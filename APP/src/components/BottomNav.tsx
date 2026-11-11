import React from "react";
import { View, Pressable, Text, Platform } from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import {
  House,
  Compass,
  MessageCircle,
  UsersRound,
  UserRound,
} from "lucide-react-native";
import { useApp, Page } from "../context/AppContext";

const items: [Page, string, any][] = [
  ["home", "Home", House],
  ["explore", "Explore", Compass],
  ["chat", "Chat", MessageCircle],
  ["people", "People", UsersRound],
  ["profile", "Profile", UserRound],
];

export default function BottomNav() {
  const { page, setPage, colors, theme } = useApp();

  const isDark = theme === "dark";

  return (
    <View
      style={{
        position: "absolute",
        bottom: Platform.OS === "web" ? 16 : 13,
        left: 16,
        right: 16,
        alignItems: "center",
        pointerEvents: "box-none",
      }}
    >
      <View
        style={{
          width: "100%",
          maxWidth: 530,
          borderRadius: 28,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: colors.line,
        }}
      >
        <BlurView
          intensity={80}
          tint={isDark ? "dark" : "light"}
          experimentalBlurMethod="dimezisBlurView"
          style={{ width: "100%" }}
        >
          <LinearGradient
            colors={
              isDark
                ? ["rgba(37, 33, 54, 0.75)", "rgba(15, 13, 21, 0.85)"]
                : ["rgba(255, 255, 255, 0.85)", "rgba(240, 238, 248, 0.75)"]
            }
            style={{
              padding: 6,
              flexDirection: "row",
              justifyContent: "space-between",
            }}
          >
            {items.map(([id, label, Icon]) => (
              <Pressable
                key={id}
                onPress={() => setPage(id)}
                accessibilityRole="tab"
                accessibilityState={{ selected: page === id }}
                style={{
                  flex: 1,
                  height: 58,
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 3,
                  borderRadius: 21,
                  backgroundColor:
                    page === id ? colors.purpleSoft : "transparent",
                }}
              >
                <View style={{ position: "relative" }}>
                  <Icon
                    size={23}
                    strokeWidth={page === id ? 2.4 : 1.9}
                    color={page === id ? colors.purple : colors.muted}
                  />
                  {id === "chat" && (
                    <View
                      style={{
                        position: "absolute",
                        right: -5,
                        top: -4,
                        width: 13,
                        height: 13,
                        borderRadius: 7,
                        backgroundColor: "#E65B63",
                        borderWidth: 2,
                        borderColor: colors.surface,
                      }}
                    />
                  )}
                </View>
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: page === id ? "700" : "500",
                    color: page === id ? colors.purple : colors.muted,
                  }}
                >
                  {label}
                </Text>
              </Pressable>
            ))}
          </LinearGradient>
        </BlurView>
      </View>
    </View>
  );
}