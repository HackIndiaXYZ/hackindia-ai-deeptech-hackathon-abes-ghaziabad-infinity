import { createFileRoute } from "@tanstack/react-router";
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle2 } from "lucide-react";
import { PageShell } from "@/components/sentinel/PageShell";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/ueba")({
  head: () => ({
    meta: [
      { title: "User Behavior (UEBA) — Sentivoy" },
      { name: "description", content: "User & Entity Behavior Analytics powered by ML baselines." },
    ],
  }),
  component: UebaPage,
});


const statusStyle = {
  anomalous: "bg-critical/10 text-critical",
  watch: "bg-warning/15 text-[oklch(0.5_0.13_70)]",
  normal: "bg-success/10 text-success",
};

import { useDashboardData } from "@/hooks/useDashboardData";

function UebaPage() {
  const { data: dashboardData } = useDashboardData();

  // Deduplicate users from alerts and mock risk scores
  const derivedUsers = Array.from(new Set(dashboardData?.alerts?.map(a => a.user) || [])).map(user => {
    const userAlerts = dashboardData!.alerts.filter(a => a.user === user);
    const criticals = userAlerts.filter(a => a.severity === "Critical").length;
    const highs = userAlerts.filter(a => a.severity === "High").length;
    const risk = Math.min(100, Math.max(10, Math.floor(criticals * 40 + highs * 15)));
    
    return {
      name: user,
      role: user.includes('bot') || user.includes('deploy') ? 'Service' : 'User',
      risk: risk,
      baseline: userAlerts.length, 
      change: Math.floor(userAlerts.length * 10),
      country: userAlerts[0]?.country || 'UK',
      status: risk >= 75 ? 'anomalous' : risk >= 50 ? 'watch' : 'normal'
    };
  }).sort((a,b) => b.risk - a.risk);

  return (
    <PageShell
      title="User Behavior (UEBA)"
      description="Per-user baselines, peer cohorts, and behavior drift scoring."
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(() => {
          const totalUsers = derivedUsers.length;
          const anomalousCount = derivedUsers.filter(u => u.status === "anomalous").length;
          const avgRisk = totalUsers > 0 ? Math.round(derivedUsers.reduce((acc, u) => acc + u.risk, 0) / totalUsers) : 0;

          const cards = [
            { label: "Monitored Users", value: String(totalUsers), icon: CheckCircle2, tone: "default" as const },
            { label: "Anomalous", value: String(anomalousCount), icon: AlertTriangle, tone: "critical" as const },
            { label: "Avg Risk Score", value: String(avgRisk), icon: TrendingDown, tone: "success" as const },
            { label: "Watched", value: String(derivedUsers.filter(u => u.status === "watch").length), icon: TrendingUp, tone: "default" as const },
          ];

          return cards.map((s) => {
            const Icon = s.icon;
            const tone = {
              default: "bg-primary-soft text-primary",
              critical: "bg-critical/10 text-critical",
              success: "bg-success/10 text-success",
            }[s.tone];
            return (
              <div key={s.label} className="card-hover bg-card border border-border rounded-2xl p-5 shadow-[var(--shadow-soft)]">
                <div className={cn("h-9 w-9 rounded-xl grid place-items-center", tone)}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="mt-4 text-[26px] font-semibold tracking-tight text-foreground tabular-nums">{s.value}</div>
                <div className="text-[12.5px] text-muted-foreground mt-1">{s.label}</div>
              </div>
            );
          });
        })()}
      </div>

      <div className="bg-card border border-border rounded-2xl shadow-[var(--shadow-soft)] overflow-hidden">
        <div className="p-5 pb-3">
          <div className="text-[15px] font-semibold text-foreground">High-Risk Entities</div>
          <div className="text-xs text-muted-foreground mt-0.5">Sorted by behavioral risk score</div>
        </div>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-left text-muted-foreground border-b border-border">
              <th className="font-medium px-5 py-2.5 text-[11px] uppercase tracking-wider">User / Entity</th>
              <th className="font-medium px-3 py-2.5 text-[11px] uppercase tracking-wider">Role</th>
              <th className="font-medium px-3 py-2.5 text-[11px] uppercase tracking-wider">Risk Score</th>
              <th className="font-medium px-3 py-2.5 text-[11px] uppercase tracking-wider">Baseline (events/d)</th>
              <th className="font-medium px-3 py-2.5 text-[11px] uppercase tracking-wider">Δ vs baseline</th>
              <th className="font-medium px-3 py-2.5 text-[11px] uppercase tracking-wider">Geo</th>
              <th className="font-medium px-5 py-2.5 text-[11px] uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody>
            {derivedUsers.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-sm text-muted-foreground">
                  No user behavioral anomalies detected yet.
                </td>
              </tr>
            )}
            {derivedUsers.map((u) => (
              <tr key={u.name} className="border-b border-border last:border-0 hover:bg-muted/40 transition">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary to-[oklch(0.46_0.20_270)] grid place-items-center text-primary-foreground text-[10px] font-semibold">
                      {u.name.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="text-foreground truncate">{u.name}</span>
                  </div>
                </td>
                <td className="px-3 py-3 text-muted-foreground">{u.role}</td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    <span className={cn("font-semibold tabular-nums", u.risk > 70 ? "text-critical" : u.risk > 40 ? "text-[oklch(0.5_0.13_70)]" : "text-success")}>
                      {u.risk}
                    </span>
                    <div className="h-1.5 w-20 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full"
                        style={{
                          width: `${u.risk}%`,
                          background: u.risk > 70 ? "oklch(0.62 0.24 22)" : u.risk > 40 ? "oklch(0.78 0.15 78)" : "oklch(0.68 0.16 152)",
                        }}
                      />
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3 text-foreground tabular-nums">{u.baseline}</td>
                <td className="px-3 py-3">
                  <span className={cn("text-[11px] font-semibold tabular-nums", u.change > 0 ? "text-critical" : "text-success")}>
                    {u.change > 0 ? "+" : ""}{u.change}%
                  </span>
                </td>
                <td className="px-3 py-3 text-muted-foreground font-mono text-[11.5px]">{u.country}</td>
                <td className="px-5 py-3">
                  <span className={cn("text-[10.5px] font-semibold capitalize px-2 py-0.5 rounded-md", statusStyle[u.status as keyof typeof statusStyle])}>
                    {u.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageShell>
  );
}
