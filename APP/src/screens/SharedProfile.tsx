import { StarField } from '../components/StarField';
import { BackButton } from '../components/BackButton';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, Modal, Pressable, StyleSheet, View } from 'react-native';
import { MessageCircle, UserPlus, X } from 'lucide-react-native';
import { Card, Pill, Section, T } from '../components/UI';
import { ProfileAvatar } from '../components/ProfileAvatar';
import { useApp } from '../context/AppContext';
import { fetchSharedProfile, likeOrRequestPerson, type SharedProfile as SharedProfileData } from '../services/peopleService';

export default function SharedProfile({ id }: { id: string }) {
  const { colors, user, setPage, goBack, setSelectedChat } = useApp();
  const [profile, setProfile] = useState<SharedProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState('');
  const [story, setStory] = useState<SharedProfileData['stories'][number] | null>(null);

  const load = useCallback(async (attempt: { cancelled: boolean }) => {
    setLoading(true);
    setNotice('');
    try {
      const result = await fetchSharedProfile(user, id);
      if (!attempt.cancelled) setProfile(result);
    } catch (error) {
      if (!attempt.cancelled) setNotice(error instanceof Error ? error.message : 'Could not load this profile.');
    } finally {
      if (!attempt.cancelled) setLoading(false);
    }
  }, [id, user]);

  useEffect(() => {
    const attempt = { cancelled: false };
    void load(attempt);
    return () => { attempt.cancelled = true; };
  }, [load]);

  const add = async () => {
    if (!profile || sending) return;
    setSending(true);
    setNotice('');
    try {
      const result = await likeOrRequestPerson(user, profile.id);
      if (result.matched) await load({ cancelled: false });
      else setProfile({ ...profile, relationship: 'pending' });
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Could not send the request.');
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <BackButton onPress={() => goBack('people')} />
      {loading && !profile && <ActivityIndicator style={styles.loader} color={colors.purple} />}
      {!!notice && <Card style={{ marginBottom: 12, gap: 8 }}><T muted size={13}>{notice}</T>{!profile && <Pill onPress={() => load({ cancelled: false })}>Try again</Pill>}</Card>}
      {profile && <>
        <Card style={styles.identity}>
          <ProfileAvatar name={profile.name} source={profile.avatarUrl} />
          <T bold size={27} style={{ textAlign: 'center' }}>{profile.name}</T>
          {!!profile.bio && <T muted size={13} style={{ textAlign: 'center' }}>{profile.bio}</T>}
          {!!profile.interests?.length && <T muted size={12} style={{ textAlign: 'center' }}>{profile.interests.join(' · ')}</T>}
          {profile.relationship === 'available' && <Pill selected disabled={sending} onPress={add}><UserPlus size={14} color={colors.purple} /> {sending ? 'Sending…' : 'Add connection'}</Pill>}
          {profile.relationship === 'pending' && <T muted size={12}>Connection request sent</T>}
          {profile.relationship === 'friend' && profile.chatEmail && <Pill selected onPress={() => {
            setSelectedChat({ targetUser: profile.chatEmail });
            setPage('chat');
          }}><MessageCircle size={15} color={colors.purple} />  Chat</Pill>}
          {profile.relationship === 'self' && <Pill onPress={() => setPage('profile')}>My profile</Pill>}
        </Card>
        <Section>Stories</Section>
        {profile.stories.length ? <View style={styles.stories}>
          {profile.stories.map((entry, index) => (
            <Pressable key={entry.id} accessibilityRole="button" accessibilityLabel={'Open story ' + (index + 1)} onPress={() => setStory(entry)} style={[styles.thumbnail, { borderColor: colors.line, backgroundColor: colors.surface }]}>
              <Image source={{ uri: entry.imageUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
            </Pressable>
          ))}
        </View> : <Card><T muted size={13}>No active stories.</T></Card>}
      </>}
      {story && <Modal visible transparent animationType="fade" onRequestClose={() => setStory(null)}>
        <View style={styles.storyBackdrop}>
          <StarField subtle />
          <Pressable accessibilityRole="button" accessibilityLabel="Close story" onPress={() => setStory(null)} style={styles.storyClose}><X size={24} color="#fff" /></Pressable>
          <Image source={{ uri: story.imageUrl }} resizeMode="contain" style={styles.storyImage} />
        </View>
      </Modal>}
    </>
  );
}

const styles = StyleSheet.create({
  back: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 9 },
  loader: { marginTop: 24 },
  identity: { alignItems: 'center', gap: 10, paddingVertical: 22, marginBottom: 9 },
  stories: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  thumbnail: { width: 82, height: 113, overflow: 'hidden', borderRadius: 16, borderWidth: 1 },
  storyBackdrop: { flex: 1, backgroundColor: '#050817', justifyContent: 'center', alignItems: 'center' },
  storyImage: { width: '100%', height: '86%' },
  storyClose: { position: 'absolute', top: 44, right: 15, width: 44, height: 44, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
});
