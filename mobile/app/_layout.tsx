import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { colors } from "@/constants/theme";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack
        screenOptions={{
          contentStyle: { backgroundColor: colors.canvas },
          headerShadowVisible: false,
          headerTintColor: colors.ink,
          headerStyle: { backgroundColor: colors.canvas },
          headerBackTitle: "Назад",
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="booking-success"
          options={{ title: "Запись создана", presentation: "modal", gestureEnabled: false }}
        />
      </Stack>
      <StatusBar style="dark" backgroundColor={colors.canvas} />
    </GestureHandlerRootView>
  );
}
