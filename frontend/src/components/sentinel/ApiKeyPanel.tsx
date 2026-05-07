import { useState, useEffect } from "react";
import { useAuth } from "@/lib/authContext";
import { API_URL } from "@/lib/api";

interface ApiKey {
  id: string;
  name: string;
  key_string: string;
  is_active: boolean;
  created_at: string;
}

export function ApiKeyPanel() {
  const { session } = useAuth();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [newKeyName, setNewKeyName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [justCreated, setJustCreated] = useState<string | null>(null);

  const fetchKeys = async () => {
    if (!session?.access_token) return;
    try {
      const res = await fetch(`${API_URL}/api/keys`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setKeys(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, [session?.access_token]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim() || !session?.access_token) return;
    
    setIsCreating(true);
    try {
      const res = await fetch(`${API_URL}/api/keys`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ name: newKeyName }),
      });
      if (res.ok) {
        const newKey = await res.json();
        setJustCreated(newKey.key_string);
        setNewKeyName("");
        fetchKeys();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsCreating(false);
    }
  };

  const handleRevoke = async (id: string) => {
    if (!session?.access_token || !confirm("Are you sure you want to revoke this key?")) return;
    try {
      const res = await fetch(`${API_URL}/api/keys/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        fetchKeys();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="bg-card border border-border rounded-2xl shadow-[var(--shadow-soft)] overflow-hidden">
      <div className="p-5 pb-3 border-b border-border">
        <div className="text-[15px] font-semibold text-foreground">API Keys</div>
        <div className="text-xs text-muted-foreground mt-0.5">Programmatic access tokens for log ingestion</div>
      </div>
      
      <div className="p-5 bg-muted/20 border-b border-border">
        <form onSubmit={handleCreate} className="flex gap-3">
          <input
            type="text"
            placeholder="Key name (e.g. Prod Server, Logstash)"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            className="flex-1 h-9 px-3 rounded-lg border border-border bg-background text-[13px] placeholder:text-muted-foreground focus:outline-none focus:border-primary"
            required
          />
          <button 
            type="submit" 
            disabled={isCreating}
            className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-[13px] font-semibold hover:opacity-90 disabled:opacity-50 transition"
          >
            {isCreating ? "Generating..." : "Generate Key"}
          </button>
        </form>
        {justCreated && (
          <div className="mt-3 p-3 bg-success/10 border border-success/30 rounded-lg">
            <div className="text-[13px] font-semibold text-success mb-1">Key Generated Successfully!</div>
            <div className="text-[12px] text-muted-foreground mb-2">Please copy this key now. You will not be able to see it again.</div>
            <div className="flex items-center gap-2">
              <code className="flex-1 block p-2 bg-background border border-border rounded text-[12px] font-mono select-all">
                {justCreated}
              </code>
              <button 
                onClick={() => setJustCreated(null)}
                className="h-8 px-3 rounded bg-muted hover:bg-muted/80 text-[12px] font-medium"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="divide-y divide-border">
        {loading ? (
          <div className="p-8 text-center text-[13px] text-muted-foreground">Loading keys...</div>
        ) : keys.length === 0 ? (
          <div className="p-8 text-center text-[13px] text-muted-foreground">No active API keys found.</div>
        ) : (
          keys.map((k) => (
            <div key={k.id} className="p-4 flex items-center justify-between text-[13px]">
              <div>
                <div className="font-semibold text-foreground">{k.name}</div>
                <div className="font-mono text-muted-foreground mt-1 tracking-wider text-[11px]">
                  {k.key_string.substring(0, 12)}••••••••••••••••
                </div>
                <div className="text-[11px] text-muted-foreground/70 mt-1">
                  Created {new Date(k.created_at).toLocaleDateString()}
                </div>
              </div>
              <button 
                onClick={() => handleRevoke(k.id)}
                className="text-[12px] font-semibold text-critical hover:underline"
              >
                Revoke
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
