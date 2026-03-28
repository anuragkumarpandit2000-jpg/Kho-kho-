import { useState } from "react";
import { usePlayers, useCreatePlayer, useUpdatePlayer, useDeletePlayer } from "@/hooks/use-kho";
import { Player, playerSchema } from "@/lib/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Edit2, Trash2, Shield, Activity, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";

export default function Players() {
  const { data: players, isLoading } = usePlayers();
  const { mutate: createPlayer, isPending: isCreating } = useCreatePlayer();
  const { mutate: updatePlayer, isPending: isUpdating } = useUpdatePlayer();
  const { mutate: deletePlayer } = useDeletePlayer();

  const [isOpen, setIsOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [filter, setFilter] = useState<"All" | "Runner" | "Chaser">("All");

  const form = useForm({
    resolver: zodResolver(playerSchema.omit({ id: true, createdAt: true })),
    defaultValues: {
      name: "",
      role: "Runner" as const,
      specialSkill: "",
      strengthLevel: 5,
      weaknessNotes: "",
    },
  });

  const openEdit = (player: Player) => {
    setEditingPlayer(player);
    form.reset({
      name: player.name,
      role: player.role,
      specialSkill: player.specialSkill,
      strengthLevel: player.strengthLevel,
      weaknessNotes: player.weaknessNotes || "",
    });
    setIsOpen(true);
  };

  const onOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setTimeout(() => {
        setEditingPlayer(null);
        form.reset({ name: "", role: "Runner", specialSkill: "", strengthLevel: 5, weaknessNotes: "" });
      }, 200);
    }
  };

  const onSubmit = (values: any) => {
    if (editingPlayer) {
      updatePlayer({ id: editingPlayer.id, data: values }, { onSuccess: () => setIsOpen(false) });
    } else {
      createPlayer(values, { onSuccess: () => setIsOpen(false) });
    }
  };

  const filteredPlayers = players?.filter(p => filter === "All" || p.role === filter) || [];

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black">Roster Management</h1>
          <p className="text-muted-foreground mt-1">Add and manage your team athletes.</p>
        </div>

        <Dialog open={isOpen} onOpenChange={onOpenChange}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-white rounded-xl shadow-lg shadow-primary/20 hover-elevate">
              <Plus className="w-5 h-5 mr-2" /> Add Player
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black">{editingPlayer ? 'Edit Player' : 'New Player Registration'}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="uppercase text-xs font-bold tracking-widest text-muted-foreground">Full Name</FormLabel>
                    <FormControl><Input placeholder="e.g. Rahul Kumar" className="bg-muted border-0 h-12 rounded-xl" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="role" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="uppercase text-xs font-bold tracking-widest text-muted-foreground">Primary Role</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-muted border-0 h-12 rounded-xl"><SelectValue placeholder="Select role" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Runner">Runner</SelectItem>
                          <SelectItem value="Chaser">Chaser</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="specialSkill" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="uppercase text-xs font-bold tracking-widest text-muted-foreground">Special Skill</FormLabel>
                      <FormControl><Input placeholder="e.g. Pole Dive" className="bg-muted border-0 h-12 rounded-xl" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <FormField control={form.control} name="strengthLevel" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="uppercase text-xs font-bold tracking-widest text-muted-foreground flex justify-between">
                      <span>Strength Level</span>
                      <span className="text-primary">{field.value}/10</span>
                    </FormLabel>
                    <FormControl>
                      <div className="py-2">
                        <Slider 
                          min={1} max={10} step={1} 
                          value={[field.value]} 
                          onValueChange={(v) => field.onChange(v[0])}
                          className="py-2"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="weaknessNotes" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="uppercase text-xs font-bold tracking-widest text-muted-foreground">Areas for Improvement</FormLabel>
                    <FormControl><Textarea placeholder="What needs work?" className="bg-muted border-0 rounded-xl resize-none" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <Button type="submit" disabled={isCreating || isUpdating} className="w-full h-12 rounded-xl font-bold text-lg mt-4">
                  {isCreating || isUpdating ? "Saving..." : "Save Athlete"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-2">
        {["All", "Runner", "Chaser"].map(f => (
          <Button 
            key={f} 
            variant={filter === f ? "default" : "outline"}
            onClick={() => setFilter(f as any)}
            className="rounded-full px-6 transition-all"
          >
            {f}s
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-48 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredPlayers.map((player) => (
              <motion.div
                key={player.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="bg-card overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-border rounded-2xl group">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <Badge variant="secondary" className="mb-2 text-xs font-bold tracking-widest uppercase bg-secondary text-secondary-foreground">{player.role}</Badge>
                        <h3 className="text-2xl font-black text-foreground leading-none">{player.name}</h3>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => openEdit(player)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => deletePlayer(player.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-xs font-bold text-muted-foreground uppercase mb-1">
                          <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> Skill</span>
                        </div>
                        <p className="text-sm font-medium">{player.specialSkill}</p>
                      </div>
                      
                      <div>
                        <div className="flex justify-between text-xs font-bold text-muted-foreground uppercase mb-1">
                          <span className="flex items-center gap-1"><Activity className="w-3 h-3" /> Strength</span>
                          <span className="text-primary">{player.strengthLevel}/10</span>
                        </div>
                        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${(player.strengthLevel / 10) * 100}%` }} />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
          {filteredPlayers.length === 0 && (
            <div className="col-span-full py-12 text-center text-muted-foreground bg-muted/30 rounded-2xl border border-dashed border-border">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p className="text-lg">No players found in this category.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
