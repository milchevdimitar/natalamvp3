import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, ChevronRight, Heart, MessageCircle, Sparkles, UserRoundPlus } from 'lucide-react-native';
import { BackButton, backHeaderSpacing } from '../components/BackButton';
import { Card, Section, T } from '../components/UI';
import { useApp } from '../context/AppContext';

export default function NotificationsScreen() {
  const { colors, notifications, notificationsUnavailable, goBack, setPage, setSelectedChat } = useApp();
  return <SafeAreaView style={styles.screen}>
    <View style={styles.header}>
      <BackButton onPress={() => goBack('home')} />
      <View style={styles.heading}><T bold size={20}>Notifications</T></View>
      <View style={styles.spacer} />
    </View>
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {notifications === null ? <T muted style={styles.center}>{notificationsUnavailable ? 'Could not load notifications. Retrying…' : 'Loading notifications…'}</T>
        : !notifications.length ? <Card style={styles.empty}>
          <Bell size={25} color={colors.purple} />
          <T bold size={16}>You’re all caught up</T>
          <T muted size={13} style={styles.center}>New activity will appear here.</T>
        </Card>
        : <>
          <Section>Activity</Section>
          {notifications.map(({ id, kind, title, body, date, chatId, mirrorId, friendId }) => {
            const Icon = mirrorId || friendId ? Sparkles : kind === 'chat' ? MessageCircle : kind === 'match' ? Heart : UserRoundPlus;
            return <Card key={id} style={styles.row} onPress={() => {
              if (friendId) { setPage('constellation', friendId); return; }
              if (mirrorId) { setPage('mirror-session', mirrorId); return; }
              if (kind === 'chat' && chatId) setSelectedChat({ chatId });
              setPage(kind === 'chat' ? 'chat' : kind === 'match' ? 'dating' : 'people');
            }}>
              <View style={[styles.icon, { backgroundColor: colors.purpleSoft }]}><Icon size={19} color={colors.purple} /></View>
              <View style={styles.text}>
                <T bold size={14}>{title}</T>
                <T muted size={12} numberOfLines={2}>{body}</T>
                {!!date && <T muted size={11}>{new Date(date).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</T>}
              </View>
              <ChevronRight size={16} color={colors.muted} />
            </Card>;
          })}
        </>}
    </ScrollView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { ...backHeaderSpacing, flexDirection: 'row', alignItems: 'center', paddingBottom: 10 },
  heading: { flex: 1, alignItems: 'center' },
  spacer: { width: 44 },
  content: { paddingHorizontal: 18, paddingBottom: 26, gap: 9 },
  row: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 11 },
  icon: { width: 39, height: 39, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1, gap: 2 },
  empty: { alignItems: 'center', paddingVertical: 24, gap: 7 },
  center: { textAlign: 'center' },
});
