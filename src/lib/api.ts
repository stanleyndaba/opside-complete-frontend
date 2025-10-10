export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface ApiClientOptions {
	baseUrl?: string;
	headers?: Record<string, string>;
}

export class ApiClient {
	private readonly baseUrl: string;
	private readonly defaultHeaders: Record<string, string>;

	constructor(options?: ApiClientOptions) {
		this.baseUrl = (options?.baseUrl ?? import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");
		this.defaultHeaders = {
			"Content-Type": "application/json",
			...(options?.headers ?? {}),
		};
	}

	private buildUrl(path: string): string {
		if (!this.baseUrl) return path; // allow relative URLs via Vite proxy during dev
		const normalizedPath = path.startsWith("/") ? path : `/${path}`;
		return `${this.baseUrl}${normalizedPath}`;
	}

	async request<T>(method: HttpMethod, path: string, body?: unknown, init?: RequestInit): Promise<T> {
		const url = this.buildUrl(path);
		const response = await fetch(url, {
			method,
			headers: this.defaultHeaders,
			body: body != null ? JSON.stringify(body) : undefined,
			credentials: "include",
			...init,
		});
		if (!response.ok) {
			const text = await response.text().catch(() => "");
			throw new Error(`HTTP ${response.status} ${response.statusText}: ${text}`);
		}
		// Try JSON; if empty, return as any
		const contentType = response.headers.get("content-type") ?? "";
		if (contentType.includes("application/json")) {
			return (await response.json()) as T;
		}
		return (await response.text()) as unknown as T;
	}

	get<T>(path: string, init?: RequestInit): Promise<T> {
		return this.request<T>("GET", path, undefined, init);
	}

	post<T>(path: string, body?: unknown, init?: RequestInit): Promise<T> {
		return this.request<T>("POST", path, body, init);
	}

	put<T>(path: string, body?: unknown, init?: RequestInit): Promise<T> {
		return this.request<T>("PUT", path, body, init);
	}

	patch<T>(path: string, body?: unknown, init?: RequestInit): Promise<T> {
		return this.request<T>("PATCH", path, body, init);
	}

	delete<T>(path: string, init?: RequestInit): Promise<T> {
		return this.request<T>("DELETE", path, undefined, init);
	}
}

export const apiClient = new ApiClient();

export function buildApiUrl(path: string): string {
	const base = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");
	const normalized = path.startsWith("/") ? path : `/${path}`;
	return base ? `${base}${normalized}` : normalized;
}

