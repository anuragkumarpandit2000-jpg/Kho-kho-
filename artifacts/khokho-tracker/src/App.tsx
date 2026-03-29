import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AppShell } from "@/components/layoutui/app-shell";
import { Loader2 } from "lucide-react";

import Login from "@/pages/Login";
import PlayerDashboard from "@/pages/PlayerDashboard";
import DailyEntry from "@/pages/DailyEntry";
import MyProgress from "@/pages/MyProgress";
import Leaderboard from "@/pages/Leaderboard";
import CoachDashboard from "@/pages/CoachDashboard";
import StrategyPage from "@/pages/StrategyPage";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 1000 * 60 * 5, refetchOnWindowFocus: false } },
});

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground font-semibold">Loading...</p>
        </div>
      </div>
    );
  }
  if (!user) return <Login />;
  return <>{children}</>;
}

function CoachGuard({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user?.isCoach) return <Redirect to="/" />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <AuthGuard>
      <AppShell>
        <Switch>
          <Route path="/" component={PlayerDashboard} />
          <Route path="/entry" component={DailyEntry} />
          <Route path="/progress" component={MyProgress} />
          <Route path="/leaderboard" component={Leaderboard} />
          <Route path="/coach">
            <CoachGuard><CoachDashboard /></CoachGuard>
          </Route>
          <Route path="/strategy">
            <CoachGuard><StrategyPage /></CoachGuard>
          </Route>
          <Route>
            <Redirect to="/" />
          </Route>
        </Switch>
      </AppShell>
    </AuthGuard>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <AppRoutes />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
