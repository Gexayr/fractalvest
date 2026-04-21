import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { LayoutDashboard, Building2, PieChart, ArrowLeftRight, Bell, Settings, LogOut, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/assets",    label: "Assets",    icon: Building2 },
  { href: "/portfolio", label: "Portfolio", icon: PieChart },
  { href: "/transactions", label: "Activity", icon: ArrowLeftRight },
  { href: "/notifications", label: "Alerts", icon: Bell },
];

const formatBalance = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, isLoading } = useAuth();
  const [location] = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="h-dvh bg-background flex overflow-hidden">

      {/* ── Desktop sidebar ─────────────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border bg-card shrink-0">
        <div className="p-6 border-b border-border">
          <Link href="/dashboard" className="text-xl font-bold tracking-tight text-primary flex items-center gap-2">
            <div className="w-6 h-6 bg-primary text-primary-foreground flex items-center justify-center font-mono text-sm shrink-0">FV</div>
            FractionalVest
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = location === href || location.startsWith(href + "/");
            return (
              <Link key={href} href={href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 text-sm font-medium transition-colors rounded-sm",
                  active
                    ? "bg-accent text-accent-foreground border-l-2 border-primary"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border space-y-1">
          <Link href="/settings"
            className={cn(
              "flex items-center gap-3 px-3 py-2 text-sm font-medium transition-colors rounded-sm",
              location === "/settings"
                ? "bg-accent text-accent-foreground border-l-2 border-primary"
                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
            )}
          >
            <Settings className="h-4 w-4 shrink-0" /> Settings
          </Link>
          <button onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors text-left rounded-sm"
          >
            <LogOut className="h-4 w-4 shrink-0" /> Logout
          </button>
        </div>
      </aside>

      {/* ── Main column ──────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

        {/* Mobile top bar */}
        <header className="md:hidden h-14 shrink-0 sticky top-0 z-20 border-b border-border bg-card/90 backdrop-blur-md flex items-center justify-between px-4">
          <Link href="/dashboard" className="font-bold tracking-tight text-primary flex items-center gap-2">
            <div className="w-6 h-6 bg-primary text-primary-foreground flex items-center justify-center font-mono text-xs shrink-0">FV</div>
            FractionalVest
          </Link>
          <div className="flex items-center gap-3">
            {user && (
              <span className="text-xs text-muted-foreground font-mono">
                {formatBalance(user.walletBalance)}
              </span>
            )}
            <Link href="/settings">
              <div className="h-8 w-8 bg-primary/10 text-primary flex items-center justify-center rounded-full font-mono text-xs border border-primary/20">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </div>
            </Link>
          </div>
        </header>

        {/* Desktop top bar */}
        <header className="hidden md:flex h-16 shrink-0 sticky top-0 z-10 border-b border-border bg-card/50 backdrop-blur items-center justify-between px-6">
          <div className="text-sm text-muted-foreground font-mono">
            {new Date().toLocaleDateString("en-US", { weekday: "short", year: "numeric", month: "short", day: "numeric" })}
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-right">
              <div className="font-medium">{user?.firstName} {user?.lastName}</div>
              <div className="text-xs text-muted-foreground font-mono">
                Bal: ${user?.walletBalance?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}
              </div>
            </div>
            <div className="h-8 w-8 bg-primary/10 text-primary flex items-center justify-center rounded-full font-mono text-xs border border-primary/20">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
          </div>
        </header>

        {/* Scrollable page content */}
        <main className="flex-1 overflow-y-auto overscroll-contain">
          <div className="p-4 md:p-8 pb-24 md:pb-8">
            {children}
          </div>
        </main>
      </div>

      {/* ── Mobile bottom navigation ─────────────────────────────── */}
      <nav
        className="md:hidden fixed inset-x-0 bottom-0 z-30 bg-card/95 backdrop-blur-md border-t border-border"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex items-stretch h-16">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = location === href || location.startsWith(href + "/");
            return (
              <Link key={href} href={href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 flex-1 transition-colors active:bg-accent/30",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                <Icon className={cn("h-5 w-5 transition-transform duration-150", active && "scale-110")} />
                <span className="text-[10px] font-medium leading-none">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

    </div>
  );
}
