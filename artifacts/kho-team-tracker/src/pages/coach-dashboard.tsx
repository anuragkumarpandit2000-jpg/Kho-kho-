import { useAuth } from "@workspace/replit-auth-web";
import { useGetAllPlayers, useGetLeaderboard } from "@workspace/api-client-react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Trophy, AlertTriangle, ShieldAlert, Timer, Target } from "lucide-react";
import { differenceInDays } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

export default function CoachDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  
  const { data: players, isLoading: loadingPlayers, error } = useGetAllPlayers();
  const { data: leaderboard, isLoading: loadingLeaderboard } = useGetLeaderboard();

  // Handle 403 Forbidden (not a coach)
  if (error && (error as any)?.response?.status === 403) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center max-w-md mx-auto">
        <ShieldAlert className="w-16 h-16 text-destructive mb-6" />
        <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
        <p className="text-muted-foreground mb-8">You do not have coach privileges to view this dashboard.</p>
        <Button onClick={() => setLocation("/app")} className="hover-elevate">Return to Home</Button>
      </div>
    );
  }

  if (loadingPlayers || loadingLeaderboard) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-16 w-full" />
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      </div>
    );
  }

  const sortedPlayers = players ? [...players].sort((a, b) => a.displayName.localeCompare(b.displayName)) : [];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-8 pb-12"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2 border-b border-border/50 pb-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-primary flex items-center gap-3">
            <Users className="w-8 h-8" /> Coach Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">Overview of your team's performance and consistency.</p>
        </div>
        <div className="flex gap-4 text-center">
          <div className="bg-secondary/40 px-4 py-2 rounded-xl">
            <p className="text-xs font-bold text-muted-foreground uppercase">Active Roster</p>
            <p className="text-2xl font-display font-bold">{players?.length || 0}</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="roster" className="w-full">
        <TabsList className="h-14 bg-secondary/30 p-1 w-full sm:w-auto grid grid-cols-2 sm:flex sm:inline-flex mb-6">
          <TabsTrigger value="roster" className="h-full rounded-lg px-6 font-bold data-[state=active]:bg-card data-[state=active]:shadow-sm">
            <Users className="w-4 h-4 mr-2" /> Team Roster
          </TabsTrigger>
          <TabsTrigger value="leaderboard" className="h-full rounded-lg px-6 font-bold data-[state=active]:bg-card data-[state=active]:shadow-sm">
            <Trophy className="w-4 h-4 mr-2 text-yellow-500" /> Leaderboards
          </TabsTrigger>
        </TabsList>

        <TabsContent value="roster" className="focus-visible:outline-none">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedPlayers.map(player => {
              const daysSinceTraining = player.lastTrainingDate 
                ? differenceInDays(new Date(), new Date(player.lastTrainingDate)) 
                : 999;
              
              const missedEntry = daysSinceTraining > 1;

              return (
                <Card key={player.id} className="border-border/50 shadow-md hover:border-primary/30 transition-all hover-elevate">
                  <CardHeader className="pb-4 border-b border-border/20">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl mb-1">{player.displayName}</CardTitle>
                        <Badge variant="outline" className="no-default-active-elevate text-xs uppercase font-bold text-muted-foreground">
                          {player.role}
                        </Badge>
                      </div>
                      {missedEntry && (
                        <div title="Missed recent training">
                          <AlertTriangle className="w-5 h-5 text-destructive" />
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground uppercase text-[10px] font-bold tracking-wider mb-1">Streak</p>
                        <p className="font-bold text-foreground flex items-center gap-1">
                          {player.trainingStreakDays} days
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground uppercase text-[10px] font-bold tracking-wider mb-1">Best 80m</p>
                        <p className="font-bold text-accent flex items-center gap-1">
                          {player.bestSpeedTime ? `${player.bestSpeedTime}s` : '--'}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-muted-foreground uppercase text-[10px] font-bold tracking-wider mb-1">Special Skill</p>
                        <p className="font-medium text-foreground truncate">{player.specialSkill || "None specified"}</p>
                      </div>
                    </div>
                    {missedEntry && (
                      <p className="text-xs text-destructive bg-destructive/10 px-3 py-2 rounded-lg font-medium">
                        Hasn't logged training in {daysSinceTraining === 999 ? 'forever' : `${daysSinceTraining} days`}.
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
            
            {sortedPlayers.length === 0 && (
              <div className="col-span-full py-12 text-center text-muted-foreground border-2 border-dashed border-border rounded-2xl">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>No players have set up their profiles yet.</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="leaderboard" className="focus-visible:outline-none">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Speed Leaderboard */}
            <Card className="border-border/50 shadow-md">
              <CardHeader className="bg-secondary/20 pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Timer className="w-5 h-5 text-accent" /> Speed Rankings
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead className="text-xs text-muted-foreground uppercase border-b border-border/50">
                    <tr>
                      <th className="px-6 py-4 font-bold text-left w-16">#</th>
                      <th className="px-6 py-4 font-bold text-left">Athlete</th>
                      <th className="px-6 py-4 font-bold text-right">Best Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/20">
                    {leaderboard?.speed.map((entry, index) => (
                      <tr key={entry.playerId} className="hover:bg-muted/30">
                        <td className="px-6 py-4 font-bold text-muted-foreground">{index + 1}</td>
                        <td className="px-6 py-4">
                          <p className="font-bold text-foreground">{entry.displayName}</p>
                          <p className="text-xs text-muted-foreground">{entry.role}</p>
                        </td>
                        <td className="px-6 py-4 text-right font-display font-bold text-accent text-lg">
                          {entry.speedScore ? `${entry.speedScore.toFixed(2)}s` : '--'}
                        </td>
                      </tr>
                    ))}
                    {(!leaderboard?.speed || leaderboard.speed.length === 0) && (
                      <tr><td colSpan={3} className="text-center py-8 text-muted-foreground">No speed data available.</td></tr>
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            {/* Consistency Leaderboard */}
            <Card className="border-border/50 shadow-md">
              <CardHeader className="bg-secondary/20 pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" /> Consistency Rankings
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead className="text-xs text-muted-foreground uppercase border-b border-border/50">
                    <tr>
                      <th className="px-6 py-4 font-bold text-left w-16">#</th>
                      <th className="px-6 py-4 font-bold text-left">Athlete</th>
                      <th className="px-6 py-4 font-bold text-right">Logs</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/20">
                    {leaderboard?.consistency.map((entry, index) => (
                      <tr key={entry.playerId} className="hover:bg-muted/30">
                        <td className="px-6 py-4 font-bold text-muted-foreground">{index + 1}</td>
                        <td className="px-6 py-4">
                          <p className="font-bold text-foreground">{entry.displayName}</p>
                          <p className="text-xs text-muted-foreground">{entry.role}</p>
                        </td>
                        <td className="px-6 py-4 text-right font-display font-bold text-primary text-lg">
                          {entry.totalTrainingDays}
                        </td>
                      </tr>
                    ))}
                    {(!leaderboard?.consistency || leaderboard.consistency.length === 0) && (
                      <tr><td colSpan={3} className="text-center py-8 text-muted-foreground">No training data available.</td></tr>
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
