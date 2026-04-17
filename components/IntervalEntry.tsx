import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

type IntervalField = 'hours' | 'minutes' | 'seconds';

interface IntervalEntryProps {
  hours: string;
  minutes: string;
  seconds: string;
  activeField: IntervalField;
  onSelectField: (field: IntervalField) => void;
}

function formatField(value: string): string {
  if (value.length === 0) return '00';
  return value.padStart(2, '0');
}

export function IntervalEntry({
  hours,
  minutes,
  seconds,
  activeField,
  onSelectField,
}: IntervalEntryProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.field, activeField === 'hours' && styles.activeField]}
        onPress={() => onSelectField('hours')}
      >
        <Text style={styles.value}>{formatField(hours)}</Text>
        <Text style={styles.label}>HH</Text>
      </TouchableOpacity>
      <Text style={styles.separator}>:</Text>
      <TouchableOpacity
        style={[styles.field, activeField === 'minutes' && styles.activeField]}
        onPress={() => onSelectField('minutes')}
      >
        <Text style={styles.value}>{formatField(minutes)}</Text>
        <Text style={styles.label}>MM</Text>
      </TouchableOpacity>
      <Text style={styles.separator}>:</Text>
      <TouchableOpacity
        style={[styles.field, activeField === 'seconds' && styles.activeField]}
        onPress={() => onSelectField('seconds')}
      >
        <Text style={styles.value}>{formatField(seconds)}</Text>
        <Text style={styles.label}>SS</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  field: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#f5f5f5',
    minWidth: 64,
  },
  activeField: {
    borderColor: '#007AFF',
    backgroundColor: '#eaf3ff',
  },
  value: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  label: {
    fontSize: 10,
    letterSpacing: 1,
    color: '#777',
    marginTop: 2,
  },
  separator: {
    fontSize: 18,
    color: '#999',
    marginHorizontal: 6,
    fontWeight: '600',
  },
});
