import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { 
  Sidebar, 
  SidebarContent, 
  SidebarGroup, 
  SidebarGroupContent, 
  SidebarGroupLabel, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem, 
  SidebarProvider,
  SidebarTrigger
} from "@/components/ui/sidebar";
import { Activity, Users, Timer, Dumbbell, Trophy, Lightbulb, Menu, Shield, Wifi } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";

const NAV_ITEMS = [
  { title: "Dashboard", url: "/", icon: Activity },
  { title: "Team Players", url: "/players", icon: Users },
  { title: "Speed Tracker", url: "/speed", icon: Timer },
  { title: "Training Logs", url: "/training", icon: Dumbbell },
  { title: "Match Analysis", url: "/matches", icon: Trophy },
  { title: "Strategy Gen", url: "/strategy", icon: Lightbulb },
  { title: "Live Team", url: "/live-team", icon: Wifi },
];

export function AppShell({ children }: { children: ReactNode }) {
  const [location] = useLocation();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar variant="inset" className="border-r border-border/50">
          <SidebarContent className="bg-card">
            <div className="p-6 flex items-center gap-3">
              <div className="bg-primary/20 p-2 rounded-xl text-primary">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight text-foreground uppercase leading-none">Kho-Kho</h2>
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest">Champion Tracker</p>
              </div>
            </div>
            <SidebarGroup>
              <SidebarGroupLabel className="uppercase tracking-wider text-xs font-bold text-muted-foreground">Navigation</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {NAV_ITEMS.map((item) => {
                    const isActive = location === item.url;
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton 
                          asChild 
                          isActive={isActive}
                          className="hover-elevate my-1"
                        >
                          <Link href={item.url} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${isActive ? 'bg-primary/10 text-primary font-bold' : 'text-muted-foreground hover:text-foreground'}`}>
                            <item.icon className={`w-5 h-5 ${isActive ? 'text-primary' : ''}`} />
                            <span className="text-base">{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
        
        <div className="flex flex-col flex-1 min-w-0">
          <header className="sticky top-0 z-50 flex h-16 items-center justify-between px-4 border-b border-border/40 bg-background/80 backdrop-blur-md">
            <div className="flex items-center gap-2">
              <SidebarTrigger>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="w-5 h-5" />
                </Button>
              </SidebarTrigger>
              <h1 className="text-lg font-bold md:hidden">KHO-KHO</h1>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
            </div>
          </header>
          <main className="flex-1 p-4 md:p-8 overflow-y-auto">
            <div className="max-w-6xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
