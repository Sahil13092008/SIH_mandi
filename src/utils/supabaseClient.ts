import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    SUPABASE_URL && 
    SUPABASE_ANON_KEY && 
    !SUPABASE_URL.includes('YOUR_') && 
    !SUPABASE_ANON_KEY.includes('YOUR_')
  );
};

let supabaseInstance: SupabaseClient | null = null;

if (SUPABASE_URL && SUPABASE_ANON_KEY && !SUPABASE_ANON_KEY.includes('YOUR_')) {
  try {
    supabaseInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log(`[Supabase] Client initialized with URL: ${SUPABASE_URL}`);
  } catch (err) {
    console.warn('[Supabase] Failed to initialize client, falling back to in-memory mode:', err);
  }
} else {
  console.log('[Supabase] Credentials not provided or default placeholder used. App operating in in-memory mode with fallback capability.');
}

export const supabase = supabaseInstance;

/**
 * Helper to sync token upserts to Supabase table `tokens` asynchronously
 */
export const syncTokenToSupabase = async (token: any) => {
  if (!supabaseClient) return;
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
    } else {
      console.log(`[Supabase Sync Success] Token ${token.token_number} (${token.status}) synced to cloud DB.`);
    }
  } catch (err) {
    console.error('[Supabase Sync Exception]', err);
  }
};
