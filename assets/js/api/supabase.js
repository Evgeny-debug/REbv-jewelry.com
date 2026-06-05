import { CONFIG } from './config.js';

// Робимо безпечну перевірку: якщо бібліотеки немає (локальний режим), 
// клієнт просто буде null і не "покладе" нам весь сайт.
export const supabaseClient = window.supabase 
    ? window.supabase.createClient(CONFIG.supabaseUrl, CONFIG.supabaseKey) 
    : null;

if (supabaseClient) {
    console.log("BV Jewelry: Підключення до Supabase встановлено.");
} else {
    console.log("BV Jewelry: Supabase відключено (Локальний режим).");
}