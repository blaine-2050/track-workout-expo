/**
 * HR CSV parser + time-window alignment.
 * Mirrors track-workout-swift/Importers/HRImporter.swift logic.
 *
 * CSV schema: track-workout-core DATA_MODEL.md § CSV Import Schema
 * Required columns: timestamp, heart_rate_bpm
 * Optional: elevation_m, speed_kmh, distance_km
 */

import { HeartRateSample, Workout } from '../types';

export interface HRImportResult {
  batchId: string;
  parsed: number;
  skipped: number;
  persisted: number;
  aligned: number;
  source: string;
}

function parseISODate(s: string): Date | null {
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function generateId(): string {
  return `hr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function parseHRCSV(csv: string): { samples: Omit<HeartRateSample, 'id' | 'source' | 'importBatchId'>[]; skipped: number } {
  const lines = csv.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return { samples: [], skipped: 0 };

  const headers = lines[0]!.split(',').map((h) => h.trim().toLowerCase());
  const tsIdx = headers.indexOf('timestamp');
  const bpmIdx = headers.indexOf('heart_rate_bpm');
  if (tsIdx === -1 || bpmIdx === -1) return { samples: [], skipped: lines.length - 1 };

  const elIdx = headers.indexOf('elevation_m');
  const spIdx = headers.indexOf('speed_kmh');
  const dsIdx = headers.indexOf('distance_km');

  const samples: Omit<HeartRateSample, 'id' | 'source' | 'importBatchId'>[] = [];
  let skipped = 0;

  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i]!.split(',').map((c) => c.trim());
    const ts = parseISODate(cells[tsIdx] ?? '');
    const bpmStr = cells[bpmIdx] ?? '';
    const bpm = parseInt(bpmStr, 10);

    if (!ts || isNaN(bpm) || bpm <= 0) {
      skipped++;
      continue;
    }

    samples.push({
      timestamp: ts.toISOString(),
      bpm,
      elevationMeters: elIdx >= 0 ? parseFloat(cells[elIdx] ?? '') || undefined : undefined,
      speedKmh: spIdx >= 0 ? parseFloat(cells[spIdx] ?? '') || undefined : undefined,
      distanceKm: dsIdx >= 0 ? parseFloat(cells[dsIdx] ?? '') || undefined : undefined,
    });
  }

  return { samples, skipped };
}

export function alignAndPersist(
  parsed: Omit<HeartRateSample, 'id' | 'source' | 'importBatchId'>[],
  source: string,
  workouts: Workout[],
): { result: HRImportResult; samples: HeartRateSample[] } {
  const batchId = generateId();
  const samples: HeartRateSample[] = [];
  let aligned = 0;

  for (const p of parsed) {
    const ts = new Date(p.timestamp).getTime();
    const matchingWorkout = workouts.find((w) => {
      const start = new Date(w.startTime).getTime();
      const end = w.endTime ? new Date(w.endTime).getTime() : Date.now();
      return ts >= start && ts <= end;
    });

    const sample: HeartRateSample = {
      id: generateId(),
      ...p,
      source,
      importBatchId: batchId,
      workoutId: matchingWorkout?.id,
    };
    samples.push(sample);
    if (matchingWorkout) aligned++;
  }

  return {
    result: {
      batchId,
      parsed: parsed.length,
      skipped: 0,
      persisted: samples.length,
      aligned,
      source,
    },
    samples,
  };
}

/** Generate a synthetic 60-sample CSV ending at now (for testing). */
export function syntheticHRCSV(seconds = 60): string {
  const lines = ['timestamp,heart_rate_bpm,elevation_m,speed_kmh,distance_km'];
  const now = Date.now();
  for (let i = 0; i < seconds; i++) {
    const ts = new Date(now - (seconds - i) * 1000).toISOString();
    const bpm = 120 + Math.floor((i / Math.max(1, seconds - 1)) * 15);
    const el = (100 + Math.sin(i / 10) * 1.2).toFixed(2);
    const sp = '5.00';
    const dist = ((i + 1) * (5 / 3600)).toFixed(4);
    lines.push(`${ts},${bpm},${el},${sp},${dist}`);
  }
  return lines.join('\n');
}
