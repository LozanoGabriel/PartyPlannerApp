import { Inter_400Regular } from "@expo-google-fonts/inter/400Regular";
import { NanumPenScript_400Regular } from "@expo-google-fonts/nanum-pen-script/400Regular";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { ReactNode, useEffect } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

export function AuthPage({ children }: { children: ReactNode }) {
  const [fontsLoaded, fontError] = useFonts({ Inter_400Regular, NanumPenScript_400Regular });

  useEffect(() => {
    if (fontError) console.error("Failed to load authentication fonts:", fontError);
  }, [fontError]);

  return (
    <SafeAreaView style={styles.page}>
      <Stack.Screen options={{ headerShown: false }} />
      {!fontsLoaded ? (
        <View style={styles.status}>
          {fontError ? (
            <Text accessibilityRole="alert">Unable to load the fonts. Please restart the app.</Text>
          ) : (
            <ActivityIndicator size="large" color="#2c2c2c" accessibilityLabel="Loading screen" />
          )}
        </View>
      ) : (
        <KeyboardAvoidingView style={styles.keyboard} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

export function AuthField({ label, error, ...inputProps }: TextInputProps & { label: string; error?: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        {...inputProps}
        accessibilityLabel={label}
        accessibilityHint={error}
        placeholderTextColor="#767676"
        style={[styles.input, error && styles.invalidInput]}
      />
      {error ? <Text style={styles.error} accessibilityLiveRegion="polite">{error}</Text> : null}
    </View>
  );
}

export const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#ffa49f" },
  keyboard: { flex: 1 },
  status: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  content: { flexGrow: 1, paddingBottom: 48 },
  hero: { width: "100%", maxWidth: 480, alignSelf: "center", alignItems: "center" },
  title: {
    marginTop: 24, color: "#ffffff", fontFamily: "NanumPenScript_400Regular",
    fontSize: 50, lineHeight: 60, maxWidth: "100%", paddingHorizontal: 12, textAlign: "center",
  },
  subtitle: {
    marginTop: 8, color: "#ffffff", fontFamily: "NanumPenScript_400Regular",
    fontSize: 38, lineHeight: 46, textAlign: "center",
  },
  elephantFrame: { width: "100%", overflow: "hidden", alignItems: "center" },
  elephant: { position: "absolute" },
  card: {
    width: "77%", maxWidth: 420, alignSelf: "center", gap: 24, borderWidth: 1,
    borderColor: "#d9d9d9", borderRadius: 8, backgroundColor: "#ffffff", padding: 24,
  },
  field: { gap: 8 },
  label: { color: "#1e1e1e", fontFamily: "Inter_400Regular", fontSize: 16, lineHeight: 22.4 },
  input: {
    borderWidth: 1, borderColor: "#d9d9d9", borderRadius: 8, backgroundColor: "#ffffff",
    paddingHorizontal: 16, paddingVertical: 12, color: "#1e1e1e",
    fontFamily: "Inter_400Regular", fontSize: 16, lineHeight: 20,
  },
  invalidInput: { borderColor: "#b3261e" },
  error: { color: "#b3261e", fontFamily: "Inter_400Regular", fontSize: 14 },
  button: {
    alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#2c2c2c",
    borderRadius: 8, backgroundColor: "#2c2c2c", padding: 12,
  },
  disabled: { opacity: 0.6 },
  buttonText: { color: "#f5f5f5", fontFamily: "Inter_400Regular", fontSize: 16, lineHeight: 20 },
  googleButton: { backgroundColor: "#ffffff", borderColor: "#767676" },
  googleButtonText: { color: "#1e1e1e", fontFamily: "Inter_400Regular", fontSize: 16, lineHeight: 20, textAlign: "center" },
  link: { color: "#1e1e1e", fontFamily: "Inter_400Regular", fontSize: 16, lineHeight: 22.4, textDecorationLine: "underline" },
  signUpButton: { marginTop: 8 },
  notice: { color: "#555555", fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 20 },
});
