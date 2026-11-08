import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { EventPreviewProvider } from "../components/event-preview-context";
import { AppPreferencesProvider, useAppPreferences } from "../components/app-preferences";
import { NotificationPreviewProvider } from "../components/notification-preview";

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
  return (
    <>
      <StatusBar style={darkMode ? "light" : "dark"} />
      <Stack>
        <Stack.Screen name="create-event" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}
