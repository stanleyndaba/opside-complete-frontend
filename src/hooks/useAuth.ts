import { useEffect, useState, useCallback } from 'react';
import { apiClient } from '@/lib/api';

export interface UserProfile {
	id: string;
	name: string;
	email: string;
	avatarUrl?: string;
}

export function useAuth() {
	const [user, setUser] = useState<UserProfile | null>(null);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);

	// Frontend-only: demo mode helpers
	const isDemoEnv = (import.meta.env.VITE_DEMO_MODE as string | undefined) === 'true';
	const getIsDemo = () => isDemoEnv || localStorage.getItem('demo_mode') === '1' || new URLSearchParams(window.location.search).get('demo') === '1';

	const fetchMe = useCallback(async () => {
		try {
			setLoading(true);
			const data = await apiClient.get<UserProfile>('/api/auth/me');
			setUser(data);
			setError(null);
		} catch (err) {
			// Frontend-only demo fallback: show a stub user when backend auth isn't available
			if (getIsDemo()) {
				setUser({ id: 'demo-user', name: 'Demo User', email: 'demo@example.com' });
				setError(null);
			} else {
				setUser(null);
				setError(null);
			}
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchMe();
	}, [fetchMe]);

	// Stripe onboarding hook: run once per session right after login succeeds
	useEffect(() => {
		const runStripePostLogin = async () => {
			try {
				const alreadyChecked = sessionStorage.getItem('stripe_post_login_checked');
				// Skip Stripe in demo mode
				if (!user || alreadyChecked || getIsDemo()) return;
				sessionStorage.setItem('stripe_post_login_checked', '1');
				const result = await apiClient.post<any>('/api/auth/post-login/stripe');
				const url = (result as any)?.redirectUrl || (result as any)?.onboardingUrl;
				if (typeof url === 'string' && url.startsWith('http')) {
					window.location.href = url;
				}
			} catch {
				// Swallow errors to avoid blocking dashboard access
			}
		};
		runStripePostLogin();
	}, [user]);

	const signInWithAmazon = useCallback(() => {
		// Redirect flow; backend should start OAuth and set cookie
		window.location.href = '/api/auth/amazon/login';
	}, []);

	const signOut = useCallback(async () => {
		try { await apiClient.post('/api/auth/logout'); } catch {}
		localStorage.removeItem('demo_mode');
		setUser(null);
	}, []);

	return { user, loading, error, refresh: fetchMe, signInWithAmazon, signOut };
}

