import { Search, Bell, ChevronDown, Calendar, Menu, LogOut } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/lib/sidebarContext";
import { useAuth } from "@/lib/authContext";

export function TopHeader() {
  const [range, setRange] = useState("24h");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const ranges = ["24h", "7d", "30d", "Custom"];
  const { setMobileOpen } = useSidebar();
  const { user, signOut } = useAuth();

  // Derive display values from the Supabase user object
  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "User";
  const avatarUrl = user?.user_metadata?.avatar_url;
  const initials = displayName
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const displayEmail = user?.email || "";

  return (
    <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="flex items-center gap-3 px-4 md:px-6 h-16">
        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(true)}
          className="md:hidden h-9 w-9 grid place-items-center rounded-lg hover:bg-muted transition"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5 text-foreground" />
        </button>

        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search logs, IPs, users…"
            className="w-full h-9 pl-9 pr-16 rounded-lg bg-muted/60 border border-transparent focus:border-border focus:bg-card text-sm placeholder:text-muted-foreground outline-none transition"
          />
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 hidden md:inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-card border border-border text-[10px] font-medium text-muted-foreground">
            ⌘K
          </kbd>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <div className="hidden md:flex items-center bg-muted/60 rounded-lg p-0.5">
            {ranges.map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={cn(
                  "px-2.5 h-7 text-xs font-medium rounded-md flex items-center gap-1 transition",
                  range === r
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {r === "Custom" && <Calendar className="h-3 w-3" />}
                {r}
              </button>
            ))}
          </div>

          <div className="hidden sm:flex items-center gap-2 px-2.5 h-8 rounded-full bg-success/10 border border-success/20">
            <span className="live-dot" />
            <span className="text-[11px] font-semibold text-success">Monitoring</span>
          </div>

          <button className="relative h-9 w-9 grid place-items-center rounded-lg hover:bg-muted transition">
            <Bell className="h-4 w-4 text-muted-foreground" />
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-critical ring-2 ring-background" />
          </button>

          {/* User profile button + dropdown */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen((o) => !o)}
              className="flex items-center gap-2 pl-1 pr-2 h-9 rounded-full hover:bg-muted transition"
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="h-7 w-7 rounded-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary to-[oklch(0.46_0.20_270)] grid place-items-center text-primary-foreground text-[11px] font-semibold">
                  {initials}
                </div>
              )}
              <div className="hidden md:block leading-tight text-left">
                <div className="text-xs font-semibold text-foreground">{displayName}</div>
                <div className="text-[10px] text-muted-foreground">{displayEmail}</div>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground hidden md:block" />
            </button>

            {/* Dropdown */}
            {userMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-1 z-50 w-56 rounded-xl border border-border bg-card shadow-xl p-1.5">
                  <div className="px-3 py-2 border-b border-border mb-1">
                    <div className="text-sm font-semibold text-foreground">{displayName}</div>
                    <div className="text-xs text-muted-foreground truncate">{displayEmail}</div>
                  </div>
                  <button
                    onClick={async () => {
                      setUserMenuOpen(false);
                      await signOut();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
