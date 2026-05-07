import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";

const colors = [
  "oklch(0.62 0.24 22)",
  "oklch(0.78 0.15 78)",
  "oklch(0.58 0.19 260)",
  "oklch(0.62 0.18 300)",
  "oklch(0.68 0.16 152)",
];

interface ThreatPatternsProps {
  data: Array<{ name: string; value: number }>;
}

export function ThreatPatterns({ data }: ThreatPatternsProps) {
  const chartData = data || [];

  return (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-[var(--shadow-soft)] h-full flex flex-col">
      <div>
        <div className="text-[15px] font-semibold text-foreground">Threat Patterns</div>
        <div className="text-xs text-muted-foreground mt-0.5">Most active over the last 24h</div>
      </div>

      <div className="flex-1 min-h-[240px] mt-4 -ml-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 0 }}>
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="name"
              stroke="oklch(0.45 0.03 257)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              width={108}
            />
            <Tooltip
              cursor={{ fill: "oklch(0.96 0.006 247)" }}
              contentStyle={{
                background: "var(--color-card)",
                border: "1px solid var(--color-border)",
                borderRadius: 12,
                fontSize: 12,
                boxShadow: "var(--shadow-card)",
              }}
            />
            <Bar dataKey="value" radius={[6, 6, 6, 6]} barSize={14}>
              {chartData.map((_, i) => (
                <Cell key={i} fill={colors[i % colors.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
