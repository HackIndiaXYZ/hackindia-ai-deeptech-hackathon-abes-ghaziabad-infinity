import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ShieldCheck, Ban, UserX, AlertTriangle } from "lucide-react";
import type { AlertRow } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  alert: AlertRow | null;
  onClose: () => void;
}

export function AlertDrawer({ alert, onClose }: Props) {
  return (
    <Sheet open={!!alert} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto scrollbar-thin">
        {alert && (
          <>
            <SheetHeader>
              <div
                className={cn(
                  "inline-flex items-center gap-1.5 self-start text-[10.5px] font-semibold px-2 py-0.5 rounded-md mb-2",
                  alert.severity === "Critical"
                    ? "bg-critical/10 text-critical"
                    : "bg-warning/15 text-[oklch(0.5_0.13_60)]",
                )}
              >
                <AlertTriangle className="h-3 w-3" />
                {alert.severity} Severity
              </div>
              <SheetTitle className="text-xl">{alert.event}</SheetTitle>
              <div className="text-xs text-muted-foreground">
                Event ID: <span className="font-mono">{alert.id}</span>
              </div>
            </SheetHeader>

            <div className="mt-6 space-y-5">
              <div className="grid grid-cols-2 gap-3">
                {[
                  ["User", alert.user],
                  ["Source IP", alert.ip],
                  ["Country", alert.country],
                  ["Status", alert.status],
                  ["Timestamp", new Date(alert.timestamp).toLocaleString()],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-lg bg-muted/50 p-3">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                      {k}
                    </div>
                    <div className="text-[13px] text-foreground mt-0.5 font-medium break-all">
                      {v}
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">
                  Raw Log
                </div>
                <pre className="text-[11px] font-mono bg-[oklch(0.20_0.03_264)] text-[oklch(0.85_0.05_150)] p-3 rounded-lg overflow-x-auto scrollbar-thin">
                  {alert.rawLog}
                </pre>
              </div>

              <div>
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">
                  Related events
                </div>
                <div className="space-y-2">
                  {[
                    { e: "Failed login (5x)", t: "1m before" },
                    { e: "New device fingerprint", t: "3m before" },
                    { e: "Geo-IP mismatch", t: "5m before" },
                  ].map((r, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-[12px] p-2.5 rounded-lg border border-border"
                    >
                      <span className="text-foreground">{r.e}</span>
                      <span className="text-muted-foreground">{r.t}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">
                  Recommended actions
                </div>
                <div className="grid grid-cols-1 gap-2">
                  <button className="flex items-center gap-2 h-10 px-3 rounded-lg bg-primary text-primary-foreground text-[13px] font-semibold hover:bg-primary/90 transition">
                    <ShieldCheck className="h-4 w-4" /> Force MFA on user
                  </button>
                  <button className="flex items-center gap-2 h-10 px-3 rounded-lg border border-border text-[13px] font-semibold hover:bg-muted transition">
                    <Ban className="h-4 w-4" /> Block source IP
                  </button>
                  <button className="flex items-center gap-2 h-10 px-3 rounded-lg border border-border text-[13px] font-semibold hover:bg-muted transition">
                    <UserX className="h-4 w-4" /> Suspend session
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
