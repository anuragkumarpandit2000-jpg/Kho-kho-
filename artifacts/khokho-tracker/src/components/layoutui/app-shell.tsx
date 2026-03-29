import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import {
  Activity, ClipboardList, TrendingUp, Trophy, Lightbulb,
  Shield, LogOut, Menu, X, ChevronRight
} from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

function NavItem({ title, url, icon: Icon, isActive, onClick }: {
  title: string; url: string; icon: React.ElementType; isActive: boolean; onClick?: () => void;
}) {
  return (
    <Link href={url}>
      <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-left ${
          isActive
            ? "bg-primary/15 text-primary font-bold"
            : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
        }`}
      >
        <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-primary" : ""}`} />
        <span className="text-sm font-semibold">{title}</span>
        {isActive && <ChevronRight className="w-4 h-4 ml-auto text-primary" />}
      </button>
    </Link>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const PLAYER_NAV = [
    { title: "Dashboard", url: "/", icon: Activity },
    { title: "Daily Entry", url: "/entry", icon: ClipboardList },
    { title: "My Progress", url: "/progress", icon: TrendingUp },
    { title: "Leaderboard", url: "/leaderboard", icon: Trophy },
  ];

  const COACH_NAV = [
    { title: "Dashboard", url: "/", icon: Activity },
    { title: "Daily Entry", url: "/entry", icon: ClipboardList },
    { title: "My Progress", url: "/progress", icon: TrendingUp },
    { title: "Leaderboard", url: "/leaderboard", icon: Trophy },
    { title: "Coach Dashboard", url: "/coach", icon: Shield },
    { title: "Strategy", url: "/strategy", icon: Lightbulb },
  ];

  const NAV_ITEMS = user?.isCoach ? COACH_NAV : PLAYER_NAV;

  const SidebarContent = ({ onNavClick }: { onNavClick?: () => void }) => (
    <div className="flex flex-col h-full">
      <div className="p-6 flex items-center gap-3 border-b border-border/30">
        <div className="bg-primary/15 p-2.5 rounded-xl">
          <Shield className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-black tracking-tight text-foreground uppercase leading-none">Kho-Kho</h2>
          <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest">Champion Tracker</p>
        </div>
      </div>

      {user && (
        <div className="px-4 py-4 border-b border-border/30">
          <div className="flex items-center gap-3 bg-secondary/40 rounded-xl px-3 py-2.5">
            <div className="w-9 h-9 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-primary font-black text-sm">{user.name[0].toUpperCase()}</span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-foreground truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground font-semibold">{user.isCoach ? "🛡️ Coach" : `⭐ ${user.totalScore} pts`}</p>
            </div>
          </div>
        </div>
      )}

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="text-xs font-black uppercase tracking-wider text-muted-foreground px-4 mb-2">Navigation</p>
        {NAV_ITEMS.map((item) => (
          <NavItem
            key={item.title}
            {...item}
            isActive={location === item.url}
            onClick={onNavClick}
          />
        ))}
      </nav>

      <div className="p-4 border-t border-border/30">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all text-sm font-semibold"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside className="hidden lg:flex w-64 flex-col bg-card border-r border-border/50 flex-shrink-0 fixed h-full z-40">
        <SidebarContent />
      </aside>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed left-0 top-0 h-full w-72 bg-card border-r border-border/50 z-50 lg:hidden"
            >
              <SidebarContent onNavClick={() => setMobileOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex flex-col flex-1 lg:pl-64 min-w-0">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between px-4 border-b border-border/40 bg-background/90 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl hover:bg-secondary transition"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="font-black text-foreground uppercase tracking-tight lg:hidden">KHO-KHO</span>
          </div>
          <div className="flex items-center gap-3">
            {user && (
              <span className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground font-semibold bg-secondary/60 px-3 py-1.5 rounded-full">
                {user.isCoach ? "🛡️ Coach" : `⭐ ${user.totalScore} pts`}
              </span>
            )}
            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <div className="max-w-5xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
