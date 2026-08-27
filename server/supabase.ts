import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl && 
    supabaseKey && 
    supabaseUrl !== 'https://hfrzvhftrtvgcryyxmxx.supabase.co' && 
    supabaseKey !== 'YOUR_SUPABASE_ANON_KEY'
  ) || Boolean(
    supabaseUrl && 
    supabaseKey && 
    !supabaseUrl.includes('YOUR_') && 
    !supabaseKey.includes('YOUR_')
  );
};

let supabaseInstance: SupabaseClient | null = null;

if (supabaseUrl && supabaseKey && !supabaseKey.includes('YOUR_')) {
  try {
    supabaseInstance = createClient(supabaseUrl, supabaseKey);
    console.log(`[Supabase] Client initialized with URL: ${supabaseUrl}`);
  } catch (err) {
    console.warn('[Supabase] Failed to initialize client, falling back to in-memory mode:', err);
  }
} else {
  console.log('[Supabase] Credentials not provided or default placeholder used. App operating in in-memory mode with fallback capability.');
}

export const supabase = supabaseInstance;
