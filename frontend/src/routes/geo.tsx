import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/sentinel/PageShell";
import { GeoThreatMap } from "@/components/sentinel/GeoThreatMap";
import { useDashboardData } from "@/hooks/useDashboardData";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/geo")({
  head: () => ({
    meta: [
      { title: "Geo Intelligence — Sentivoy" },
      { name: "description", content: "Geographic threat intelligence and IP reputation feeds." },
    ],
  }),
  component: GeoPage,
});

const repStyle = {
  critical: "bg-critical/10 text-critical",
  high: "bg-warning/15 text-[oklch(0.5_0.13_70)]",
  medium: "bg-primary-soft text-primary",
  low: "bg-muted text-muted-foreground",
};

function GeoPage() {
  const { data: dashboardData, isLoading } = useDashboardData();

  if (isLoading || !dashboardData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const { geoOrigins } = dashboardData;

  return (
    <PageShell
      title="Geo Intelligence"
      description="Geographic threat sources, ASN reputation, and impossible-travel signals."
    >
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 min-h-[480px]">
          <GeoThreatMap data={geoOrigins} />
        </div>

        <div className="bg-card border border-border rounded-2xl shadow-[var(--shadow-soft)] overflow-hidden">
          <div className="p-5 pb-3">
            <div className="text-[15px] font-semibold text-foreground">Country Breakdown</div>
            <div className="text-xs text-muted-foreground mt-0.5">All flagged origins, last 24h</div>
          </div>
          <div className="px-2 pb-3 max-h-[420px] overflow-y-auto scrollbar-thin">
            {geoOrigins.map((o) => (
              <div
                key={o.code}
                className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-muted/40 transition"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="h-7 w-9 rounded bg-muted grid place-items-center font-mono text-[10px] font-bold text-muted-foreground">
                    {o.code}
                  </div>
                  <div>
                    <div className="text-[13px] text-foreground">{o.country}</div>
                    <div className="text-[10.5px] text-muted-foreground capitalize">{o.intensity} intensity</div>
                  </div>
                </div>
                <div className="text-[13px] font-semibold text-foreground tabular-nums">{o.threats}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl shadow-[var(--shadow-soft)] overflow-hidden">
        <div className="p-5 pb-3">
          <div className="text-[15px] font-semibold text-foreground">Active Regions</div>
          <div className="text-xs text-muted-foreground mt-0.5">Regions ranked by hostile traffic intensity</div>
        </div>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-left text-muted-foreground border-b border-border">
              <th className="font-medium px-5 py-2.5 text-[11px] uppercase tracking-wider">Country Code</th>
              <th className="font-medium px-3 py-2.5 text-[11px] uppercase tracking-wider">Country Name</th>
              <th className="font-medium px-3 py-2.5 text-[11px] uppercase tracking-wider">Intensity</th>
              <th className="font-medium px-5 py-2.5 text-[11px] uppercase tracking-wider">Detected Threats</th>
            </tr>
          </thead>
          <tbody>
            {(geoOrigins || []).sort((a,b) => b.threats - a.threats).map((g) => (
              <tr key={g.code} className="border-b border-border last:border-0 hover:bg-muted/40 transition">
                <td className="px-5 py-3 font-mono text-primary font-semibold">{g.code}</td>
                <td className="px-3 py-3 text-foreground">{g.country}</td>
                <td className="px-3 py-3">
                  <span className={cn("text-[10.5px] font-semibold capitalize px-2 py-0.5 rounded-md", repStyle[g.intensity as keyof typeof repStyle])}>
                    {g.intensity}
                  </span>
                </td>
                <td className="px-5 py-3 text-foreground tabular-nums font-semibold">{g.threats}</td>
              </tr>
            ))}
            {geoOrigins.length === 0 && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-sm text-muted-foreground">
                  No geographical data available yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </PageShell>
  );
}
