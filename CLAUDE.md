# CLAUDE.md — track-workout-expo

## What this is
Cross-platform implementation of Track Workout using Expo (React Native). Targets **iOS and Android** from a single TypeScript codebase.

## Tool + platforms
Expo (managed workflow) + React Native + TypeScript. iOS + Android.

## Delegates to

| What | Where | How |
|------|-------|-----|
| **Behavior spec** | [track-workout-core](https://github.com/blaine-2050/track-workout-core) | Fetch `PRD.md`, `DATA_MODEL.md`, `WORKOUT_SCRIPTS/` before non-trivial work. Spec wins on disagreements unless a local decision is recorded here. |
| **Sync server** | [track-workout-api](https://github.com/blaine-2050/track-workout-api) | Opt-in `POST /sync/events` with API key. Disabled by default. |
| **HR data (CSV)** | [body-metrics](../body-metrics/) | `fit_to_csv.py` converts vendor FIT → CSV. This app imports the normalized CSV. |
| **HR data (BLE)** | [ble](../ble/) | Future. Direct Polar H10 integration. |

## Spec conformance (v2.1 gaps)

This app was feature-complete against spec **v1** as of 2026-02-26. The v2/v2.1 spec changes are NOT yet implemented here:

| Feature | Status |
|---------|--------|
| Strength logging (weight + reps + sticky) | ✅ v1 |
| Workout lifecycle (start, stop, summary) | ✅ v1 |
| Interval entry (HH:MM:SS) | ✅ v1 |
| CSV export | ✅ v1 |
| Move.measurementType on schema | ✅ v2 (feat/data-model-v2) |
| LogEntry.moveName, LogEntry.notes | ✅ v2 (feat/data-model-v2) |
| HeartRateSample type | ✅ v2 (feat/data-model-v2) |
| Free-form move names (+ new move) | ✅ v2 (feat/free-form-moves) |
| Cardio tap-start / tap-stop | ✅ v2 (feat/cardio-tap-start) |
| Notes on entries | ✅ v2 (feat/notes) |
| note_only entries | ✅ v2 (feat/notes) |
| Settings (sync opt-in, endpoint, API key) | ✅ v2 (feat/settings-sync-opt-in) |
| HR CSV import (demo fixture) | ✅ v2.1 (feat/hr-import) |
| HR CSV file-picker import | ✅ v2.1 (fix/remaining-gaps) |
| Sync gated behind toggle at runtime | ✅ v2.1 (fix/remaining-gaps) |

## Stack
- **Framework**: Expo (managed workflow)
- **Language**: TypeScript
- **State**: React useState
- **Storage**: AsyncStorage (auth token); local state for workout entries
- **Build**: `npx expo start`, `npx expo run:android`, `npx expo run:ios`

## Project structure
```
track-workout-expo/
├── App.tsx                 # Entry + navigation
├── components/
│   ├── WorkoutScreen.tsx   # Main screen (strength + interval entry)
│   ├── NumericKeypad.tsx
│   ├── MoveSelector.tsx
│   ├── IntervalEntry.tsx
│   ├── EventHistory.tsx
│   ├── WorkoutStatusBar.tsx
│   └── AuthScreen.tsx
├── types/index.ts          # Move, LogEntry, Workout types
├── utils/formatElapsed.ts
├── hooks/useAuth.ts
├── api/client.ts           # Sync client (API server)
├── test-fixtures.ts        # Mock data for offline testing
├── app.json                # Expo config
├── package.json
└── tsconfig.json
```

## Development
```bash
npm install
npx expo start                # Dev server (QR code for Expo Go)
npx expo run:android          # Native Android build
npx expo run:ios              # Native iOS build
```

## Conventions
- This repo mirrors the same delegation pattern as `track-workout-swift`: behavior comes from `track-workout-core`, sync goes to `track-workout-api`, HR data comes from `body-metrics`.
- When implementing a v2 feature, read the relevant core spec first. The Swift app is a reference implementation but NOT the spec — the spec is in `track-workout-core`.
- Test flows live in `runs/flows/` (Maestro YAML) when added. Use the same naming conventions as the Swift repo.
