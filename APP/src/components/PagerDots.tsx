import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

export function PagerDots({ labels, index, onSelect }: {
  labels: readonly string[];
  index: number;
  onSelect: (index: number) => void;
}) {
  return (
    <View style={styles.row}>
      {labels.map((label, page) => (
        <Pressable key={page} accessibilityRole="button" accessibilityLabel={'Go to ' + label}
          accessibilityState={{ selected: page === index }} onPress={() => onSelect(page)} style={styles.target}>
          <View style={[styles.dot, page === index && styles.active]} />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 12, paddingBottom: 9, paddingTop: 3 },
  target: { height: 44, minWidth: 17, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4 },
  dot: { width: 7, height: 7, borderRadius: 6, backgroundColor: '#576d9e' },
  active: { width: 18, backgroundColor: '#baaaff' },
});
