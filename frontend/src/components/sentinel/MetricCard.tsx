import { useEffect, useState } from "react";
import { ArrowUpRight, ArrowDownRight, type LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Props {
  label: string;
  value: number;
  delta?: number; // percent — optional, hidden if not provided
  icon: LucideIcon;
  tone?: "default" | "critical" | "warning" | "success";
  format?: (n: number) => string;
  suffix?: string;
}

function useCountUp(target: number, duration = 1000) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const from = val;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(from + (target - from) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);
  return val;
}

export function MetricCard({
  label,
  value,
  delta,
  icon: Icon,
  tone = "default",
  format,
  suffix,
}: Props) {
  const display = useCountUp(value);
  const hasDelta = delta !== undefined && delta !== null;
  const positive = hasDelta && delta >= 0;
  // For threats/anomalies "up" is bad; we use deltaIsBad heuristic via tone
  const badWhenUp = tone === "critical" || tone === "warning";
  const goodDirection = badWhenUp ? !positive : positive;

  const toneClasses = {
    default: "bg-primary-soft text-primary",
    critical: "bg-critical/10 text-critical",
    warning: "bg-warning/15 text-[oklch(0.55_0.13_70)]",
    success: "bg-success/10 text-success",
  }[tone];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="card-hover bg-card border border-border rounded-2xl p-5 shadow-[var(--shadow-soft)]"
    >
      <div className="flex items-start justify-between">
        <div className={cn("h-9 w-9 rounded-xl grid place-items-center", toneClasses)}>
          <Icon className="h-4.5 w-4.5" strokeWidth={2.2} />
        </div>
        {hasDelta && (
          <div
            className={cn(
              "flex items-center gap-0.5 text-[11px] font-semibold px-1.5 py-0.5 rounded-md",
              goodDirection ? "text-success bg-success/10" : "text-critical bg-critical/10",
            )}
          >
            {positive ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : (
              <ArrowDownRight className="h-3 w-3" />
            )}
            {Math.abs(delta).toFixed(1)}%
          </div>
        )}
      </div>
      <div className="mt-5">
        <div className="text-[28px] font-semibold tracking-tight tabular-nums leading-none text-foreground">
          {format ? format(display) : display.toLocaleString()}
          {suffix && (
            <span className="text-base text-muted-foreground font-medium ml-1">{suffix}</span>
          )}
        </div>
        <div className="mt-2 text-[12.5px] text-muted-foreground">{label}</div>
      </div>
    </motion.div>
  );
}
