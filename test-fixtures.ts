/**
 * Test fixtures for Track Workout React Native
 *
 * Rules:
 * - move: must be a string
 * - weight: stored as int, displayed as decimal with 1 digit
 * - reps: int > 0
 * - timestamps: increasing across the workout
 */

import { Move, LogEntry, User } from './types';

// Standard moves used across all platforms (alphabetically sorted by name)
export const MOCK_MOVES: Move[] = [
  { id: 'move-01', name: 'Bench Press', sortOrder: 0 },
  { id: 'move-02', name: 'Bent Over Row', sortOrder: 1 },
  { id: 'move-03', name: 'Deadlift', sortOrder: 2 },
  { id: 'move-04', name: 'Elipitical', sortOrder: 3 },
  { id: 'move-05', name: 'Incline DB Press', sortOrder: 4 },
  { id: 'move-06', name: 'Lat Pull Down', sortOrder: 5 },
  { id: 'move-07', name: 'Leg Press', sortOrder: 6 },
  { id: 'move-08', name: 'Military DB Press', sortOrder: 7 },
  { id: 'move-09', name: 'MTB', sortOrder: 8 },
  { id: 'move-10', name: 'Single Arm Snatch', sortOrder: 9 },
  { id: 'move-11', name: 'Split Squat', sortOrder: 10 },
  { id: 'move-12', name: 'Squat', sortOrder: 11 },
  { id: 'move-13', name: 'Treadmill', sortOrder: 12 },
];

// Map move names to IDs for convenience
export const MOVE_ID_MAP: Record<string, string> = MOCK_MOVES.reduce(
  (acc, move) => ({ ...acc, [move.name]: move.id }),
  {}
);

// Mock user for development
export const MOCK_USER: User = { id: 'test-user-001', email: 'dev@test.com' };
export const MOCK_TOKEN = 'mock-token-for-development';

// Sample workout session data
// Format: [moveName, weight (as int), reps]
const SAMPLE_WORKOUT_RAW: [string, number, number][] = [
  ['Bench Press', 110, 10],
  ['Bench Press', 150, 5],
  ['Bench Press', 150, 2],
  ['Single Arm Snatch', 2, 10],
  ['Single Arm Snatch', 4, 10],
  ['Single Arm Snatch', 8, 1],
  ['Incline DB Press', 30, 10],
  ['Incline DB Press', 40, 4],
  ['Incline DB Press', 50, 2],
  ['Military DB Press', 50, 2],
  ['Squat', 200, 5],
  ['Split Squat', 50, 12],
  ['Split Squat', 50, 10],
  ['Split Squat', 50, 8],
  ['Split Squat', 50, 4],
  ['Deadlift', 250, 1],
  ['Lat Pull Down', 50, 30],
  ['Lat Pull Down', 80, 10],
  ['Lat Pull Down', 130, 5],
  ['Bent Over Row', 50, 10],
  ['Leg Press', 150, 20],
  ['Leg Press', 170, 10],
  ['Leg Press', 190, 5],
  ['Leg Press', 210, 2],
];

// Generate log entries with increasing timestamps
// Start time: 2024-01-15 06:00:00 UTC
// Each entry 2 minutes apart
const BASE_TIMESTAMP = new Date('2024-01-15T06:00:00Z');
const INTERVAL_MS = 2 * 60 * 1000; // 2 minutes

export const MOCK_LOG_ENTRIES: LogEntry[] = SAMPLE_WORKOUT_RAW.map(
  ([moveName, weight, reps], index) => ({
    id: `log-${String(index + 1).padStart(3, '0')}`,
    moveId: MOVE_ID_MAP[moveName],
    weight,
    reps,
    measurementType: 'weight',
    timestamp: new Date(BASE_TIMESTAMP.getTime() + index * INTERVAL_MS).toISOString(),
  })
);

// Validation helpers
export function isValidWeight(weight: number): boolean {
  return Number.isInteger(weight) && weight >= 0;
}

export function isValidReps(reps: number): boolean {
  return Number.isInteger(reps) && reps > 0;
}

export function formatWeight(weight: number): string {
  return weight.toFixed(1);
}

// For testing: get a subset of entries (most recent first)
export function getRecentEntries(count: number = 10): LogEntry[] {
  return MOCK_LOG_ENTRIES.slice(-count).reverse();
}

// Get move name by ID
export function getMoveName(moveId: string): string {
  const move = MOCK_MOVES.find((m) => m.id === moveId);
  return move?.name ?? 'Unknown';
}
