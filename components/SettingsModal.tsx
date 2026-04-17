import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Switch,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { HeartRateSample, Workout } from '../types';
import { parseHRCSV, alignAndPersist, syntheticHRCSV } from '../utils/hrImporter';

const KEYS = {
  syncEnabled: 'settings.syncEnabled',
  syncEndpoint: 'settings.syncEndpoint',
  apiKey: 'settings.apiKey',
};

interface SettingsModalProps {
  visible: boolean;
  workouts: Workout[];
  onDismiss: () => void;
  onHRImported: (samples: HeartRateSample[]) => void;
}

export function SettingsModal({ visible, workouts, onDismiss, onHRImported }: SettingsModalProps) {
  const [syncEnabled, setSyncEnabled] = useState(false);
  const [endpoint, setEndpoint] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [testResult, setTestResult] = useState('');
  const [hrImportResult, setHrImportResult] = useState('');
  const [hrImportError, setHrImportError] = useState('');

  const handleFileImport = async () => {
    setHrImportResult('');
    setHrImportError('');
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'text/comma-separated-values', 'text/plain', '*/*'],
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      const csv = await FileSystem.readAsStringAsync(asset.uri, { encoding: 'utf8' });
      const { samples: parsed, skipped } = parseHRCSV(csv);
      const source = `file:${asset.name ?? 'unknown'}`;
      const { result: importResult, samples } = alignAndPersist(parsed, source, workouts);
      onHRImported(samples);
      setHrImportResult(
        `${importResult.persisted} samples, ${importResult.aligned} aligned` +
        (skipped > 0 ? ` · ${skipped} rows skipped` : '')
      );
    } catch (err: any) {
      setHrImportError(`Import failed: ${err.message ?? err}`);
    }
  };

  useEffect(() => {
    if (!visible) return;
    (async () => {
      const [e, ep, k] = await Promise.all([
        AsyncStorage.getItem(KEYS.syncEnabled),
        AsyncStorage.getItem(KEYS.syncEndpoint),
        AsyncStorage.getItem(KEYS.apiKey),
      ]);
      setSyncEnabled(e === 'true');
      setEndpoint(ep ?? '');
      setApiKey(k ?? '');
    })();
  }, [visible]);

  const save = async () => {
    await Promise.all([
      AsyncStorage.setItem(KEYS.syncEnabled, String(syncEnabled)),
      AsyncStorage.setItem(KEYS.syncEndpoint, endpoint),
      AsyncStorage.setItem(KEYS.apiKey, apiKey),
    ]);
    onDismiss();
  };

  const testConnection = async () => {
    setTestResult('Testing…');
    try {
      const healthUrl = endpoint.replace('/sync/events', '/health');
      const res = await fetch(healthUrl, { signal: AbortSignal.timeout(5000) });
      setTestResult(res.ok ? `OK ${res.status}` : `HTTP ${res.status}`);
    } catch (err: any) {
      setTestResult(`Error: ${err.message ?? err}`);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <ScrollView>
            <Text style={styles.title}>Settings</Text>

            <View style={styles.row}>
              <Text style={styles.label}>Sync to remote server</Text>
              <Switch value={syncEnabled} onValueChange={setSyncEnabled} />
            </View>
            <Text style={styles.hint}>
              When off, workouts are saved locally only. The app works fully offline.
            </Text>

            {syncEnabled && (
              <>
                <Text style={styles.sectionTitle}>Endpoint</Text>
                <TextInput
                  style={styles.input}
                  value={endpoint}
                  onChangeText={setEndpoint}
                  placeholder="https://your-server.example.com/sync/events"
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                />

                <Text style={styles.sectionTitle}>API key</Text>
                <TextInput
                  style={styles.input}
                  value={apiKey}
                  onChangeText={setApiKey}
                  placeholder="API key"
                  autoCapitalize="none"
                  autoCorrect={false}
                  secureTextEntry
                />

                <TouchableOpacity
                  style={[styles.testBtn, !endpoint && styles.testBtnDisabled]}
                  onPress={testConnection}
                  disabled={!endpoint}
                >
                  <Text style={styles.testBtnText}>Test connection</Text>
                  {testResult ? (
                    <Text style={[
                      styles.testResult,
                      testResult.startsWith('OK') ? styles.testOk : styles.testFail,
                    ]}>
                      {testResult}
                    </Text>
                  ) : null}
                </TouchableOpacity>
              </>
            )}
            <Text style={styles.sectionTitle}>Heart rate</Text>
            <TouchableOpacity
              style={styles.testBtn}
              onPress={handleFileImport}
            >
              <Text style={styles.testBtnText}>Import HR CSV from file…</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.testBtn}
              onPress={() => {
                const csv = syntheticHRCSV(60);
                const { samples: parsed } = parseHRCSV(csv);
                const { result, samples } = alignAndPersist(parsed, 'demo-fixture', workouts);
                onHRImported(samples);
                setHrImportResult(`${result.persisted} samples, ${result.aligned} aligned`);
              }}
            >
              <Text style={styles.testBtnText}>Import demo HR data</Text>
            </TouchableOpacity>
            {hrImportResult ? (
              <Text style={[styles.testResult, styles.testOk, { marginTop: 4 }]}>{hrImportResult}</Text>
            ) : null}
            {hrImportError ? (
              <Text style={[styles.testResult, styles.testFail, { marginTop: 4 }]}>{hrImportError}</Text>
            ) : null}
          </ScrollView>

          <TouchableOpacity style={styles.doneBtn} onPress={save}>
            <Text style={styles.doneBtnText}>Done</Text>
          </TouchableOpacity>
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
    maxHeight: '80%',
  },
  title: { fontSize: 20, fontWeight: '700', textAlign: 'center', marginBottom: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  label: { fontSize: 16, fontWeight: '600' },
  hint: { fontSize: 12, color: '#999', marginBottom: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#666', marginTop: 12, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    backgroundColor: '#f9fafb',
  },
  testBtn: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 10,
    backgroundColor: '#f0f0f0',
  },
  testBtnDisabled: { opacity: 0.5 },
  testBtnText: { fontSize: 14, fontWeight: '600', color: '#333' },
  testResult: { fontSize: 12 },
  testOk: { color: '#34C759' },
  testFail: { color: '#FF3B30' },
  doneBtn: {
    marginTop: 16,
    backgroundColor: '#007AFF',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  doneBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
