import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@workspace/replit-auth-web";
import { useGetMyProfile } from "@workspace/api-client-react";
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
  SidebarTrigger,
  SidebarFooter
} from "@/components/ui/sidebar";
import { Activity, Dumbbell, Timer, UserCircle, Users, LogOut, Shield, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

export function AppShell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { isAuthenticated, logout, user } = useAuth();
  
  // Only try to fetch profile if authenticated
  const { data: profile } = useGetMyProfile({
    query: {
      enabled: isAuthenticated,
      retry: false
    }
  });

  if (!isAuthenticated) {
    return <>{children}</>;
  }

  const NAV_ITEMS = [
    { title: "Home", url: "/app", icon: Activity },
    { title: "My Profile", url: "/app/profile", icon: UserCircle },
    { title: "Training Log", url: "/app/training", icon: Dumbbell },
    { title: "Speed Tracker", url: "/app/speed", icon: Timer },
  ];

  return (
    <SidebarProvider style={{ "--sidebar-width": "16rem", "--sidebar-width-icon": "4rem" } as React.CSSProperties}>
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar variant="inset" className="border-r border-border/50">
          <SidebarContent className="bg-card">
            <div className="p-6 flex items-center gap-3">
              <div className="bg-primary/20 p-2.5 rounded-xl text-primary shrink-0">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-display font-bold tracking-tight text-foreground uppercase leading-none">Kho-Kho</h2>
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mt-1">Team Tracker</p>
              </div>
            </div>
            
            <SidebarGroup>
              <SidebarGroupLabel className="uppercase tracking-wider text-xs font-bold text-muted-foreground mb-2">
                Player Space
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {NAV_ITEMS.map((item) => {
                    const isActive = location === item.url;
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton 
                          asChild 
                          isActive={isActive}
                          className="hover-elevate my-0.5"
                        >
                          <Link href={item.url} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${isActive ? 'bg-primary/10 text-primary font-bold' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}>
                            <item.icon className={`w-5 h-5 ${isActive ? 'text-primary' : ''}`} />
                            <span className="text-sm font-medium">{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {profile?.isCoach && (
              <SidebarGroup className="mt-4">
                <SidebarGroupLabel className="uppercase tracking-wider text-xs font-bold text-primary mb-2 flex items-center gap-2">
                  <Shield className="w-3 h-3" />
                  Coach Access
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton 
                        asChild 
                        isActive={location.startsWith("/app/coach")}
                        className="hover-elevate my-0.5"
                      >
                        <Link href="/app/coach" className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${location.startsWith("/app/coach") ? 'bg-primary text-primary-foreground font-bold shadow-md shadow-primary/20' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}>
                          <Users className="w-5 h-5" />
                          <span className="text-sm font-medium">Team Dashboard</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}
          </SidebarContent>

          <SidebarFooter className="p-4 bg-card border-t border-border/50">
            <div className="flex items-center gap-3 mb-4 px-2">
              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-sm font-bold text-secondary-foreground shrink-0 overflow-hidden">
                {user?.profileImageUrl ? (
                  <img src={user.profileImageUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  user?.firstName?.charAt(0) || "U"
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-foreground truncate">{profile?.displayName || user?.firstName || "Player"}</p>
                <p className="text-xs text-muted-foreground truncate">{profile?.role || "Setup profile"}</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10 hover:border-destructive/30"
              onClick={logout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </SidebarFooter>
        </Sidebar>
        
        <div className="flex flex-col flex-1 min-w-0">
          <header className="sticky top-0 z-40 flex h-16 items-center justify-between px-4 md:px-8 border-b border-border/40 bg-background/80 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <SidebarTrigger>
                <Button variant="ghost" size="icon" className="md:hidden hover-elevate">
                  <Activity className="w-5 h-5" />
                </Button>
              </SidebarTrigger>
              <h1 className="text-lg font-display font-bold md:hidden">TEAM TRACKER</h1>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
            </div>
          </header>
          <main className="flex-1 p-4 md:p-8 overflow-y-auto">
            <div className="max-w-5xl mx-auto h-full">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
