import { Sparkles, ShieldCheck, ArrowRight, Send } from "lucide-react";
import { motion } from "framer-motion";

export function AIInsights() {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-[var(--shadow-soft)] h-full flex flex-col relative overflow-hidden">
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <div className="flex items-center gap-2 relative">
        <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary to-[oklch(0.46_0.20_270)] grid place-items-center text-primary-foreground">
          <Sparkles className="h-4 w-4" />
        </div>
        <div>
          <div className="text-[14px] font-semibold text-foreground flex items-center gap-1.5">
            Sentivoy AI
            <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-md bg-primary-soft text-primary">BETA</span>
          </div>
          <div className="text-[10.5px] text-muted-foreground">Insight stream • live</div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mt-4 rounded-xl border border-border bg-muted/40 p-4 relative"
      >
        <div className="text-[10px] font-semibold uppercase tracking-wider text-primary mb-1.5">
          Anomaly · 2 min ago
        </div>
        <p className="text-[13.5px] leading-relaxed text-foreground">
          Unusual login pattern from <span className="font-semibold">3 countries</span> in
          <span className="font-semibold"> 10 minutes</span> on user
          <span className="font-mono text-[12.5px] bg-card px-1 rounded"> j.morrison@acme.io</span>.
          Likely credential stuffing.
        </p>
        <div className="mt-3 flex items-center gap-2">
          <button className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-primary text-primary-foreground text-[12px] font-semibold hover:bg-primary/90 transition">
            <ShieldCheck className="h-3.5 w-3.5" /> Force MFA
          </button>
          <button className="inline-flex items-center gap-1 h-8 px-3 rounded-lg border border-border text-[12px] font-medium text-foreground hover:bg-muted transition">
            Investigate <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </motion.div>

      <div className="mt-3 space-y-2 flex-1">
        {[
          "Token reuse spike on /api/v2/payments — 23 events",
          "Brute-force on admin panel slowing (rate-limit kicked in)",
        ].map((t, i) => (
          <div key={i} className="flex items-start gap-2 text-[12px] text-muted-foreground">
            <span className="mt-1.5 h-1 w-1 rounded-full bg-muted-foreground/60 shrink-0" />
            <span>{t}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 relative">
        <input
          placeholder="Ask Sentivoy AI…"
          className="w-full h-10 pl-3 pr-10 rounded-xl bg-muted/60 border border-transparent focus:border-primary/40 focus:bg-card text-[13px] outline-none transition"
        />
        <button className="absolute right-1.5 top-1/2 -translate-y-1/2 h-7 w-7 rounded-lg bg-primary text-primary-foreground grid place-items-center hover:bg-primary/90 transition">
          <Send className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
