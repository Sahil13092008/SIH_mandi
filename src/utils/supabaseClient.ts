import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://hfrzvhftrtvgcryyxmxx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzIsInJlZiI6Imhmcnp2aGZ0cnR2Z2NyeXl4bXh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4MDU4MjksImV4cCI6MjEwMzM4MTgyOX0.Egj_utV5g72kxQCAbwPkW_5QbIjAVD8nxU86bZ5V3jg';

export const supabaseClient: SupabaseClient | null = (SUPABASE_URL && SUPABASE_ANON_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

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
      quality_check_result: token.quality_check_result ? JSON.stringify(token.quality_check_result) : null,
      payment_amount: token.payment_amount,
      payment_reference: token.payment_reference || null,
      payment_confirmed_at: token.payment_confirmed_at || null,
      created_at: token.created_at,
      updated_at: token.updated_at
    };
    await supabaseClient.from('tokens').upsert(payload, { onConflict: 'token_id' });
  } catch (err) {
    console.warn('[Supabase Sync Warning] Could not sync token:', err);
  }
};
