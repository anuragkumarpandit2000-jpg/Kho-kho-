import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { useGetMyTrainingLogs, useSubmitTrainingLog, getGetMyTrainingLogsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Dumbbell, Battery, Table2, Info } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const logSchema = z.object({
  date: z.string().nonempty("Date is required"),
  runningMinutes: z.coerce.number().min(0, "Must be positive"),
  sprintRounds: z.coerce.number().min(0, "Must be positive"),
  skillPracticed: z.boolean(),
  skillName: z.string().optional(),
  matchPlayed: z.boolean(),
  foulsCommitted: z.coerce.number().min(0).default(0),
  energyLevel: z.coerce.number().min(1).max(10),
  sleepHours: z.coerce.number().min(0).max(24),
  notes: z.string().optional(),
});

type LogFormValues = z.infer<typeof logSchema>;

export default function TrainingPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const { data: logs, isLoading } = useGetMyTrainingLogs();
  
  const submitMutation = useSubmitTrainingLog({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMyTrainingLogsQueryKey() });
        toast({ title: "Training Logged", description: "Great work out there today!" });
        form.reset({ ...form.getValues(), notes: "", runningMinutes: 0, sprintRounds: 0 }); // reset some fields
      },
      onError: (err) => {
        toast({ title: "Error", description: err.error || "Failed to log training.", variant: "destructive" });
      }
    }
  });

  const form = useForm<LogFormValues>({
    resolver: zodResolver(logSchema),
    defaultValues: {
      date: format(new Date(), 'yyyy-MM-dd'),
      runningMinutes: 0,
      sprintRounds: 0,
      skillPracticed: false,
      skillName: "",
      matchPlayed: false,
      foulsCommitted: 0,
      energyLevel: 7,
      sleepHours: 8,
      notes: "",
    },
  });

  const watchSkill = form.watch("skillPracticed");
  const watchMatch = form.watch("matchPlayed");

  const onSubmit = (data: LogFormValues) => {
    submitMutation.mutate({ 
      data: {
        ...data,
        skillName: data.skillPracticed ? data.skillName : null,
        notes: data.notes || null,
      } 
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-8"
    >
      <div className="mb-2">
        <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
          <Dumbbell className="text-primary w-8 h-8" /> Training Log
        </h1>
        <p className="text-muted-foreground mt-1">Record your daily efforts. Consistency is key to becoming a champion.</p>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Form Column */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="border-border/50 shadow-lg">
            <CardHeader className="bg-secondary/20 border-b border-border/50 pb-4">
              <CardTitle className="text-xl">Daily Entry</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  
                  <FormField control={form.control} name="date" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold uppercase">Date</FormLabel>
                      <FormControl>
                        <Input type="date" className="h-12 rounded-xl bg-secondary/30" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="runningMinutes" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold uppercase">Running (mins)</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" className="h-12 rounded-xl bg-secondary/30 text-center text-lg font-bold" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="sprintRounds" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold uppercase">Sprint Rounds</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" className="h-12 rounded-xl bg-secondary/30 text-center text-lg font-bold" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <div className="space-y-4 p-4 rounded-xl bg-secondary/20 border border-border/50">
                    <FormField control={form.control} name="skillPracticed" render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg">
                        <div className="space-y-0.5">
                          <FormLabel className="text-sm font-bold">Skill Practice</FormLabel>
                          <CardDescription>Did you work on specific techniques?</CardDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )} />
                    
                    {watchSkill && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}>
                        <FormField control={form.control} name="skillName" render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input placeholder="e.g. Pole Turn, Fake Dive" className="h-10 rounded-lg bg-background" {...field} value={field.value || ''} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </motion.div>
                    )}
                  </div>

                  <div className="space-y-4 p-4 rounded-xl bg-secondary/20 border border-border/50">
                    <FormField control={form.control} name="matchPlayed" render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg">
                        <div className="space-y-0.5">
                          <FormLabel className="text-sm font-bold">Match Played</FormLabel>
                          <CardDescription>Did you play a practice match?</CardDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )} />
                    
                    {watchMatch && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}>
                        <FormField control={form.control} name="foulsCommitted" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-bold uppercase">Fouls Committed</FormLabel>
                            <FormControl>
                              <Input type="number" min="0" className="h-10 rounded-lg bg-background" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </motion.div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-6 pt-2">
                    <FormField control={form.control} name="energyLevel" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold uppercase flex justify-between">
                          Energy <span className="text-primary">{field.value}/10</span>
                        </FormLabel>
                        <FormControl>
                          <div className="pt-2">
                            <Slider 
                              min={1} max={10} step={1} 
                              value={[field.value]} 
                              onValueChange={(v) => field.onChange(v[0])}
                              className="py-2"
                            />
                          </div>
                        </FormControl>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="sleepHours" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold uppercase flex justify-between">
                          Sleep <span className="text-accent">{field.value}h</span>
                        </FormLabel>
                        <FormControl>
                          <div className="pt-2">
                            <Slider 
                              min={0} max={12} step={0.5} 
                              value={[field.value]} 
                              onValueChange={(v) => field.onChange(v[0])}
                              className="py-2 [&_[role=slider]]:border-accent [&_[data-orientation=horizontal]]:bg-accent"
                            />
                          </div>
                        </FormControl>
                      </FormItem>
                    )} />
                  </div>

                  <FormField control={form.control} name="notes" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold uppercase">Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="How did you feel today?" className="resize-none h-20 rounded-xl bg-secondary/30" {...field} value={field.value || ''} />
                      </FormControl>
                    </FormItem>
                  )} />

                  <Button type="submit" disabled={submitMutation.isPending} className="w-full h-14 text-lg font-bold rounded-xl hover-elevate shadow-lg shadow-primary/20">
                    {submitMutation.isPending ? "Submitting..." : "Log Training"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* History Column */}
        <div className="lg:col-span-7">
          <Card className="border-border/50 shadow-md h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-xl flex items-center gap-2">
                <Table2 className="w-5 h-5 text-muted-foreground" />
                History <span className="text-sm font-normal text-muted-foreground ml-2">(Last 30 Days)</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-hidden">
              {isLoading ? (
                <div className="p-6 space-y-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : logs && logs.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground uppercase bg-secondary/50 border-y border-border">
                      <tr>
                        <th className="px-6 py-4 font-bold">Date</th>
                        <th className="px-6 py-4 font-bold">Run / Sprint</th>
                        <th className="px-6 py-4 font-bold text-center">Skill</th>
                        <th className="px-6 py-4 font-bold text-center">Match</th>
                        <th className="px-6 py-4 font-bold text-right">Energy</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {logs.slice(0, 10).map((log) => (
                        <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-6 py-4 font-medium">{format(new Date(log.date), 'MMM d, yyyy')}</td>
                          <td className="px-6 py-4 text-muted-foreground">{log.runningMinutes}m / {log.sprintRounds}r</td>
                          <td className="px-6 py-4 text-center">
                            {log.skillPracticed ? (
                              <span className="inline-block px-2 py-1 bg-accent/10 text-accent text-xs rounded-full font-bold truncate max-w-[100px]">
                                {log.skillName || "Yes"}
                              </span>
                            ) : "-"}
                          </td>
                          <td className="px-6 py-4 text-center">
                            {log.matchPlayed ? (
                              <span className="text-primary font-bold">{log.foulsCommitted} fouls</span>
                            ) : "-"}
                          </td>
                          <td className="px-6 py-4 text-right font-bold text-foreground">
                            {log.energyLevel}/10
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {logs.length > 10 && (
                    <div className="p-4 text-center text-sm text-muted-foreground bg-secondary/20">
                      Showing most recent 10 of {logs.length} entries.
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-center px-6">
                  <Info className="w-12 h-12 text-muted-foreground/30 mb-4" />
                  <p className="text-lg font-medium text-foreground">No logs yet</p>
                  <p className="text-sm text-muted-foreground">Your training history will appear here once you submit your first log.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
