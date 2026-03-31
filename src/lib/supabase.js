import { createClient } from '@supabase/supabase-js'
import { supabase as mockSupabase } from './supabaseMock.js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Pokud chybí klíče (lokální preview bez backendu), použij mock klient
export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : mockSupabase
