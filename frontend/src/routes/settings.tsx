import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Bell, Shield, Users, Key, Database, Sparkles, Send, CheckCircle2, XCircle } from "lucide-react";
import { PageShell } from "@/components/sentinel/PageShell";
import { ApiKeyPanel } from "@/components/sentinel/ApiKeyPanel";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/authContext";
import { API_URL } from "@/lib/api";
import { useDashboardData } from "@/hooks/useDashboardData";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Sentivoy" },
      { name: "description", content: "Configure detection rules, members, and billing." },
    ],
  }),
  component: SettingsPage,
});

const sections = [
  { id: "general", label: "General", icon: Sparkles },
  { id: "detection", label: "Detection rules", icon: Shield },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "members", label: "Team", icon: Users },
  { id: "api", label: "API keys", icon: Key },
  { id: "data", label: "Data retention", icon: Database },
] as const;

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      className={cn(
        "h-5 w-9 rounded-full p-0.5 transition relative",
        on ? "bg-primary" : "bg-muted",
      )}
    >
      <span
        className={cn(
          "block h-4 w-4 rounded-full bg-white shadow transition-transform",
          on ? "translate-x-4" : "translate-x-0",
        )}
      />
    </button>
  );
}

function SettingsPage() {
  const { session, user } = useAuth();
  const { data: dashboardData } = useDashboardData();
  const [active, setActive] = useState<(typeof sections)[number]["id"]>("general");
  const [toggles, setToggles] = useState({
    realtime: true,
    aiTriage: true,
    autoBlock: false,
    weeklyReport: true,
    sso: true,
    mfaRequired: true,
  });
  const [testAlertLoading, setTestAlertLoading] = useState(false);
  const [testAlertResult, setTestAlertResult] = useState<{ success: boolean; message: string } | null>(null);

  const update = (k: keyof typeof toggles) => (v: boolean) => setToggles((p) => ({ ...p, [k]: v }));

  const sendTestAlert = async () => {
    if (!session?.access_token) return;
    setTestAlertLoading(true);
    setTestAlertResult(null);
    try {
      const res = await fetch(`${API_URL}/api/notifications/test`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      setTestAlertResult({
        success: data.success,
        message: data.success
          ? `Test alert sent to ${data.email_sent_to}`
          : data.message || "Failed to send test alert",
      });
    } catch (err) {
      setTestAlertResult({ success: false, message: "Network error. Is the backend running?" });
    } finally {
      setTestAlertLoading(false);
      setTimeout(() => setTestAlertResult(null), 5000);
    }
  };

  const settingItems: Record<string, { label: string; sub: string; key: keyof typeof toggles }[]> = {
    general: [
      { label: "Real-time monitoring", sub: "Stream events from all connected sources.", key: "realtime" },
      { label: "Sentivoy AI triage", sub: "Let AI auto-classify low-confidence alerts.", key: "aiTriage" },
      { label: "Weekly executive report", sub: "Email summary every Monday at 8am.", key: "weeklyReport" },
    ],
    detection: [
      { label: "Auto-block hostile IPs", sub: "Push offending IPs to edge firewall.", key: "autoBlock" },
      { label: "Real-time monitoring", sub: "Stream events from all connected sources.", key: "realtime" },
    ],
    notifications: [
      { label: "Weekly executive report", sub: "Email summary every Monday at 8am.", key: "weeklyReport" },
    ],
    members: [
      { label: "Require MFA for all members", sub: "Enforced on next login.", key: "mfaRequired" },
      { label: "SSO enabled (Okta)", sub: "Members sign in via SSO.", key: "sso" },
    ],
    api: [],
    data: [],
  };

  // Workspace data from real sources
  const totalLogs = dashboardData?.metrics?.logs ?? 0;
  const totalAlerts = dashboardData?.alerts?.length ?? 0;
  const userEmail = user?.email || "—";

  return (
    <PageShell title="Settings" description="Workspace configuration.">
      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-5">
        <nav className="bg-card border border-border rounded-2xl p-2 h-fit shadow-[var(--shadow-soft)]">
          {sections.map((s) => {
            const Icon = s.icon;
            return (
              <button
                key={s.id}
                onClick={() => setActive(s.id)}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition",
                  active === s.id ? "bg-primary-soft text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted",
                )}
              >
                <Icon className="h-4 w-4" />
                {s.label}
              </button>
            );
          })}
        </nav>

        <div className="space-y-4">
          {active === "api" ? (
            <ApiKeyPanel />
          ) : active === "data" ? (
            <div className="bg-card border border-border rounded-2xl p-5 shadow-[var(--shadow-soft)]">
              <div className="text-[15px] font-semibold text-foreground">Data Retention</div>
              <div className="text-xs text-muted-foreground mt-0.5">How long Sentivoy keeps your logs</div>
              <div className="mt-5 space-y-4">
                {[
                  { label: "Raw logs", value: "30 days" },
                  { label: "Anomaly events", value: "180 days" },
                  { label: "Incidents & post-mortems", value: "Forever" },
                ].map((r) => (
                  <div key={r.label} className="flex items-center justify-between border-b border-border pb-3 last:border-0">
                    <div>
                      <div className="text-[13.5px] font-medium text-foreground">{r.label}</div>
                    </div>
                    <select className="h-8 px-3 rounded-lg border border-border bg-card text-[12px] font-medium">
                      <option>{r.value}</option>
                      <option>7 days</option>
                      <option>90 days</option>
                      <option>1 year</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div className="bg-card border border-border rounded-2xl shadow-[var(--shadow-soft)] divide-y divide-border">
                {(settingItems[active] ?? []).map((item) => (
                  <div key={item.label} className="p-5 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="text-[13.5px] font-medium text-foreground">{item.label}</div>
                      <div className="text-[11.5px] text-muted-foreground mt-0.5">{item.sub}</div>
                    </div>
                    <Toggle on={toggles[item.key]} onChange={update(item.key)} />
                  </div>
                ))}
                {(settingItems[active] ?? []).length === 0 && (
                  <div className="p-8 text-center text-sm text-muted-foreground">Nothing to configure here.</div>
                )}
              </div>

              {/* Email Alert Test Section — only on notifications tab */}
              {active === "notifications" && (
                <div className="bg-card border border-border rounded-2xl p-5 shadow-[var(--shadow-soft)]">
                  <div className="text-[15px] font-semibold text-foreground">Email Alert Testing</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Send a test critical alert email to verify your Resend integration
                  </div>
                  <div className="mt-5 flex items-center gap-3">
                    <button
                      onClick={sendTestAlert}
                      disabled={testAlertLoading}
                      className={cn(
                        "inline-flex items-center gap-2 h-9 px-4 rounded-lg text-[13px] font-semibold transition",
                        "bg-primary text-white hover:bg-primary/90 disabled:opacity-50"
                      )}
                    >
                      {testAlertLoading ? (
                        <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      ) : (
                        <Send className="h-3.5 w-3.5" />
                      )}
                      {testAlertLoading ? "Sending..." : "Send test alert"}
                    </button>
                    {testAlertResult && (
                      <div className={cn(
                        "flex items-center gap-1.5 text-[12px] font-medium",
                        testAlertResult.success ? "text-green-500" : "text-destructive"
                      )}>
                        {testAlertResult.success ? (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5" />
                        )}
                        {testAlertResult.message}
                      </div>
                    )}
                  </div>
                  <div className="mt-3 text-[11px] text-muted-foreground">
                    This sends a simulated critical alert to your registered email address via Resend.
                  </div>
                </div>
              )}
            </>
          )}

          <div className="bg-card border border-border rounded-2xl p-5 shadow-[var(--shadow-soft)]">
            <div className="text-[15px] font-semibold text-foreground">Workspace</div>
            <div className="text-xs text-muted-foreground mt-0.5">{userEmail}</div>
            <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3 text-[12.5px]">
              <div>
                <div className="text-muted-foreground">Logs ingested</div>
                <div className="text-[15px] font-semibold text-foreground tabular-nums">
                  {totalLogs >= 1000000
                    ? (totalLogs / 1000000).toFixed(1) + "M"
                    : totalLogs >= 1000
                      ? (totalLogs / 1000).toFixed(1) + "K"
                      : String(totalLogs)}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Active alerts</div>
                <div className="text-[15px] font-semibold text-foreground tabular-nums">{totalAlerts}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Anomalies</div>
                <div className="text-[15px] font-semibold text-foreground tabular-nums">{dashboardData?.metrics?.anomalies ?? 0}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

