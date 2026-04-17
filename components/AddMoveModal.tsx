import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
} from 'react-native';
import { Move, MeasurementType } from '../types';

interface AddMoveModalProps {
  visible: boolean;
  existingMoves: Move[];
  onSave: (move: Move) => void;
  onCancel: () => void;
}

const CATEGORIES: { label: string; value: MeasurementType }[] = [
  { label: 'Strength', value: 'strength' },
  { label: 'Cardio', value: 'duration' },
  { label: 'Other', value: 'note_only' },
];

export function AddMoveModal({ visible, existingMoves, onSave, onCancel }: AddMoveModalProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<MeasurementType>('strength');

  const trimmed = name.trim();
  const isDuplicate = existingMoves.some(
    (m) => m.name.toLowerCase() === trimmed.toLowerCase()
  );
  const canSave = trimmed.length > 0 && !isDuplicate;

  const handleSave = () => {
    if (!canSave) return;
    const maxSort = existingMoves.reduce((max, m) => Math.max(max, m.sortOrder), -1);
    const newMove: Move = {
      id: `custom-${Date.now()}`,
      name: trimmed,
      sortOrder: maxSort + 1,
      measurementType: category,
      isCustom: true,
    };
    onSave(newMove);
    setName('');
    setCategory('strength');
  };

  const handleCancel = () => {
    setName('');
    setCategory('strength');
    onCancel();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Add Move</Text>

          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Bike commute"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            autoFocus
          />
          {isDuplicate && (
            <Text style={styles.error}>A move with that name already exists</Text>
          )}

          <Text style={styles.label}>Type</Text>
          <View style={styles.categoryRow}>
            {CATEGORIES.map((c) => (
              <TouchableOpacity
                key={c.value}
                style={[styles.categoryBtn, category === c.value && styles.categoryBtnActive]}
                onPress={() => setCategory(c.value)}
              >
                <Text
                  style={[styles.categoryText, category === c.value && styles.categoryTextActive]}
                >
                  {c.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.hint}>
            {category === 'strength'
              ? 'Weight + reps (e.g. Bench Press)'
              : category === 'duration'
                ? 'Timed segment (e.g. Bike commute, Stairs)'
                : 'Just a note (e.g. Stretching, Yoga)'}
          </Text>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={!canSave}
            >
              <Text style={styles.saveText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    backgroundColor: '#f9fafb',
  },
  error: {
    color: '#e53e3e',
    fontSize: 12,
    marginTop: 4,
  },
  hint: {
    color: '#999',
    fontSize: 12,
    marginTop: 4,
  },
  categoryRow: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  categoryBtnActive: {
    borderColor: '#007AFF',
    backgroundColor: '#e8f0fe',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  categoryTextActive: {
    color: '#007AFF',
  },
  actions: {
    flexDirection: 'row',
    marginTop: 24,
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  saveBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  saveBtnDisabled: {
    opacity: 0.5,
  },
  saveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
