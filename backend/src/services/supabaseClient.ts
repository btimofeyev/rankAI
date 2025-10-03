import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

type SupabaseService = {
  client: SupabaseClient | null;
  isMocked: boolean;
};

let cached: SupabaseService | null = null;

export const getSupabase = (): SupabaseService => {
  if (cached) return cached;

  if (!env.supabaseUrl || !env.supabaseServiceRoleKey) {
    logger.warn('Supabase env vars missing, using in-memory store');
    cached = { client: null, isMocked: true };
    return cached;
  }

  cached = {
    client: createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
      auth: { persistSession: false }
    }),
    isMocked: false
  };
  return cached;
};
