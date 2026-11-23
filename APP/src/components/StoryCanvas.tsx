import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { captureRef } from 'react-native-view-shot';
import { cosmic } from '../theme/cosmic';

const width = 360;
const height = 450;
const stars = [[27, 36], [77, 67], [316, 28], [331, 107], [19, 185], [333, 281], [31, 371], [317, 408], [95, 419], [266, 427]];

export function captureStory(ref: React.RefObject<React.ComponentRef<typeof View> | null>) {
  return captureRef(ref, {
    format: 'png',
    result: 'base64',
    width: width * 2,
    height: height * 2,
  });
}

export function StoryCanvas({ storyRef, title, children }: React.PropsWithChildren<{
  storyRef: React.RefObject<React.ComponentRef<typeof View> | null>;
  title: string;
}>) {
  return (
    <View style={styles.offscreen} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View ref={storyRef} collapsable={false} style={styles.canvas}>
        <LinearGradient colors={[cosmic.bg, cosmic.surface, '#211a48', cosmic.bg]} style={StyleSheet.absoluteFill} />
        {stars.map(([left, top], index) => <View key={left} style={[styles.star, { left, top, opacity: index % 2 ? 0.35 : 0.65 }]} />)}
        <View style={styles.frame} />
        <Text allowFontScaling={false} style={styles.brand}>Natala</Text>
        <Text allowFontScaling={false} style={styles.title}>{title}</Text>
        <View style={styles.body}>{children}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  offscreen: { position: 'absolute', left: -10000, top: 0 },
  canvas: { width, height, padding: 22, overflow: 'hidden', backgroundColor: cosmic.bg, alignItems: 'center' },
  frame: { position: 'absolute', top: 10, left: 10, right: 10, bottom: 10, borderWidth: 1, borderRadius: 20, borderColor: cosmic.line },
  star: { position: 'absolute', width: 2, height: 2, borderRadius: 1, backgroundColor: cosmic.purple },
  brand: { color: cosmic.text, fontFamily: 'DancingScript_700Bold', fontSize: 34, lineHeight: 42 },
  title: { color: cosmic.purple, fontSize: 11, fontWeight: '800', letterSpacing: 2, textTransform: 'uppercase' },
  body: { flex: 1, alignSelf: 'stretch', justifyContent: 'center', alignItems: 'center', gap: 8, paddingTop: 8 },
});
