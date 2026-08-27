import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Token } from '../types';

const SUPABASE_URL: string = import.meta.env?.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY: string = import.meta.env?.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = (): boolean => {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
};

let supabaseInstance: SupabaseClient | null = null;

if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  try {
    supabaseInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    if (import.meta.env?.DEV) {
      console.log('[Supabase] Client initialized successfully.');
    }
  } catch (err) {
    console.warn('[Supabase] Failed to initialize client:', err);
  }
} else {
  if (import.meta.env?.DEV) {
    console.log('[Supabase] No credentials provided. Running in offline/fallback mode.');
  }
}

export const supabaseClient: SupabaseClient | null = supabaseInstance;
export const supabase: SupabaseClient | null = supabaseInstance;

/**
 * Helper to sync token upserts to Supabase table `tokens` asynchronously
 */
export const syncTokenToSupabase = async (token: Partial<Token>): Promise<boolean> => {
  if (!supabaseClient || !token.token_id) return false;
  try {
    const payload = {
      token_id: token.token_id,
      farmer_id: token.farmer_id,
      farmer_name: token.farmer_name,
      farmer_phone: token.farmer_phone,
      farmer_village: token.farmer_village,
      center_id: token.center_id,
      center_name: token.center_name,
      crop: token.crop,
      quantity: token.quantity,
      msp_rate: token.msp_rate,
      preferred_slot: token.preferred_slot,
      token_number: token.token_number,
      queue_position: token.queue_position,
      status: token.status,
      quality_check_result: token.quality_check_result ? (typeof token.quality_check_result === 'string' ? token.quality_check_result : JSON.stringify(token.quality_check_result)) : null,
      payment_amount: token.payment_amount,
      payment_reference: token.payment_reference || null,
      payment_confirmed_at: token.payment_confirmed_at || null,
      status_history: token.status_history ? (typeof token.status_history === 'string' ? token.status_history : JSON.stringify(token.status_history)) : null,
      created_at: token.created_at,
      updated_at: token.updated_at
    };
    const { error } = await supabaseClient.from('tokens').upsert(payload, { onConflict: 'token_id' });
    if (error) {
      console.error('[Supabase Upsert Error]', error.message, error.details, error.hint);
      return false;
    } else {
      if (import.meta.env?.DEV) {
        console.log(`[Supabase Sync Success] Token ${token.token_number} (${token.status}) synced to cloud DB.`);
      }
      return true;
    }
  } catch (err) {
    console.error('[Supabase Sync Exception]', err);
    return false;
  }
};
