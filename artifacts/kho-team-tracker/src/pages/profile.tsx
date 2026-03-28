import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@workspace/replit-auth-web";
import { useGetMyProfile, useUpdateMyProfile, getGetMyProfileQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Shield, User, Zap } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const profileSchema = z.object({
  displayName: z.string().min(2, "Name must be at least 2 characters"),
  role: z.enum(["Runner", "Chaser"]),
  specialSkill: z.string().min(2, "Required to highlight your strength on the team"),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const { data: profile, isLoading } = useGetMyProfile({
    query: { retry: false }
  });
  
  const updateMutation = useUpdateMyProfile({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMyProfileQueryKey() });
        toast({ title: "Profile Updated", description: "Your details have been saved successfully." });
      },
      onError: () => {
        toast({ title: "Error", description: "Could not save profile.", variant: "destructive" });
      }
    }
  });

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: "",
      role: "Runner",
      specialSkill: "",
    },
  });

  // Prefill form when data arrives or fallback to auth user name if creating for the first time
  useEffect(() => {
    if (profile) {
      form.reset({
        displayName: profile.displayName,
        role: profile.role as "Runner" | "Chaser",
        specialSkill: profile.specialSkill || "",
      });
    } else if (user && !isLoading) {
      form.reset({
        displayName: user.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : "",
        role: "Runner",
        specialSkill: "",
      });
    }
  }, [profile, user, isLoading, form]);

  const onSubmit = (data: ProfileFormValues) => {
    updateMutation.mutate({ data });
  };

  if (isLoading) {
    return <Skeleton className="h-[400px] w-full max-w-2xl mx-auto rounded-2xl" />;
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-2xl mx-auto"
    >
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-foreground">My Profile</h1>
        <p className="text-muted-foreground">Manage your player identity and role.</p>
      </div>

      <Card className="border-border/50 shadow-lg overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-primary to-accent opacity-20"></div>
        <CardHeader className="-mt-12 text-center pb-2">
          <div className="w-20 h-20 mx-auto rounded-full bg-card border-4 border-card flex items-center justify-center shadow-sm overflow-hidden mb-2">
            {user?.profileImageUrl ? (
              <img src={user.profileImageUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <User className="w-10 h-10 text-muted-foreground" />
            )}
          </div>
          <CardTitle className="text-2xl">{profile?.displayName || "Setup Profile"}</CardTitle>
          <CardDescription className="flex items-center justify-center gap-2 mt-1">
            {profile?.isCoach && (
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 no-default-active-elevate">
                <Shield className="w-3 h-3 mr-1" /> Coach
              </Badge>
            )}
            {profile?.role && (
              <Badge variant="outline" className="no-default-active-elevate font-semibold uppercase">
                {profile.role}
              </Badge>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground/80 font-bold uppercase text-xs tracking-wider">Display Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your full name" className="h-12 rounded-xl bg-secondary/30 focus-visible:ring-primary/20" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid sm:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground/80 font-bold uppercase text-xs tracking-wider">Primary Role</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-12 rounded-xl bg-secondary/30 focus:ring-primary/20">
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Runner">Runner</SelectItem>
                          <SelectItem value="Chaser">Chaser</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="specialSkill"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground/80 font-bold uppercase text-xs tracking-wider flex items-center gap-1">
                        Special Skill <Zap className="w-3 h-3 text-accent" />
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Pole Dive, Sudden Sprint" className="h-12 rounded-xl bg-secondary/30 focus-visible:ring-primary/20" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full h-14 text-lg font-bold rounded-xl mt-4 hover-elevate shadow-lg shadow-primary/20"
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? "Saving..." : "Save Profile"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
