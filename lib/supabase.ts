import { createClient } from '@supabase/supabase-js';

// TODO: Remove hardcodes and use env vars only in production deployment.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dkjudcsvfknegnzictno.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRranVkY3N2ZmtuZWduemljdG5vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4ODc2MTMsImV4cCI6MjA3NDQ2MzYxM30.ae5DUw4Pek1qvcZcR2d5GbTufWM7CEejvahG5oPRKpw';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.warn('Development warning: NEXT_PUBLIC_SUPABASE_URL is missing');
}

if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.warn('Development warning: NEXT_PUBLIC_SUPABASE_ANON_KEY is missing');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Server-side client for admin operations (use in API routes or edge functions)
export const createServerClient = () => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!serviceRoleKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
  }
  
  return createClient(supabaseUrl!, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};