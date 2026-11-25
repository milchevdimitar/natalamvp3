import React, { useLayoutEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { BlurView, type BlurViewProps } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { House, Compass, UsersRound, Heart, Film } from 'lucide-react-native';
import { useApp } from '../context/AppContext';
import { useReducedMotion } from '../screens/Home/CosmicBackground';

const items = [
  ['home', 'Home', House],
  ['explore', 'Explore', Compass],
  ['people', 'People', UsersRound],
  ['dating', 'Dating', Heart],
  ['feed', 'Feed', Film],
] as const;

export default function BottomNav({ blurTarget }: Pick<BlurViewProps, 'blurTarget'>) {
  const { page, setPage, tabActivity } = useApp();
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const [rowWidth, setRowWidth] = useState(0);
  const slot = rowWidth / items.length;
  const currentTab = page === 'chat' || page === 'shared-profile' ? 'people' : page;
  const index = items.findIndex(([id]) => id === currentTab);
  const offset = useRef(new Animated.Value(0)).current;
  const lastSlot = useRef(0);

  useLayoutEffect(() => {
    if (!slot || index < 0) return;
    const toValue = slot * index;
    if (reduced || lastSlot.current !== slot) {
      offset.setValue(toValue);
      lastSlot.current = slot;
      return;
    }

    const motion = Animated.timing(offset, {
      toValue,
      duration: 265,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: Platform.OS !== 'web',
    });
    motion.start();
    return () => motion.stop();
  }, [index, offset, reduced, slot]);

  return (
    <View style={[styles.position, { bottom: Math.max(insets.bottom, 13) + 3 }]} pointerEvents="box-none">
      <View style={styles.shell}>
        <BlurView
          intensity={Platform.OS === 'web' ? 15 : 22}
          tint="default"
          blurTarget={blurTarget}
          blurMethod="dimezisBlurViewSdk31Plus"
          pointerEvents="none"
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.tint} pointerEvents="none" />
        <View accessibilityRole="tablist" style={styles.row} onLayout={(event) => setRowWidth(event.nativeEvent.layout.width)}>
          {slot > 0 && index >= 0 && (
            <Animated.View
              testID="navbar-selection"
              pointerEvents="none"
              style={[styles.selector, { width: slot, transform: [{ translateX: offset }] }]}
            />
          )}
          {items.map(([id, label, Icon]) => {
            const hasActivity = id === 'people' && (tabActivity.people || tabActivity.chat);
            const selected = currentTab === id;
            return (
              <Pressable key={id} onPress={() => setPage(id)} accessibilityRole="tab" accessibilityLabel={hasActivity ? label + ', new activity' : label} accessibilityState={{ selected }} aria-selected={selected} style={styles.tab}>
                <View>
                  <Icon size={23} strokeWidth={selected ? 2.4 : 1.9} color={selected ? '#dfccff' : '#bdc9e9'} />
                  {hasActivity && <View style={styles.notification} />}
                </View>
                <Text style={[styles.label, selected && styles.selectedLabel]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  position: { position: 'absolute', left: 16, right: 16, alignItems: 'center' },
  shell: { width: '100%', maxWidth: 530, borderRadius: 28, borderWidth: 1, borderColor: 'rgba(177,195,255,0.28)', overflow: 'hidden' },
  tint: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(9,19,53,0.59)' },
  row: { flexDirection: 'row', margin: 6 },
  selector: { position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: 21, backgroundColor: 'rgba(151,119,245,0.27)' },
  tab: { flex: 1, minWidth: 0, height: 58, alignItems: 'center', justifyContent: 'center', gap: 3 },
  notification: { position: 'absolute', right: -5, top: -4, width: 13, height: 13, borderRadius: 7, backgroundColor: '#E65B63', borderWidth: 2, borderColor: '#24365c' },
  label: { fontSize: 10, fontWeight: '500', color: '#bdc9e9' },
  selectedLabel: { fontWeight: '700', color: '#f0e4ff' },
});
