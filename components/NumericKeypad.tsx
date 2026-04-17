import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';

interface NumericKeypadProps {
  value: string;
  onValueChange: (value: string) => void;
  allowDecimal?: boolean;
  maxLength?: number;
  showColon?: boolean;
  onColon?: () => void;
  allowLeadingZero?: boolean;
}

export function NumericKeypad({
  value,
  onValueChange,
  allowDecimal = true,
  maxLength = 6,
  showColon = false,
  onColon,
  allowLeadingZero = false,
}: NumericKeypadProps) {
  const handlePress = async (key: string) => {
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (key === 'C') {
      onValueChange('');
      return;
    }

    if (key === '⌫') {
      onValueChange(value.slice(0, -1));
      return;
    }

    if (key === ':') {
      onColon?.();
      return;
    }

    if (key === '.' && !allowDecimal) {
      return;
    }

    if (key === '.' && value.includes('.')) {
      return;
    }

    if (value.length >= maxLength) {
      return;
    }

    // Don't allow leading zeros unless followed by decimal
    if (!allowLeadingZero && value === '0' && key !== '.') {
      onValueChange(key);
      return;
    }

    onValueChange(value + key);
  };

  const bottomLeftKey = showColon ? ':' : allowDecimal ? '.' : 'C';
  const keys = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    [bottomLeftKey, '0', '⌫'],
  ];

  return (
    <View style={styles.container}>
      {keys.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row.map((key) => (
            <TouchableOpacity
              key={key}
              style={[
                styles.key,
                key === '⌫' && styles.deleteKey,
                key === 'C' && styles.clearKey,
              ]}
              onPress={() => handlePress(key)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.keyText,
                  (key === '⌫' || key === 'C') && styles.actionKeyText,
                ]}
              >
                {key}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 8,
  },
  key: {
    width: 72,
    height: 56,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  deleteKey: {
    backgroundColor: '#ffcccc',
  },
  clearKey: {
    backgroundColor: '#ffe0cc',
  },
  keyText: {
    fontSize: 24,
    fontWeight: '500',
    color: '#333',
  },
  actionKeyText: {
    fontSize: 20,
  },
});
