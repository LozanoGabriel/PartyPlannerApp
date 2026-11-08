import { Stack } from "expo-router";
import { EventSettingsProvider } from "../../components/event-settings-context";

export default function CreateEventLayout() {
  return (
    <EventSettingsProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </EventSettingsProvider>
  );
}
