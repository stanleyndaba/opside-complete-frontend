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

	const fetchMe = useCallback(async () => {
		try {
			setLoading(true);
			const data = await apiClient.get<UserProfile>('/api/auth/me');
			setUser(data);
			setError(null);
		} catch (err) {
			setUser(null);
			setError(null);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchMe();
	}, [fetchMe]);

	const signInWithAmazon = useCallback(() => {
		// Redirect flow; backend should start OAuth and set cookie
		window.location.href = '/api/auth/amazon/login';
	}, []);

	const signOut = useCallback(async () => {
		await apiClient.post('/api/auth/logout');
		setUser(null);
	}, []);

	return { user, loading, error, refresh: fetchMe, signInWithAmazon, signOut };
}

