// Mock Supabase klient pro lokální preview bez backendu
// Použije se automaticky když chybí VITE_SUPABASE_URL

const PLAYERS = [
  { id: 'p1', name: 'Honza',  score: 15 },
  { id: 'p2', name: 'Marie',  score: 12 },
  { id: 'p3', name: 'Petr',   score: 8  },
  { id: 'p4', name: 'Jana',   score: 3  },
]

const MOCK_DUEL_ID = 'duel-mock-1'

const DUELS = [
  {
    id: MOCK_DUEL_ID,
    challenger_id: 'p2',
    opponent_id:   'p1',
    category:      'filmy',
    status:        'waiting',
    challenger_score: 3,
    opponent_score:   null,
    expires_at: new Date(Date.now() + 2 * 864e5).toISOString(),
    challenger: { id: 'p2', name: 'Marie' },
    opponent:   { id: 'p1', name: 'Honza' },
  },
]

const DUEL_QUESTIONS = [
  { duel_id: MOCK_DUEL_ID, question_id: 45, position: 1 },
  { duel_id: MOCK_DUEL_ID, question_id: 46, position: 2 },
  { duel_id: MOCK_DUEL_ID, question_id: 47, position: 3 },
  { duel_id: MOCK_DUEL_ID, question_id: 48, position: 4 },
  { duel_id: MOCK_DUEL_ID, question_id: 49, position: 5 },
]

// ---------------------------------------------------------------------------
// Query builder – sbírá operace, při await vrátí mock data
// ---------------------------------------------------------------------------
class QB {
  constructor(table) {
    this._table   = table
    this._filters = {}
    this._order   = null
    this._lim     = null
    this._insert  = null
    this._update  = null
    this._countMode = false
    this._result  = null  // předdefinovaný výsledek (pro insert/update)
  }

  // --- modifikátory ---
  select(_f, opts) { if (opts?.count === 'exact' && opts?.head) this._countMode = true; return this }
  insert(data)     { this._insert = data; return this }
  update(data)     { this._update = data; return this }
  upsert()         { return this }
  delete()         { return this }
  eq(f, v)         { this._filters[f] = v; return this }
  neq()            { return this }
  or()             { return this }
  in()             { return this }
  lt()             { return this }
  order(f, o)      { this._order = { field: f, ...o }; return this }
  limit(n)         { this._lim = n; return this }

  // --- terminátory ---
  single()      { return Promise.resolve(this._resolve(true)) }
  maybeSingle() { return Promise.resolve(this._resolve(true, true)) }
  then(res, rej) {
    return Promise.resolve(this._resolve(false)).then(res, rej)
  }

  // --- hlavní logika ---
  _resolve(single, maybe = false) {
    if (this._countMode) return { count: 0, error: null }

    // INSERT → vrátí vložená data
    if (this._insert) {
      const rows = Array.isArray(this._insert) ? this._insert : [this._insert]
      const created = rows.map(r => ({
        id: 'mock-' + Math.random().toString(36).slice(2, 8),
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 3 * 864e5).toISOString(),
        status: 'waiting',
        challenger_score: null,
        opponent_score: null,
        score: 0,
        ...r,
      }))
      if (single) return { data: created[0], error: null }
      return { data: created, error: null }
    }

    // UPDATE → vrátí objekt s aplikovanými změnami
    if (this._update) {
      const id = this._filters['id']
      let base = this._tableData().find(r => r.id === id) ?? {}
      const updated = { ...base, ...this._update }
      if (single) return { data: updated, error: null }
      return { data: [updated], error: null }
    }

    // SELECT
    let rows = this._tableData()

    // aplikuj eq filtry
    for (const [k, v] of Object.entries(this._filters)) {
      rows = rows.filter(r => r[k] === v)
    }

    // order
    if (this._order) {
      rows = [...rows].sort((a, b) =>
        this._order.ascending === false
          ? b[this._order.field] - a[this._order.field]
          : a[this._order.field] - b[this._order.field]
      )
    }

    // limit
    if (this._lim) rows = rows.slice(0, this._lim)

    if (single) {
      if (rows.length === 0 && maybe) return { data: null, error: null }
      if (rows.length === 0)          return { data: null, error: { message: 'not found' } }
      return { data: rows[0], error: null }
    }
    return { data: rows, error: null }
  }

  _tableData() {
    switch (this._table) {
      case 'players':         return PLAYERS
      case 'duels':           return DUELS
      case 'duel_questions':  return DUEL_QUESTIONS
      case 'player_answers':  return []
      case 'questions':       return []
      default:                return []
    }
  }
}

// ---------------------------------------------------------------------------
// Real-time channel – noop
// ---------------------------------------------------------------------------
const noop = () => mockChannel
const mockChannel = { on: noop, subscribe: noop }

// ---------------------------------------------------------------------------
// Export mock klienta
// ---------------------------------------------------------------------------
export const supabase = {
  from: (table) => new QB(table),
  channel: () => mockChannel,
  removeChannel: () => {},
  rpc: () => Promise.resolve({ data: null, error: null }),
}
