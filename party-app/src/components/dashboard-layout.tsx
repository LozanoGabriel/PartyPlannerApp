import { DMSans_400Regular } from "@expo-google-fonts/dm-sans/400Regular";
import { DMSans_700Bold } from "@expo-google-fonts/dm-sans/700Bold";
import { NanumPenScript_400Regular } from "@expo-google-fonts/nanum-pen-script/400Regular";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useFonts } from "expo-font";
import { Href, router, Stack } from "expo-router";
import { ReactNode, RefObject, useEffect } from "react";
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const galaIcon = require("../../assets/images/navbar_gala_button.png");
type NavPage = "Home" | "Events" | "Tasks" | "Gala";
const links: { label: NavPage; href: Href; icon: "home-outline" | "calendar-outline" | "checkbox-outline" | null }[] = [
  { label: "Home", href: "/dashboard", icon: "home-outline" },
  { label: "Events", href: "/events", icon: "calendar-outline" },
  { label: "Tasks", href: "/tasks", icon: "checkbox-outline" },
  { label: "Gala", href: "/gala", icon: null },
];

export function DashboardLayout({ children, active, showNavigation = true, compactContent = false, onNavigate, overlay, scrollRef, onContentSizeChange }: {
  children: ReactNode;
  active?: NavPage;
  showNavigation?: boolean;
  compactContent?: boolean;
  onNavigate?: (href: Href) => void;
  overlay?: ReactNode;
  scrollRef?: RefObject<ScrollView | null>;
  onContentSizeChange?: (width: number, height: number) => void;
}) {
  const [loaded, error] = useFonts({
    DMSans_400Regular,
    DMSans_700Bold,
    NanumPenScript_400Regular,
    ...Ionicons.font,
  });

  useEffect(() => {
    if (error) console.error("Failed to load dashboard fonts:", error);
  }, [error]);

  return (
    <SafeAreaView style={layout.page}>
      <Stack.Screen options={{ headerShown: false }} />
      {!loaded ? (
        <View style={layout.status}>
          {error ? (
            <Text accessibilityRole="alert">Unable to load the dashboard fonts. Please restart the app.</Text>
          ) : (
            <ActivityIndicator size="large" color="#2c2c2c" accessibilityLabel="Loading page" />
          )}
        </View>
      ) : (
        <>
          <KeyboardAvoidingView style={layout.scrollArea} behavior={Platform.OS === "ios" ? "padding" : undefined}>
            <ScrollView ref={scrollRef} onContentSizeChange={onContentSizeChange} contentContainerStyle={[layout.content, compactContent && layout.compactContent]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {children}
            </ScrollView>
          </KeyboardAvoidingView>
          {showNavigation && <View style={layout.navbar}>
            {links.map(({ label, href, icon }) => (
              <Pressable
                key={label}
                accessibilityRole="link"
                accessibilityLabel={label}
                accessibilityState={{ selected: active === label }}
                onPress={() => {
                  if (onNavigate) onNavigate(href);
                  else if (active !== label) router.replace(href);
                }}
                style={layout.navItem}
              >
                {icon ? <Ionicons name={icon} size={26} color="#ffffff" /> : (
                  <Image source={galaIcon} style={layout.galaIcon} resizeMode="contain" accessible={false} />
                )}
                <Text style={[layout.navLabel, active === label && layout.selected]}>{label}</Text>
              </Pressable>
            ))}
          </View>}
          {overlay && <View pointerEvents="box-none" style={layout.overlay}>{overlay}</View>}
        </>
      )}
    </SafeAreaView>
  );
}

export function DashboardPlaceholder({ title, active }: { title: string; active?: NavPage }) {
  return (
    <DashboardLayout active={active}>
      <View style={layout.placeholder}>
        <Text style={layout.placeholderTitle} accessibilityRole="header">{title}</Text>
        <Text style={layout.placeholderText}>This page is a preview and is not connected yet.</Text>
        {title === "Settings" && (
          <Pressable accessibilityRole="link" onPress={() => router.replace("/login")}>
            <Text style={layout.backLink}>Back to sign in</Text>
          </Pressable>
        )}
      </View>
    </DashboardLayout>
  );
}

const layout = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#ffa49f" },
  status: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  scrollArea: { flex: 1 },
  content: { flexGrow: 1, width: "100%", maxWidth: 600, alignSelf: "center", paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24 },
  compactContent: { paddingHorizontal: 12, paddingVertical: 12 },
  navbar: {
    width: "90%", maxWidth: 560, alignSelf: "center", flexDirection: "row",
    justifyContent: "space-around", backgroundColor: "#c65d58", borderRadius: 60,
    paddingHorizontal: 8, paddingVertical: 8, marginBottom: 12,
  },
  navItem: { flex: 1, alignItems: "center", justifyContent: "center", minHeight: 52, gap: 2 },
  navLabel: { color: "#ffffff", fontFamily: "DMSans_400Regular", fontSize: 12 },
  selected: { fontFamily: "DMSans_700Bold", textDecorationLine: "underline" },
  galaIcon: { width: 30, height: 30 },
  overlay: { position: "absolute", bottom: 88, left: 16, right: 16, alignItems: "center" },
  placeholder: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16 },
  placeholderTitle: { color: "#ffffff", fontFamily: "DMSans_700Bold", fontSize: 30 },
  placeholderText: { color: "#3d2423", fontFamily: "DMSans_400Regular", fontSize: 16, textAlign: "center" },
  backLink: { color: "#3d2423", fontFamily: "DMSans_700Bold", fontSize: 16, textDecorationLine: "underline" },
});
