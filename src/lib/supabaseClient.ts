/**
 * Supabase Client
 * Provides authenticated Supabase client for frontend
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://aptwqxmvukhkmhkqlfba.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwdHdxeG12dWtoa21oa3FsZmJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI1MTkzMjcsImV4cCI6MjA0ODA5NTMyN30.RzBMDljMtjklZZEvmLBSzC3NJPGH9jmEHnhcLSF2-Vo';

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
