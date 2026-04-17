import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Share,
  ActionSheetIOS,
  Platform,
} from 'react-native';
import { Workout, LogEntry, Move } from '../types';

interface WorkoutStatusBarProps {
  currentWorkout: Workout | null;
  onStart: () => void;
  onStop: () => void;
  entries: LogEntry[];
  moves: Move[];
  workouts: Workout[];
}

function buildExportText(
  entries: LogEntry[],
  moves: Move[],
  workouts: Workout[]
): string {
  const getMoveNameById = (moveId: string): string => {
    const move = moves.find((m) => m.id === moveId);
    return move?.name || 'Unknown';
  };

  const lines: string[] = ['Track Workout Export', ''];

  for (const workout of workouts) {
    const wEntries = entries.filter((e) => e.workoutId === workout.id);
    if (wEntries.length === 0) continue;
    const startDate = new Date(workout.startTime);
    lines.push(`Workout ${startDate.toLocaleDateString()} ${startDate.toLocaleTimeString()}`);
    for (const entry of wEntries) {
      const name = getMoveNameById(entry.moveId);
      if (entry.measurementType === 'duration') {
        lines.push(`  ${name}: ${entry.durationSeconds ?? 0}s`);
      } else {
        lines.push(`  ${name}: ${entry.weight} x ${entry.reps} = ${entry.weight * entry.reps}`);
      }
    }
    lines.push('');
  }

  // Also include entries without a workoutId
  const unlinked = entries.filter((e) => !e.workoutId);
  if (unlinked.length > 0) {
    lines.push('Unlinked Entries');
    for (const entry of unlinked) {
      const name = getMoveNameById(entry.moveId);
      if (entry.measurementType === 'duration') {
        lines.push(`  ${name}: ${entry.durationSeconds ?? 0}s`);
      } else {
        lines.push(`  ${name}: ${entry.weight} x ${entry.reps} = ${entry.weight * entry.reps}`);
      }
    }
  }

  return lines.join('\n');
}

export function WorkoutStatusBar({
  currentWorkout,
  onStart,
  onStop,
  entries,
  moves,
  workouts,
}: WorkoutStatusBarProps) {
  const handleExport = () => {
    const text = buildExportText(entries, moves, workouts);

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Copy to Clipboard', 'Share', 'Remote DB'],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            // Copy
            Share.share({ message: text }).catch(() => {});
          } else if (buttonIndex === 2) {
            Share.share({ message: text }).catch(() => {});
          } else if (buttonIndex === 3) {
            Alert.alert('Remote DB', 'Remote database support is on its way!');
          }
        }
      );
    } else {
      // Android / web fallback
      Alert.alert('Export', 'Choose an option', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Copy / Share',
          onPress: () => Share.share({ message: text }).catch(() => {}),
        },
        {
          text: 'Remote DB',
          onPress: () =>
            Alert.alert('Remote DB', 'Remote database support is on its way!'),
        },
      ]);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Track Workout</Text>
      <View style={styles.rightSection}>
        {currentWorkout ? (
          <TouchableOpacity style={styles.stopButton} onPress={onStop}>
            <Text style={styles.stopButtonText}>Stop</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.startButton} onPress={onStart}>
            <Text style={styles.startButtonText}>Start</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.exportButton} onPress={handleExport}>
          <Text style={styles.exportIcon}>&#x2191;</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  startButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  stopButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  stopButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  exportButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  exportIcon: {
    fontSize: 20,
    color: '#007AFF',
  },
});
