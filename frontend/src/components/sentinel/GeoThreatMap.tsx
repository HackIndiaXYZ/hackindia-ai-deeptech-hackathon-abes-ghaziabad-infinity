import { cn } from "@/lib/utils";
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";

const intensityColor = {
  critical: "oklch(0.62 0.24 22)",
  high: "oklch(0.72 0.18 40)",
  medium: "oklch(0.78 0.15 78)",
  low: "oklch(0.58 0.19 260)",
};

const intensityLabel = {
  critical: "bg-critical/10 text-critical",
  high: "bg-warning/15 text-[oklch(0.55_0.13_60)]",
  medium: "bg-warning/15 text-[oklch(0.55_0.13_70)]",
  low: "bg-primary-soft text-primary",
};

export interface GeoOrigin {
  country: string;
  code: string;
  x: number; // For real map, x = longitude
  y: number; // For real map, y = latitude
  threats: number;
  intensity: "low" | "medium" | "high" | "critical";
}

interface GeoThreatMapProps {
  data: Array<GeoOrigin>;
}

// Ensure topojson loads
const geoUrl = "/world-110m.json";

export function GeoThreatMap({ data }: GeoThreatMapProps) {
  const geoOrigins = data || [];

  return (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-[var(--shadow-soft)] h-full flex flex-col">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[15px] font-semibold text-foreground">Geo Threat Origins</div>
          <div className="text-xs text-muted-foreground mt-0.5">Live IP resolution, last 24h</div>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-critical" />Critical</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-warning" />High</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-primary" />Low</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_180px] gap-4 mt-4 flex-1 min-h-0">
        <div className="relative rounded-xl bg-[oklch(0.97_0.005_247)] border border-border overflow-hidden dark:bg-[oklch(0.18_0.01_260)]">
          <ComposableMap
            projectionConfig={{ scale: 145 }}
            className="w-full h-full outline-none"
          >
            <Geographies geography={geoUrl}>
              {({ geographies }) =>
                geographies.map((geo) => (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill="oklch(0.92 0.012 255)"
                    stroke="oklch(0.86 0.014 255)"
                    strokeWidth={0.5}
                    style={{
                      default: { outline: "none" },
                      hover: { outline: "none", fill: "oklch(0.88 0.01 255)" },
                      pressed: { outline: "none" },
                    }}
                    className="dark:fill-[oklch(0.24_0.02_260)] dark:stroke-[oklch(0.3_0.03_260)]"
                  />
                ))
              }
            </Geographies>

            {geoOrigins.map((o, i) => {
              if (!o.x || !o.y) return null;
              const c = intensityColor[o.intensity];
              const r = 3 + Math.min(6, o.threats / 50);
              
              return (
                <Marker key={i} coordinates={[o.x, o.y]}>
                  {/* Glowing effect */}
                  <circle r={r * 2.5} fill={c} opacity="0.2">
                    <animate attributeName="r" values={`${r * 2};${r * 3.5};${r * 2}`} dur="2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.3;0;0.3" dur="2s" repeatCount="indefinite" />
                  </circle>
                  {/* Core dot */}
                  <circle r={r} fill={c} stroke="currentColor" strokeWidth="1" className="text-card" />
                </Marker>
              );
            })}
          </ComposableMap>
        </div>

        <div className="space-y-1.5">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Top Origins
          </div>
          {geoOrigins.slice(0, 5).map((o) => (
            <div
              key={o.code}
              className="flex items-center justify-between px-2.5 py-2 rounded-lg hover:bg-muted/60 transition cursor-pointer"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[10px] font-mono font-semibold text-muted-foreground w-6">{o.code}</span>
                <span className="text-[12.5px] text-foreground truncate">{o.country}</span>
              </div>
              <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-md", intensityLabel[o.intensity])}>
                {o.threats}
              </span>
            </div>
          ))}
          {geoOrigins.length === 0 && (
             <div className="text-[11px] text-muted-foreground pt-4 text-center">No threats active</div>
          )}
        </div>
      </div>
    </div>
  );
}
