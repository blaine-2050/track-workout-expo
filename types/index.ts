export interface Move {
  id: string;
  name: string;
  sortOrder: number;
}

export interface LogEntry {
  id: string;
  moveId: string;
  weight: number;
  reps: number;
  timestamp: string;
  durationSeconds?: number;
  measurementType?: 'weight' | 'duration';
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

export interface User {
  id: string;
  email: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}
