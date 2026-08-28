import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Token, Farmer } from '../types';

// C-1: No hardcoded credentials. Credentials must be supplied via environment
// variables (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY). If they are absent
// the app degrades gracefully into offline/localStorage-only mode.
const SUPABASE_URL: string =
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.SUPABASE_URL ||
  '';

const SUPABASE_ANON_KEY: string =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.SUPABASE_ANON_KEY ||
  '';

export const isSupabaseConfigured = (): boolean =>
  Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

let supabaseInstance: SupabaseClient | null = null;

if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  try {
    supabaseInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    // L-2: connection log is dev-only and contains no user data
    if (import.meta.env.DEV) {
      console.log('[Supabase] Client initialised (URL prefix:', SUPABASE_URL.slice(0, 30), ')');
    }
  } catch (err) {
    console.warn('[Supabase] Failed to initialise client:', err);
  }
} else {
  if (import.meta.env.DEV) {
    console.log('[Supabase] No credentials — running in offline/fallback mode.');
  }
}

export const supabaseClient: SupabaseClient | null = supabaseInstance;
export const supabase: SupabaseClient | null = supabaseInstance;

// ---------------------------------------------------------------------------
// syncTokenToSupabase
// Tries UPDATE first (triggers UPDATE RLS policy), falls back to INSERT/upsert
// for new rows. Fire-and-forget — callers should not await critical UI paths on
// this; optimistic state is applied immediately.
// ---------------------------------------------------------------------------
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
      quality_check_result: token.quality_check_result
        ? (typeof token.quality_check_result === 'string'
            ? token.quality_check_result
            : JSON.stringify(token.quality_check_result))
        : null,
      payment_amount: token.payment_amount,
      payment_reference: token.payment_reference || null,
      payment_confirmed_at: token.payment_confirmed_at || null,
      payment_method: token.payment_method || null,
      status_history: token.status_history
        ? (typeof token.status_history === 'string'
            ? token.status_history
            : JSON.stringify(token.status_history))
        : null,
      created_at: token.created_at,
      updated_at: token.updated_at,
    };

    // Try UPDATE first (existing rows — triggers UPDATE RLS policy)
    const { data: updatedData, error: updateError } = await supabaseClient
      .from('tokens')
      .update(payload)
      .eq('token_id', token.token_id)
      .select('token_id');

    if (!updateError && updatedData && updatedData.length > 0) {
      return true;
    }

    // Row doesn't exist yet — INSERT (triggers INSERT RLS policy)
    const { error: insertError } = await supabaseClient
      .from('tokens')
      .upsert(payload, { onConflict: 'token_id' });

    if (insertError) {
      if (import.meta.env.DEV) {
        console.error('[Supabase Sync Error]', insertError.message);
      }
      return false;
    }
    return true;
  } catch (err) {
    if (import.meta.env.DEV) {
      console.error('[Supabase Sync Exception]', err);
    }
    return false;
  }
};

// ---------------------------------------------------------------------------
// syncFarmerToSupabase
// Upserts a farmer record. Used on registration so the account survives a
// hard refresh on any device (not only the registering browser).
// ---------------------------------------------------------------------------
export const syncFarmerToSupabase = async (farmer: Farmer): Promise<boolean> => {
  if (!supabaseClient || !farmer.farmer_id) return false;
  try {
    const { error } = await supabaseClient
      .from('farmers')
      .upsert(
        {
          farmer_id: farmer.farmer_id,
          name: farmer.name,
          phone: farmer.phone,
          village: farmer.village,
          district: farmer.district || 'Indore',
          aadhaar_last4: farmer.aadhaar_last4 || null,
          bank_account_last4: farmer.bank_account_last4 || null,
          is_aadhaar_verified: farmer.is_aadhaar_verified ?? false,
          created_at: farmer.created_at,
        },
        { onConflict: 'farmer_id' }
      );
    if (error && import.meta.env.DEV) {
      console.warn('[Supabase] Farmer upsert failed:', error.message);
    }
    return !error;
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn('[Supabase] Farmer upsert exception:', err);
    }
    return false;
  }
};
