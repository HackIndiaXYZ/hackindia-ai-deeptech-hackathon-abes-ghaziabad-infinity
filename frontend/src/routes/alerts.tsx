import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Filter, Download } from "lucide-react";
import { PageShell } from "@/components/sentinel/PageShell";
import { AlertsTable } from "@/components/sentinel/AlertsTable";
import { AlertDrawer } from "@/components/sentinel/AlertDrawer";
import { type AlertRow, type AlertStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useDashboardData } from "@/hooks/useDashboardData";

export const Route = createFileRoute("/alerts")({
  head: () => ({
    meta: [
      { title: "Alerts — Sentivoy" },
      { name: "description", content: "Triage, assign, and resolve security alerts." },
    ],
  }),
  component: AlertsPage,
});

function AlertsPage() {
  const { data: dashboardData, isLoading } = useDashboardData();
  const [tab, setTab] = useState<AlertStatus | "All">("All");
  const [selected, setSelected] = useState<AlertRow | null>(null);

  if (isLoading || !dashboardData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const all = dashboardData.alerts || [];

  const counts = {
    All: all.length,
    Open: all.filter((a) => a.status === "Open").length,
    Investigating: all.filter((a) => a.status === "Investigating").length,
    Resolved: all.filter((a) => a.status === "Resolved").length,
  };

  const filtered = tab === "All" ? all : all.filter((a) => a.status === tab);
  const tabs: (AlertStatus | "All")[] = ["All", "Open", "Investigating", "Resolved"];

  const sevCounts = {
    Critical: all.filter((a) => a.severity === "Critical").length,
    High: all.filter((a) => a.severity === "High").length,
    Medium: all.filter((a) => a.severity === "Medium").length,
    Low: all.filter((a) => a.severity === "Low").length,
  };

  return (
    <PageShell
      title="Alerts"
      description="Triage workflow for every detection. Click an alert to drill in."
      actions={
        <>
          <button className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-border bg-card text-[13px] font-medium hover:bg-muted transition">
            <Filter className="h-3.5 w-3.5" /> Advanced filter
          </button>
          <button className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-foreground text-background text-[13px] font-semibold hover:opacity-90 transition">
            <Download className="h-3.5 w-3.5" /> Export
          </button>
        </>
      }
    >
      {/* Severity overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(
          [
            ["Critical", sevCounts.Critical, "bg-critical/10 text-critical", "border-critical/20"],
            [
              "High",
              sevCounts.High,
              "bg-warning/15 text-[oklch(0.5_0.16_45)]",
              "border-warning/20",
            ],
            ["Medium", sevCounts.Medium, "bg-primary-soft text-primary", "border-primary/20"],
            ["Low", sevCounts.Low, "bg-muted text-muted-foreground", "border-border"],
          ] as const
        ).map(([label, value, tone, border]) => (
          <div
            key={label}
            className={cn(
              "card-hover bg-card rounded-2xl border p-5 shadow-[var(--shadow-soft)]",
              border,
            )}
          >
            <div
              className={cn(
                "inline-flex text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md",
                tone,
              )}
            >
              {label}
            </div>
            <div className="mt-3 text-[28px] font-semibold tracking-tight tabular-nums text-foreground">
              {value}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">total alerts</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center bg-muted/60 rounded-lg p-0.5 w-fit">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "px-3 h-8 text-[12px] font-semibold rounded-md transition flex items-center gap-1.5",
              tab === t
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t}
            <span className="text-[10px] tabular-nums opacity-70">{counts[t]}</span>
          </button>
        ))}
      </div>

      <AlertsTable alerts={filtered} onSelect={setSelected} />
      <AlertDrawer alert={selected} onClose={() => setSelected(null)} />
    </PageShell>
  );
}
