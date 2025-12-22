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
    showSessionTimeout: () => void;
    hideSessionTimeout: () => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
    const [sessionTimeoutOpen, setSessionTimeoutOpen] = useState(false);
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [isSessionValid, setIsSessionValid] = useState(true);

    // Get user email on mount
    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user?.email) {
                setUserEmail(user.email);
                localStorage.setItem('user_email', user.email);
            }
        };
        getUser();
    }, []);

    // Listen for auth state changes
    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_OUT' || !session) {
                setIsSessionValid(false);
            } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                setIsSessionValid(true);
                setSessionTimeoutOpen(false);
                if (session.user?.email) {
                    setUserEmail(session.user.email);
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
