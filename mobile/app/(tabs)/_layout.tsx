import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import type { ComponentProps } from "react";
import { Platform, StyleSheet, View } from "react-native";

import { colors } from "@/constants/theme";

type IconName = ComponentProps<typeof Ionicons>["name"];

function TabIcon({ name, color, focused, prominent = false }: {
  name: IconName;
  color: string;
  focused: boolean;
  prominent?: boolean;
}) {
  if (prominent) {
    return (
      <View style={[styles.prominentIcon, focused && styles.prominentIconFocused]}>
        <Ionicons name={name} size={25} color={colors.white} />
      </View>
    );
  }
  return <Ionicons name={name} size={22} color={color} />;
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: styles.label,
        tabBarStyle: styles.tabBar,
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Главная",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? "home" : "home-outline"} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="services"
        options={{
          title: "Услуги",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? "sparkles" : "sparkles-outline"} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="book"
        options={{
          title: "Записаться",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="add" color={color} focused={focused} prominent />
          ),
        }}
      />
      <Tabs.Screen
        name="specialists"
        options={{
          title: "Мастера",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? "people" : "people-outline"} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="appointments"
        options={{
          title: "Записи",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? "calendar" : "calendar-outline"} color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: Platform.OS === "ios" ? 86 : 68,
    paddingTop: 8,
    paddingBottom: Platform.OS === "ios" ? 22 : 10,
    borderTopColor: colors.line,
    backgroundColor: colors.surface,
  },
  label: { fontSize: 10, fontWeight: "700" },
  prominentIcon: {
    width: 44,
    height: 44,
    marginTop: -15,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accent,
    borderWidth: 3,
    borderColor: colors.surface,
    shadowColor: colors.accentDark,
    shadowOpacity: 0.24,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  prominentIconFocused: { backgroundColor: colors.accentDark },
});
