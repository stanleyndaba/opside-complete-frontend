import { apiRequest, setAuthToken } from "@/lib/api";

export interface User {
  id: string;
  email: string;
  name?: string;
}

export interface LoginResponse {
  accessToken: string;
  user: User;
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const res = await apiRequest<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  setAuthToken(res.accessToken);
  return res;
}

export async function refreshToken(): Promise<string> {
  const res = await apiRequest<{ accessToken: string }>("/auth/refresh", {
    method: "POST",
  });
  setAuthToken(res.accessToken);
  return res.accessToken;
}

export function logout(): void {
  setAuthToken(null);
}

