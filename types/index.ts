// Type system aligned with track-workout-core DATA_MODEL.md v2.1.
// Changes from v1:
// - Move: + measurementType, + isCustom
// - LogEntry: + moveName (always populated), + notes, measurementType expanded
// - HeartRateSample: new entity
// - MeasurementType: 'strength' | 'duration' | 'note_only'

export type MeasurementType = 'strength' | 'duration' | 'note_only';

export interface Move {
  id: string;
  name: string;
  sortOrder: number;
  /** 'strength' = weight+reps, 'duration' = timed segment, 'note_only' = just a note */
  measurementType: MeasurementType;
  /** true for user-created moves (not from the seed catalog) */
  isCustom: boolean;
}

export interface LogEntry {
  id: string;
  moveId: string;
  /** Always populated. Mirrors Move.name if moveId is set; otherwise the user's typed string. */
  moveName: string;
  weight: number;
  reps: number;
  timestamp: string;
  measurementType: MeasurementType;
  /** Free-form text up to ~1000 chars. Optional on every entry. */
  notes?: string;
  durationSeconds?: number;
  startedAt?: string;
  endedAt?: string;
  workoutId?: string;
  weightUnit?: string;
}

export interface Workout {
  id: string;
  startTime: string;
  endTime?: string;
}

export interface HeartRateSample {
  id: string;
  userId?: string;
  workoutId?: string;
  timestamp: string;
  bpm: number;
  rrIntervalMs?: number;
  elevationMeters?: number;
  speedKmh?: number;
  distanceKm?: number;
  source: string;
  importBatchId?: string;
}

export interface User {
  id: string;
  email: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}
