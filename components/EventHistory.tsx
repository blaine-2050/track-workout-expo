import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { LogEntry, Move, Workout } from '../types';
import { formatElapsed, formatTime } from '../utils/formatElapsed';

interface EventHistoryProps {
  entries: LogEntry[];
  moves: Move[];
  workouts: Workout[];
  isRefreshing: boolean;
  onRefresh: () => void;
}

interface EntrySet {
  moveId: string;
  moveName: string;
  setNumber: number;
  entries: LogEntry[];
  firstTimestamp: string;
}

interface WorkoutGroup {
  workout: Workout | null; // null for unlinked entries
  sets: EntrySet[];
}

function getMoveNameById(moves: Move[], moveId: string): string {
  const move = moves.find((m) => m.id === moveId);
  return move?.name || 'Unknown';
}

function groupEntriesIntoSets(entries: LogEntry[], moves: Move[]): EntrySet[] {
  if (entries.length === 0) return [];

  // entries should be in chronological order (oldest first) for grouping
  const chronological = [...entries].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const sets: EntrySet[] = [];
  let currentSet: EntrySet | null = null;
  let setCounter = 0;

  for (const entry of chronological) {
    if (!currentSet || currentSet.moveId !== entry.moveId) {
      setCounter++;
      currentSet = {
        moveId: entry.moveId,
        moveName: getMoveNameById(moves, entry.moveId),
        setNumber: setCounter,
        entries: [entry],
        firstTimestamp: entry.timestamp,
      };
      sets.push(currentSet);
    } else {
      currentSet.entries.push(entry);
    }
  }

  // Reverse entries within each set so newest is first
  for (const set of sets) {
    set.entries.reverse();
  }

  // Return sets in reverse order (newest set first)
  return sets.reverse();
}

function buildWorkoutGroups(
  entries: LogEntry[],
  moves: Move[],
  workouts: Workout[]
): WorkoutGroup[] {
  const groups: WorkoutGroup[] = [];

  // Group by workoutId
  const workoutMap = new Map<string, LogEntry[]>();
  const unlinked: LogEntry[] = [];

  for (const entry of entries) {
    if (entry.workoutId) {
      const list = workoutMap.get(entry.workoutId) ?? [];
      list.push(entry);
      workoutMap.set(entry.workoutId, list);
    } else {
      unlinked.push(entry);
    }
  }

  // Sort workouts newest first
  const sortedWorkouts = [...workouts].sort(
    (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
  );

  for (const workout of sortedWorkouts) {
    const wEntries = workoutMap.get(workout.id) ?? [];
    if (wEntries.length === 0) continue;
    groups.push({
      workout,
      sets: groupEntriesIntoSets(wEntries, moves),
    });
  }

  // Unlinked entries (legacy / no workout)
  if (unlinked.length > 0) {
    groups.push({
      workout: null,
      sets: groupEntriesIntoSets(unlinked, moves),
    });
  }

  return groups;
}

export function EventHistory({
  entries,
  moves,
  workouts,
  isRefreshing,
  onRefresh,
}: EventHistoryProps) {
  const [now, setNow] = useState(new Date());

  // Tick every second so live elapsed times update
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const groups = buildWorkoutGroups(entries, moves, workouts);

  if (entries.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>History</Text>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No workout entries yet</Text>
          <Text style={styles.emptySubtext}>Log your first exercise to get started</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>History</Text>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      >
        {groups.map((group, gi) => (
          <View key={group.workout?.id ?? `unlinked-${gi}`} style={styles.workoutGroup}>
            {/* Workout header */}
            {group.workout ? (
              <View style={styles.workoutHeader}>
                <Text style={styles.workoutTitle}>
                  Workout {formatTime(new Date(group.workout.startTime))}
                </Text>
                {group.workout.endTime && (
                  <Text style={styles.workoutDuration}>
                    {formatElapsed(group.workout.startTime, group.workout.endTime, now)}
                  </Text>
                )}
              </View>
            ) : (
              <View style={styles.workoutHeader}>
                <Text style={styles.workoutTitle}>Previous Entries</Text>
              </View>
            )}

            {/* Workout summary (if ended) */}
            {group.workout?.endTime && (
              <WorkoutSummary group={group} now={now} />
            )}

            {/* Sets */}
            {group.sets.map((set, si) => (
              <View key={`set-${si}`} style={styles.setContainer}>
                <View style={styles.setHeader}>
                  <Text style={styles.setTitle}>
                    Set {set.setNumber} — {set.moveName}
                  </Text>
                  <Text style={styles.setTime}>
                    {formatTime(new Date(set.firstTimestamp))}
                  </Text>
                </View>
                {set.entries.map((entry) => (
                  <View key={entry.id} style={styles.entryRow}>
                    <View style={styles.entryLeft}>
                      {entry.measurementType === 'note_only' ? (
                        <Text style={styles.entryText}>📝 Note</Text>
                      ) : entry.durationSeconds !== undefined && entry.measurementType === 'duration' ? (
                        <Text style={styles.entryText}>
                          Duration: {formatDurationHMS(entry.durationSeconds)}
                        </Text>
                      ) : (
                        <Text style={styles.entryText}>
                          {entry.weight} x {entry.reps} = {entry.weight * entry.reps}
                        </Text>
                      )}
                      {entry.notes ? (
                        <Text style={styles.entryNote}>{entry.notes}</Text>
                      ) : null}
                    </View>
                    <Text style={styles.entryElapsed}>
                      {formatElapsed(entry.startedAt, entry.endedAt, now)}
                    </Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

function WorkoutSummary({ group, now }: { group: WorkoutGroup; now: Date }) {
  if (!group.workout?.endTime) return null;

  const duration = formatElapsed(group.workout.startTime, group.workout.endTime, now);
  const setCount = group.sets.length;
  let totalWeight = 0;
  for (const set of group.sets) {
    for (const entry of set.entries) {
      if (entry.measurementType !== 'duration') {
        totalWeight += entry.weight * entry.reps;
      }
    }
  }

  return (
    <View style={styles.summaryContainer}>
      <Text style={styles.summaryText}>Duration: {duration}</Text>
      <Text style={styles.summaryText}>Sets: {setCount}</Text>
      <Text style={styles.summaryText}>Total Weight: {totalWeight.toLocaleString()}</Text>
    </View>
  );
}

function formatDurationHMS(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
  },
  workoutGroup: {
    marginBottom: 16,
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    marginBottom: 8,
  },
  workoutTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  workoutDuration: {
    fontSize: 14,
    color: '#666',
  },
  summaryContainer: {
    backgroundColor: '#f0f7ff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  summaryText: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '600',
  },
  setContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  setHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 6,
  },
  setTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  setTime: {
    fontSize: 12,
    color: '#999',
  },
  entryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  entryLeft: {
    flex: 1,
  },
  entryText: {
    fontSize: 15,
    color: '#333',
  },
  entryElapsed: {
    fontSize: 13,
    color: '#999',
    marginLeft: 8,
  },
  entryNote: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#888',
    marginTop: 2,
    paddingLeft: 4,
  },
});
