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

const questions = [
  { id: 1,  category: 'matematika',   question: 'Kolik je 15 × 4?',                                                                    options: ['45', '55', '60', '65'],                                                                      correct: 2 },
  { id: 2,  category: 'matematika',   question: 'Kolik stran má pravidelný šestiúhelník?',                                              options: ['5', '6', '7', '8'],                                                                          correct: 1 },
  { id: 3,  category: 'matematika',   question: 'Kolik je 25 % ze 200?',                                                                options: ['40', '50', '75', '100'],                                                                     correct: 1 },
  { id: 4,  category: 'matematika',   question: 'Jaký je obvod čtverce se stranou 7 cm?',                                               options: ['14 cm', '21 cm', '28 cm', '49 cm'],                                                          correct: 2 },
  { id: 5,  category: 'matematika',   question: 'Kolik je 7²?',                                                                         options: ['14', '42', '49', '56'],                                                                      correct: 2 },
  { id: 6,  category: 'matematika',   question: 'Kolik minut má dvě a půl hodiny?',                                                     options: ['120', '135', '150', '180'],                                                                  correct: 2 },
  { id: 7,  category: 'cestina',      question: 'Kdo napsal báseň „Máj"?',                                                              options: ['Jan Neruda', 'Karel Hynek Mácha', 'Jaroslav Seifert', 'Božena Němcová'],                       correct: 1 },
  { id: 8,  category: 'cestina',      question: 'Kolik písmen má česká abeceda?',                                                       options: ['26', '32', '42', '46'],                                                                      correct: 2 },
  { id: 9,  category: 'cestina',      question: 'Jaký je mluvnický rod podstatného jména „jablko"?',                                    options: ['Mužský', 'Ženský', 'Střední', 'Jablko rod nemá'],                                            correct: 2 },
  { id: 10, category: 'cestina',      question: 'Který román napsal Jaroslav Hašek?',                                                   options: ['Babička', 'Osudy dobrého vojáka Švejka', 'Staré pověsti české', 'Malostranské povídky'],     correct: 1 },
  { id: 11, category: 'cestina',      question: 'Které slovo je přídavné jméno?',                                                       options: ['Rychle', 'Krásný', 'Stůl', 'Běžet'],                                                         correct: 1 },
  { id: 12, category: 'zahradkareni', question: 'Kdy se nejlépe sází rajčata ven na záhon?',                                            options: ['V březnu', 'V dubnu', 'Po posledních mrazech', 'V červenci'],                                 correct: 2 },
  { id: 13, category: 'zahradkareni', question: 'Co je to kompost?',                                                                    options: ['Chemické hnojivo', 'Organické hnojivo z rozloženého odpadu', 'Druh pesticidu', 'Typ zavlažovacího systému'], correct: 1 },
  { id: 14, category: 'zahradkareni', question: 'Která zelenina roste pod zemí?',                                                       options: ['Rajče', 'Paprika', 'Mrkev', 'Lilek'],                                                        correct: 2 },
  { id: 15, category: 'zahradkareni', question: 'Jak se nazývá zahradní nástroj na kopání?',                                            options: ['Hrábě', 'Rýč', 'Sekera', 'Zahradní nůžky'],                                                  correct: 1 },
  { id: 16, category: 'zahradkareni', question: 'Co potřebují rostliny k fotosyntéze?',                                                 options: ['Pouze vodu', 'Světlo a kyslík', 'Světlo, vodu a CO₂', 'Pouze hnojivo'],                       correct: 2 },
  { id: 17, category: 'zvirata',      question: 'Jak dlouhá je březost slonice?',                                                       options: ['9 měsíců', '12 měsíců', '18 měsíců', '22 měsíců'],                                          correct: 3 },
  { id: 18, category: 'zvirata',      question: 'Který z těchto ptáků neumí létat?',                                                    options: ['Orel', 'Čáp', 'Tučňák', 'Sova'],                                                             correct: 2 },
  { id: 19, category: 'zvirata',      question: 'Kolik noh má pavouk?',                                                                 options: ['6', '8', '10', '12'],                                                                        correct: 1 },
  { id: 20, category: 'zvirata',      question: 'Jak se nazývá samice koně?',                                                           options: ['Kráva', 'Klisna', 'Ovce', 'Koza'],                                                           correct: 1 },
  { id: 21, category: 'zvirata',      question: 'Který savec přirozeně umí létat?',                                                     options: ['Veverka', 'Netopýr', 'Ježek', 'Krtek'],                                                      correct: 1 },
  { id: 22, category: 'zvirata',      question: 'Kde přirozeně žije velbloud?',                                                         options: ['V Arktidě', 'V deštném pralese', 'V poušti', 'V moři'],                                      correct: 2 },
  { id: 23, category: 'rostliny',     question: 'Který strom nese žaludy?',                                                             options: ['Buk', 'Dub', 'Bříza', 'Jedle'],                                                              correct: 1 },
  { id: 24, category: 'rostliny',     question: 'Které ovoce roste na palmě?',                                                          options: ['Jablko', 'Hruška', 'Kokos', 'Třešeň'],                                                       correct: 2 },
  { id: 25, category: 'rostliny',     question: 'Která houba je v ČR nejnebezpečnější pro smrtelnou otravu?',                           options: ['Muchomůrka červená', 'Muchomůrka zelená', 'Hřib smrkový', 'Lišák obecný'],                   correct: 1 },
  { id: 26, category: 'rostliny',     question: 'Jak se nazývá zelené barvivo v listech, které umožňuje fotosyntézu?',                  options: ['Karotén', 'Chlorofyl', 'Tanin', 'Antokyan'],                                                 correct: 1 },
  { id: 27, category: 'rostliny',     question: 'Jaký druh rostliny je kaktus?',                                                        options: ['Kapradina', 'Sukulent', 'Liána', 'Epifyt'],                                                  correct: 1 },
  { id: 28, category: 'ceske_zvyky',  question: 'Co se tradičně pálí v noci z 30. dubna na 1. května?',                                 options: ['Sláma', 'Čarodějnice', 'Vánoční stromky', 'Seno'],                                            correct: 1 },
  { id: 29, category: 'ceske_zvyky',  question: 'Co se tradičně jí na Štědrý večer v Čechách?',                                         options: ['Vepřo knedlo zelo', 'Svíčková na smetaně', 'Kapr s bramborovým salátem', 'Guláš s knedlíkem'], correct: 2 },
  { id: 30, category: 'ceske_zvyky',  question: 'Jak se nazývá tradiční česká velikonoční pomůcka, kterou chlapci šlehají dívky?',      options: ['Metla', 'Pomlázka', 'Žíla', 'Věneček'],                                                      correct: 1 },
  { id: 31, category: 'ceske_zvyky',  question: 'Kdy slaví Češi Silvestra?',                                                            options: ['24. prosince', '26. prosince', '31. prosince', '1. ledna'],                                  correct: 2 },
  { id: 32, category: 'ceske_zvyky',  question: 'Co symbolizuje čáp v české tradici?',                                                  options: ['Smrt', 'Příchod jara a narození dítěte', 'Hojnost úrody', 'Konec zimy'],                     correct: 1 },
  { id: 33, category: 'ceske_zvyky',  question: 'Jak se nazývá tradiční české vánoční cukroví ve tvaru půlměsíce?',                     options: ['Perníček', 'Linecké cukroví', 'Vanilkové rohlíčky', 'Pracny'],                               correct: 2 },
  { id: 34, category: 'veda',         question: 'Jaký je chemický symbol vody?',                                                        options: ['HO', 'H₂O', 'O₂H', 'H₃O'],                                                                  correct: 1 },
  { id: 35, category: 'veda',         question: 'Kolik planet má naše sluneční soustava?',                                              options: ['7', '8', '9', '10'],                                                                         correct: 1 },
  { id: 36, category: 'veda',         question: 'Co měří teploměr?',                                                                    options: ['Tlak vzduchu', 'Vlhkost vzduchu', 'Teplotu', 'Rychlost větru'],                               correct: 2 },
  { id: 37, category: 'veda',         question: 'Jaká je jednotka elektrického napětí?',                                                options: ['Ampér', 'Volt', 'Watt', 'Ohm'],                                                              correct: 1 },
  { id: 38, category: 'veda',         question: 'Kdo formuloval teorii relativity?',                                                    options: ['Isaac Newton', 'Albert Einstein', 'Nikola Tesla', 'Galileo Galilei'],                         correct: 1 },
  { id: 39, category: 'veda',         question: 'Z čeho se skládá atom?',                                                               options: ['Pouze z elektronů', 'Z protonů a elektronů', 'Z protonů, neutronů a elektronů', 'Z molekul a atomů'], correct: 2 },
  { id: 40, category: 'technologie',  question: 'Co znamená zkratka „URL"?',                                                            options: ['Universal Remote Link', 'Uniform Resource Locator', 'United Resource List', 'User Resource Location'], correct: 1 },
  { id: 41, category: 'technologie',  question: 'Kdo je spoluzakladatelem společnosti Apple?',                                          options: ['Bill Gates', 'Steve Jobs', 'Mark Zuckerberg', 'Elon Musk'],                                  correct: 1 },
  { id: 42, category: 'technologie',  question: 'Co je „CPU" v počítači?',                                                              options: ['Pevný disk', 'Grafická karta', 'Procesor', 'Operační paměť'],                                 correct: 2 },
  { id: 43, category: 'technologie',  question: 'V kterém roce byl uveden první iPhone?',                                               options: ['2003', '2005', '2007', '2010'],                                                               correct: 2 },
  { id: 44, category: 'technologie',  question: 'Co je „Wi-Fi"?',                                                                       options: ['Typ počítačového viru', 'Bezdrátové připojení k internetu', 'Druh softwaru', 'Hardwarová komponenta'], correct: 1 },
  { id: 45, category: 'filmy',        question: 'Který český film získal Oscara za nejlepší cizojazyčný film v roce 1967?',              options: ['Kolya', 'Ostře sledované vlaky', 'Hoří, má panenko', 'Všichni dobří rodáci'],                correct: 1 },
  { id: 46, category: 'filmy',        question: 'Kdo režíroval film „Titanic" z roku 1997?',                                            options: ['Steven Spielberg', 'James Cameron', 'Christopher Nolan', 'Martin Scorsese'],                  correct: 1 },
  { id: 47, category: 'filmy',        question: 'Jak se jmenuje hlavní hrdina kouzelné série filmů podle knih J. K. Rowlingové?',       options: ['Frodo Pytlík', 'Harry Potter', 'Luke Skywalker', 'James Bond'],                              correct: 1 },
  { id: 48, category: 'filmy',        question: 'V jakém filmovém světě zazní slavná věta „Já jsem tvůj otec"?',                        options: ['Pán prstenů', 'Star Wars', 'Matrix', 'Indiana Jones'],                                       correct: 1 },
  { id: 49, category: 'filmy',        question: 'Kde se odehrává animovaný film „Lví král"?',                                           options: ['V Asii', 'V Africe', 'V Antarktidě', 'V Austrálii'],                                         correct: 1 },
  { id: 50, category: 'umeni',        question: 'Kdo namaloval obraz „Mona Lisa"?',                                                     options: ['Michelangelo', 'Leonardo da Vinci', 'Pablo Picasso', 'Vincent van Gogh'],                     correct: 1 },
  { id: 51, category: 'umeni',        question: 'Který český skladatel složil operu „Rusalka"?',                                        options: ['Bedřich Smetana', 'Antonín Dvořák', 'Leoš Janáček', 'Josef Suk'],                            correct: 1 },
  { id: 52, category: 'umeni',        question: 'Co je charakteristické pro malířský směr zvaný impresionismus?',                       options: ['Abstraktní geometrické tvary', 'Zachycení okamžitých dojmů světla a barev', 'Realistická malba přírody do detailu', 'Středověká náboženská tematika'], correct: 1 },
  { id: 53, category: 'umeni',        question: 'Který hudební nástroj má klávesy a uvnitř struny?',                                    options: ['Kytara', 'Housle', 'Klavír', 'Trubka'],                                                      correct: 2 },
  { id: 54, category: 'umeni',        question: 'Kdo vytvořil slavnou sochu „David"?',                                                  options: ['Leonardo da Vinci', 'Michelangelo', 'Donatello', 'Raffael'],                                 correct: 1 },
  { id: 55, category: 'lidske_telo',  question: 'Kolik kostí má dospělý člověk?',                                                       options: ['150', '180', '206', '250'],                                                                  correct: 2 },
  { id: 56, category: 'lidske_telo',  question: 'Jaká je normální tělesná teplota zdravého člověka?',                                   options: ['35,0 °C', '36,6 °C', '38,0 °C', '40,0 °C'],                                                 correct: 1 },
  { id: 57, category: 'lidske_telo',  question: 'Který orgán filtruje krev a tvoří moč?',                                               options: ['Játra', 'Ledviny', 'Srdce', 'Plíce'],                                                        correct: 1 },
  { id: 58, category: 'lidske_telo',  question: 'Kolik zubů má dospělý člověk bez zubů moudrosti?',                                    options: ['24', '28', '32', '36'],                                                                      correct: 1 },
  { id: 59, category: 'lidske_telo',  question: 'Jak se nazývá největší kost v lidském těle?',                                          options: ['Holenní kost', 'Pažní kost', 'Stehenní kost', 'Páteř'],                                     correct: 2 },
  { id: 60, category: 'lidske_telo',  question: 'Jaká je hlavní funkce červených krvinek?',                                             options: ['Boj s infekcemi', 'Přenos kyslíku', 'Srážení krve', 'Tvorba hormonů'],                       correct: 1 },
];

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
