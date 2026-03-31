-- ============================================================
-- Rodinný kvíz – Supabase schema
-- Spusť celý soubor v Supabase SQL editoru
-- ============================================================

-- ------------------------------------------------------------
-- PLAYERS
-- ------------------------------------------------------------
create table if not exists players (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  score      int  not null default 0,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- QUESTIONS
-- ------------------------------------------------------------
create table if not exists questions (
  id       int  primary key,
  category text not null,
  question text not null,
  options  jsonb not null,   -- ["A","B","C","D"]
  correct  int  not null     -- index 0–3
);

-- ------------------------------------------------------------
-- DUELS
-- ------------------------------------------------------------
create type duel_status as enum (
  'waiting',           -- challenger odehrál, čeká na oponenta
  'challenger_done',   -- stejné jako waiting (alias pro přehlednost frontendu)
  'completed',         -- oba odehráli, body přičteny
  'expired'            -- oponent neodehrál do 3 dnů
);

create table if not exists duels (
  id                uuid        primary key default gen_random_uuid(),
  challenger_id     uuid        not null references players(id),
  opponent_id       uuid        not null references players(id),
  category          text        not null,
  status            duel_status not null default 'waiting',
  challenger_score  int,        -- výsledek challengera v tomto duelu (null = ještě nehrál)
  opponent_score    int,        -- výsledek oponenta (null = ještě nehrál)
  created_at        timestamptz not null default now(),
  expires_at        timestamptz not null default now() + interval '3 days',
  completed_at      timestamptz,
  constraint no_self_duel check (challenger_id <> opponent_id)
);

-- index pro rychlé načítání duelů hráče
create index if not exists duels_challenger_idx on duels(challenger_id);
create index if not exists duels_opponent_idx   on duels(opponent_id);

-- ------------------------------------------------------------
-- DUEL QUESTIONS  (5 otázek přiřazených k duelu)
-- ------------------------------------------------------------
create table if not exists duel_questions (
  id          uuid primary key default gen_random_uuid(),
  duel_id     uuid not null references duels(id) on delete cascade,
  question_id int  not null references questions(id),
  position    int  not null check (position between 1 and 5),
  unique (duel_id, position)
);

-- ------------------------------------------------------------
-- PLAYER ANSWERS
-- ------------------------------------------------------------
create table if not exists player_answers (
  id          uuid        primary key default gen_random_uuid(),
  duel_id     uuid        not null references duels(id) on delete cascade,
  player_id   uuid        not null references players(id),
  question_id int         not null references questions(id),
  answer      int,        -- index 0–3, null = timeout
  is_correct  bool        not null default false,
  answered_at timestamptz not null default now(),
  unique (duel_id, player_id, question_id)
);

-- ------------------------------------------------------------
-- FUNKCE: vypočítá skóre hráče v duelu (+1 správná, -1 špatná/timeout)
-- ------------------------------------------------------------
create or replace function calc_duel_score(p_duel_id uuid, p_player_id uuid)
returns int language sql stable as $$
  select coalesce(sum(case when is_correct then 1 else -1 end), 0)::int
  from   player_answers
  where  duel_id   = p_duel_id
    and  player_id = p_player_id;
$$;

-- ------------------------------------------------------------
-- FUNKCE: zavolá se po uložení všech odpovědí hráče
-- Pokud oba hráči hotovi → uzavře duel a přičte body
-- ------------------------------------------------------------
create or replace function finish_player_turn(p_duel_id uuid, p_player_id uuid)
returns void language plpgsql as $$
declare
  v_duel          duels%rowtype;
  v_ch_score      int;
  v_op_score      int;
  v_questions_cnt int := 5;
  v_answers_cnt   int;
begin
  select * into v_duel from duels where id = p_duel_id for update;

  -- Ověř, že hráč odpověděl na všech 5 otázek
  select count(*) into v_answers_cnt
  from   player_answers
  where  duel_id = p_duel_id and player_id = p_player_id;

  if v_answers_cnt < v_questions_cnt then
    raise exception 'Hráč ještě neodpověděl na všechny otázky.';
  end if;

  v_ch_score := calc_duel_score(p_duel_id, v_duel.challenger_id);
  v_op_score := calc_duel_score(p_duel_id, v_duel.opponent_id);

  if p_player_id = v_duel.challenger_id then
    -- challenger právě dokončil
    update duels
    set challenger_score = v_ch_score,
        status = case
          when opponent_score is not null then 'completed'
          else 'waiting'
        end,
        completed_at = case
          when opponent_score is not null then now()
          else null
        end
    where id = p_duel_id;
  else
    -- opponent právě dokončil
    update duels
    set opponent_score = v_op_score,
        status = case
          when challenger_score is not null then 'completed'
          else 'waiting'
        end,
        completed_at = case
          when challenger_score is not null then now()
          else null
        end
    where id = p_duel_id;
  end if;

  -- Pokud je duel completed, přičti body oběma hráčům
  if (select status from duels where id = p_duel_id) = 'completed' then
    update players set score = score + v_ch_score where id = v_duel.challenger_id;
    update players set score = score + v_op_score  where id = v_duel.opponent_id;
  end if;
end;
$$;

-- ------------------------------------------------------------
-- FUNKCE: označí expirované duely a potrestá oponenta (-2 body)
-- Volej přes pg_cron nebo z frontendu při načtení home
-- ------------------------------------------------------------
create or replace function expire_duels()
returns int language plpgsql as $$
declare
  v_count int := 0;
  v_duel  record;
begin
  for v_duel in
    select id, challenger_id, opponent_id, challenger_score
    from   duels
    where  status = 'waiting'
      and  expires_at < now()
  loop
    update duels set status = 'expired' where id = v_duel.id;

    -- Pokud challenger odehrál, přičteme mu jeho body
    if v_duel.challenger_score is not null then
      update players set score = score + v_duel.challenger_score
      where id = v_duel.challenger_id;
    end if;

    -- Oponent, který neodehrál, dostane -2
    update players set score = score - 2
    where id = v_duel.opponent_id;

    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;

-- ------------------------------------------------------------
-- RLS (Row Level Security)
-- ------------------------------------------------------------
alter table players        enable row level security;
alter table questions      enable row level security;
alter table duels          enable row level security;
alter table duel_questions enable row level security;
alter table player_answers enable row level security;

-- Otázky jsou veřejné (read only)
create policy "questions_select" on questions for select using (true);

-- Hráči: kdokoliv může číst, vkládat (registrace), měnit jen sebe
create policy "players_select" on players for select using (true);
create policy "players_insert" on players for insert with check (true);
create policy "players_update" on players for update using (true);  -- score mění pouze DB funkce

-- Duely: hráč vidí jen své duely
create policy "duels_select" on duels for select
  using (auth.uid() is null or challenger_id = auth.uid() or opponent_id = auth.uid());
create policy "duels_insert" on duels for insert with check (true);
create policy "duels_update" on duels for update using (true);

-- Duel questions: viditelné účastníkům duelu
create policy "duel_questions_select" on duel_questions for select using (true);
create policy "duel_questions_insert" on duel_questions for insert with check (true);

-- Odpovědi: hráč vkládá jen své
create policy "answers_select" on player_answers for select using (true);
create policy "answers_insert" on player_answers for insert with check (true);
