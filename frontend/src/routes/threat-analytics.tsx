import { createFileRoute } from "@tanstack/react-router";
import { Activity, Download, Filter, TrendingUp, Shield, Zap, Target } from "lucide-react";
import {
  AreaChart,
  Area,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import { PageShell } from "@/components/sentinel/PageShell";
import { useDashboardData } from "@/hooks/useDashboardData";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/threat-analytics")({
  head: () => ({
    meta: [
      { title: "Threat Analytics — Sentivoy" },
      {
        name: "description",
        content: "Deep-dive analytics on detected threats and anomaly patterns.",
      },
    ],
  }),
  component: ThreatAnalyticsPage,
});

const DEFAULT_KILL_CHAIN = [
  { stage: "Recon", value: 0 },
  { stage: "Weaponize", value: 0 },
  { stage: "Deliver", value: 0 },
  { stage: "Exploit", value: 0 },
  { stage: "Install", value: 0 },
  { stage: "C2", value: 0 },
  { stage: "Action", value: 0 },
];

function ThreatAnalyticsPage() {
  const { data: dashboardData, isLoading } = useDashboardData();

  if (isLoading || !dashboardData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const { trend, threatPatterns } = dashboardData;

  const techniques = threatPatterns
    .filter((t) => t.value > 0)
    .map((tp, i) => ({
      id: `T100${i}`,
      name: tp.name,
      count: tp.value,
      trend: 0,
    }));

  // Derive radar surface
  const radarData = threatPatterns.slice(0, 6).map((tp) => ({
    kind: tp.name,
    score: Math.min(100, tp.value * 20),
  }));

  // Fill in blanks if empty
  while (radarData.length < 3) {
    radarData.push({ kind: `Unknown-${radarData.length}`, score: 0 });
  }

  // Derive Kill Chain mapping
  const derivedKillChain = [...DEFAULT_KILL_CHAIN];
  threatPatterns.forEach((t) => {
    if (t.name.toLowerCase().includes("brute") || t.name.toLowerCase().includes("auth")) {
      derivedKillChain[3].value += t.value; // Exploit
    } else if (t.name.toLowerCase().includes("api") || t.name.toLowerCase().includes("sql")) {
      derivedKillChain[6].value += t.value; // Action
    } else if (t.name.toLowerCase().includes("geo")) {
      derivedKillChain[0].value += t.value; // Recon
    }
  });

  return (
    <PageShell
      title="Threat Analytics"
      description="Attack-pattern analysis, MITRE technique coverage, and kill-chain telemetry."
      actions={
        <>
          <button className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-border bg-card text-[13px] font-medium hover:bg-muted transition">
            <Filter className="h-3.5 w-3.5" /> Filter
          </button>
          <button className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-foreground text-background text-[13px] font-semibold hover:opacity-90 transition">
            <Download className="h-3.5 w-3.5" /> Export
          </button>
        </>
      }
    >
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(() => {
          const { metrics } = dashboardData;
          const totalThreats = metrics.threats || 0;
          const techniquesCount = techniques.length;
          const criticalCount = metrics.critical || 0;
          const totalAnomalies = metrics.anomalies || 0;
          const score =
            totalAnomalies > 0
              ? Math.min(100, Math.round((criticalCount / Math.max(totalAnomalies, 1)) * 100))
              : 0;
          const scoreLabel =
            score > 70 ? "Critical" : score > 40 ? "Elevated" : score > 15 ? "Moderate" : "Low";

          const cards = [
            {
              label: "Threat Score",
              value: `${score} / 100`,
              sub: scoreLabel,
              icon: Shield,
              tone: "warning" as const,
            },
            {
              label: "Techniques Seen",
              value: String(techniquesCount),
              sub: `from ${totalAnomalies} anomalies`,
              icon: Target,
              tone: "default" as const,
            },
            {
              label: "Critical Threats",
              value: String(criticalCount),
              sub: `of ${totalThreats} total`,
              icon: Zap,
              tone: "critical" as const,
            },
            {
              label: "Total Anomalies",
              value: String(totalAnomalies),
              sub: `${metrics.blocked || 0} blocked`,
              icon: TrendingUp,
              tone: "success" as const,
            },
          ];

          return cards.map((k) => {
            const Icon = k.icon;
            const tone = {
              default: "bg-primary-soft text-primary",
              critical: "bg-critical/10 text-critical",
              warning: "bg-warning/15 text-[oklch(0.55_0.13_70)]",
              success: "bg-success/10 text-success",
            }[k.tone];
            return (
              <div
                key={k.label}
                className="card-hover bg-card border border-border rounded-2xl p-5 shadow-[var(--shadow-soft)]"
              >
                <div className={cn("h-9 w-9 rounded-xl grid place-items-center", tone)}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="mt-4 text-[26px] font-semibold tracking-tight text-foreground">
                  {k.value}
                </div>
                <div className="text-[12.5px] text-muted-foreground mt-1">{k.label}</div>
                <div className="text-[10.5px] text-muted-foreground/70 mt-0.5">{k.sub}</div>
              </div>
            );
          });
        })()}
      </div>

      {/* Radar + technique table */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-2xl p-5 shadow-[var(--shadow-soft)]">
          <div className="text-[15px] font-semibold text-foreground">Attack Surface Coverage</div>
          <div className="text-xs text-muted-foreground mt-0.5">
            Detection confidence per category
          </div>
          <div className="h-[280px] mt-3">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="oklch(0.92 0.012 255)" />
                <PolarAngleAxis
                  dataKey="kind"
                  tick={{ fill: "oklch(0.45 0.03 257)", fontSize: 11 }}
                />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar
                  dataKey="score"
                  stroke="oklch(0.58 0.19 260)"
                  fill="oklch(0.58 0.19 260)"
                  fillOpacity={0.35}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="xl:col-span-2 bg-card border border-border rounded-2xl shadow-[var(--shadow-soft)] overflow-hidden">
          <div className="p-5 pb-3">
            <div className="text-[15px] font-semibold text-foreground">
              Top MITRE ATT&CK Techniques
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              Observed across your environment
            </div>
          </div>
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-left text-muted-foreground border-b border-border">
                <th className="font-medium px-5 py-2.5 text-[11px] uppercase tracking-wider">ID</th>
                <th className="font-medium px-3 py-2.5 text-[11px] uppercase tracking-wider">
                  Technique
                </th>
                <th className="font-medium px-3 py-2.5 text-[11px] uppercase tracking-wider">
                  Events
                </th>
                <th className="font-medium px-3 py-2.5 text-[11px] uppercase tracking-wider">
                  7d Trend
                </th>
                <th className="font-medium px-5 py-2.5 text-[11px] uppercase tracking-wider">
                  Severity
                </th>
              </tr>
            </thead>
            <tbody>
              {techniques.map((t) => (
                <tr
                  key={t.id}
                  className="border-b border-border last:border-0 hover:bg-muted/40 transition"
                >
                  <td className="px-5 py-3 font-mono text-[12px] text-primary font-semibold">
                    {t.id}
                  </td>
                  <td className="px-3 py-3 text-foreground">{t.name}</td>
                  <td className="px-3 py-3 text-foreground tabular-nums">{t.count}</td>
                  <td className="px-3 py-3">
                    <span
                      className={cn(
                        "text-[11px] font-semibold tabular-nums",
                        t.trend > 0 ? "text-critical" : "text-success",
                      )}
                    >
                      {t.trend > 0 ? "+" : ""}
                      {t.trend}%
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="h-1.5 w-32 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(100, t.count / 5)}%`,
                          background:
                            t.count > 200
                              ? "oklch(0.62 0.24 22)"
                              : t.count > 100
                                ? "oklch(0.78 0.15 78)"
                                : "oklch(0.58 0.19 260)",
                        }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Trend + Kill chain */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 bg-card border border-border rounded-2xl p-5 shadow-[var(--shadow-soft)]">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            <div className="text-[15px] font-semibold text-foreground">
              Threat Velocity (30 days)
            </div>
          </div>
          <div className="h-[260px] mt-3 -ml-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend}>
                <defs>
                  <linearGradient id="velGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="oklch(0.62 0.18 300)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="oklch(0.62 0.18 300)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  stroke="oklch(0.93 0.01 255)"
                  strokeDasharray="3 3"
                  vertical={false}
                />
                <XAxis
                  dataKey="time"
                  stroke="oklch(0.55 0.035 257)"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  interval={9}
                />
                <YAxis
                  stroke="oklch(0.55 0.035 257)"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  width={32}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="anomalies"
                  stroke="oklch(0.62 0.18 300)"
                  strokeWidth={2}
                  fill="url(#velGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 shadow-[var(--shadow-soft)]">
          <div className="text-[15px] font-semibold text-foreground">Cyber Kill Chain</div>
          <div className="text-xs text-muted-foreground mt-0.5">Stages observed last 24h</div>
          <div className="h-[260px] mt-3 -ml-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={derivedKillChain}>
                <CartesianGrid
                  stroke="oklch(0.93 0.01 255)"
                  strokeDasharray="3 3"
                  vertical={false}
                />
                <XAxis
                  dataKey="stage"
                  stroke="oklch(0.55 0.035 257)"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="oklch(0.55 0.035 257)"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  width={32}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {derivedKillChain.map((_, i) => (
                    <Cell key={i} fill={`oklch(${0.78 - i * 0.04} 0.18 ${260 - i * 25})`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
