import AsyncStorage from '@react-native-async-storage/async-storage';
import { Move, LogEntry, AuthResponse, Workout, MeasurementType } from '../types';
import {
  MOCK_MOVES,
  MOCK_USER,
  MOCK_TOKEN,
  MOCK_LOG_ENTRIES,
  MOVE_ID_MAP,
} from '../test-fixtures';

const API_BASE = 'http://localhost:3000';
const TOKEN_KEY = 'auth_token';
const WORKOUTS_KEY = 'workouts';
const ENTRIES_KEY = 'log_entries';

// Mutable copy of mock log entries for development
let mockLogEntries: LogEntry[] = [...MOCK_LOG_ENTRIES];
let mockWorkouts: Workout[] = [];

export async function isApiAvailable(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    const response = await fetch(`${API_BASE}/health`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response.ok;
  } catch {
    return false;
  }
}

async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options?.headers,
    },
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Request failed: ${response.status}`);
  }
  return response.json();
}

// Token management
export async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function setToken(token: string): Promise<void> {
  await AsyncStorage.setItem(TOKEN_KEY, token);
}

export async function clearToken(): Promise<void> {
  await AsyncStorage.removeItem(TOKEN_KEY);
}

// Auth
export async function login(email: string, password: string): Promise<AuthResponse> {
  if (await isApiAvailable()) {
    const response = await apiRequest<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    await setToken(response.token);
    return response;
  }
  console.warn('API unavailable, using mock auth');
  await setToken(MOCK_TOKEN);
  return { token: MOCK_TOKEN, user: MOCK_USER };
}

export async function register(email: string, password: string): Promise<AuthResponse> {
  if (await isApiAvailable()) {
    const response = await apiRequest<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    await setToken(response.token);
    return response;
  }
  console.warn('API unavailable, using mock auth');
  await setToken(MOCK_TOKEN);
  return { token: MOCK_TOKEN, user: MOCK_USER };
}

export async function logout(): Promise<void> {
  await clearToken();
}

// Moves
export async function getMoves(): Promise<Move[]> {
  if (await isApiAvailable()) {
    return apiRequest<Move[]>('/moves');
  }
  console.warn('API unavailable, using mock moves');
  return [...MOCK_MOVES].sort((a, b) => a.name.localeCompare(b.name));
}

// Log Entries
export async function getLogEntries(): Promise<LogEntry[]> {
  if (await isApiAvailable()) {
    return apiRequest<LogEntry[]>('/log');
  }
  console.warn('API unavailable, using mock log entries');
  return [...mockLogEntries].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

interface LogEntryPayload {
  measurementType?: MeasurementType;
  moveName?: string;
  weight?: number;
  reps?: number;
  durationSeconds?: number;
  startedAt?: string;
  endedAt?: string;
  workoutId?: string;
  weightUnit?: string;
  notes?: string;
}

export async function createLogEntry(
  moveId: string,
  payload: LogEntryPayload
): Promise<LogEntry> {
  const measurementType = payload.measurementType ?? 'strength';
  const weight = payload.weight ?? 0;
  const reps = payload.reps ?? 0;
  const durationSeconds = payload.durationSeconds ?? 0;

  if (await isApiAvailable()) {
    return apiRequest<LogEntry>('/log', {
      method: 'POST',
      body: JSON.stringify({ moveId, weight, reps, durationSeconds, measurementType }),
    });
  }
  console.warn('API unavailable, using mock log entry');
  const entry: LogEntry = {
    id: `mock-entry-${Date.now()}`,
    moveId,
    moveName: payload.moveName ?? 'Unknown',
    weight,
    reps,
    durationSeconds,
    measurementType,
    timestamp: new Date().toISOString(),
    startedAt: payload.startedAt,
    endedAt: payload.endedAt,
    workoutId: payload.workoutId,
    weightUnit: payload.weightUnit,
    notes: payload.notes,
  };
  mockLogEntries.push(entry);
  return entry;
}

export async function updateLogEntry(
  entryId: string,
  updates: Partial<LogEntry>
): Promise<void> {
  const idx = mockLogEntries.findIndex((e) => e.id === entryId);
  if (idx !== -1) {
    mockLogEntries[idx] = { ...mockLogEntries[idx], ...updates };
  }
}

// Workouts
export async function getWorkouts(): Promise<Workout[]> {
  return [...mockWorkouts];
}

export async function createWorkout(): Promise<Workout> {
  const workout: Workout = {
    id: `workout-${Date.now()}`,
    startTime: new Date().toISOString(),
  };
  mockWorkouts.push(workout);
  return workout;
}

export async function endWorkout(workoutId: string): Promise<Workout | null> {
  const idx = mockWorkouts.findIndex((w) => w.id === workoutId);
  if (idx !== -1) {
    mockWorkouts[idx] = { ...mockWorkouts[idx], endTime: new Date().toISOString() };
    return mockWorkouts[idx];
  }
  return null;
}
