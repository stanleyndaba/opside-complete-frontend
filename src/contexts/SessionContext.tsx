/**
 * Session Context
 * Manages global session state including soft timeout handling.
 * Provides session timeout modal without losing user's page state.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { SessionTimeoutModal } from '@/components/modals/SessionTimeoutModal';

interface SessionContextType {
    isSessionValid: boolean;
    userEmail: string | null;
    isPaidUser: boolean;
    showSessionTimeout: () => void;
    hideSessionTimeout: () => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
    const [sessionTimeoutOpen, setSessionTimeoutOpen] = useState(false);
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [isSessionValid, setIsSessionValid] = useState(true);
    const [isPaidUser, setIsPaidUser] = useState(false);

    // Get user email and ID on mount
    useEffect(() => {
        const getUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            const { data: { user } } = await supabase.auth.getUser();
            if (session?.access_token) {
                localStorage.setItem('session_token', session.access_token);
            }
            if (user?.email) {
                setUserEmail(user.email);
                localStorage.setItem('user_email', user.email);
                
                // Fetch the payment status from our fortress users table
                const { data: profile } = await supabase
                    .from('users')
                    .select('is_paid_beta')
                    .eq('id', user.id)
                    .single();
                
                if (profile) {
                    setIsPaidUser(!!profile.is_paid_beta);
                }
            }
            // Store user ID for API calls
            if (user?.id) {
                localStorage.setItem('user_id', user.id);
            }
        };
        getUser();
    }, []);

    // Listen for auth state changes
    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_OUT' || !session) {
                setIsSessionValid(false);
                // Clear user_id on sign out
                localStorage.removeItem('user_id');
                localStorage.removeItem('session_token');
            } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                setIsSessionValid(true);
                setSessionTimeoutOpen(false);
                if (session.access_token) {
                    localStorage.setItem('session_token', session.access_token);
                }
                if (session.user?.email) {
                    setUserEmail(session.user.email);
                    
                    // Re-verify payment status on re-auth
                    supabase
                        .from('users')
                        .select('is_paid_beta')
                        .eq('id', session.user.id)
                        .single()
                        .then(({ data }) => {
                            if (data) setIsPaidUser(!!data.is_paid_beta);
                        });
                }
                // Store user_id for API calls
                if (session.user?.id) {
                    localStorage.setItem('user_id', session.user.id);
                }
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const showSessionTimeout = useCallback(() => {
        setSessionTimeoutOpen(true);
    }, []);

    const hideSessionTimeout = useCallback(() => {
        setSessionTimeoutOpen(false);
    }, []);

    const handleSessionRestored = useCallback(() => {
        setIsSessionValid(true);
        setSessionTimeoutOpen(false);
    }, []);

    return (
        <SessionContext.Provider value={{
            isSessionValid,
            userEmail,
            isPaidUser,
            showSessionTimeout,
            hideSessionTimeout
        }}>
            {children}
            <SessionTimeoutModal
                isOpen={sessionTimeoutOpen}
                onClose={() => setSessionTimeoutOpen(false)}
                onSuccess={handleSessionRestored}
                userEmail={userEmail || undefined}
            />
        </SessionContext.Provider>
    );
}

export function useSession() {
    const context = useContext(SessionContext);
    if (context === undefined) {
        throw new Error('useSession must be used within a SessionProvider');
    }
    return context;
}

/**
 * Hook for handling 401 errors with session timeout modal
 * Use this instead of redirecting to login page
 */
export function useSessionErrorHandler() {
    const { showSessionTimeout } = useSession();

    const handleAuthError = useCallback((status: number) => {
        if (status === 401) {
            showSessionTimeout();
            return true; // Handled
        }
        return false; // Not handled
    }, [showSessionTimeout]);

    return { handleAuthError };
}

export default SessionProvider;
