import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  ScrollView,
  Text,
  Animated,
  Platform,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import {
  useFonts,
  DancingScript_700Bold,
} from '@expo-google-fonts/dancing-script';
import { AppProvider, useApp } from './src/context/AppContext';
import BottomNav from './src/components/BottomNav';
import Home from './src/screens/Home';
import Explore from './src/screens/Explore';
import Chat from './src/screens/Chat';
import People from './src/screens/People';
import Profile from './src/screens/Profile';
import Astrology from './src/screens/Astrology';
import MBTI from './src/screens/MBTI';
import Tarot from './src/screens/Tarot';
import Numerology from './src/screens/Numerology';
import Cardology from './src/screens/Cardology';
import Ayurveda from './src/screens/Ayurveda';
import Login from './src/screens/Login';
import { checkHealth } from './src/services/api';
import { registerForPushNotificationsAsync } from './src/services/notifications';

function Shell() {
  const { page, colors, theme, user } = useApp();
  const [showSplash, setShowSplash] = useState(true);
  const fade = useRef(new Animated.Value(1)).current;

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
    chat: <Chat />,
    people: <People />,
    profile: <Profile />,
    login: <Login />,
  };

  const activePageNode = !user ? <Login /> : pages[page] || <Home />;
  const isHomePage = user && page === 'home';

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ExpoStatusBar style={theme === 'dark' ? 'light' : 'dark'} />

      <View
        key={user ? page : 'login'}
        style={{
          flex: 1,
          paddingTop:
            Platform.OS === 'web'
              ? 30
              : Math.max((StatusBar.currentHeight || 0) + 16, 28),
          paddingHorizontal: 18,
          width: '100%',
          maxWidth: 720,
          alignSelf: 'center',
        }}
      >
        {isHomePage ? (
          // Home управлява собствен ScrollView с Pull-to-Refresh
          activePageNode
        ) : (
          // Всички останали страници се обвиват в ScrollView, за да могат да се скролват
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{
              paddingBottom: user ? 120 : 40,
            }}
          >
            {activePageNode}
          </ScrollView>
        )}
      </View>

      {/* Навигацията отдолу е видима само след успешен вход */}
      {user && <BottomNav />}

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
          <Text
            style={{
              fontFamily: 'DancingScript_700Bold',
              fontSize: 68,
              color: colors.purple,
            }}
          >
            Natala
          </Text>
          <Text
            style={{
              color: colors.gold,
              fontSize: 12,
              letterSpacing: 3,
              marginTop: 10,
            }}
          >
            A MOMENT OF DISCOVERY
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
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}