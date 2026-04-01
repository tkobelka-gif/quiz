// Seed script – nahraje otázky do Supabase
// Spuštění: node supabase/seed.js
//
// Před spuštěním nastav v .env.local:
//   VITE_SUPABASE_URL=https://xxxx.supabase.co
//   VITE_SUPABASE_ANON_KEY=eyJ...
//
// Nebo předej přes env proměnné:
//   SUPABASE_URL=... SUPABASE_KEY=... node supabase/seed.js

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { questions } from '../src/data/questions.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Načti .env.local ručně (vite ho nenačítá mimo build)
function loadEnv() {
  try {
    const env = readFileSync(resolve(__dirname, '../.env.local'), 'utf8');
    for (const line of env.split('\n')) {
      const [key, ...rest] = line.split('=');
      if (key && rest.length) process.env[key.trim()] = rest.join('=').trim();
    }
  } catch {
    // .env.local neexistuje, použijeme process.env přímo
  }
}
loadEnv();

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Chyba: nastav VITE_SUPABASE_URL a VITE_SUPABASE_ANON_KEY v .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function seed() {
  console.log(`Nahrávám ${questions.length} otázek do Supabase...`);

  const { error } = await supabase
    .from('questions')
    .upsert(questions, { onConflict: 'id' });

  if (error) {
    console.error('Chyba při nahrávání:', error.message);
    process.exit(1);
  }

  console.log('Hotovo! Všechny otázky jsou v databázi.');
}

seed();
