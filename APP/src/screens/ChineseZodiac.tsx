import { BackButton } from '../components/BackButton';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Sparkles } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Card, Hero, Section, T } from '../components/UI';
import { useApp } from '../context/AppContext';
import { animals, chineseZodiacForYear } from '../data/chineseZodiac';
import { getBirthParts } from '../services/profileDashboard';

export default function ChineseZodiac() {
  const { colors, user, setPage } = useApp();
  const year = getBirthParts(user)?.year;
  const result = year === undefined ? undefined : chineseZodiacForYear(year);
  const [selected, setSelected] = useState<number | null>(null);
  const active = selected ?? result?.animalIndex;
  const animal = active === undefined ? undefined : animals[active];
  const personal = result && active === result.animalIndex;

  return (
    <>
      <BackButton onPress={() => setPage('explore')} label="Back to Explore" />
      <Hero eyebrow="CHINESE ZODIAC" first="Your birth year," accent="in symbols." description="Explore the twelve animals and the elements of the sixty-year cycle." />
      {animal ? <>
        <Card style={styles.heroCard}>
          <LinearGradient colors={['rgba(106,71,159,0.26)', 'rgba(39,54,110,0.05)']} style={StyleSheet.absoluteFill} pointerEvents="none" />
          <View style={[styles.medallion, { borderColor: colors.line, backgroundColor: colors.purpleSoft }]}>
            <Text style={{ color: colors.gold, fontSize: 47 }}>{animal.hanzi}</Text>
          </View>
          <T muted bold size={11}>{personal ? year + ' · YOUR BIRTH-YEAR SIGN' : 'ANIMAL IN THE CYCLE'}</T>
          <T bold size={32}>{personal ? result.element + ' ' + animal.name : animal.name}</T>
          <T bold size={13} style={{ color: colors.purple }}>{personal ? result.polarity + ' · ' : ''}{animal.theme}</T>
        </Card>
        <Card style={styles.reading}>
          <T bold size={16}>Symbolic reading</T>
          <T muted size={14}>{animal.meaning}</T>
          <View style={styles.prompt}><Sparkles size={16} color={colors.gold} /><T size={13} style={{ flex: 1 }}>{animal.prompt}</T></View>
        </Card>
      </> : <Card><T muted size={14}>Add a birth date to your profile to see your sign, or select an animal below.</T></Card>}
      {result && <T muted size={11} style={{ marginVertical: 12 }}>This reading uses your Gregorian birth year. Traditional zodiac years change at Lunar New Year, so January or February birthdays can belong to the preceding sign.</T>}
      <Section>The twelve animals</Section>
      <View style={styles.grid}>
        {animals.map((entry, index) => <Pressable key={entry.name} accessibilityRole="button" accessibilityState={{ selected: index === active }} onPress={() => setSelected(index)} style={[styles.tile, {
          backgroundColor: index === active ? colors.purpleSoft : colors.surface,
          borderColor: index === active ? colors.purple : colors.line,
        }]}>
          <T size={23} style={{ color: index === active ? colors.gold : colors.text }}>{entry.hanzi}</T>
          <T size={11} bold>{entry.name}</T>
        </Pressable>)}
      </View>
      {result && selected !== null && selected !== result.animalIndex && <Pressable accessibilityRole="button" onPress={() => setSelected(null)} style={styles.back}>
        <T bold size={13} style={{ color: colors.purple }}>Show my sign</T>
      </Pressable>}
    </>
  );
}

const styles = StyleSheet.create({
  back: { minHeight: 44, flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 7 },
  heroCard: { alignItems: 'center', gap: 4, paddingVertical: 24 },
  medallion: { width: 82, height: 82, borderRadius: 41, alignItems: 'center', justifyContent: 'center', borderWidth: 1, marginBottom: 7 },
  reading: { marginTop: 11, gap: 10 },
  prompt: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  grid: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  tile: { width: '22%', flexGrow: 1, minHeight: 66, borderRadius: 15, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});
