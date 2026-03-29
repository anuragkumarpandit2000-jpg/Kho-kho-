import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppShell } from "./components/layout/app-shell";

// Pages
import Dashboard from "./pages/dashboard";
import Players from "./pages/players";
import SpeedTracker from "./pages/speed-tracker";
import TrainingTracker from "./pages/training";
import Matches from "./pages/matches";
import Strategy from "./pages/strategy";
import LiveTeam from "./pages/live-team";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 mins
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <AppShell>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/players" component={Players} />
        <Route path="/speed" component={SpeedTracker} />
        <Route path="/training" component={TrainingTracker} />
        <Route path="/matches" component={Matches} />
        <Route path="/strategy" component={Strategy} />
        <Route path="/live-team" component={LiveTeam} />
        <Route component={NotFound} />
      </Switch>
    </AppShell>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
