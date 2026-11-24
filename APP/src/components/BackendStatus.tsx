import React, { useSyncExternalStore } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { getBackendConnection, subscribeToBackendConnection } from '../services/apiBase';

export function useBackendConnection() {
  return useSyncExternalStore(subscribeToBackendConnection, getBackendConnection);
}

export function BackendStatus() {
  const { kind, status } = useBackendConnection();
  const connected = status === 'connected';
  const description = connected ? 'Connected' : status === 'checking' ? 'Checking connection'
    : status === 'database-unavailable' ? 'Database unavailable' : 'Unavailable';
  return (
    <View accessible accessibilityLabel={kind + '. ' + description} accessibilityLiveRegion="polite" style={styles.status}>
      <Text style={styles.label}>{kind}</Text>
      <View style={[styles.dot, connected ? styles.connected : status === 'checking' ? styles.checking : styles.unavailable]} />
    </View>
  );
}

const styles = StyleSheet.create({
  status: { alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 7 },
  label: { fontSize: 12, color: '#d3d9f3' },
  dot: { width: 8, height: 8, borderRadius: 4 },
  connected: { backgroundColor: '#51d99d' },
  checking: { backgroundColor: '#f6c66d' },
  unavailable: { backgroundColor: '#ff727e' },
});
