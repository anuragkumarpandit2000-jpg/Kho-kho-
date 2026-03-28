import { useAuth } from "@workspace/replit-auth-web";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, Activity, Shield, Trophy } from "lucide-react";

export default function LandingPage() {
  const { login } = useAuth();

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <header className="flex items-center justify-between p-6 md:px-12 z-10">
        <div className="flex items-center gap-3">
          <div className="bg-primary p-2.5 rounded-xl text-primary-foreground shadow-lg shadow-primary/25">
            <Activity className="w-6 h-6" />
          </div>
          <span className="font-display font-bold text-2xl tracking-tight">KHO-KHO</span>
        </div>
        <Button onClick={login} variant="ghost" className="font-bold text-base hover-elevate">
          Sign In
        </Button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center relative overflow-hidden px-4 py-20">
        {/* Abstract Background Decoration */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-accent/10 rounded-full blur-[120px]" />
        </div>

        <div className="w-full max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-8 items-center z-10">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="flex flex-col items-start text-left space-y-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary text-secondary-foreground text-sm font-semibold border border-border">
              <Trophy className="w-4 h-4 text-primary" />
              <span>For Champions. By Champions.</span>
            </div>
            
            <h1 className="font-display text-5xl md:text-7xl font-extrabold leading-[1.1] tracking-tight">
              Elevate Your <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Kho-Kho Game</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-[480px] leading-relaxed">
              The ultimate tracking platform for serious Kho-Kho teams. Monitor your speed, log daily training, and climb the team leaderboard.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Button 
                onClick={login} 
                size="lg" 
                className="h-14 px-8 text-lg font-bold rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-xl shadow-primary/20 hover:shadow-2xl hover:shadow-primary/30 transition-all hover:-translate-y-1"
              >
                Join the Squad <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>

            <div className="flex items-center gap-8 pt-4">
              <div className="flex flex-col">
                <span className="text-3xl font-display font-bold text-foreground">30d</span>
                <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Progress Tracking</span>
              </div>
              <div className="w-px h-12 bg-border"></div>
              <div className="flex flex-col">
                <span className="text-3xl font-display font-bold text-foreground">100%</span>
                <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Coach Visibility</span>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
            className="relative w-full aspect-[4/3] lg:aspect-square"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-accent/20 rounded-3xl transform rotate-3 scale-105 border border-white/10 backdrop-blur-sm"></div>
            <div className="absolute inset-0 bg-card rounded-3xl shadow-2xl border border-border/50 overflow-hidden flex items-center justify-center">
              <img 
                src={`${import.meta.env.BASE_URL}images/hero-bg.png`} 
                alt="Kho-Kho Abstract Background" 
                className="w-full h-full object-cover opacity-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent"></div>
              
              {/* Floating UI Elements over the image */}
              <div className="absolute bottom-8 left-8 right-8 bg-background/80 backdrop-blur-md border border-border p-4 rounded-2xl flex items-center justify-between shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                    <Shield className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground">Coach Dashboard</p>
                    <p className="text-xs text-muted-foreground">Real-time team analytics</p>
                  </div>
                </div>
                <div className="px-3 py-1 bg-accent/20 text-accent font-bold rounded-full text-xs">
                  Active
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
