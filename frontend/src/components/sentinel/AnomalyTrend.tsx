import { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { cn } from "@/lib/utils";

const tabs = ["24h", "7d", "30d"] as const;

interface AnomalyTrendProps {
  data: Array<{ time: string; anomalies: number; critical: number }>;
}

export function AnomalyTrend({ data }: AnomalyTrendProps) {
  const [tab, setTab] = useState<(typeof tabs)[number]>("24h");

  // Optional: slice data based on tab if needed, but for now we just render the provided data
  const chartData = data || [];

  return (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-[var(--shadow-soft)] h-full flex flex-col">
      <div className="flex items-start justify-between mb-1">
        <div>
          <div className="text-[15px] font-semibold text-foreground">Anomaly Trend</div>
          <div className="text-xs text-muted-foreground mt-0.5">
            Detected anomalies over time, by severity
          </div>
        </div>
        <div className="flex items-center bg-muted/60 rounded-lg p-0.5">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "px-2.5 h-7 text-[11px] font-medium rounded-md transition",
                tab === t
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4 mt-3 mb-1 text-[11px]">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-primary" /> Anomalies
        </span>
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-critical" /> Critical
        </span>
      </div>

      <div className="flex-1 min-h-[240px] -ml-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="anomGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="oklch(0.58 0.19 260)" stopOpacity={0.35} />
                <stop offset="95%" stopColor="oklch(0.58 0.19 260)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="critGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="oklch(0.62 0.24 22)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="oklch(0.62 0.24 22)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="oklch(0.93 0.01 255)" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="time"
              stroke="oklch(0.55 0.035 257)"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              interval={Math.floor(chartData.length / 6)}
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
                boxShadow: "var(--shadow-card)",
              }}
              labelStyle={{ color: "var(--color-muted-foreground)", fontSize: 11 }}
            />
            <Area
              type="monotone"
              dataKey="anomalies"
              stroke="oklch(0.58 0.19 260)"
              strokeWidth={2}
              fill="url(#anomGrad)"
            />
            <Area
              type="monotone"
              dataKey="critical"
              stroke="oklch(0.62 0.24 22)"
              strokeWidth={2}
              fill="url(#critGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
