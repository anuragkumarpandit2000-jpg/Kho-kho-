import { v4 as uuidv4 } from "uuid";
import { Player, SpeedEntry, TrainingLog, MatchRecord } from "./schema";

const KEYS = {
  PLAYERS: "kk_players",
  SPEED: "kk_speed_entries",
  TRAINING: "kk_training_logs",
  MATCHES: "kk_matches",
};

// Helper to simulate network latency
const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

const getItem = <T>(key: string): T[] => {
  const data = localStorage.getItem(key);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
};

const setItem = <T>(key: string, data: T[]) => {
  localStorage.setItem(key, JSON.stringify(data));
};

// PLAYERS
export const getPlayers = async (): Promise<Player[]> => {
  await delay();
  return getItem<Player>(KEYS.PLAYERS).sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
};

export const createPlayer = async (data: Omit<Player, "id" | "createdAt">): Promise<Player> => {
  await delay();
  const players = getItem<Player>(KEYS.PLAYERS);
  const newPlayer: Player = {
    ...data,
    id: uuidv4(),
    createdAt: new Date().toISOString(),
  };
  setItem(KEYS.PLAYERS, [newPlayer, ...players]);
  return newPlayer;
};

export const updatePlayer = async (id: string, data: Partial<Player>): Promise<Player> => {
  await delay();
  const players = getItem<Player>(KEYS.PLAYERS);
  const index = players.findIndex(p => p.id === id);
  if (index === -1) throw new Error("Player not found");
  
  players[index] = { ...players[index], ...data };
  setItem(KEYS.PLAYERS, players);
  return players[index];
};

export const deletePlayer = async (id: string): Promise<void> => {
  await delay();
  const players = getItem<Player>(KEYS.PLAYERS);
  setItem(KEYS.PLAYERS, players.filter(p => p.id !== id));
  
  // Cascade delete related records
  setItem(KEYS.SPEED, getItem<SpeedEntry>(KEYS.SPEED).filter(e => e.playerId !== id));
  setItem(KEYS.TRAINING, getItem<TrainingLog>(KEYS.TRAINING).filter(e => e.playerId !== id));
  setItem(KEYS.MATCHES, getItem<MatchRecord>(KEYS.MATCHES).filter(e => e.playerId !== id));
};

// SPEED
export const getSpeedEntries = async (playerId?: string): Promise<SpeedEntry[]> => {
  await delay();
  let entries = getItem<SpeedEntry>(KEYS.SPEED);
  if (playerId) entries = entries.filter(e => e.playerId === playerId);
  return entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

export const createSpeedEntry = async (data: Omit<SpeedEntry, "id">): Promise<SpeedEntry> => {
  await delay();
  const entries = getItem<SpeedEntry>(KEYS.SPEED);
  const newEntry = { ...data, id: uuidv4() };
  setItem(KEYS.SPEED, [...entries, newEntry]);
  return newEntry;
};

// TRAINING
export const getTrainingLogs = async (playerId?: string): Promise<TrainingLog[]> => {
  await delay();
  let logs = getItem<TrainingLog>(KEYS.TRAINING);
  if (playerId) logs = logs.filter(l => l.playerId === playerId);
  return logs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const createTrainingLog = async (data: Omit<TrainingLog, "id">): Promise<TrainingLog> => {
  await delay();
  const logs = getItem<TrainingLog>(KEYS.TRAINING);
  const newLog = { ...data, id: uuidv4() };
  setItem(KEYS.TRAINING, [newLog, ...logs]);
  return newLog;
};

// MATCHES
export const getMatches = async (playerId?: string): Promise<MatchRecord[]> => {
  await delay();
  let matches = getItem<MatchRecord>(KEYS.MATCHES);
  if (playerId) matches = matches.filter(m => m.playerId === playerId);
  return matches.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const createMatchRecord = async (data: Omit<MatchRecord, "id">): Promise<MatchRecord> => {
  await delay();
  const matches = getItem<MatchRecord>(KEYS.MATCHES);
  const newMatch = { ...data, id: uuidv4() };
  setItem(KEYS.MATCHES, [newMatch, ...matches]);
  return newMatch;
};

export const loadDemoData = async () => {
  await delay();
  const p1 = uuidv4();
  const p2 = uuidv4();
  const p3 = uuidv4();

  const players: Player[] = [
    { id: p1, name: "Rahul Kumar", role: "Chaser", specialSkill: "Pole Dive", strengthLevel: 9, weaknessNotes: "Endurance", createdAt: new Date().toISOString() },
    { id: p2, name: "Amit Singh", role: "Runner", specialSkill: "Dodge & Fake", strengthLevel: 8, weaknessNotes: "Cornering", createdAt: new Date().toISOString() },
    { id: p3, name: "Vikram Patil", role: "Chaser", specialSkill: "Sudden Sprint", strengthLevel: 7, weaknessNotes: "Fouls frequently", createdAt: new Date().toISOString() }
  ];

  const today = new Date();
  const speed: SpeedEntry[] = [];
  const training: TrainingLog[] = [];
  const matches: MatchRecord[] = [];

  for (let i = 10; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const ds = d.toISOString().split('T')[0];
    
    speed.push({ id: uuidv4(), playerId: p1, date: ds, timeInSeconds: 12 + Math.random() * 2 });
    speed.push({ id: uuidv4(), playerId: p2, date: ds, timeInSeconds: 11 + Math.random() * 1.5 });
    
    training.push({ id: uuidv4(), playerId: p1, date: ds, runningMinutes: 30, sprintRounds: 10, practiceDuration: 60 });
  }

  matches.push({ id: uuidv4(), playerId: p1, date: today.toISOString().split('T')[0], totalOuts: 4, foulsCommitted: 1, successfulChases: 3 });
  matches.push({ id: uuidv4(), playerId: p2, date: today.toISOString().split('T')[0], totalOuts: 0, foulsCommitted: 0, successfulChases: 5 });

  setItem(KEYS.PLAYERS, players);
  setItem(KEYS.SPEED, speed);
  setItem(KEYS.TRAINING, training);
  setItem(KEYS.MATCHES, matches);
};
