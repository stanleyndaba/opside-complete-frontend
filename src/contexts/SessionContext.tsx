/**
 * Session Context
 * Manages global session state including soft timeout handling.
 * Redirects protected-session failures back to login while preserving the current route.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth, useUser } from '@clerk/react';
import { supabase } from '@/lib/supabaseClient';
import { SESSION_RECOVERY_EVENT, clearSessionRecoveryPending, clearSessionRecoverySuppression } from '@/lib/sessionRecovery';
import { clearDemoSession, DEMO_SESSION_EVENT, DEMO_SESSION_TOKEN, DEMO_USER_EMAIL, DEMO_USER_ID, isDemoSessionActive } from '@/lib/demoSession';

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
    '/amazon-fba-reimbursement',
    '/amazon-lost-inventory-reimbursement',
    '/amazon-reimbursement-audit',
    '/amazon-inbound-shipment-shortage',
    '/amazon-fee-overcharge-reimbursement',
    '/getida-alternative',
    '/sellerboard-alternative',
    '/about',
    '/about-margin',
    '/research',
    '/fba-reimbursement-research',
    '/pricing',
    '/audit',
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

function getStoredDemoEmail() {
    if (typeof window === 'undefined') return DEMO_USER_EMAIL;
    return localStorage.getItem('user_email') || DEMO_USER_EMAIL;
}

export function SessionProvider({ children }: { children: ReactNode }) {
    const {
        isLoaded: isClerkLoaded,
        isSignedIn: isClerkSignedIn,
        getToken: getClerkToken,
        userId: clerkUserId,
    } = useAuth();
    const { user: clerkUser } = useUser();
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [isSessionValid, setIsSessionValid] = useState(false);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [authToken, setAuthToken] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [isPaidUser, setIsPaidUser] = useState(false);

    const applyDemoSession = useCallback(() => {
        setIsSessionValid(true);
        setAuthToken(DEMO_SESSION_TOKEN);
        setUserId(DEMO_USER_ID);
        setUserEmail(getStoredDemoEmail());
        setIsPaidUser(true);
        setIsAuthReady(true);
        clearSessionRecoveryPending();
        clearSessionRecoverySuppression();
    }, []);

    const ensureActiveDemoSession = useCallback(() => {
        return isDemoSessionActive();
    }, []);

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
        if (ensureActiveDemoSession()) {
            applyDemoSession();
            return;
        }

        setIsSessionValid(false);
        setAuthToken(null);
        setUserId(null);
        setUserEmail(null);
        setIsPaidUser(false);
        clearSessionRecoveryPending();
        clearStoredAuthContext();
        void supabase.auth.signOut({ scope: 'local' }).catch(() => undefined);
    }, [applyDemoSession, clearStoredAuthContext, ensureActiveDemoSession]);

    const redirectToLogin = useCallback(() => {
        if (typeof window === 'undefined') return;
        if (ensureActiveDemoSession()) {
            applyDemoSession();
            return;
        }

        const { pathname, search, hash } = window.location;
        if (isPublicRoute(pathname)) {
            return;
        }

        expireSessionLocally();
        const next = `${pathname}${search}${hash}`;
        const loginPath = `/login?next=${encodeURIComponent(next)}`;
        window.location.assign(loginPath);
    }, [applyDemoSession, ensureActiveDemoSession, expireSessionLocally]);

    const handleSessionExpiry = useCallback(() => {
        if (typeof window === 'undefined') return;
        if (ensureActiveDemoSession()) {
            applyDemoSession();
            return;
        }

        if (isPublicRoute(window.location.pathname)) {
            expireSessionLocally();
            return;
        }

        redirectToLogin();
    }, [applyDemoSession, ensureActiveDemoSession, expireSessionLocally, redirectToLogin]);

    useEffect(() => {
        if (ensureActiveDemoSession()) {
            applyDemoSession();
        }
    }, [applyDemoSession, ensureActiveDemoSession]);

    // Resolve protected-route authority from Clerk before any route may be treated as authenticated or logged out.
    useEffect(() => {
        let cancelled = false;

        const hydrateClerkSession = async () => {
            if (ensureActiveDemoSession()) {
                applyDemoSession();
                return;
            }

            if (!isClerkLoaded) {
                setIsAuthReady(false);
                return;
            }

            if (!isClerkSignedIn || !clerkUserId) {
                if (!cancelled) {
                    setIsSessionValid(false);
                    setAuthToken(null);
                    setUserId(null);
                    setUserEmail(null);
                    setIsPaidUser(false);
                    clearStoredAuthContext();
                    setIsAuthReady(true);
                }
                return;
            }

            const token = await getClerkToken().catch(() => null);
            if (cancelled) return;

            if (!token) {
                // Clerk is loaded but has not provided a usable token. This is not authenticated authority.
                setIsSessionValid(false);
                setAuthToken(null);
                setUserId(null);
                setUserEmail(null);
                setIsPaidUser(false);
                clearStoredAuthContext();
                setIsAuthReady(true);
                return;
            }

            const resolvedEmail = clerkUser?.primaryEmailAddress?.emailAddress || null;
            setIsSessionValid(true);
            setAuthToken(token);
            setUserId(clerkUserId);
            setUserEmail(resolvedEmail);
            setIsPaidUser(false);
            localStorage.setItem('session_token', token);
            localStorage.setItem('user_id', clerkUserId);
            if (resolvedEmail) {
                localStorage.setItem('user_email', resolvedEmail);
            } else {
                localStorage.removeItem('user_email');
            }
            clearSessionRecoveryPending();
            clearSessionRecoverySuppression();
            setIsAuthReady(true);
        };

        void hydrateClerkSession();
        return () => {
            cancelled = true;
        };
    }, [applyDemoSession, clearStoredAuthContext, clerkUser, clerkUserId, ensureActiveDemoSession, getClerkToken, isClerkLoaded, isClerkSignedIn]);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const handleDemoSessionUpdated = () => {
            if (ensureActiveDemoSession()) {
                applyDemoSession();
            }
        };

        window.addEventListener(DEMO_SESSION_EVENT, handleDemoSessionUpdated as EventListener);
        return () => {
            window.removeEventListener(DEMO_SESSION_EVENT, handleDemoSessionUpdated as EventListener);
        };
    }, [applyDemoSession, ensureActiveDemoSession]);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        let mounted = true;

        const handleRecoveryRequired = async () => {
            if (ensureActiveDemoSession()) {
                applyDemoSession();
                return;
            }

            // A 401 received before Clerk finishes restoring browser state is not proof that the seller is logged out.
            if (!isClerkLoaded) {
                return;
            }

            if (isClerkSignedIn && clerkUserId) {
                const clerkToken = await getClerkToken().catch(() => null);
                if (!mounted) return;

                if (clerkToken) {
                    setIsSessionValid(true);
                    setAuthToken(clerkToken);
                    setUserId(clerkUserId);
                    setUserEmail(clerkUser?.primaryEmailAddress?.emailAddress || null);
                    localStorage.setItem('session_token', clerkToken);
                    localStorage.setItem('user_id', clerkUserId);
                    if (clerkUser?.primaryEmailAddress?.emailAddress) {
                        localStorage.setItem('user_email', clerkUser.primaryEmailAddress.emailAddress);
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
    }, [applyDemoSession, clerkUser, clerkUserId, ensureActiveDemoSession, getClerkToken, handleSessionExpiry, isClerkLoaded, isClerkSignedIn]);

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
            if (isDemoSessionActive()) {
                return false;
            }
            showSessionTimeout();
            return true; // Handled
        }
        return false; // Not handled
    }, [showSessionTimeout]);

    return { handleAuthError };
}

export default SessionProvider;
