import { Stack } from "expo-router";
import { EventPreviewProvider } from "../components/event-preview-context";

export default function RootLayout() {
  return (
    <EventPreviewProvider>
      <Stack>
        <Stack.Screen name="create-event" options={{ headerShown: false }} />
      </Stack>
    </EventPreviewProvider>
  );
}
