# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Single main app: **Kho-Kho Champion Tracker** powered by Firebase.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **Frontend**: React + Vite + Tailwind CSS + shadcn/ui
- **Auth + Database**: Firebase (Authentication + Firestore)
- **Charts**: Chart.js + react-chartjs-2
- **Animations**: framer-motion

## Main App

### `artifacts/khokho-tracker` — Kho-Kho Champion Tracker (previewPath: `/`)

Full-featured multi-user Kho-Kho team tracking app with Firebase Auth and Firestore.

**Auth:**
- Email/Password login via Firebase Authentication
- Coach email: `anuragkumar.pandit2000@gmail.com` → Full Coach Dashboard
- Any other email → Player view only

**Player Features:**
- Daily Training Entry (running, sprints, skill, match, fouls, energy, sleep, exercise, notes)
- Point system: +5 per completed activity (max 40 pts/day)
- My Progress: Chart.js graphs (daily score, running, sprints, 80m speed)
- Leaderboard: 🥇🥈🥉 medals + full rankings by total score

**Coach Features (admin only):**
- Coach Dashboard: all players, who skipped today, best/weak performer, high fouls, team score chart
- Strategy Generator: recommended Chaser/Runner, Aggressive/Balanced/Defensive team strategy
- Smart analysis & suggestions per player

**Dev command:** `PORT=18462 BASE_PATH=/ pnpm --filter @workspace/khokho-tracker run dev`

## Structure

```
artifacts/
  khokho-tracker/     # Main app (React + Vite + Firebase)
    src/
      firebase.ts           # Firebase config + COACH_EMAIL
      contexts/
        AuthContext.tsx     # Firebase auth provider
      pages/
        Login.tsx           # Email/password login + register
        PlayerDashboard.tsx # Player home (stats, suggestions, recent entries)
        DailyEntry.tsx      # Daily training form + point calculator
        MyProgress.tsx      # Chart.js progress graphs + 80m speed logger
        Leaderboard.tsx     # Rankings with medal UI
        CoachDashboard.tsx  # Full team analytics (coach only)
        StrategyPage.tsx    # Team strategy + role suggestions (coach only)
      components/
        layoutui/
          app-shell.tsx     # Sidebar nav (coach/player aware) + header
          theme-toggle.tsx  # Dark/light mode toggle
      lib/
        points.ts           # Daily score calculator + motivational messages
        analysis.ts         # Player stats analysis + suggestions
        strategy.ts         # Chaser/Runner/Strategy logic
artifacts/
  api-server/         # Legacy Express API (unused, can be removed)
  mockup-sandbox/     # Design sandbox (canvas use only)
```

## Firebase Collections (Firestore)

- `users/{uid}` — `{ name, email, totalScore, createdAt }`
- `training/{id}` — `{ uid, name, date, running, sprintRounds, skillPracticed, matchPlayed, foulsCommitted, energyLevel, sleepHours, exercise, exerciseDuration, practiceAtHome, notes, dailyScore, createdAt }`
- `speed/{id}` — `{ uid, name, date, timeInSeconds, createdAt }`
