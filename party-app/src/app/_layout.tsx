import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="create-event" options={{ headerShown: false }} />
    </Stack>
  );
}
