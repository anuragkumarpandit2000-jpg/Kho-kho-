import { useAuth } from "@workspace/replit-auth-web";
import { useGetMyProfile, useGetMyTrainingLogs, useGetMySpeedEntries } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { UserCircle, Zap, Dumbbell, Timer, Flame, CheckCircle2, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format, isToday } from "date-fns";

export default function HomePage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { data: profile, isLoading: loadingProfile, error: profileError } = useGetMyProfile({
    query: { retry: false }
  });
  const { data: trainingLogs, isLoading: loadingTraining } = useGetMyTrainingLogs();
  const { data: speedEntries, isLoading: loadingSpeed } = useGetMySpeedEntries();

  // If profile is missing (404), prompt to complete it
  const isProfileMissing = profileError && (profileError as any)?.response?.status === 404;

  if (loadingProfile || loadingTraining || loadingSpeed) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (isProfileMissing || !profile) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto mt-12 text-center"
      >
        <div className="bg-primary/10 w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-6">
          <UserCircle className="w-12 h-12 text-primary" />
        </div>
        <h2 className="text-3xl font-display font-bold mb-4">Welcome to the Team, {user?.firstName || "Player"}!</h2>
        <p className="text-muted-foreground text-lg mb-8">
          Before you can start tracking your progress, we need to set up your player profile. Tell us your role and specialty on the mat.
        </p>
        <Button size="lg" className="h-14 px-8 text-lg font-bold rounded-2xl hover-elevate" onClick={() => setLocation("/app/profile")}>
          Complete My Profile
        </Button>
      </motion.div>
    );
  }

  const todayLog = trainingLogs?.find(log => isToday(new Date(log.date)));
  const todaySpeed = speedEntries?.find(entry => isToday(new Date(entry.date)));

  const bestSpeed = speedEntries?.length 
    ? Math.min(...speedEntries.map(s => s.timeInSeconds)) 
    : null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {profile.displayName}. Let's push those limits.</p>
        </div>
        {profile.isCoach && (
          <Button variant="outline" className="font-bold text-primary border-primary/20 hover:bg-primary/5 hover-elevate" onClick={() => setLocation("/app/coach")}>
            Switch to Coach View
          </Button>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="md:col-span-2 bg-gradient-to-br from-card to-card/50 border-border/50 shadow-md">
          <CardContent className="p-6 md:p-8 flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="w-24 h-24 rounded-full bg-secondary flex items-center justify-center shrink-0 border-4 border-background shadow-sm overflow-hidden">
              {user?.profileImageUrl ? (
                <img src={user.profileImageUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <UserCircle className="w-12 h-12 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                <h2 className="text-2xl font-bold">{profile.displayName}</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
                  {profile.role}
                </span>
              </div>
              <p className="text-muted-foreground font-medium mb-4 flex items-center justify-center sm:justify-start gap-1.5">
                <Zap className="w-4 h-4 text-accent" /> Special Skill: {profile.specialSkill}
              </p>
              <div className="flex flex-wrap justify-center sm:justify-start gap-3 mt-auto">
                <Button size="sm" variant="secondary" className="hover-elevate rounded-xl font-bold" onClick={() => setLocation("/app/profile")}>
                  Edit Profile
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Daily Status */}
        <Card className="border-border/50 shadow-md bg-card">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-500" />
              Today's Status
            </CardTitle>
            <CardDescription>{format(new Date(), 'EEEE, MMMM d')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/50">
              <div className="flex items-center gap-3">
                <Dumbbell className="w-5 h-5 text-muted-foreground" />
                <span className="font-medium">Training</span>
              </div>
              {todayLog ? (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              ) : (
                <AlertCircle className="w-5 h-5 text-destructive" />
              )}
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/50">
              <div className="flex items-center gap-3">
                <Timer className="w-5 h-5 text-muted-foreground" />
                <span className="font-medium">Speed Check</span>
              </div>
              {todaySpeed ? (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              ) : (
                <AlertCircle className="w-5 h-5 text-destructive" />
              )}
            </div>
            {(!todayLog || !todaySpeed) && (
              <p className="text-xs text-center text-muted-foreground pt-2">
                Don't forget to log your daily stats!
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        {/* Training Summary */}
        <Card className="border-border/50 shadow-md hover:border-primary/30 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Dumbbell className="w-6 h-6 text-primary" />
              Recent Training
            </CardTitle>
          </CardHeader>
          <CardContent>
            {trainingLogs && trainingLogs.length > 0 ? (
              <div className="space-y-4">
                <div className="flex justify-between items-end border-b border-border pb-4">
                  <div>
                    <p className="text-sm text-muted-foreground uppercase tracking-wider font-bold">Total Logs</p>
                    <p className="text-3xl font-display font-bold text-foreground">{trainingLogs.length}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground uppercase tracking-wider font-bold">Latest Match</p>
                    <p className="text-lg font-bold text-foreground">
                      {trainingLogs.find(l => l.matchPlayed) ? format(new Date(trainingLogs.find(l => l.matchPlayed)!.date), 'MMM d') : 'None'}
                    </p>
                  </div>
                </div>
                <Button className="w-full font-bold hover-elevate rounded-xl" onClick={() => setLocation("/app/training")}>
                  Log Today's Training
                </Button>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-muted-foreground mb-4">No training logged yet.</p>
                <Button className="font-bold hover-elevate rounded-xl" onClick={() => setLocation("/app/training")}>
                  Start Tracking
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Speed Summary */}
        <Card className="border-border/50 shadow-md hover:border-accent/30 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Timer className="w-6 h-6 text-accent" />
              Speed Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            {speedEntries && speedEntries.length > 0 ? (
              <div className="space-y-4">
                <div className="flex justify-between items-end border-b border-border pb-4">
                  <div>
                    <p className="text-sm text-muted-foreground uppercase tracking-wider font-bold">Best 80m</p>
                    <p className="text-3xl font-display font-bold text-accent">{bestSpeed?.toFixed(2)}s</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground uppercase tracking-wider font-bold">Latest</p>
                    <p className="text-lg font-bold text-foreground">
                      {speedEntries[speedEntries.length - 1].timeInSeconds.toFixed(2)}s
                    </p>
                  </div>
                </div>
                <Button variant="secondary" className="w-full font-bold hover-elevate rounded-xl bg-accent/10 text-accent hover:bg-accent/20 border-0" onClick={() => setLocation("/app/speed")}>
                  Record Sprint
                </Button>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-muted-foreground mb-4">No sprint times recorded.</p>
                <Button variant="secondary" className="font-bold hover-elevate rounded-xl bg-accent/10 text-accent hover:bg-accent/20 border-0" onClick={() => setLocation("/app/speed")}>
                  Record First Sprint
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
