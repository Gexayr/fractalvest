import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { LayoutDashboard, Building2, PieChart, ArrowLeftRight, Bell, Settings, LogOut, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, isLoading } = useAuth();
  const [location] = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/assets", label: "Assets", icon: Building2 },
    { href: "/portfolio", label: "Portfolio", icon: PieChart },
    { href: "/transactions", label: "Transactions", icon: ArrowLeftRight },
    { href: "/notifications", label: "Notifications", icon: Bell },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-border bg-card flex flex-col">
        <div className="p-6 border-b border-border">
          <Link href="/dashboard" className="text-xl font-bold tracking-tight text-primary flex items-center gap-2">
            <div className="w-6 h-6 bg-primary text-primary-foreground flex items-center justify-center font-mono text-sm">FV</div>
            FractionalVest
          </Link>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-3 py-2 text-sm font-medium transition-colors ${isActive ? "bg-accent text-accent-foreground border-l-2 border-primary" : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"}`}>
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        
        <div className="p-4 border-t border-border space-y-1">
          <Link href="/settings" className={`flex items-center gap-3 px-3 py-2 text-sm font-medium transition-colors ${location === "/settings" ? "bg-accent text-accent-foreground border-l-2 border-primary" : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"}`}>
            <Settings className="h-4 w-4" />
            Settings
          </Link>
          <button onClick={logout} className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors text-left">
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>
      
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <header className="h-16 border-b border-border bg-card/50 backdrop-blur flex items-center justify-between px-6 shrink-0 sticky top-0 z-10">
          <div className="text-sm text-muted-foreground font-mono">
            {new Date().toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-right">
              <div className="font-medium">{user?.firstName} {user?.lastName}</div>
              <div className="text-xs text-muted-foreground font-mono">
                Bal: ${user?.walletBalance?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
              </div>
            </div>
            <div className="h-8 w-8 bg-primary/10 text-primary flex items-center justify-center rounded-full font-mono text-xs border border-primary/20">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
          </div>
        </header>
        
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
