/**
 * Stackr Quest — Supabase Client
 *
 * Central Supabase instance. Reads URL + anon key from env vars.
 * Falls back gracefully when Supabase is not configured (offline-first).
 *
 * Environment variables (set in .env or Vercel dashboard):
 *   VITE_SUPABASE_URL    — e.g. https://xxxx.supabase.co
 *   VITE_SUPABASE_ANON_KEY — public anon key
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

/** Whether Supabase is configured and available */
export const isSupabaseConfigured = !!(SUPABASE_URL && SUPABASE_ANON_KEY);

/** @type {import('@supabase/supabase-js').SupabaseClient | null} */
let _client = null;

/**
 * Get the Supabase client singleton.
 * Returns null if Supabase is not configured.
 */
export function getSupabase() {
  if (!isSupabaseConfigured) return null;

  if (!_client) {
    _client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        storageKey: 'stackr_auth',
      },
    });
  }
  return _client;
}
