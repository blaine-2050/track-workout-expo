import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Move, LogEntry, Workout } from '../types';
import { NumericKeypad } from './NumericKeypad';
import { MoveSelector } from './MoveSelector';
import { EventHistory } from './EventHistory';
import { IntervalEntry } from './IntervalEntry';
import { WorkoutStatusBar } from './WorkoutStatusBar';
import { AddMoveModal } from './AddMoveModal';
import { CardioEntry } from './CardioEntry';
import { formatElapsed } from '../utils/formatElapsed';
import * as api from '../api/client';

interface WorkoutScreenProps {
  onLogout: () => void;
}

export function WorkoutScreen({ onLogout }: WorkoutScreenProps) {
  const [moves, setMoves] = useState<Move[]>([]);
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [currentWorkout, setCurrentWorkout] = useState<Workout | null>(null);
  const [selectedMove, setSelectedMove] = useState<Move | null>(null);
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [activeField, setActiveField] = useState<'weight' | 'reps'>('weight');
  const [weightUnit, setWeightUnit] = useState<'lbs' | 'kg'>('lbs');
  const [intervalHours, setIntervalHours] = useState('');
  const [intervalMinutes, setIntervalMinutes] = useState('');
  const [intervalSeconds, setIntervalSeconds] = useState('');
  const [intervalField, setIntervalField] = useState<'hours' | 'minutes' | 'seconds'>('hours');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddMove, setShowAddMove] = useState(false);
  const [cardioSegmentStart, setCardioSegmentStart] = useState<string | null>(null);
  const [cardioManualEntry, setCardioManualEntry] = useState(false);
  const isCardioRunning = cardioSegmentStart !== null;

  // Sticky inputs state
  const [isWeightSticky, setIsWeightSticky] = useState(false);
  const [isRepsSticky, setIsRepsSticky] = useState(false);

  // Timing state
  const [moveSelectedAt, setMoveSelectedAt] = useState<string | undefined>(undefined);
  const [lastLoggedAt, setLastLoggedAt] = useState<string | undefined>(undefined);

  // Set timer -- ticks every second
  const [timerDisplay, setTimerDisplay] = useState('');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isIntervalMove = selectedMove?.measurementType === 'duration';
  const isNoteOnlyMove = selectedMove?.measurementType === 'note_only';

  // Set timer effect
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (moveSelectedAt && currentWorkout) {
      const tick = () => {
        setTimerDisplay(formatElapsed(moveSelectedAt, undefined, new Date()));
      };
      tick();
      timerRef.current = setInterval(tick, 1000);
    } else {
      setTimerDisplay('');
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [moveSelectedAt, currentWorkout]);

  const loadData = useCallback(async () => {
    try {
      const [movesData, entriesData] = await Promise.all([
        api.getMoves(),
        api.getLogEntries(),
      ]);
      setMoves(movesData);
      setEntries(entriesData);
    } catch (error) {
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  const totalIntervalSeconds =
    parseInt(intervalHours || '0', 10) * 3600 +
    parseInt(intervalMinutes || '0', 10) * 60 +
    parseInt(intervalSeconds || '0', 10);

  // Stamp endedAt on the most recent entry for the current move
  const stampPreviousEntry = (now: string) => {
    setEntries((prev) => {
      if (prev.length === 0) return prev;
      // Find most recent entry that has no endedAt and belongs to current workout
      const idx = prev.findIndex(
        (e) =>
          !e.endedAt &&
          e.workoutId === currentWorkout?.id
      );
      if (idx === -1) return prev;
      const updated = [...prev];
      updated[idx] = { ...updated[idx], endedAt: now };
      // Also update in the mock store
      api.updateLogEntry(updated[idx].id, { endedAt: now });
      return updated;
    });
  };

  // Start workout
  const handleStartWorkout = async () => {
    const workout = await api.createWorkout();
    setWorkouts((prev) => [workout, ...prev]);
    setCurrentWorkout(workout);
  };

  // Stop workout
  const handleStopWorkout = async () => {
    if (!currentWorkout) return;
    const now = new Date().toISOString();
    stampPreviousEntry(now);
    const ended = await api.endWorkout(currentWorkout.id);
    if (ended) {
      setWorkouts((prev) =>
        prev.map((w) => (w.id === ended.id ? ended : w))
      );
    }
    setCurrentWorkout(null);
    setSelectedMove(null);
    setWeight('');
    setReps('');
    setIsWeightSticky(false);
    setIsRepsSticky(false);
    setMoveSelectedAt(undefined);
    setLastLoggedAt(undefined);
    setTimerDisplay('');
    setCardioSegmentStart(null);
    setCardioManualEntry(false);
  };

  const handleMoveSelect = async (move: Move) => {
    const now = new Date().toISOString();

    // Stamp endedAt on previous entry when changing moves
    if (currentWorkout) {
      stampPreviousEntry(now);
    }

    // Auto-start workout on first move selection
    let workout = currentWorkout;
    if (!workout) {
      workout = await api.createWorkout();
      setWorkouts((prev) => [workout!, ...prev]);
      setCurrentWorkout(workout);
    }

    setSelectedMove(move);
    setWeight('');
    setReps('');
    setIsWeightSticky(false);
    setIsRepsSticky(false);
    setActiveField('weight');
    setMoveSelectedAt(now);
    setIntervalHours('');
    setIntervalMinutes('');
    setIntervalSeconds('');
    setIntervalField('hours');
    setCardioSegmentStart(null);
    setCardioManualEntry(false);
  };

  const handleAddMove = () => {
    setShowAddMove(true);
  };

  const handleCardioStart = async () => {
    if (!currentWorkout) {
      const workout = await api.createWorkout();
      setWorkouts((prev) => [workout, ...prev]);
      setCurrentWorkout(workout);
    }
    setCardioSegmentStart(new Date().toISOString());
  };

  const handleCardioStop = async () => {
    if (!cardioSegmentStart || !selectedMove) return;
    const now = new Date().toISOString();
    const durationSeconds = Math.max(0, Math.floor(
      (new Date(now).getTime() - new Date(cardioSegmentStart).getTime()) / 1000
    ));
    stampPreviousEntry(now);
    try {
      const newEntry = await api.createLogEntry(selectedMove.id, {
        measurementType: 'duration',
        moveName: selectedMove.name,
        durationSeconds,
        startedAt: cardioSegmentStart,
        endedAt: now,
        workoutId: currentWorkout?.id,
        weightUnit,
      });
      setEntries((prev) => [newEntry, ...prev]);
      setLastLoggedAt(now);
      setMoveSelectedAt(now);
    } catch {
      Alert.alert('Error', 'Failed to log cardio segment');
    }
    setCardioSegmentStart(null);
  };

  const handleSaveNewMove = (newMove: Move) => {
    setMoves((prev) => [...prev, newMove].sort((a, b) => a.name.localeCompare(b.name)));
    setShowAddMove(false);
    handleMoveSelect(newMove);
  };

  const advanceIntervalField = () => {
    setIntervalField((prev) => {
      if (prev === 'hours') return 'minutes';
      if (prev === 'minutes') return 'seconds';
      return 'seconds';
    });
  };

  const updateIntervalField = (value: string) => {
    const nextValue = value.slice(0, 2);
    if (intervalField === 'hours') {
      setIntervalHours(nextValue);
      if (nextValue.length >= 2) setIntervalField('minutes');
      return;
    }
    if (intervalField === 'minutes') {
      setIntervalMinutes(nextValue);
      if (nextValue.length >= 2) setIntervalField('seconds');
      return;
    }
    setIntervalSeconds(nextValue);
  };

  // Handle keypad value change with sticky clearing
  const handleWeightChange = (value: string) => {
    if (isWeightSticky) {
      // First keypress clears sticky value
      setIsWeightSticky(false);
      // If they pressed backspace or clear, just clear
      if (value === '' || value.length < weight.length) {
        setWeight('');
      } else {
        // The new character is the last char of value
        const newChar = value.slice(-1);
        setWeight(newChar);
      }
      return;
    }
    setWeight(value);
  };

  const handleRepsChange = (value: string) => {
    if (isRepsSticky) {
      setIsRepsSticky(false);
      if (value === '' || value.length < reps.length) {
        setReps('');
      } else {
        const newChar = value.slice(-1);
        setReps(newChar);
      }
      return;
    }
    setReps(value);
  };

  const handleLog = async () => {
    if (!selectedMove) {
      Alert.alert('Error', 'Please select an exercise');
      return;
    }
    if (isIntervalMove) {
      if (totalIntervalSeconds <= 0) {
        Alert.alert('Error', 'Please enter a duration');
        return;
      }
      setIsSubmitting(true);
      try {
        const now = new Date().toISOString();
        stampPreviousEntry(now);

        const entryStartedAt = lastLoggedAt || moveSelectedAt || now;
        const newEntry = await api.createLogEntry(selectedMove.id, {
          measurementType: 'duration',
          moveName: selectedMove.name,
          durationSeconds: totalIntervalSeconds,
          startedAt: entryStartedAt,
          workoutId: currentWorkout?.id,
          weightUnit,
        });
        setEntries((prev) => [newEntry, ...prev]);
        setLastLoggedAt(now);
        setIntervalHours('');
        setIntervalMinutes('');
        setIntervalSeconds('');
        setIntervalField('hours');
      } catch (error) {
        Alert.alert('Error', 'Failed to log entry');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    const effectiveWeight = weight;
    const effectiveReps = reps;

    if (!effectiveWeight) {
      Alert.alert('Error', 'Please enter weight');
      return;
    }
    if (!effectiveReps) {
      Alert.alert('Error', 'Please enter reps');
      return;
    }

    setIsSubmitting(true);
    try {
      const now = new Date().toISOString();
      stampPreviousEntry(now);

      const entryStartedAt = lastLoggedAt || moveSelectedAt || now;
      const newEntry = await api.createLogEntry(selectedMove.id, {
        measurementType: 'strength',
        moveName: selectedMove.name,
        weight: parseFloat(effectiveWeight),
        reps: parseInt(effectiveReps, 10),
        startedAt: entryStartedAt,
        workoutId: currentWorkout?.id,
        weightUnit,
      });
      setEntries((prev) => [newEntry, ...prev]);
      setLastLoggedAt(now);

      // Sticky: keep values visible but mark as sticky
      setIsWeightSticky(true);
      setIsRepsSticky(true);
      setActiveField('weight');
    } catch (error) {
      Alert.alert('Error', 'Failed to log entry');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <WorkoutStatusBar
        currentWorkout={currentWorkout}
        onStart={handleStartWorkout}
        onStop={handleStopWorkout}
        entries={entries}
        moves={moves}
        workouts={workouts}
      />

      <View style={styles.inputSection}>
        <View style={styles.moveSelectorRow}>
          <View style={styles.moveSelectorWrapper}>
            <MoveSelector
              moves={moves}
              selectedMove={selectedMove}
              onSelect={handleMoveSelect}
            />
          </View>
          <TouchableOpacity style={styles.addMoveButton} onPress={handleAddMove}>
            <Text style={styles.addMoveButtonText}>+</Text>
          </TouchableOpacity>
        </View>

        {isIntervalMove && !cardioManualEntry ? (
          /* Cardio primary path: tap-start / tap-stop */
          <View>
            <CardioEntry
              isRunning={isCardioRunning}
              startTime={cardioSegmentStart}
              onStart={handleCardioStart}
              onStop={handleCardioStop}
            />
            {!isCardioRunning && (
              <TouchableOpacity onPress={() => setCardioManualEntry(true)}>
                <Text style={styles.manualEntryLink}>Enter duration manually</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          /* Strength path or manual cardio entry */
          <View style={styles.entryPanels}>
            <View style={styles.entryPanel}>
              <View style={styles.valueInputs}>
                <TouchableOpacity
                  style={[
                    styles.valueField,
                    activeField === 'weight' && styles.activeField,
                    isIntervalMove && styles.disabledField,
                    isWeightSticky && styles.stickyField,
                  ]}
                  onPress={() => !isIntervalMove && setActiveField('weight')}
                  disabled={isIntervalMove}
                >
                  <Text style={styles.valueLabel}>Weight ({weightUnit})</Text>
                  <Text style={[styles.valueDisplay, isWeightSticky && styles.stickyText]}>
                    {weight || '0'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.valueField,
                    activeField === 'reps' && styles.activeField,
                    isIntervalMove && styles.disabledField,
                    isRepsSticky && styles.stickyField,
                  ]}
                  onPress={() => !isIntervalMove && setActiveField('reps')}
                  disabled={isIntervalMove}
                >
                  <Text style={styles.valueLabel}>Reps</Text>
                  <Text style={[styles.valueDisplay, isRepsSticky && styles.stickyText]}>
                    {reps || '0'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.entryPanel}>
              {isIntervalMove ? (
                <View>
                  <IntervalEntry
                    hours={intervalHours}
                    minutes={intervalMinutes}
                    seconds={intervalSeconds}
                    activeField={intervalField}
                    onSelectField={setIntervalField}
                  />
                  <TouchableOpacity onPress={() => setCardioManualEntry(false)}>
                    <Text style={styles.manualEntryLink}>Tap-start mode</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <Text style={styles.intervalPlaceholder}>HH:MM:SS</Text>
              )}
            </View>
          </View>
        )}

        {/* Unit picker + set timer line */}
        <View style={styles.unitTimerRow}>
          <View style={styles.unitPicker}>
            <TouchableOpacity
              style={[styles.unitButton, weightUnit === 'lbs' && styles.unitButtonActive]}
              onPress={() => setWeightUnit('lbs')}
            >
              <Text style={[styles.unitButtonText, weightUnit === 'lbs' && styles.unitButtonTextActive]}>
                lbs
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.unitButton, weightUnit === 'kg' && styles.unitButtonActive]}
              onPress={() => setWeightUnit('kg')}
            >
              <Text style={[styles.unitButtonText, weightUnit === 'kg' && styles.unitButtonTextActive]}>
                kg
              </Text>
            </TouchableOpacity>
          </View>
          {timerDisplay ? (
            <Text style={styles.setTimer}>{timerDisplay}</Text>
          ) : null}
        </View>

        <NumericKeypad
          value={
            isIntervalMove
              ? intervalField === 'hours'
                ? intervalHours
                : intervalField === 'minutes'
                  ? intervalMinutes
                  : intervalSeconds
              : activeField === 'weight'
                ? weight
                : reps
          }
          onValueChange={
            isIntervalMove
              ? updateIntervalField
              : activeField === 'weight'
                ? handleWeightChange
                : handleRepsChange
          }
          allowDecimal={!isIntervalMove && activeField === 'weight'}
          maxLength={isIntervalMove ? 2 : activeField === 'weight' ? 6 : 3}
          showColon={isIntervalMove}
          onColon={isIntervalMove ? advanceIntervalField : undefined}
          allowLeadingZero={isIntervalMove}
        />

        {/* Hide Log button when cardio tap-start mode owns the action */}
        {!(isIntervalMove && !cardioManualEntry) && <TouchableOpacity
          style={[
            styles.logButton,
            (isSubmitting || (isIntervalMove ? totalIntervalSeconds <= 0 : !weight || !reps)) &&
              styles.logButtonDisabled,
          ]}
          onPress={handleLog}
          disabled={isSubmitting || (isIntervalMove ? totalIntervalSeconds <= 0 : !weight || !reps)}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.logButtonText}>Log Entry</Text>
          )}
        </TouchableOpacity>}
      </View>

      <AddMoveModal
        visible={showAddMove}
        existingMoves={moves}
        onSave={handleSaveNewMove}
        onCancel={() => setShowAddMove(false)}
      />

      <View style={styles.historySection}>
        <EventHistory
          entries={entries}
          moves={moves}
          workouts={workouts}
          isRefreshing={isRefreshing}
          onRefresh={handleRefresh}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  inputSection: {
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  moveSelectorRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 0,
  },
  moveSelectorWrapper: {
    flex: 1,
  },
  addMoveButton: {
    width: 48,
    height: 48,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    marginBottom: 16,
  },
  addMoveButtonText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '600',
    lineHeight: 30,
  },
  valueInputs: {
    flexDirection: 'row',
    marginBottom: 0,
  },
  valueField: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  activeField: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f7ff',
  },
  disabledField: {
    opacity: 0.5,
  },
  stickyField: {
    borderColor: '#FFD60A',
    backgroundColor: '#FFFDE7',
  },
  stickyText: {
    color: '#999',
  },
  entryPanels: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  entryPanel: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#f9fafb',
    marginHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  intervalPlaceholder: {
    fontSize: 16,
    color: '#9ca3af',
    letterSpacing: 1,
  },
  valueLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  valueDisplay: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
  },
  unitTimerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  unitPicker: {
    flexDirection: 'row',
    gap: 4,
  },
  unitButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  unitButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  unitButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  unitButtonTextActive: {
    color: '#fff',
  },
  setTimer: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    fontVariant: ['tabular-nums'],
  },
  logButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  logButtonDisabled: {
    backgroundColor: '#ccc',
  },
  logButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  historySection: {
    flex: 1,
    padding: 16,
  },
  manualEntryLink: {
    textAlign: 'center',
    color: '#999',
    fontSize: 13,
    marginTop: 8,
  },
});
