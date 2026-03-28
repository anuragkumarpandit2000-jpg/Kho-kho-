import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { useGetMySpeedEntries, useSubmitSpeedEntry, getGetMySpeedEntriesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Timer, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

const speedSchema = z.object({
  date: z.string().nonempty("Date is required"),
  timeInSeconds: z.coerce.number().min(5, "Impossible time").max(60, "Too slow"),
});

type SpeedFormValues = z.infer<typeof speedSchema>;

export default function SpeedPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const { data: entries, isLoading } = useGetMySpeedEntries();
  
  const submitMutation = useSubmitSpeedEntry({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMySpeedEntriesQueryKey() });
        toast({ title: "Time Recorded", description: "Speed entry added to your history." });
        form.reset({ ...form.getValues(), timeInSeconds: 0 }); 
      },
      onError: (err) => {
        toast({ title: "Error", description: err.error || "Failed to log speed.", variant: "destructive" });
      }
    }
  });

  const form = useForm<SpeedFormValues>({
    resolver: zodResolver(speedSchema),
    defaultValues: {
      date: format(new Date(), 'yyyy-MM-dd'),
      timeInSeconds: 0,
    },
  });

  const onSubmit = (data: SpeedFormValues) => {
    submitMutation.mutate({ data });
  };

  // Analytics calculations
  const sortedEntries = entries ? [...entries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) : [];
  const chartData = sortedEntries.map(e => ({
    day: format(new Date(e.date), 'MMM d'),
    time: e.timeInSeconds
  }));

  const bestTime = sortedEntries.length > 0 ? Math.min(...sortedEntries.map(e => e.timeInSeconds)) : null;
  const avgTime = sortedEntries.length > 0 
    ? sortedEntries.reduce((acc, curr) => acc + curr.timeInSeconds, 0) / sortedEntries.length 
    : null;

  let insightBadge = null;
  if (sortedEntries.length >= 3) {
    const last3 = sortedEntries.slice(-3).map(e => e.timeInSeconds);
    if (last3[2] < last3[0] && last3[1] <= last3[0]) {
      insightBadge = { label: "Improving", icon: TrendingDown, color: "text-green-500", bg: "bg-green-500/10 border-green-500/20" };
    } else if (Math.max(...last3) - Math.min(...last3) < 0.5) {
      insightBadge = { label: "Stable", icon: Minus, color: "text-blue-500", bg: "bg-blue-500/10 border-blue-500/20" };
    } else {
      insightBadge = { label: "Needs Practice", icon: TrendingUp, color: "text-destructive", bg: "bg-destructive/10 border-destructive/20" };
    }
  }

  let improvementPercent = null;
  if (sortedEntries.length >= 2) {
    const first = sortedEntries[0].timeInSeconds;
    const last = sortedEntries[sortedEntries.length - 1].timeInSeconds;
    improvementPercent = (((first - last) / first) * 100).toFixed(1);
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
            <Timer className="text-accent w-8 h-8" /> Speed Tracker
          </h1>
          <p className="text-muted-foreground mt-1">Track your 80m sprint times over the last 30 days.</p>
        </div>
        {insightBadge && (
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full border font-bold text-sm ${insightBadge.bg} ${insightBadge.color}`}>
            <insightBadge.icon className="w-4 h-4" />
            {insightBadge.label}
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Form */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="border-border/50 shadow-md">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Log New Sprint</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <FormField control={form.control} name="date" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold uppercase">Date</FormLabel>
                      <FormControl>
                        <Input type="date" className="h-12 rounded-xl bg-secondary/30" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="timeInSeconds" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold uppercase">80m Time (seconds)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          min="5" 
                          max="60" 
                          placeholder="e.g. 12.45"
                          className="h-16 text-3xl font-display font-bold text-center rounded-xl bg-secondary/30 text-accent" 
                          {...field} 
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <Button type="submit" disabled={submitMutation.isPending} className="w-full h-12 font-bold rounded-xl hover-elevate bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg shadow-accent/20">
                    {submitMutation.isPending ? "Saving..." : "Record Time"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          {bestTime !== null && (
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-secondary/30 border-0 shadow-none">
                <CardContent className="p-4 text-center">
                  <p className="text-xs text-muted-foreground font-bold uppercase mb-1">Best Time</p>
                  <p className="text-2xl font-display font-bold text-accent">{bestTime.toFixed(2)}s</p>
                </CardContent>
              </Card>
              <Card className="bg-secondary/30 border-0 shadow-none">
                <CardContent className="p-4 text-center">
                  <p className="text-xs text-muted-foreground font-bold uppercase mb-1">Improvement</p>
                  <p className="text-2xl font-display font-bold text-primary">
                    {improvementPercent ? `${improvementPercent}%` : '--'}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Chart */}
        <div className="lg:col-span-8">
          <Card className="border-border/50 shadow-md h-full flex flex-col min-h-[400px]">
            <CardHeader>
              <CardTitle className="text-lg">Performance Graph</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-6 pt-0">
              {isLoading ? (
                <Skeleton className="w-full h-full min-h-[300px] rounded-xl" />
              ) : chartData.length > 0 ? (
                <div className="w-full h-full min-h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="day" 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                        dy={10}
                      />
                      <YAxis 
                        domain={['dataMin - 0.5', 'dataMax + 0.5']}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          borderColor: 'hsl(var(--border))',
                          borderRadius: '8px',
                          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                        }}
                        itemStyle={{ color: 'hsl(var(--accent))', fontWeight: 'bold' }}
                        labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 'bold', marginBottom: '4px' }}
                        formatter={(value: number) => [`${value}s`, 'Time']}
                      />
                      {avgTime && (
                        <ReferenceLine 
                          y={avgTime} 
                          stroke="hsl(var(--muted-foreground))" 
                          strokeDasharray="3 3" 
                          label={{ position: 'top', value: 'AVG', fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} 
                        />
                      )}
                      <Line 
                        type="monotone" 
                        dataKey="time" 
                        stroke="hsl(var(--accent))" 
                        strokeWidth={4}
                        dot={{ fill: 'hsl(var(--card))', stroke: 'hsl(var(--accent))', strokeWidth: 3, r: 6 }}
                        activeDot={{ r: 8, strokeWidth: 0, fill: 'hsl(var(--primary))' }}
                        animationDuration={1000}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                  <TrendingDown className="w-12 h-12 text-muted-foreground/30 mb-4" />
                  <p className="text-lg font-medium text-foreground">No data to chart</p>
                  <p className="text-sm text-muted-foreground">Add your first sprint time to see the graph.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
