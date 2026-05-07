import { motion } from "framer-motion";

export function RepeatAttackRate({ value = 68 }: { value?: number }) {
  const radius = 62;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (value / 100) * circ;

  return (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-[var(--shadow-soft)] h-full flex flex-col">
      <div>
        <div className="text-[15px] font-semibold text-foreground">Repeat Attack Rate</div>
        <div className="text-xs text-muted-foreground mt-0.5">Re-attempts within 24h</div>
      </div>

      <div className="flex-1 grid place-items-center my-2">
        <div className="relative h-[170px] w-[170px]">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
            <circle cx="80" cy="80" r={radius} fill="none" stroke="oklch(0.94 0.01 255)" strokeWidth="14" />
            <motion.circle
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke="url(#repeatGrad)"
              strokeWidth="14"
              strokeLinecap="round"
              strokeDasharray={circ}
              initial={{ strokeDashoffset: circ }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1.2, ease: "easeOut" }}
            />
            <defs>
              <linearGradient id="repeatGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="oklch(0.62 0.24 22)" />
                <stop offset="100%" stopColor="oklch(0.78 0.15 78)" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 grid place-items-center">
            <div className="text-center">
              <div className="text-[34px] font-semibold tracking-tight text-foreground tabular-nums leading-none">
                {value}<span className="text-lg text-muted-foreground">%</span>
              </div>
              <div className="text-[10px] text-muted-foreground mt-1">flagged actors</div>
            </div>
          </div>
        </div>
      </div>

      <p className="text-[12px] text-muted-foreground text-center leading-snug">
        of flagged actors re-attempted within 24 hours.
      </p>
      <button className="mt-3 w-full h-9 rounded-lg border border-border text-[12.5px] font-semibold text-foreground hover:bg-muted transition">
        Show details
      </button>
    </div>
  );
}
