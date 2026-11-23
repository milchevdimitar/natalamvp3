import { ProfileReading } from './ProfileReading';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Animated, Platform, Pressable, StyleSheet, View } from 'react-native';
import { Brain, ChevronRight, Compass, FileDown, Hash, Layers, Leaf, Orbit, QrCode, Settings, Share2, Sparkles, Sun } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system/legacy';
import * as IntentLauncher from 'expo-intent-launcher';
import * as Sharing from 'expo-sharing';
import { Card, Section, T } from '../components/UI';
import { CountUp, DashboardProgressBar, DoshaTriangle, ElementSymbols, useDashboardVisibility } from '../components/DashboardCharts';
import { DOSHA_META } from './Ayurveda/ayurveda.data';
import { ProfileSettings } from './ProfileSettings';
import { ProfilePhoto } from '../components/ProfilePhoto';
import { ProfileQrCard } from '../components/ProfileQrCard';
import { profileId, shareProfile } from '../services/profileLinks';
import type { ExploreRoute } from '../data/exploreRoutes';
import { useApp } from '../context/AppContext';
import { authorizedFetch, hasFeature } from '../services/account';
import { API_BASE_URL } from '../services/api';
import { getBirthParts, getDashboardBalances, getDashboardSystems } from '../services/profileDashboard';
import { useSystemActivity } from '../services/systemActivity';

const elements = [['Fire', '#f29986'], ['Earth', '#edc58a'], ['Air', '#b9b0ff'], ['Water', '#7ac9f5']] as const;
const doshas = (['Vata', 'Pitta', 'Kapha'] as const).map((name) => [name, DOSHA_META[name].color] as const);
const systemIcons: Record<ExploreRoute, typeof Sun> = {
  astrology: Sun, numerology: Hash, mbti: Brain, cardology: Layers, tarot: Sparkles,
  ayurveda: Leaf, bazi: Compass, 'chinese-zodiac': Orbit,
};

export default function Profile({ scrollOffset }: { scrollOffset: Animated.Value }) {
  const { colors, user, setPage, account } = useApp();
  const insets = useSafeAreaInsets();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [shareNotice, setShareNotice] = useState('');
  const [readingOpen, setReadingOpen] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const activity = useSystemActivity(user?.email);
  const systems = getDashboardSystems(user, activity);
  const ready = systems.filter((system) => system.value);
  const pending = systems.filter((system) => !system.value);
  const balances = getDashboardBalances(user, activity);
  const numerology = ready.find(({ route }) => route === 'numerology');
  const astrology = ready.find(({ route }) => route === 'astrology');
  const archetype = ready.find(({ route }) => route === 'mbti');
  const ayurveda = ready.find(({ route }) => route === 'ayurveda');
  const insights = ready.filter((system) => system !== numerology && system !== astrology && system !== archetype && system !== ayurveda);
  const completion = Math.round(ready.length * 100 / systems.length);
  const visibility = useDashboardVisibility();
  const birth = getBirthParts(user);
  const name = String(user?.name || '').trim();
  const publicId = profileId(user?._id ?? user?.id);
  const photo = typeof user?.avatarUrl === 'string' ? user.avatarUrl : typeof user?.photoUrl === 'string' ? user.photoUrl : undefined;
  const birthLabel = birth && new Date(birth.year, birth.month - 1, birth.day).toLocaleDateString(undefined, { dateStyle: 'long' });
  const birthCity = typeof user?.birthCity === 'string' ? user.birthCity : user?.birthCity?.name;

  const share = async () => {
    if (!publicId) {
      setShareNotice('Sign in to a saved Natala account to share your profile.');
      return;
    }
    setShareNotice('');
    try {
      const result = await shareProfile(publicId, name);
      if (result === 'copied') setShareNotice('Profile link copied.');
    } catch (error) {
      if (!(error instanceof Error && error.name === 'AbortError')) setShareNotice('Could not share the profile link.');
    }
  };

  const handleGeneratePdf = async () => {
    if (!hasFeature(account, 'pdf-report')) { setPage('subscription'); return; }
    const userId = user?._id || user?.id;
    if (!userId) {
      Alert.alert('Грешка', 'Липсва ID на потребителя.');
      return;
    }

    setGeneratingPdf(true);
    try {
      const response = await authorizedFetch(`${API_BASE_URL}/users/${userId}/report/pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tarot: activity?.tarot }),
      });

      if (!response.ok) {
        throw new Error('Сървърът върна грешка при генерирането.');
      }

      const blob = await response.blob();
      if (!blob.size || !response.headers.get('content-type')?.includes('application/pdf')) {
        throw new Error('The server did not return a PDF.');
      }
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
        setTimeout(() => window.URL.revokeObjectURL(url), 1000);
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
    <Animated.ScrollView
      onLayout={visibility.onLayout}
      onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollOffset } } }], {
        useNativeDriver: Platform.OS !== 'web',
        listener: visibility.onScroll,
      })}
      scrollEventThrottle={16}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[styles.content, { paddingTop: Platform.OS === 'web' ? 22 : insets.top + 12, paddingBottom: insets.bottom + 126 }]}
    >
      <View style={styles.header}>
        <T size={40} style={styles.logo}>Natala</T>
        <Pressable accessibilityRole="button" accessibilityLabel="Open settings" onPress={() => setSettingsOpen(true)} style={[styles.settings, { borderColor: colors.line, backgroundColor: colors.surfaceAlt }]}>
          <Settings size={18} color={colors.text} />
        </Pressable>
      </View>
      <View style={styles.identity}>
        <ProfilePhoto name={name} source={photo} />
        <T bold size={36} style={styles.name}>{name || 'Your profile'}</T>
        {(birthLabel || birthCity || user?.email) && <T muted size={12} style={{ textAlign: 'center' }}>{[birthLabel, birthCity].filter(Boolean).join(' · ') || user?.email}</T>}
        <View style={styles.shareActions}>
          <Pressable accessibilityRole="button" accessibilityLabel="Share profile" onPress={share} style={[styles.shareAction, { borderColor: colors.line, backgroundColor: colors.purpleSoft }]}><Share2 color={colors.purple} size={20} /></Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Show profile QR code" onPress={() => {
            if (publicId) { setShareNotice(''); setQrOpen(true); }
            else setShareNotice('Sign in to a saved Natala account to show a QR code.');
          }} style={[styles.shareAction, { borderColor: colors.line, backgroundColor: colors.purpleSoft }]}><QrCode color={colors.purple} size={20} /></Pressable>
        </View>
        {!!shareNotice && !qrOpen && <T muted size={12}>{shareNotice}</T>}
      </View>

      <View style={styles.metricsGroup} onLayout={visibility.section('metrics')}>
        <View style={styles.metrics}>
          <Card onPress={() => setPage('numerology')} style={[styles.metric, { backgroundColor: 'rgba(119,74,141,0.28)' }]}>
            <Hash size={22} color={colors.gold} />
            {numerology?.value ? <CountUp value={Number(numerology.value)} active={!!visibility.visible.metrics} color={colors.text} /> : <T bold size={26}>—</T>}
            <T bold size={11} style={styles.center}>Life path</T>
          </Card>
          <Card onPress={() => setPage('astrology')} style={styles.metric}>
            <Sun size={22} color={colors.gold} />
            <T bold size={15} style={styles.center}>{astrology?.value || '—'}</T>
            <T bold size={11} style={styles.center}>Sun sign</T>
          </Card>
          <Card onPress={() => setPage('mbti')} style={styles.metric}>
            <Brain size={22} color={colors.purple} />
            <T bold size={15} style={styles.center}>{archetype?.value || '—'}</T>
            <T bold size={11} style={styles.center}>16 archetypes</T>
          </Card>
        </View>
        <Card style={styles.completion}>
          <View style={styles.completionHeading}>
            <T bold size={12}>Discovery</T>
            <CountUp value={completion} suffix="%" active={!!visibility.visible.metrics} size={13} color={colors.text} />
          </View>
          <DashboardProgressBar value={completion} active={!!visibility.visible.metrics} />
          <T muted size={11}>{ready.length} of {systems.length} systems ready</T>
        </Card>
      </View>

      <View onLayout={visibility.section('elements')}>
        <Section>Element balance</Section>
        <Card style={styles.elementChart}>
          {!balances.elements && <T muted size={12}>Element proportions appear when a natal chart has saved element data.</T>}
          <ElementSymbols categories={elements} values={balances.elements} active={!!visibility.visible.elements} />
        </Card>
      </View>

      <View onLayout={visibility.section('ayurveda')}>
        <Section>Ayurveda balance</Section>
        <Card style={styles.ayurvedaChart} onPress={() => setPage('ayurveda')}>
          <DoshaTriangle categories={doshas} values={balances.doshas} active={!!visibility.visible.ayurveda} />
          {!balances.doshas && <View style={styles.chartLink}>
            <T size={12} style={{ color: colors.purple }}>Open the Ayurveda assessment</T><ChevronRight size={15} color={colors.purple} />
          </View>}
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

      <Card style={styles.reading} onPress={() => {
        if (!hasFeature(account, 'pdf-report')) { setPage('subscription'); return; }
        if (publicId) setReadingOpen(true);
      }}>
        <View style={styles.readingIcon}><Sparkles size={22} color="#e6ceff" /></View>
        <View style={{ flex: 1, gap: 4 }}>
          <T bold size={17}>Your Cosmic Report</T>
          <T muted size={12}>A personalized AI reading in 12 chapters</T>
        </View>
        <ChevronRight size={18} color={colors.muted} />
      </Card>

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
    </Animated.ScrollView>
    {readingOpen && publicId && <ProfileReading userId={publicId} tarot={activity?.tarot} onClose={() => setReadingOpen(false)} />}
    {settingsOpen && <ProfileSettings birthLabel={birthLabel} birthCity={birthCity} onClose={() => setSettingsOpen(false)} />}
    {qrOpen && publicId && <ProfileQrCard id={publicId} name={name || 'Natala profile'} photo={photo} onClose={() => setQrOpen(false)} onShare={share} notice={shareNotice} />}
    </>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 19, gap: 13 },
  header: { width: '100%', maxWidth: 442, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  logo: { fontFamily: 'DancingScript_700Bold', lineHeight: 49 },
  settings: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  identity: { alignItems: 'center', paddingTop: 7, paddingBottom: 16, gap: 6 },
  shareActions: { flexDirection: 'row', gap: 9, paddingTop: 6 },
  shareAction: { width: 45, height: 45, borderRadius: 23, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  name: { textAlign: 'center', lineHeight: 41, letterSpacing: -1.2 },
  metricsGroup: { gap: 8 },
  metrics: { flexDirection: 'row', gap: 8 },
  metric: { flex: 1, minWidth: 0, minHeight: 122, paddingHorizontal: 4, paddingVertical: 10, gap: 3, alignItems: 'center', justifyContent: 'center', borderRadius: 21 },
  center: { textAlign: 'center' },
  completion: { gap: 6, paddingVertical: 11, paddingHorizontal: 15, borderRadius: 21 },
  completionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  elementChart: { gap: 8, paddingHorizontal: 12, paddingVertical: 10 },
  ayurvedaChart: { gap: 6, paddingHorizontal: 15, paddingVertical: 10 },
  chartHeading: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  chartLink: { minHeight: 40, flexDirection: 'row', alignItems: 'center', gap: 5 },
  insights: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  insight: { width: '47%', flexGrow: 1, minHeight: 90, padding: 13, gap: 5, borderRadius: 20 },
  pending: { paddingHorizontal: 15, paddingVertical: 4 },
  copy: { flex: 1, minWidth: 0, gap: 2 },
  next: { minHeight: 57, flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  reading: { minHeight: 87, marginBottom: 11, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, backgroundColor: 'rgba(66,58,126,0.43)' },
  readingIcon: { width: 45, height: 45, borderRadius: 23, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(141,110,194,0.3)' },
  report: { position: 'relative', flexDirection: 'row', alignItems: 'center', minHeight: 96, paddingHorizontal: 13, paddingVertical: 24, gap: 10, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: '#ffe3a5' },
  reportInk: { color: '#442914' },
  reportIcon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(98,53,19,0.14)' },
  premium: { position: 'absolute', right: 9, top: 7, borderRadius: 14, paddingHorizontal: 8, paddingVertical: 2, backgroundColor: 'rgba(255,246,214,0.55)' },
});
