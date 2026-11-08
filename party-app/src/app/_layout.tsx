import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { EventPreviewProvider } from "../components/event-preview-context";
import { AppPreferencesProvider, useAppPreferences } from "../components/app-preferences";
import { NotificationPreviewProvider } from "../components/notification-preview";
import { StartupSplash } from "../components/startup-splash";
import { useCallback, useState } from "react";
import { View } from "react-native";

export default function RootLayout() {
  return (
    <AppPreferencesProvider>
      <EventPreviewProvider>
        <NotificationPreviewProvider>
          <AppStack />
        </NotificationPreviewProvider>
      </EventPreviewProvider>
    </AppPreferencesProvider>
  );
}

function AppStack() {
  const { darkMode } = useAppPreferences();
  const [starting, setStarting] = useState(true);
  const finishStartup = useCallback(() => setStarting(false), []);
  return (
    <View style={{ flex: 1 }}>
      <StatusBar style={darkMode ? "light" : "dark"} />
      <View style={{ flex: 1 }} accessibilityElementsHidden={starting} importantForAccessibility={starting ? "no-hide-descendants" : "auto"} aria-hidden={starting}>
        <Stack>
          <Stack.Screen name="create-event" options={{ headerShown: false }} />
        </Stack>
      </View>
      {starting && <StartupSplash onFinish={finishStartup} />}
    </View>
  );
}
