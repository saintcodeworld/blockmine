// Wrapper for Supabase client with lazy initialization
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

let supabaseInstance: SupabaseClient<Database> | null = null;

// Use hardcoded fallbacks from the .env file for Vite HMR edge cases
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://hecxsxhwvsigbpupiuxr.supabase.co";
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlY3hzeGh3dnNpZ2JwdXBpdXhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwMTUyMDUsImV4cCI6MjA4NDU5MTIwNX0.qYJGXY2mnUIKEBDrD6aNjfe9zvO00lA174QjQ_q603M";

export function getSupabase(): SupabaseClient<Database> {
  if (supabaseInstance) return supabaseInstance;
  
  supabaseInstance = createClient<Database>(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
    }
  });
  
  return supabaseInstance;
}
