import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";

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

  const didStripeHook = useRef(false);

  useEffect(() => {
    let isMounted = true;
    const fetchMe = async () => {
      setIsLoading(true);
      try {
        const data = await apiFetch<any>(`/api/auth/me`);
        if (isMounted) setUser(data?.user ?? null);
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

  // Post-login Stripe onboarding hook
  useEffect(() => {
    const runStripeHook = async () => {
      if (!user || didStripeHook.current) return;
      didStripeHook.current = true;
      try {
        const res = await apiFetch<any>(`/api/auth/post-login/stripe`, {
          method: "POST",
          body: JSON.stringify({}),
        });
        const onboardingUrl = res?.onboarding_url || res?.url;
        const manageUrl = res?.manage_billing_url || res?.billing_portal_url;
        if (onboardingUrl) {
          window.location.href = onboardingUrl;
          return;
        }
        if (manageUrl) {
          toast.success("Billing ready. Manage your payment method.", {
            action: {
              label: "Manage Billing",
              onClick: () => window.open(manageUrl, "_blank"),
            },
          });
        }
      } catch (_e) {
        // Don’t block dashboard; show gentle notice
        toast.message("Billing setup deferred", { description: "You can complete Stripe onboarding later from Billing." });
      }
    };
    runStripeHook();
  }, [user]);

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

