/**
 * Supabase Client
 * Provides authenticated Supabase client for frontend
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://uuuqpujtnubusmigbkvw.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1dXFwdWp0bnVidXNtaWdia3Z3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzOTY4MzksImV4cCI6MjA2ODk3MjgzOX0.UGmTZEbQ3g2jCwDgPRH9MyGGeE9DFjrCxA3_0YHzoYs';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
    }
});

/**
 * Get the current authenticated user's ID
 * Returns 'demo-user' as fallback if not authenticated
 */
export async function getCurrentUserId(): Promise<string> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        return user?.id || 'demo-user';
    } catch {
        return 'demo-user';
    }
}

/**
 * Get the current session's access token
 */
export async function getAccessToken(): Promise<string | null> {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        return session?.access_token || null;
    } catch {
        return null;
    }
}
