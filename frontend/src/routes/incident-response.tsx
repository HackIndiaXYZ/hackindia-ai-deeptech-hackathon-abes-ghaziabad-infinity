import { createFileRoute } from "@tanstack/react-router";
import { Siren, PlayCircle, Clock, Users, CheckCircle2, AlertCircle } from "lucide-react";
import { PageShell } from "@/components/sentinel/PageShell";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/incident-response")({
  head: () => ({
    meta: [
      { title: "Incident Response — Sentivoy" },
      {
        name: "description",
        content: "Coordinate incident response with playbooks and timelines.",
      },
    ],
  }),
  component: IncidentPage,
});

const playbooks = [
  { name: "Credential Stuffing Response", steps: 7 },
  { name: "Ransomware Containment", steps: 12 },
  { name: "Insider Data Exfil", steps: 9 },
  { name: "Cloud Misconfig Auto-Fix", steps: 5 },
];

const sevStyle = {
  Critical: "bg-critical/10 text-critical",
  High: "bg-warning/15 text-[oklch(0.5_0.16_45)]",
  Medium: "bg-primary-soft text-primary",
};

const statusStyle = {
  active: "bg-critical/10 text-critical",
  resolving: "bg-warning/15 text-[oklch(0.5_0.13_70)]",
  closed: "bg-success/10 text-success",
};

import { useDashboardData } from "@/hooks/useDashboardData";

function IncidentPage() {
  const { data: dashboardData } = useDashboardData();

  // Derive simple incidents from the latest alerts
  const derivedIncidents = (dashboardData?.alerts || []).slice(0, 5).map((a) => {
    const isClosed = a.status === "Resolved";
    return {
      id: "INC-" + a.id.substring(0, 4).toUpperCase(),
      title: `${a.event} involving ${a.user}`,
      severity: a.severity,
      status: isClosed ? "closed" : "active",
      opened: new Date(a.timestamp).toLocaleString(),
      owner: "Unassigned",
      progress: isClosed ? 100 : 0,
    };
  });

  return (
    <PageShell
      title="Incident Response"
      description="Coordinate live incidents and run automated playbooks."
      actions={
        <button className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-critical text-critical-foreground text-[13px] font-semibold hover:opacity-90 transition">
          <Siren className="h-3.5 w-3.5" /> Declare incident
        </button>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(() => {
          const activeCount = derivedIncidents.filter((i) => i.status === "active").length;
          const closedCount = derivedIncidents.filter((i) => i.status === "closed").length;
          const totalAlerts = dashboardData?.alerts?.length || 0;

          const cards = [
            {
              label: "Active Incidents",
              value: String(activeCount),
              icon: AlertCircle,
              tone: "critical" as const,
            },
            {
              label: "Total Alerts",
              value: String(totalAlerts),
              icon: Clock,
              tone: "default" as const,
            },
            { label: "On-call", value: "—", icon: Users, tone: "default" as const },
            {
              label: "Resolved",
              value: String(closedCount),
              icon: CheckCircle2,
              tone: "success" as const,
            },
          ];

          return cards.map((s) => {
            const Icon = s.icon;
            const tone = {
              default: "bg-primary-soft text-primary",
              critical: "bg-critical/10 text-critical",
              success: "bg-success/10 text-success",
            }[s.tone];
            return (
              <div
                key={s.label}
                className="card-hover bg-card border border-border rounded-2xl p-5 shadow-[var(--shadow-soft)]"
              >
                <div className={cn("h-9 w-9 rounded-xl grid place-items-center", tone)}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="mt-4 text-[26px] font-semibold tracking-tight text-foreground tabular-nums">
                  {s.value}
                </div>
                <div className="text-[12.5px] text-muted-foreground mt-1">{s.label}</div>
              </div>
            );
          });
        })()}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 bg-card border border-border rounded-2xl shadow-[var(--shadow-soft)] overflow-hidden">
          <div className="p-5 pb-3">
            <div className="text-[15px] font-semibold text-foreground">Open Incidents</div>
            <div className="text-xs text-muted-foreground mt-0.5">Sorted by recency</div>
          </div>
          <div className="divide-y divide-border">
            {derivedIncidents.length === 0 && (
              <div className="p-8 text-center text-sm text-muted-foreground">
                No incidents currently match alert constraints.
              </div>
            )}
            {derivedIncidents.map((i) => (
              <div
                key={i.id}
                className={cn(
                  "p-5 hover:bg-muted/40 transition cursor-pointer",
                  i.severity === "Critical" && "border-l-2 border-l-critical",
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-[11px] font-semibold text-primary">
                        {i.id}
                      </span>
                      <span
                        className={cn(
                          "text-[10px] font-semibold px-2 py-0.5 rounded-md",
                          sevStyle[i.severity as keyof typeof sevStyle] || sevStyle.Medium,
                        )}
                      >
                        {i.severity}
                      </span>
                      <span
                        className={cn(
                          "text-[10px] font-semibold capitalize px-2 py-0.5 rounded-md",
                          statusStyle[i.status as keyof typeof statusStyle],
                        )}
                      >
                        {i.status}
                      </span>
                    </div>
                    <div className="mt-2 text-[14px] font-medium text-foreground">{i.title}</div>
                    <div className="mt-1 text-[11.5px] text-muted-foreground flex items-center gap-3">
                      <span>Opened {i.opened}</span>
                      <span>·</span>
                      <span>Owner: {i.owner}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[11px] text-muted-foreground">Resolution</div>
                    <div className="text-[18px] font-semibold tabular-nums text-foreground">
                      {i.progress}%
                    </div>
                  </div>
                </div>
                <div className="mt-3 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${i.progress}%`,
                      background:
                        i.progress === 100 ? "oklch(0.68 0.16 152)" : "oklch(0.58 0.19 260)",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl shadow-[var(--shadow-soft)] overflow-hidden">
          <div className="p-5 pb-3">
            <div className="text-[15px] font-semibold text-foreground">Automated Playbooks</div>
            <div className="text-xs text-muted-foreground mt-0.5">One-click response</div>
          </div>
          <div className="divide-y divide-border">
            {playbooks.map((p) => (
              <div
                key={p.name}
                className="p-4 flex items-center justify-between gap-3 hover:bg-muted/40 transition"
              >
                <div className="min-w-0">
                  <div className="text-[13px] font-medium text-foreground truncate">{p.name}</div>
                  <div className="text-[10.5px] text-muted-foreground">{p.steps} steps</div>
                </div>
                <button className="shrink-0 inline-flex items-center gap-1 h-8 px-2.5 rounded-lg bg-primary-soft text-primary text-[11.5px] font-semibold hover:bg-primary hover:text-primary-foreground transition">
                  <PlayCircle className="h-3.5 w-3.5" /> Run
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageShell>
  );
}
