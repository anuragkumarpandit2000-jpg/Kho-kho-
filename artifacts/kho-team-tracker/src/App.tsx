import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { AppShell } from "./components/layout/app-shell";

// Pages
import LandingPage from "./pages/landing";
import HomePage from "./pages/home";
import ProfilePage from "./pages/profile";
import TrainingPage from "./pages/training";
import SpeedPage from "./pages/speed";
import CoachDashboard from "./pages/coach-dashboard";
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
        <Route path="/" component={LandingPage} />
        <Route path="/app" component={HomePage} />
        <Route path="/app/profile" component={ProfilePage} />
        <Route path="/app/training" component={TrainingPage} />
        <Route path="/app/speed" component={SpeedPage} />
        <Route path="/app/coach" component={CoachDashboard} />
        <Route component={NotFound} />
      </Switch>
    </AppShell>
  );
}

export default function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="kho-theme">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
