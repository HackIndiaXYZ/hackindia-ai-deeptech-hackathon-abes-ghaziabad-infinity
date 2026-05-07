import type { LucideIcon } from "lucide-react";
import { Sparkles } from "lucide-react";

export function ComingSoon({ title, icon: Icon, description }: { title: string; icon?: LucideIcon; description?: string }) {
  const I = Icon ?? Sparkles;
  return (
    <div className="grid place-items-center min-h-[60vh] p-8">
      <div className="text-center max-w-md">
        <div className="mx-auto h-14 w-14 rounded-2xl bg-primary-soft text-primary grid place-items-center mb-4">
          <I className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
        <p className="text-sm text-muted-foreground mt-2">
          {description ?? "This module is coming soon. Sentivoy AI is calibrating models for this surface."}
        </p>
        <div className="mt-5 inline-flex items-center gap-2 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-warning/15 text-[oklch(0.5_0.13_70)]">
          <span className="h-1.5 w-1.5 rounded-full bg-warning" /> In development
        </div>
      </div>
    </div>
  );
}
