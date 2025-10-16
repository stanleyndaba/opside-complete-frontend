import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";

export interface HealthResponse {
  status: "ok" | "error";
  service?: string;
  version?: string;
  time?: string;
}

export function useApiHealth() {
  return useQuery({
    queryKey: ["api", "health"],
    queryFn: () => apiRequest<HealthResponse>("/health"),
    retry: 1,
    staleTime: 30_000,
  });
}

