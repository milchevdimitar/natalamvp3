import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { UserRound } from 'lucide-react-native';
import { T } from './UI';

export function ProfileAvatar({ name, size = 90, source }: { name: string; size?: number; source?: string }) {
  const initials = name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((word) => Array.from(word)[0]).join('').toUpperCase();
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
      <LinearGradient colors={['#435eab', '#332563', '#171944']} style={StyleSheet.absoluteFill} />
      {initials ? <T bold size={size * 0.31} style={{ color: '#f1eaff' }}>{initials}</T> : <UserRound color="#f1eaff" size={size * 0.34} />}
      {!!source && <Image source={{ uri: source }} style={StyleSheet.absoluteFill} />}
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: { borderWidth: 1, borderColor: 'rgba(197,192,255,0.5)', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
});
