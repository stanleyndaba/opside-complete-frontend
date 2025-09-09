import { useEffect, useMemo, useState, useCallback } from "react";

type AuthUser = {
  id: string;
  name: string;
  email: string;
};

type AuthState = {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  loginWithAmazon: () => void;
  logout: () => Promise<void>;
};

const apiBase = (import.meta as any)?.env?.VITE_API_BASE_URL || (import.meta as any)?.env?.VITE_API_URL || "";

export function useAuth(): AuthState {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    const fetchMe = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`${apiBase}/auth/me`, {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });
        if (res.ok) {
          const data = await res.json();
          if (isMounted) setUser(data?.user ?? null);
        } else {
          if (isMounted) setUser(null);
        }
      } catch (_err) {
        if (isMounted) setUser(null);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    fetchMe();
    return () => {
      isMounted = false;
    };
  }, []);

  const loginWithAmazon = useCallback(() => {
    window.location.href = `${apiBase}/auth/amazon`;
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch(`${apiBase}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (_e) {
      // ignore
    } finally {
      setUser(null);
    }
  }, []);

  return useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!user,
      loginWithAmazon,
      logout,
    }),
    [user, isLoading, loginWithAmazon, logout]
  );
}

