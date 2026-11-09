import React, { useEffect, useRef, useState } from "react";
import {
  View,
  ScrollView,
  Text,
  Animated,
  Platform,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import {
  useFonts,
  DancingScript_700Bold,
} from "@expo-google-fonts/dancing-script";
import { AppProvider, useApp } from "./src/context/AppContext";
import BottomNav from "./src/components/BottomNav";
import Home from "./src/screens/Home";
import Explore from "./src/screens/Explore";
import Chat from "./src/screens/Chat";
import People from "./src/screens/People";
import Profile from "./src/screens/Profile";
import Astrology from "./src/screens/Astrology";
import MBTI from "./src/screens/MBTI";
import Tarot from "./src/screens/Tarot";
import Numerology from "./src/screens/Numerology";

function Shell() {
  const { page, colors, theme } = useApp();
  const scroll = useRef<ScrollView>(null);
  const [showSplash, setShowSplash] = useState(true);
  const fade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const timer = setTimeout(
      () =>
        Animated.timing(fade, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
        }).start(() => setShowSplash(false)),
      1050
    );
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    scroll.current?.scrollTo({ y: 0, animated: false });
  }, [page]);

  const pages: Record<string, React.ReactNode> = {
    home: <Home />,
    explore: <Explore />,
    astrology: <Astrology />,
    mbti: <MBTI />,
    tarot: <Tarot />,
    numerology: <Numerology />,
    chat: <Chat />,
    people: <People />,
    profile: <Profile />,
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ExpoStatusBar style={theme === "dark" ? "light" : "dark"} />
      <ScrollView
        ref={scroll}
        key={page}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingTop:
            Platform.OS === "web"
              ? 30
              : Math.max((StatusBar.currentHeight || 0) + 16, 28),
          paddingHorizontal: 18,
          paddingBottom: 120,
          width: "100%",
          maxWidth: 720,
          alignSelf: "center",
        }}
      >
        {pages[page]}
      </ScrollView>
      <BottomNav />
      {showSplash && (
        <Animated.View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.bg,
            opacity: fade,
          }}
        >
          <Text
            style={{
              fontFamily: "DancingScript_700Bold",
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
      <View style={{ flex: 1, justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}