import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { fetchCurrentUser, getAmazonLoginUrl } from '@/lib/api';

interface AuthUser {
  id: string;
  name?: string;
  email?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
  loginWithAmazon: () => void;
  logoutToLanding: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refresh = async () => {
    setLoading(true);
    const res = await fetchCurrentUser<AuthUser>();
    if (res.ok) {
      setUser(res.data || null);
    } else {
      setUser(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loginWithAmazon = () => {
    window.location.href = getAmazonLoginUrl();
  };

  const logoutToLanding = () => {
    // Assume backend clears session on /auth/logout; fallback to landing
    try {
      fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch {}
    setUser(null);
    window.location.href = '/';
  };

  const value = useMemo<AuthContextValue>(() => ({ user, loading, refresh, loginWithAmazon, logoutToLanding }), [user, loading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-sm text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    window.location.replace('/');
    return null;
  }

  return <>{children}</>;
}

