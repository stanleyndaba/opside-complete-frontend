/**
 * Session Context
 * Manages global session state including soft timeout handling.
 * Provides session timeout modal without losing user's page state.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { SessionTimeoutModal } from '@/components/modals/SessionTimeoutModal';
import { SESSION_RECOVERY_EVENT } from '@/lib/sessionRecovery';

interface SessionContextType {
    isSessionValid: boolean;
    isAuthReady: boolean;
    authToken: string | null;
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
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [authToken, setAuthToken] = useState<string | null>(null);
    const [isPaidUser, setIsPaidUser] = useState(false);

    // Get user email and ID on mount
    useEffect(() => {
        const getUser = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                const { data: { user } } = await supabase.auth.getUser();
                const token = session?.access_token || localStorage.getItem('session_token') || null;

                if (token) {
                    localStorage.setItem('session_token', token);
                    setAuthToken(token);
                }

                if (user?.email) {
                    setUserEmail(user.email);
                    localStorage.setItem('user_email', user.email);

                    // Fetch the payment status from our fortress users table
                    const { data: profile } = await supabase
                        .from('users')
                        .select('is_paid_beta')
                        .eq('id', user.id)
                        .maybeSingle();

                    setIsPaidUser(!!profile?.is_paid_beta);
                }
                // Store user ID for API calls
                if (user?.id) {
                    localStorage.setItem('user_id', user.id);
                }
            } finally {
                setIsAuthReady(true);
            }
        };
        getUser();
    }, []);

    // Listen for auth state changes
    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_OUT') {
                setIsSessionValid(false);
                localStorage.removeItem('user_id');
                localStorage.removeItem('session_token');
                localStorage.removeItem('active_tenant_id');
                localStorage.removeItem('active_tenant_slug');
                setAuthToken(null);
                setIsAuthReady(true);
            } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || !!session) {
                setIsSessionValid(true);
                setSessionTimeoutOpen(false);
                if (session.access_token) {
                    localStorage.setItem('session_token', session.access_token);
                    setAuthToken(session.access_token);
                }
                if (session.user?.email) {
                    setUserEmail(session.user.email);
                    
                    // Re-verify payment status on re-auth
                    supabase
                        .from('users')
                        .select('is_paid_beta')
                        .eq('id', session.user.id)
                        .maybeSingle()
                        .then(({ data }) => {
                            setIsPaidUser(!!data?.is_paid_beta);
                        });
                }
                // Store user_id for API calls
                if (session.user?.id) {
                    localStorage.setItem('user_id', session.user.id);
                }
                setIsAuthReady(true);
            } else {
                setIsAuthReady(true);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const handleRecoveryRequired = () => {
            setIsSessionValid(false);
            setSessionTimeoutOpen(true);
        };

        window.addEventListener(SESSION_RECOVERY_EVENT, handleRecoveryRequired as EventListener);
        return () => {
            window.removeEventListener(SESSION_RECOVERY_EVENT, handleRecoveryRequired as EventListener);
        };
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
        if (typeof window !== 'undefined') {
            window.location.reload();
        }
    }, []);

    return (
        <SessionContext.Provider value={{
            isSessionValid,
            isAuthReady,
            authToken,
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
