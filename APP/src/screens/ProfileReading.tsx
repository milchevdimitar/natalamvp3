import * as FileSystem from 'expo-file-system/legacy';
import * as IntentLauncher from 'expo-intent-launcher';
import * as Sharing from 'expo-sharing';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { ArrowLeft, ChevronLeft, ChevronRight, Download, Sparkles } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { T } from '../components/UI';
import { API_BASE_URL } from '../services/apiBase';
import { authorizedFetch } from '../services/account';
import { DetailScreen } from './Home/CelestialDetails';
import { useReducedMotion } from './Home/CosmicBackground';

type ReadingPage = { id: string; number: number; title: string; subtitle: string; paragraphs: string[] };

export function ProfileReading({ userId, onClose }: {
  userId: string; onClose: () => void;
}) {
  const reduced = useReducedMotion();
  const offset = useRef(new Animated.Value(0)).current;
  const pager = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const [width, setWidth] = useState(0);
  const [index, setIndex] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [pages, setPages] = useState<ReadingPage[]>([]);
  const [error, setError] = useState('');
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [downloadError, setDownloadError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    setError('');
    void (async () => {
      try {
        const response = await authorizedFetch(`${API_BASE_URL}/users/${encodeURIComponent(userId)}/report/reading`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: controller.signal,
        });
        const data = await response.json().catch(() => null);
        if (!response.ok || data?.pages?.length !== 13) throw new Error(data?.error || 'Could not load your reading.');
        if (!controller.signal.aborted) setPages(data.pages);
      } catch (failure) {
        if (!controller.signal.aborted) setError(failure instanceof Error ? failure.message : 'Could not load your reading.');
      }
    })();
    return () => controller.abort();
  }, [attempt, userId]);

  const handleGeneratePdf = async () => {
    if (generatingPdf) return;
    setDownloadError('');
    setGeneratingPdf(true);
    try {
      const response = await authorizedFetch(`${API_BASE_URL}/users/${encodeURIComponent(userId)}/report/pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
      setDownloadError('Could not download your PDF. Please try again.');
      console.error('PDF грешка:', err);
      Alert.alert(
        'Грешка',
        'Неуспешно генериране на AI доклад. Провери връзката със сървъра.'
      );
      setGeneratingPdf(false);
    }
  };

  const move = (next: number) => {
    if (next < 0 || next >= pages.length || !width) return;
    setIndex(next);
    pager.current?.scrollTo({ x: width * next, animated: !reduced });
  };
  const current = pages[index]?.number ?? 0;

  return <DetailScreen title="" onClose={onClose} offset={offset} reduced={reduced} darkBottom travel={width * 13} header={
    <View>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={onClose} style={styles.button}>
          <ArrowLeft color="#efe9ff" size={21} />
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Download PDF" accessibilityState={{ busy: generatingPdf }}
          onPress={handleGeneratePdf} disabled={generatingPdf} style={styles.download}>
          <LinearGradient colors={['#ffe0a5', '#eebd66', '#d49342']} style={StyleSheet.absoluteFill} pointerEvents="none" />
          {generatingPdf ? <ActivityIndicator color="#442914" size="small" /> : <Download color="#442914" size={17} />}
          <T bold size={13} style={styles.downloadInk}>Download</T>
        </Pressable>
      </View>
      {!!downloadError && <T size={13} style={styles.muted}>{downloadError}</T>}
    </View>
  }>
    <View style={styles.body} onLayout={(event) => {
      const next = event.nativeEvent.layout.width;
      if (next > 0 && next !== width) setWidth(next);
    }}>
      {error ? <View style={styles.status}>
        <T bold size={21} style={styles.text}>Reading unavailable</T>
        <T size={14} style={styles.muted}>{error}</T>
        <Pressable accessibilityRole="button" onPress={() => setAttempt((value) => value + 1)} style={styles.button}><T bold style={styles.text}>Try again</T></Pressable>
      </View> : !pages.length ? <View style={styles.status}>
        <ActivityIndicator size="large" color="#e0c5ff" />
        <T bold size={20} style={styles.text}>Preparing your cosmic report</T>
        <T size={14} style={styles.muted}>Natala is connecting the results from your profile.</T>
      </View> : width > 0 && <>
        <Animated.ScrollView
          ref={pager}
          horizontal pagingEnabled bounces={false} showsHorizontalScrollIndicator={false}
          directionalLockEnabled nestedScrollEnabled scrollEventThrottle={16}

          onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: offset } } }], {
            useNativeDriver: Platform.OS !== 'web',
            listener: (event: { nativeEvent: { contentOffset: { x: number } } }) =>
              setIndex(Math.min(12, Math.max(0, Math.round(event.nativeEvent.contentOffset.x / width)))),
          })}
        >
          {pages.map((page) => <View key={page.id} style={{ width }}>
            <ScrollView style={styles.body} nestedScrollEnabled directionalLockEnabled contentContainerStyle={styles.chapter}>
              <LinearGradient colors={['#654571', '#282c65', '#171d4a']} style={styles.orb}>
                <Sparkles color="#ffe4b5" size={page.number ? 27 : 38} />
              </LinearGradient>
              <T bold size={11} style={styles.eyebrow}>{page.number ? `CHAPTER ${String(page.number).padStart(2, '0')} / 12` : 'PROLOGUE'}</T>
              <T bold size={30} style={styles.title}>{page.title}</T>
              <T size={15} style={styles.subtitle}>{page.subtitle}</T>
              <View style={styles.card}>
                {page.paragraphs.map((paragraph, position) => <T key={position} size={15} style={styles.paragraph}>{paragraph}</T>)}
              </View>
            </ScrollView>
          </View>)}
        </Animated.ScrollView>
        <View style={styles.controls}>
          <Pressable accessibilityRole="button" accessibilityLabel="Previous page" disabled={index === 0} onPress={() => move(index - 1)} style={[styles.button, index === 0 && styles.disabled]}><ChevronLeft color="#efe9ff" size={22} /></Pressable>
          <T size={13} style={styles.muted}>{current ? `${current} of 12` : 'Introduction'}</T>
          <Pressable accessibilityRole="button" accessibilityLabel="Next page" disabled={index === 12} onPress={() => move(index + 1)} style={[styles.button, index === 12 && styles.disabled]}><ChevronRight color="#efe9ff" size={22} /></Pressable>
        </View>
      </>}
    </View>
  </DetailScreen>;
}

const styles = StyleSheet.create({
  body: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 19, paddingVertical: 8 },
  download: { minHeight: 44, minWidth: 112, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
    borderRadius: 22, paddingHorizontal: 13, overflow: 'hidden', backgroundColor: '#eebd66' },
  downloadInk: { color: '#442914' },
  text: { color: '#f8f4ff' },
  muted: { color: '#c7c8e5', textAlign: 'center' },
  status: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 25, gap: 15 },
  chapter: { width: '100%', maxWidth: 620, alignSelf: 'center', padding: 21, paddingBottom: 25, gap: 11 },
  orb: { alignSelf: 'center', width: 92, height: 92, borderRadius: 46, borderWidth: 1, borderColor: '#b9a3d280', alignItems: 'center', justifyContent: 'center', marginVertical: 6 },
  eyebrow: { color: '#ecd2a9', textAlign: 'center', letterSpacing: 2 },
  title: { color: '#f8f4ff', textAlign: 'center', lineHeight: 36 },
  subtitle: { color: '#d7caef', textAlign: 'center', lineHeight: 21 },
  card: { padding: 17, gap: 13, marginTop: 8, borderRadius: 22, borderWidth: 1, borderColor: '#878bc05e', backgroundColor: '#30356266' },
  paragraph: { color: '#f2efff', lineHeight: 23 },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', alignSelf: 'center', width: '100%', maxWidth: 360, paddingHorizontal: 24, paddingVertical: 8 },
  button: { minWidth: 44, minHeight: 44, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center', borderRadius: 22, borderWidth: 1, borderColor: '#878bc05e', backgroundColor: '#303562' },
  disabled: { opacity: 0.3 },
});
