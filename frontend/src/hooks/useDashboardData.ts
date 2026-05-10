import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/authContext";
import { API_URL } from "@/lib/api";
import type { AlertRow } from "@/lib/types";

export interface DashboardData {
  metrics: {
    logs: number;
    anomalies: number;
    critical: number;
    threats: number;
    blocked: number;
  };
  trend: Array<{ time: string; anomalies: number; critical: number }>;
  threatPatterns: Array<{ name: string; value: number }>;
  geoOrigins: Array<{
    country: string;
    code: string;
    x: number;
    y: number;
    threats: number;
    intensity: "low" | "medium" | "high" | "critical";
  }>;
  alerts: AlertRow[];
}

export function useDashboardData() {
  const { session } = useAuth();

  return useQuery<DashboardData>({
    queryKey: ["dashboardData"],
    queryFn: async () => {
      if (!session?.access_token) throw new Error("No session");

      const res = await fetch(`${API_URL}/api/dashboard/summary`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!res.ok) {
        let errText = "Unknown error";
        try {
          const errBody = await res.json();
          errText = errBody.detail || JSON.stringify(errBody);
        } catch (e) {
          errText = await res.text();
        }
        throw new Error(`Failed to fetch dashboard data (${res.status}): ${errText}`);
      }

      return res.json();
    },
    enabled: !!session?.access_token,
    refetchInterval: 5000, // Poll every 5 seconds globally
    staleTime: 4000,
    retry: false, // Don't retry on errors so we see them immediately
  });
}
