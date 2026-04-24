import { AuthProvider } from "@/lib/auth";
import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { setAuthTokenGetter } from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout";
import { useAuth } from "@/lib/auth";
import { Loader2 } from "lucide-react";
import HomPage from "@/pages/home";
import LoginPage from "@/pages/login";
import RegisterPage from "@/pages/register";
import DashboardPage from "@/pages/dashboard";
import AssetsPage from "@/pages/assets";
import AssetDetailPage from "@/pages/asset-detail";
import PortfolioPage from "@/pages/portfolio";
import TransactionsPage from "@/pages/transactions";
import NotificationsPage from "@/pages/notifications";
import SettingsPage from "@/pages/settings";
import AdminPage from "@/pages/admin";
import NotFoundPage from "@/pages/not-found";

setAuthTokenGetter(() => localStorage.getItem("fv_token"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function AdminRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-muted-foreground h-6 w-6" />
      </div>
    );
  }

  if (!user) return <Redirect to="/login" />;
  if (user.role !== "admin") return <Redirect to="/dashboard" />;

  return (
    <AppLayout>
      <Component />
    </AppLayout>
  );
}

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-muted-foreground h-6 w-6" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  return (
    <AppLayout>
      <Component />
    </AppLayout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />

      <Route path="/dashboard"><ProtectedRoute component={DashboardPage} /></Route>
      <Route path="/assets"><ProtectedRoute component={AssetsPage} /></Route>
      <Route path="/assets/:id"><ProtectedRoute component={AssetDetailPage} /></Route>
      <Route path="/portfolio"><ProtectedRoute component={PortfolioPage} /></Route>
      <Route path="/transactions"><ProtectedRoute component={TransactionsPage} /></Route>
      <Route path="/notifications"><ProtectedRoute component={NotificationsPage} /></Route>
      <Route path="/settings"><ProtectedRoute component={SettingsPage} /></Route>
      <Route path="/admin"><AdminRoute component={AdminPage} /></Route>

      <Route component={NotFoundPage} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <Router />
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
