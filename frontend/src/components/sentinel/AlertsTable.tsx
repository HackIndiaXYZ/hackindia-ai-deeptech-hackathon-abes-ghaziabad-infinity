import { MoreHorizontal } from "lucide-react";
import type { AlertRow, Severity, AlertStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const sevStyles: Record<Severity, string> = {
  Critical: "bg-critical/10 text-critical",
  High: "bg-warning/15 text-[oklch(0.50_0.16_45)]",
  Medium: "bg-primary-soft text-primary",
  Low: "bg-muted text-muted-foreground",
};

const statusStyles: Record<AlertStatus, string> = {
  Open: "bg-critical/10 text-critical",
  Investigating: "bg-warning/15 text-[oklch(0.50_0.13_70)]",
  Resolved: "bg-success/10 text-success",
};

function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

interface Props {
  alerts: AlertRow[];
  onSelect: (a: AlertRow) => void;
}

export function AlertsTable({ alerts, onSelect }: Props) {
  return (
    <div className="bg-card border border-border rounded-2xl shadow-[var(--shadow-soft)] overflow-hidden">
      <div className="flex items-center justify-between p-5 pb-3">
        <div>
          <div className="text-[15px] font-semibold text-foreground">Recent Alerts</div>
          <div className="text-xs text-muted-foreground mt-0.5">Click a row for full event details</div>
        </div>
        <div className="flex items-center gap-2">
          <button className="text-[12px] font-medium text-muted-foreground hover:text-foreground px-2 py-1 rounded-md hover:bg-muted transition">
            Filter
          </button>
          <button className="text-[12px] font-semibold text-primary hover:underline">View all →</button>
        </div>
      </div>

      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-left text-muted-foreground border-b border-border">
              <th className="font-medium px-5 py-2.5 text-[11px] uppercase tracking-wider">Timestamp</th>
              <th className="font-medium px-3 py-2.5 text-[11px] uppercase tracking-wider">User / IP</th>
              <th className="font-medium px-3 py-2.5 text-[11px] uppercase tracking-wider">Event</th>
              <th className="font-medium px-3 py-2.5 text-[11px] uppercase tracking-wider">Severity</th>
              <th className="font-medium px-3 py-2.5 text-[11px] uppercase tracking-wider">Status</th>
              <th className="font-medium px-5 py-2.5 text-[11px] uppercase tracking-wider w-10"></th>
            </tr>
          </thead>
          <tbody>
            {alerts.map((a) => (
              <tr
                key={a.id}
                onClick={() => onSelect(a)}
                className={cn(
                  "border-b border-border last:border-b-0 hover:bg-muted/40 transition cursor-pointer relative",
                  a.severity === "Critical" && "bg-critical/[0.03]",
                )}
              >
                <td className="px-5 py-3 relative">
                  {a.severity === "Critical" && (
                    <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-md bg-critical" />
                  )}
                  <div className="text-foreground">{timeAgo(a.timestamp)}</div>
                  <div className="text-[10.5px] text-muted-foreground">
                    {new Date(a.timestamp).toLocaleTimeString()}
                  </div>
                </td>
                <td className="px-3 py-3">
                  <div className="text-foreground truncate max-w-[180px]">{a.user}</div>
                  <div className="text-[10.5px] text-muted-foreground font-mono">{a.ip} · {a.country}</div>
                </td>
                <td className="px-3 py-3 text-foreground">{a.event}</td>
                <td className="px-3 py-3">
                  <span className={cn("text-[10.5px] font-semibold px-2 py-0.5 rounded-md", sevStyles[a.severity])}>
                    {a.severity}
                  </span>
                </td>
                <td className="px-3 py-3">
                  <span className={cn("text-[10.5px] font-semibold px-2 py-0.5 rounded-md", statusStyles[a.status])}>
                    {a.status}
                  </span>
                </td>
                <td className="px-5 py-3 text-right">
                  <button
                    onClick={(e) => e.stopPropagation()}
                    className="h-7 w-7 grid place-items-center rounded-md hover:bg-muted text-muted-foreground"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
