import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Toggle this variable to connect/disconnect the website from the admin dashboard database:
// - true: Live mode (fetch products & gallery logs from Supabase, write checkout orders).
// - false: Standalone mode (uses local product list and static gallery logs).
const CONNECT_TO_DASHBOARD = false;

export const supabase = (CONNECT_TO_DASHBOARD && supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
