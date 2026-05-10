import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Activity,
  ScrollText,
  AlertTriangle,
  UserCog,
  Globe2,
  Siren,
  Plug,
  Settings,
  HelpCircle,
  ChevronDown,
  BarChart3,
  PanelLeftClose,
  PanelLeft,
  LogOut,
} from "lucide-react";
import { Link, useLocation } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/lib/sidebarContext";
import { useAuth } from "@/lib/authContext";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Sheet, SheetContent } from "@/components/ui/sheet";

// ─── Data ────────────────────────────────────────────────────────────────────

type NavItem = {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
  badge?: string;
};

type NavGroup = {
  label: string;
  icon: typeof LayoutDashboard;
  children: NavItem[];
};

const primaryNav: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/alerts", label: "Alerts", icon: AlertTriangle },
  { to: "/live-logs", label: "Live Logs", icon: ScrollText },
  { to: "/geo", label: "Geo Intelligence", icon: Globe2 },
  { to: "/incident-response", label: "Incident Response", icon: Siren },
  { to: "/integrations", label: "Integrations", icon: Plug },
];

const analyticsGroup: NavGroup = {
  label: "Analytics",
  icon: BarChart3,
  children: [
    { to: "/threat-analytics", label: "Threat Analytics", icon: Activity },
    { to: "/ueba", label: "User Behavior", icon: UserCog },
  ],
};

const bottomNav: NavItem[] = [{ to: "/settings", label: "Settings", icon: Settings }];

// ─── Expanded nav link (with label) ──────────────────────────────────────────

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
  const Icon = item.icon;

  return (
    <Link
      to={item.to as "/"}
      className={cn(
        "group flex items-center gap-3 px-3 py-[9px] rounded-xl text-[13.5px] font-medium transition-all duration-150",
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-muted/70",
      )}
    >
      <Icon
        className={cn(
          "h-[18px] w-[18px] shrink-0",
          active
            ? "text-primary-foreground"
            : "text-muted-foreground group-hover:text-sidebar-foreground",
        )}
        strokeWidth={active ? 2.2 : 1.8}
      />
      <span className="truncate">{item.label}</span>
      {item.badge && (
        <span
          className={cn(
            "ml-auto text-[10.5px] font-bold tabular-nums min-w-[22px] text-center px-1.5 py-[1px] rounded-md",
            active ? "bg-white/20 text-primary-foreground" : "bg-primary/10 text-primary",
          )}
        >
          {item.badge}
        </span>
      )}
    </Link>
  );
}

// ─── Collapsed nav link (icon-only with tooltip) ─────────────────────────────

function CollapsedNavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
  const Icon = item.icon;

  return (
    <Tooltip delayDuration={0}>
      <TooltipTrigger asChild>
        <Link
          to={item.to as "/"}
          className={cn(
            "group relative flex items-center justify-center h-10 w-10 rounded-xl transition-all duration-150",
            active
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-sidebar-foreground hover:bg-muted/70",
          )}
        >
          <Icon className="h-[18px] w-[18px]" strokeWidth={active ? 2.2 : 1.8} />
          {item.badge && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full bg-critical text-white text-[9px] font-bold">
              {item.badge}
            </span>
          )}
        </Link>
      </TooltipTrigger>
      <TooltipContent side="right" sideOffset={8}>
        {item.label}
      </TooltipContent>
    </Tooltip>
  );
}

// ─── Expanded sidebar content ────────────────────────────────────────────────

function SidebarExpanded({ pathname, onClose }: { pathname: string; onClose?: () => void }) {
  const { signOut } = useAuth();

  const [analyticsOpen, setAnalyticsOpen] = useState(() => {
    return analyticsGroup.children.some((c) => pathname.startsWith(c.to));
  });
  const isAnalyticsActive = analyticsGroup.children.some((c) => pathname.startsWith(c.to));

  return (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="px-5 pt-5 pb-4 flex items-center gap-3">
        <img
          src="/favicon.png"
          alt="Sentivoy"
          className="h-[34px] w-[34px] rounded-[10px] object-cover"
        />
        <span className="text-[16px] font-bold tracking-tight text-sidebar-foreground">
          Sentivoy
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 overflow-y-auto scrollbar-thin space-y-0.5">
        {primaryNav.map((item) => (
          <div key={item.to} onClick={onClose}>
            <NavLink item={item} pathname={pathname} />
          </div>
        ))}

        {/* Collapsible Analytics */}
        <div className="pt-0.5">
          <button
            onClick={() => setAnalyticsOpen((o) => !o)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-[9px] rounded-xl text-[13.5px] font-medium transition-all duration-150",
              isAnalyticsActive && !analyticsOpen
                ? "text-primary"
                : "text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-muted/70",
            )}
          >
            <BarChart3
              className={cn(
                "h-[18px] w-[18px] shrink-0",
                isAnalyticsActive ? "text-primary" : "text-muted-foreground",
              )}
              strokeWidth={1.8}
            />
            <span className="truncate">{analyticsGroup.label}</span>
            <ChevronDown
              className={cn(
                "ml-auto h-4 w-4 text-muted-foreground transition-transform duration-200",
                analyticsOpen && "rotate-180",
              )}
            />
          </button>

          <div
            className={cn(
              "overflow-hidden transition-all duration-200",
              analyticsOpen ? "max-h-[200px] opacity-100" : "max-h-0 opacity-0",
            )}
          >
            <div className="ml-[18px] pl-4 border-l border-border/70 space-y-0.5 py-0.5">
              {analyticsGroup.children.map((child) => {
                const active = child.exact ? pathname === child.to : pathname.startsWith(child.to);
                return (
                  <div key={child.to} onClick={onClose}>
                    <Link
                      to={child.to as "/"}
                      className={cn(
                        "block px-3 py-[7px] rounded-lg text-[13px] font-medium transition-all duration-150 truncate",
                        active
                          ? "text-primary bg-primary/[0.06]"
                          : "text-muted-foreground hover:text-sidebar-foreground hover:bg-muted/60",
                      )}
                    >
                      {child.label}
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="!my-2.5 mx-1 h-px bg-border/80" />

        {/* Settings / Help */}
        {bottomNav.map((item) => (
          <div key={item.to} onClick={onClose}>
            <NavLink item={item} pathname={pathname} />
          </div>
        ))}

        <button className="w-full flex items-center gap-3 px-3 py-[9px] rounded-xl text-[13.5px] font-medium text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-muted/70 transition-all duration-150">
          <HelpCircle
            className="h-[18px] w-[18px] text-muted-foreground shrink-0"
            strokeWidth={1.8}
          />
          <span>Help &amp; Support</span>
        </button>

        <button
          onClick={() => signOut()}
          className="w-full flex items-center gap-3 px-3 py-[9px] rounded-xl text-[13.5px] font-medium text-red-500 hover:text-red-400 hover:bg-red-500/10 transition-all duration-150 mb-4"
        >
          <LogOut className="h-[18px] w-[18px] shrink-0" strokeWidth={1.8} />
          <span>Sign Out</span>
        </button>
      </nav>
    </div>
  );
}

// ─── Collapsed sidebar content (icon-only) ───────────────────────────────────

function SidebarCollapsed({ pathname }: { pathname: string }) {
  const { signOut } = useAuth();
  const isAnalyticsActive = analyticsGroup.children.some((c) => pathname.startsWith(c.to));

  return (
    <TooltipProvider>
      <div className="flex flex-col items-center h-full py-5">
        {/* Logo only */}
        <img
          src="/favicon.png"
          alt="Sentivoy"
          className="h-[32px] w-[32px] rounded-[10px] object-cover mb-4"
        />

        {/* Nav icons */}
        <nav className="flex-1 flex flex-col items-center gap-1 overflow-y-auto scrollbar-thin">
          {primaryNav.map((item) => (
            <CollapsedNavLink key={item.to} item={item} pathname={pathname} />
          ))}

          {/* Analytics group items */}
          <div className="!my-1 w-6 h-px bg-border/80" />
          {analyticsGroup.children.map((child) => (
            <CollapsedNavLink key={child.to} item={child} pathname={pathname} />
          ))}

          <div className="!my-1 w-6 h-px bg-border/80" />

          {bottomNav.map((item) => (
            <CollapsedNavLink key={item.to} item={item} pathname={pathname} />
          ))}

          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <button className="flex items-center justify-center h-10 w-10 rounded-xl text-muted-foreground hover:text-sidebar-foreground hover:bg-muted/70 transition-all duration-150">
                <HelpCircle className="h-[18px] w-[18px]" strokeWidth={1.8} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={8}>
              Help &amp; Support
            </TooltipContent>
          </Tooltip>

          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <button
                onClick={() => signOut()}
                className="flex items-center justify-center mt-2 h-10 w-10 rounded-xl text-red-500 hover:text-red-400 hover:bg-red-500/10 transition-all duration-150"
              >
                <LogOut className="h-[18px] w-[18px]" strokeWidth={1.8} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={8}>
              Sign Out
            </TooltipContent>
          </Tooltip>
        </nav>
      </div>
    </TooltipProvider>
  );
}

// ─── Main AppSidebar ─────────────────────────────────────────────────────────

export function AppSidebar() {
  const { pathname } = useLocation();
  const { collapsed, toggleCollapsed, mobileOpen, setMobileOpen } = useSidebar();

  // Close mobile drawer on navigation
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname, setMobileOpen]);

  return (
    <>
      {/* Desktop / Tablet sidebar */}
      <aside
        className={cn(
          "hidden md:flex flex-col shrink-0 border-r border-border bg-sidebar h-screen sticky top-0 transition-all duration-300 ease-in-out",
          collapsed ? "w-[68px]" : "w-[252px]",
        )}
      >
        {/* Toggle button */}
        <button
          onClick={toggleCollapsed}
          className={cn(
            "absolute -right-3 top-7 z-40 h-6 w-6 rounded-full border border-border bg-card shadow-sm grid place-items-center text-muted-foreground hover:text-foreground hover:bg-muted transition",
          )}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <PanelLeft className="h-3.5 w-3.5" />
          ) : (
            <PanelLeftClose className="h-3.5 w-3.5" />
          )}
        </button>

        {collapsed ? (
          <SidebarCollapsed pathname={pathname} />
        ) : (
          <SidebarExpanded pathname={pathname} />
        )}
      </aside>

      {/* Mobile drawer overlay */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-[272px] p-0 bg-sidebar border-r border-border">
          <SidebarExpanded pathname={pathname} onClose={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  );
}
