/**
 * Centralized API base URL — reads from VITE_API_URL env var.
 * In production, set this to your Render backend URL.
 * Locally it defaults to http://localhost:8000.
 */
export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// Global headers helper
const getHeaders = () => ({
  "Content-Type": "application/json",
  "X-API-Key": "sentivoy-dev-api-key-change-me" // Hardcoded for dev bypass
});

// Integrations API
export const api = {
  integrations: {
    list: async () => {
      const res = await fetch(`${API_URL}/api/integrations`, { headers: getHeaders() });
      if (!res.ok) throw new Error("Failed to fetch integrations");
      return res.json();
    },
    save: async (provider: string, config: any) => {
      const res = await fetch(`${API_URL}/api/integrations`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ provider, config })
      });
      if (!res.ok) throw new Error("Failed to save integration");
      return res.json();
    },
    disconnect: async (id: string) => {
      const res = await fetch(`${API_URL}/api/integrations/${id}`, {
        method: "DELETE",
        headers: getHeaders()
      });
      if (!res.ok) throw new Error("Failed to disconnect integration");
      return res.json();
    }
  }
};
