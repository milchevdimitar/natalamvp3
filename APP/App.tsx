import { hasFeature, isPlanFeature } from './src/services/account';
import { ProfileSettings } from './src/screens/ProfileSettings';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Animated,
  Platform,
  StatusBar,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { BlurTargetView } from 'expo-blur';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts,
  DancingScript_700Bold,
} from '@expo-google-fonts/dancing-script';
import { AppProvider, useApp } from './src/context/AppContext';
import BottomNav from './src/components/BottomNav';
import { ShootingStar } from './src/components/ShootingStar';
import Home from './src/screens/Home';
import { CosmicBackground, useReducedMotion } from './src/screens/Home/CosmicBackground';
import { isCosmicPage } from './src/theme/cosmic';
import Explore from './src/screens/Explore';
import Chat from './src/screens/Chat';
import People from './src/screens/People';
import Feed from './src/screens/Feed';
import Profile from './src/screens/Profile';
import SharedProfile from './src/screens/SharedProfile';
import { profileFromLink } from './src/services/profileLinks';
import Astrology from './src/screens/Astrology';
import MBTI from './src/screens/MBTI';
import Tarot from './src/screens/Tarot';
import Numerology from './src/screens/Numerology';
import Cardology from './src/screens/Cardology';
import Ayurveda from './src/screens/Ayurveda';
import BaZi from './src/screens/BaZi';
import ChineseZodiac from './src/screens/ChineseZodiac';
import Login from './src/screens/Login';
import { checkHealth } from './src/services/api';
import { registerForPushNotificationsAsync } from './src/services/notifications';

function Shell() {
  const { page, setPage, colors, theme, user, hideBottomNav, account, restoring } = useApp();
  const [pendingProfile, setPendingProfile] = useState<string | null>(null);
  const [sharedProfile, setSharedProfile] = useState<string | null>(null);
  const [showSplash, setShowSplash] = useState(true);
  const fade = useRef(new Animated.Value(1)).current;
  const navBlurTarget = useRef<React.ComponentRef<typeof BlurTargetView>>(null);
  const cosmicHome = !!user && page === 'home';
  const cosmicTab = !!user && isCosmicPage(page);
  const reducedMotion = useReducedMotion();
  const tabScroll = useRef(new Animated.Value(0)).current;
  const openSharedProfile = useCallback((id: string) => setPendingProfile(id), []);

  useEffect(() => {
    let mounted = true;
    const handle = (url: string | null | undefined) => {
      if (!url || !mounted) return;
      const id = profileFromLink(url, Platform.OS === 'web' ? window.location.origin : undefined);
      if (id) openSharedProfile(id);
    };
    void Linking.getInitialURL().then(handle).catch(() => undefined);
    const subscription = Linking.addEventListener('url', ({ url }) => handle(url));
    return () => { mounted = false; subscription.remove(); };
  }, [openSharedProfile]);

  useEffect(() => {
    if (!user || !pendingProfile) return;
    setSharedProfile(pendingProfile);
    setPage('shared-profile');
    setPendingProfile(null);
  }, [pendingProfile, setPage, user]);

  useEffect(() => {
    tabScroll.setValue(0);
  }, [page, tabScroll]);

  useEffect(() => {
    // Регистрация на права за нотификации в Android/iOS
    registerForPushNotificationsAsync();

    checkHealth().then((status) => {
      if (status.dbConnected) {
        console.log('🟢 Свързан с MongoDB Atlas! DB:', status.databaseName);
      } else {
        console.log('🔴 Офлайн режим: Сървърът не е достъпен.');
      }
    });

    const timer = setTimeout(
      () =>
        Animated.timing(fade, {
          toValue: 0,
          duration: 350,
          useNativeDriver: Platform.OS !== 'web',
        }).start(() => setShowSplash(false)),
      1050
    );
    return () => clearTimeout(timer);
  }, []);

  const pages: Record<string, React.ReactNode> = {
    home: <Home />,
    explore: <Explore />,
    astrology: <Astrology />,
    mbti: <MBTI />,
    tarot: <Tarot />,
    numerology: <Numerology />,
    cardology: <Cardology />,
    ayurveda: <Ayurveda />,
    bazi: <BaZi />,
    'chinese-zodiac': <ChineseZodiac />,
    chat: <Chat onOpenProfile={openSharedProfile} />,
    people: <People onOpenProfile={openSharedProfile} />,
    feed: <Feed />,
    profile: <Profile scrollOffset={tabScroll} />,
    'shared-profile': sharedProfile ? <SharedProfile key={sharedProfile} id={sharedProfile} /> : <People onOpenProfile={openSharedProfile} />,
    login: <Login />,
  };

  const gated = isPlanFeature(page) && !hasFeature(account, page);
  const showSubscription = page === 'subscription' || gated;
  const activePageNode = restoring ? null : !user ? <Login /> : showSubscription
    ? <ProfileSettings initialSubscription onClose={() => setPage(gated ? 'explore' : 'profile')} />
    : pages[page] || <Home />;

  // Страниците Login, Home, Chat и Feed управляват сами своя скрол и клавиатура
  const isFullHeightPage =
    !user || showSubscription || page === 'login' || page === 'home' || page === 'chat' || page === 'feed' || page === 'profile';
  const topInset = Platform.OS === 'web' ? 30 : Math.max((StatusBar.currentHeight || 0) + 16, 28);

  return (
    <View style={{ flex: 1, backgroundColor: page === 'feed' ? '#000000' : colors.bg }}>
      <ExpoStatusBar style={!user || cosmicHome || theme === 'dark' ? 'light' : 'dark'} />

      <BlurTargetView ref={navBlurTarget} style={{ flex: 1 }}>
      {cosmicTab && <CosmicBackground offset={tabScroll} reduced={reducedMotion} light={theme === 'light'} />}
      {!cosmicTab && !cosmicHome && <ShootingStar reduced={reducedMotion} light={page !== 'feed' && theme === 'light'} />}
      <View
        key={user ? page : 'login'}
        style={{
          flex: 1,
          paddingTop: !user || cosmicHome || page === 'profile' || page === 'explore' ? 0 : topInset,
          paddingHorizontal: !user || cosmicHome || page === 'feed' || page === 'profile' ? 0 : 18,
          width: '100%',
          maxWidth: !user || cosmicHome || page === 'feed' ? '100%' : cosmicTab ? 620 : 720,
          alignSelf: 'center',
        }}
      >
        {isFullHeightPage ? (
          activePageNode
        ) : (
          <Animated.ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            scrollEventThrottle={cosmicTab ? 16 : undefined}
            onScroll={cosmicTab ? Animated.event([{ nativeEvent: { contentOffset: { y: tabScroll } } }], { useNativeDriver: Platform.OS !== 'web' }) : undefined}
            contentContainerStyle={{
              paddingTop: page === 'explore' ? topInset : 0,
              paddingBottom: user ? 120 : 40,
            }}
          >
            {activePageNode}
          </Animated.ScrollView>
        )}
      </View>
      </BlurTargetView>

      {/* Навигацията отдолу е видима само след успешен вход и когато hideBottomNav не е активен */}
      {user && !hideBottomNav && <BottomNav blurTarget={navBlurTarget} />}

      {showSplash && (
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.bg,
            opacity: fade,
          }}
        >
          <CosmicBackground offset={tabScroll} reduced />
          <Text
            style={{
              fontFamily: 'DancingScript_700Bold',
              fontSize: 68,
              color: '#f8faff',
            }}
          >
            Natala
          </Text>
        </Animated.View>
      )}
    </View>
  );
}

export default function App() {
  const [loaded] = useFonts({ DancingScript_700Bold });
  if (!loaded)
    return (
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  return (
    <SafeAreaProvider>
      <AppProvider>
        <Shell />
      </AppProvider>
    </SafeAreaProvider>
  );
}
