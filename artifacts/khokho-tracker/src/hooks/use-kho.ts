import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as storage from "@/lib/storage";
import { Player, SpeedEntry, TrainingLog, MatchRecord } from "@/lib/schema";
import { useToast } from "@/hooks/use-toast";

export const KEYS = {
  PLAYERS: ["players"],
  SPEED: (id?: string) => ["speed", id],
  TRAINING: (id?: string) => ["training", id],
  MATCHES: (id?: string) => ["matches", id],
};

export function usePlayers() {
  return useQuery({
    queryKey: KEYS.PLAYERS,
    queryFn: storage.getPlayers,
  });
}

export function useCreatePlayer() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: storage.createPlayer,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.PLAYERS });
      toast({ title: "Player added", description: "New team member successfully registered." });
    }
  });
}

export function useUpdatePlayer() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: ({ id, data }: { id: string, data: Partial<Player> }) => storage.updatePlayer(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.PLAYERS });
      toast({ title: "Player updated", description: "Changes saved successfully." });
    }
  });
}

export function useDeletePlayer() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: storage.deletePlayer,
    onSuccess: () => {
      qc.invalidateQueries(); // invalidate all since it cascades
      toast({ title: "Player deleted", variant: "destructive" });
    }
  });
}

export function useSpeed(playerId?: string) {
  return useQuery({
    queryKey: KEYS.SPEED(playerId),
    queryFn: () => storage.getSpeedEntries(playerId),
  });
}

export function useCreateSpeed() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: storage.createSpeedEntry,
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: KEYS.SPEED(variables.playerId) });
      qc.invalidateQueries({ queryKey: KEYS.SPEED() });
      toast({ title: "Speed logged", description: "New timing entry saved." });
    }
  });
}

export function useTraining(playerId?: string) {
  return useQuery({
    queryKey: KEYS.TRAINING(playerId),
    queryFn: () => storage.getTrainingLogs(playerId),
  });
}

export function useCreateTraining() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: storage.createTrainingLog,
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: KEYS.TRAINING(vars.playerId) });
      qc.invalidateQueries({ queryKey: KEYS.TRAINING() });
      toast({ title: "Training logged", description: "Practice session recorded." });
    }
  });
}

export function useMatches(playerId?: string) {
  return useQuery({
    queryKey: KEYS.MATCHES(playerId),
    queryFn: () => storage.getMatches(playerId),
  });
}

export function useCreateMatch() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: storage.createMatchRecord,
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: KEYS.MATCHES(vars.playerId) });
      qc.invalidateQueries({ queryKey: KEYS.MATCHES() });
      toast({ title: "Match recorded", description: "Match statistics saved." });
    }
  });
}

export function useLoadDemoData() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: storage.loadDemoData,
    onSuccess: () => {
      qc.invalidateQueries();
      toast({ title: "Demo data loaded", description: "Dashboard is now populated with sample data." });
    }
  });
}
