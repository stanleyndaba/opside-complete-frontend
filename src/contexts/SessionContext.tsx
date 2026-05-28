/**
 * Session Context
 * Manages global session state including soft timeout handling.
 * Redirects protected-session failures back to login while preserving the current route.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { SESSION_RECOVERY_EVENT, attemptSilentSessionRefresh, clearSessionRecoveryPending, clearSessionRecoverySuppression } from '@/lib/sessionRecovery';
import { clearDemoSession, DEMO_SESSION_TOKEN, DEMO_USER_EMAIL, DEMO_USER_ID, isDemoSessionActive } from '@/lib/demoSession';

interface SessionContextType {
    isSessionValid: boolean;
    isAuthReady: boolean;
    authToken: string | null;
    userId: string | null;
    userEmail: string | null;
    isPaidUser: boolean;
    showSessionTimeout: () => void;
    hideSessionTimeout: () => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

const PUBLIC_ROUTE_SEGMENTS = [
    '/login',
    '/waitlist',
    '/connect-amazon',
    '/careers',
    '/docs',
    '/privacy',
    '/terms',
    '/refund-policy',
    '/contact',
    '/sales',
    '/about',
    '/about-margin',
    '/research',
    '/fba-reimbursement-research',
    '/pricing',
    '/branding',
    '/system-error-preview',
    '/amazon-sandbox',
    '/analyzing',
    '/stripe',
] as const;

function matchesRouteSegment(pathname: string, route: string) {
    return pathname === route || pathname.startsWith(`${route}/`);
}

function isPublicRoute(pathname: string) {
    if (!pathname) return false;
    if (pathname === '/') return true;
    if (pathname.startsWith('/auth/')) return true;

    return PUBLIC_ROUTE_SEGMENTS.some((route) => matchesRouteSegment(pathname, route));
}

export function SessionProvider({ children }: { children: ReactNode }) {
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [isSessionValid, setIsSessionValid] = useState(true);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [authToken, setAuthToken] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [isPaidUser, setIsPaidUser] = useState(false);

    const clearStoredAuthContext = useCallback(() => {
        if (typeof window === 'undefined') return;

        localStorage.removeItem('session_token');
        localStorage.removeItem('user_id');
        localStorage.removeItem('user_email');
        localStorage.removeItem('active_tenant_id');
        localStorage.removeItem('active_tenant_slug');
        clearDemoSession();
    }, []);

    const expireSessionLocally = useCallback(() => {
        setIsSessionValid(false);
        setAuthToken(null);
        setUserId(null);
        setUserEmail(null);
        setIsPaidUser(false);
        clearSessionRecoveryPending();
        clearStoredAuthContext();
        void supabase.auth.signOut({ scope: 'local' }).catch(() => undefined);
    }, [clearStoredAuthContext]);

    const redirectToLogin = useCallback(() => {
        if (typeof window === 'undefined') return;

        const { pathname, search, hash } = window.location;
        if (isPublicRoute(pathname)) {
            return;
        }

        expireSessionLocally();
        const next = `${pathname}${search}${hash}`;
        const loginPath = `/login?next=${encodeURIComponent(next)}`;
        window.location.assign(loginPath);
    }, [expireSessionLocally]);

    const handleSessionExpiry = useCallback(() => {
        if (typeof window === 'undefined') return;

        if (isPublicRoute(window.location.pathname)) {
            expireSessionLocally();
            return;
        }

        redirectToLogin();
    }, [expireSessionLocally, redirectToLogin]);

    // Get user email and ID on mount
    useEffect(() => {
        const getUser = async () => {
            try {
                if (isDemoSessionActive()) {
                    setIsSessionValid(true);
                    setAuthToken(DEMO_SESSION_TOKEN);
                    setUserId(DEMO_USER_ID);
                    setUserEmail(DEMO_USER_EMAIL);
                    setIsPaidUser(true);
                    return;
                }

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
                    setUserId(user.id);
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
            if (isDemoSessionActive()) {
                setIsSessionValid(true);
                setAuthToken(DEMO_SESSION_TOKEN);
                setUserId(DEMO_USER_ID);
                setUserEmail(DEMO_USER_EMAIL);
                setIsPaidUser(true);
                setIsAuthReady(true);
                return;
            }

            if (event === 'SIGNED_OUT') {
                setIsSessionValid(false);
                clearSessionRecoveryPending();
                localStorage.removeItem('user_id');
                localStorage.removeItem('user_email');
                localStorage.removeItem('session_token');
                localStorage.removeItem('active_tenant_id');
                localStorage.removeItem('active_tenant_slug');
                setAuthToken(null);
                setUserId(null);
                setUserEmail(null);
                setIsPaidUser(false);
                setIsAuthReady(true);
            } else if (event === 'SIGNED_IN') {
                setIsSessionValid(true);
                clearSessionRecoveryPending();
                clearSessionRecoverySuppression();
                if (session.access_token) {
                    localStorage.setItem('session_token', session.access_token);
                    setAuthToken(session.access_token);
                }
                if (session.user?.email) {
                    setUserEmail(session.user.email);
                    localStorage.setItem('user_email', session.user.email);
                    
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
                    setUserId(session.user.id);
                    localStorage.setItem('user_id', session.user.id);
                }
                setIsAuthReady(true);
            } else if (event === 'TOKEN_REFRESHED') {
                setIsSessionValid(true);
                clearSessionRecoveryPending();
                if (session?.access_token) {
                    localStorage.setItem('session_token', session.access_token);
                    setAuthToken(session.access_token);
                }
                if (session?.user?.email) {
                    setUserEmail(session.user.email);
                }
                if (session?.user?.id) {
                    setUserId(session.user.id);
                    localStorage.setItem('user_id', session.user.id);
                }
                setIsAuthReady(true);
            } else if (event === 'INITIAL_SESSION') {
                const accessToken = session?.access_token || null;
                setIsSessionValid(Boolean(accessToken));
                setAuthToken(accessToken);
                if (accessToken) {
                    clearSessionRecoveryPending();
                }

                if (accessToken) {
                    localStorage.setItem('session_token', accessToken);
                } else {
                    localStorage.removeItem('session_token');
                }

                if (session?.user?.email) {
                    setUserEmail(session.user.email);
                    localStorage.setItem('user_email', session.user.email);
                } else {
                    setUserEmail(null);
                    localStorage.removeItem('user_email');
                }

                if (session?.user?.id) {
                    setUserId(session.user.id);
                    localStorage.setItem('user_id', session.user.id);
                } else {
                    setUserId(null);
                    localStorage.removeItem('user_id');
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

        let mounted = true;

        const handleRecoveryRequired = async () => {
            const refreshed = await attemptSilentSessionRefresh();
            if (refreshed && mounted) {
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.access_token) {
                    setIsSessionValid(true);
                    setAuthToken(session.access_token);
                    localStorage.setItem('session_token', session.access_token);
                    if (session.user?.id) {
                        setUserId(session.user.id);
                        localStorage.setItem('user_id', session.user.id);
                    }
                    if (session.user?.email) {
                        setUserEmail(session.user.email);
                        localStorage.setItem('user_email', session.user.email);
                    }
                    clearSessionRecoveryPending();
                    clearSessionRecoverySuppression();
                    return;
                }
            }

            if (!mounted) return;
            handleSessionExpiry();
        };

        window.addEventListener(SESSION_RECOVERY_EVENT, handleRecoveryRequired as EventListener);
        return () => {
            mounted = false;
            window.removeEventListener(SESSION_RECOVERY_EVENT, handleRecoveryRequired as EventListener);
        };
    }, [handleSessionExpiry]);

    const showSessionTimeout = useCallback(() => {
        clearSessionRecoverySuppression();
        handleSessionExpiry();
    }, [handleSessionExpiry]);

    const hideSessionTimeout = useCallback(() => {
        clearSessionRecoveryPending();
    }, []);

    return (
        <SessionContext.Provider value={{
            isSessionValid,
            isAuthReady,
            authToken,
            userId,
            userEmail,
            isPaidUser,
            showSessionTimeout,
            hideSessionTimeout
        }}>
            {children}
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
 * Hook for handling 401 errors with a login redirect
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
