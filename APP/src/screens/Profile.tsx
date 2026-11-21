import React, { useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Brain, ChevronRight, Compass, FileDown, Hash, Layers, Leaf, Orbit, Settings, Sparkles, Sun } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system/legacy';
import * as IntentLauncher from 'expo-intent-launcher';
import * as Sharing from 'expo-sharing';
import { Card, Section, T } from '../components/UI';
import { CountUp, DashboardRing, DoshaTriangle, ElementColumns, useDashboardVisibility } from '../components/DashboardCharts';
import { ProfileSettings } from './ProfileSettings';
import type { ExploreRoute } from '../data/exploreRoutes';
import { useApp } from '../context/AppContext';
import { API_BASE_URL } from '../services/api';
import { getBirthParts, getDashboardBalances, getDashboardSystems } from '../services/profileDashboard';
import { useSystemActivity } from '../services/systemActivity';

const elements = [['Fire', '#f29986'], ['Earth', '#edc58a'], ['Air', '#b9b0ff'], ['Water', '#7ac9f5']] as const;
const doshas = [['Vata', '#b9b0ff'], ['Pitta', '#f1ad80'], ['Kapha', '#7cd8bd']] as const;
const systemIcons: Record<ExploreRoute, typeof Sun> = {
  astrology: Sun, numerology: Hash, mbti: Brain, cardology: Layers, tarot: Sparkles,
  ayurveda: Leaf, bazi: Compass, 'chinese-zodiac': Orbit,
};

export default function Profile() {
  const { colors, user, setPage } = useApp();
  const insets = useSafeAreaInsets();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const activity = useSystemActivity(user?.email);
  const systems = getDashboardSystems(user, activity);
  const ready = systems.filter((system) => system.value);
  const pending = systems.filter((system) => !system.value);
  const balances = getDashboardBalances(user, activity);
  const numerology = ready.find(({ route }) => route === 'numerology');
  const ayurveda = ready.find(({ route }) => route === 'ayurveda');
  const chinese = ready.find(({ route }) => route === 'chinese-zodiac');
  const insights = ready.filter((system) => system !== numerology && system !== ayurveda && system !== chinese);
  const visibility = useDashboardVisibility();
  const birth = getBirthParts(user);
  const name = String(user?.name || '').trim();
  const birthLabel = birth && new Date(birth.year, birth.month - 1, birth.day).toLocaleDateString(undefined, { dateStyle: 'long' });
  const birthCity = typeof user?.birthCity === 'string' ? user.birthCity : user?.birthCity?.name;

  const handleGeneratePdf = async () => {
    const userId = user?._id || user?.id;
    if (!userId) {
      Alert.alert('Грешка', 'Липсва ID на потребителя.');
      return;
    }

    setGeneratingPdf(true);
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}/report/pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Сървърът върна грешка при генерирането.');
      }

      const blob = await response.blob();
      const fileName = `Natala_Report_${Date.now()}.pdf`;

      // 1. Web: директно изтегляне в папка Downloads на компютъра
      if (Platform.OS === 'web') {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        setGeneratingPdf(false);
        return;
      }

      const reader = new FileReader();
      reader.onerror = () => {
        setGeneratingPdf(false);
        Alert.alert('Грешка', 'Неуспешно прочитане на PDF файла.');
      };

      reader.onloadend = async () => {
        try {
          const base64Data = (reader.result as string).split(',')[1];

          // 2. Android: запазване директно в избрана от потребителя папка (напр. Downloads) чрез StorageAccessFramework
          if (Platform.OS === 'android') {
            const permissions =
              await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();

            if (permissions.granted) {
              const safUri =
                await FileSystem.StorageAccessFramework.createFileAsync(
                  permissions.directoryUri,
                  fileName,
                  'application/pdf'
                );

              await FileSystem.writeAsStringAsync(safUri, base64Data, {
                encoding: FileSystem.EncodingType.Base64,
              });

              Alert.alert(
                'Файлът е запазен',
                `Докладът "${fileName}" беше успешно запазен на устройството ви.`,
                [
                  { text: 'ОК', style: 'cancel' },
                  {
                    text: 'Отвори',
                    onPress: () => {
                      IntentLauncher.startActivityAsync(
                        'android.intent.action.VIEW',
                        {
                          data: safUri,
                          flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
                          type: 'application/pdf',
                        }
                      ).catch(() => {});
                    },
                  },
                ]
              );
            } else {
              // Ако потребителят откаже избора на папка, запазваме във вътрешната памет на приложението
              const fallbackUri = `${FileSystem.documentDirectory}${fileName}`;
              await FileSystem.writeAsStringAsync(fallbackUri, base64Data, {
                encoding: FileSystem.EncodingType.Base64,
              });
              Alert.alert(
                'Запазено в приложението',
                'Не избрахте външна папка, затова файлът беше запазен локално в приложението.'
              );
            }
          } else {
            // 3. iOS: запазване локално и отваряне на системния лист ("Save to Files" / "Запази във Файлове")
            const fileUri = `${FileSystem.documentDirectory}${fileName}`;
            await FileSystem.writeAsStringAsync(fileUri, base64Data, {
              encoding: FileSystem.EncodingType.Base64,
            });

            await Sharing.shareAsync(fileUri, {
              mimeType: 'application/pdf',
              UTI: 'com.adobe.pdf',
              dialogTitle: 'Запази AI PDF доклада на устройството',
            });
          }
        } catch (saveErr) {
          console.error('Грешка при запис на PDF:', saveErr);
          Alert.alert('Грешка', 'Неуспешен запис на PDF файла на устройството.');
        } finally {
          setGeneratingPdf(false);
        }
      };

      reader.readAsDataURL(blob);
    } catch (err) {
      console.error('PDF грешка:', err);
      Alert.alert(
        'Грешка',
        'Неуспешно генериране на AI доклад. Провери връзката със сървъра.'
      );
      setGeneratingPdf(false);
    }
  };

  return (
    <>
    <ScrollView onLayout={visibility.onLayout} onScroll={visibility.onScroll} scrollEventThrottle={16} showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { paddingTop: Platform.OS === 'web' ? 22 : insets.top + 12, paddingBottom: insets.bottom + 126 }]}>
      <View style={styles.header}>
        <T size={40} style={styles.logo}>Natala</T>
        <Pressable accessibilityRole="button" accessibilityLabel="Open settings" onPress={() => setSettingsOpen(true)} style={[styles.settings, { borderColor: colors.line, backgroundColor: colors.surfaceAlt }]}>
          <Settings size={18} color={colors.text} />
        </Pressable>
      </View>
      <View style={styles.identity}>
        <T bold size={36} style={styles.name}>{name || 'Your profile'}</T>
        {(birthLabel || birthCity || user?.email) && <T muted size={12} style={{ textAlign: 'center' }}>{[birthLabel, birthCity].filter(Boolean).join(' · ') || user?.email}</T>}
      </View>

      <View onLayout={visibility.section('metrics')} style={styles.metrics}>
        <Card style={styles.metric}>
          <DashboardRing value={Math.round(ready.length * 100 / systems.length)} active={!!visibility.visible.metrics} accent={colors.purple} />
          <T bold size={11} style={styles.center}>Discovery</T>
          <View style={styles.metricCaption}>
            <CountUp value={ready.length} active={!!visibility.visible.metrics} size={10} color={colors.muted} />
            <T muted size={10}>of {systems.length} ready</T>
          </View>
        </Card>
        <Card onPress={() => setPage('numerology')} style={[styles.metric, { backgroundColor: 'rgba(119,74,141,0.28)' }]}>
          <Hash size={22} color={colors.gold} />
          {numerology?.value ? <CountUp value={Number(numerology.value)} active={!!visibility.visible.metrics} color={colors.text} /> : <T bold size={26}>—</T>}
          <T bold size={11} style={styles.center}>Life path</T>
        </Card>
        <Card onPress={() => setPage('chinese-zodiac')} style={styles.metric}>
          <Orbit size={22} color={colors.purple} />
          <T bold size={15} style={styles.center}>{chinese?.value || '—'}</T>
          <T muted size={10} style={styles.center}>Chinese Zodiac</T>
        </Card>
      </View>

      <View onLayout={visibility.section('elements')}>
        <Section>Element balance</Section>
        <Card style={styles.chart}>
          <T muted size={12}>{balances.elements ? 'From your natal chart' : 'Element proportions appear when a natal chart has saved element data.'}</T>
          <ElementColumns categories={elements} values={balances.elements} active={!!visibility.visible.elements} />
        </Card>
      </View>

      <View onLayout={visibility.section('ayurveda')}>
        <Section>Ayurveda balance</Section>
        <Card style={styles.chart}>
          <View style={styles.chartHeading}>
            <Leaf size={17} color={colors.gold} />
            <T bold size={15}>{ayurveda?.value || 'Dosha constitution'}</T>
          </View>
          <DoshaTriangle categories={doshas} values={balances.doshas} active={!!visibility.visible.ayurveda} />
          {!balances.doshas && <Pressable accessibilityRole="button" style={styles.chartLink} onPress={() => setPage('ayurveda')}>
            <T size={12} style={{ color: colors.purple }}>Open the Ayurveda assessment</T><ChevronRight size={15} color={colors.purple} />
          </Pressable>}
        </Card>
      </View>

      {insights.length > 0 && <View>
        <Section>Your insights</Section>
        <View style={styles.insights}>
          {insights.map((system) => {
            const Icon = systemIcons[system.route];
            return <Card key={system.route} onPress={() => setPage(system.route)} style={styles.insight}>
              <View style={styles.chartHeading}><Icon size={17} color={colors.purple} /><T muted bold size={10}>{system.name}</T></View>
              <T bold size={17}>{system.value}</T>
              <T muted size={11}>{system.detail}</T>
            </Card>;
          })}
        </View>
      </View>}

      {pending.length > 0 && <View>
        <Section>Still to explore</Section>
        <Card style={styles.pending}>
          {pending.map((system, index) => (
            <Pressable accessibilityRole="button" key={system.route} onPress={() => setPage(system.route)} style={[styles.next, index > 0 && { borderTopWidth: 1, borderColor: colors.line }]}>
              <View style={styles.copy}>
                <T bold size={14}>{system.name}</T>
                <T muted size={12}>{system.detail}</T>
              </View>
              <ChevronRight color={colors.muted} size={17} />
            </Pressable>
          ))}
        </Card>
      </View>}

      <Pressable accessibilityRole="button" onPress={handleGeneratePdf} disabled={generatingPdf} style={({ pressed }) => [styles.report, pressed && { opacity: 0.86 }]}>
        <LinearGradient colors={['#ffe0a5', '#eebd66', '#d49342']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} pointerEvents="none" />
        <View style={styles.premium}><T bold size={10} style={styles.reportInk}>Premium</T></View>
        <View style={styles.reportIcon}>
          {generatingPdf ? <ActivityIndicator size="small" color="#442914" /> : <FileDown size={23} color="#442914" />}
        </View>
        <View style={styles.copy}>
          <T bold size={16} style={styles.reportInk}>{generatingPdf ? 'Generating report…' : 'Download profile report'}</T>
          <T size={12} style={styles.reportInk}>Your personalized reading in one PDF</T>
        </View>
      </Pressable>
    </ScrollView>
    {settingsOpen && <ProfileSettings birthLabel={birthLabel} birthCity={birthCity} onClose={() => setSettingsOpen(false)} />}
    </>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 19, gap: 13 },
  header: { width: '100%', maxWidth: 442, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  logo: { fontFamily: 'DancingScript_700Bold', lineHeight: 49 },
  settings: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  identity: { alignItems: 'center', paddingTop: 7, paddingBottom: 16, gap: 6 },
  name: { textAlign: 'center', lineHeight: 41, letterSpacing: -1.2 },
  metrics: { flexDirection: 'row', gap: 8 },
  metric: { flex: 1, minWidth: 0, minHeight: 122, paddingHorizontal: 4, paddingVertical: 10, gap: 3, alignItems: 'center', justifyContent: 'center', borderRadius: 21 },
  center: { textAlign: 'center' },
  metricCaption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 3 },
  chart: { gap: 14, padding: 15 },
  chartHeading: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  chartLink: { minHeight: 40, flexDirection: 'row', alignItems: 'center', gap: 5 },
  insights: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  insight: { width: '47%', flexGrow: 1, minHeight: 90, padding: 13, gap: 5, borderRadius: 20 },
  pending: { paddingHorizontal: 15, paddingVertical: 4 },
  copy: { flex: 1, minWidth: 0, gap: 2 },
  next: { minHeight: 57, flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  report: { position: 'relative', flexDirection: 'row', alignItems: 'center', minHeight: 90, padding: 13, paddingTop: 22, gap: 10, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: '#ffe3a5' },
  reportInk: { color: '#442914' },
  reportIcon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(98,53,19,0.14)' },
  premium: { position: 'absolute', right: 9, top: 7, borderRadius: 14, paddingHorizontal: 8, paddingVertical: 2, backgroundColor: 'rgba(255,246,214,0.55)' },
});
