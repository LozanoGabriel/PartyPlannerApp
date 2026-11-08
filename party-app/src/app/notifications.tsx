import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { useState } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { useAppPreferences } from "../components/app-preferences";
import { DashboardLayout } from "../components/dashboard-layout";
import { darkPalette } from "../components/dark-palette";
import { GatherBrand } from "../components/gather-brand";
import { useNotificationPreview } from "../components/notification-preview";
import { usePreviewProgress } from "../components/use-preview-progress";

export default function NotificationsScreen() {
  const { darkMode } = useAppPreferences();
  const { notifications, unreadCount, markRead, markAllRead } = useNotificationPreview();
  const { progress } = usePreviewProgress();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [menu, setMenu] = useState<string | null>(null);

  return (
    <DashboardLayout>
      <GatherBrand />
      <View style={styles.panel}>
        <Text style={styles.title} accessibilityRole="header">Notifications</Text>
        <Text style={styles.subtitle}>A little update from your celebrations.</Text>
        <Text style={styles.notice}>Example notifications · Read status lasts for this session. Push notifications and reminders are not connected.</Text>
        <View style={styles.summary}>
          <Text style={styles.heading}>{unreadCount ? `${unreadCount} unread` : "You're all caught up!"}</Text>
          {unreadCount > 0 && <Pressable accessibilityRole="button" onPress={() => { markAllRead(); setMenu(null); }} style={styles.markAll}><Text style={styles.markAllText}>Mark all read</Text></Pressable>}
        </View>
        {notifications.length === 0 && <Text style={styles.empty}>No notifications yet. Your updates will appear here.</Text>}
        {notifications.length > 0 && unreadCount === 0 && <Text style={styles.empty}>No unread notifications. Your earlier updates are below.</Text>}
        <Animated.View style={[styles.list, { opacity: progress }]}>
          {notifications.map((item) => {
            const isExpanded = expanded === item.id;
            const isMenuOpen = menu === item.id;
            return (
              <View key={item.id} style={[styles.card, darkMode && styles.darkCard]}>
                <View style={styles.row}>
                  <View style={styles.iconCircle}>
                    <Ionicons name={item.kind === "guest" ? "heart-outline" : "checkbox-outline"} size={21} color="#87332f" />
                  </View>
                  <Pressable accessibilityRole="button" accessibilityLabel={`${item.title}, ${item.read ? "read" : "unread"}`} accessibilityState={{ expanded: isExpanded }} onPress={() => { setExpanded(isExpanded ? null : item.id); setMenu(null); }} style={styles.content}>
                    <View style={styles.titleRow}><Text style={[styles.cardTitle, darkMode && styles.darkText]}>{item.title}</Text>{!item.read && <View style={styles.dot} />}</View>
                    <Text style={[styles.detail, darkMode && styles.darkText]}>{item.message}</Text>
                    <Text style={[styles.readState, darkMode && styles.darkAccent]}>{item.read ? "Read" : "Unread"} · Tap for details</Text>
                  </Pressable>
                  <Pressable accessibilityRole="button" accessibilityLabel={`Options for ${item.title}`} accessibilityState={{ expanded: isMenuOpen }} onPress={() => setMenu(isMenuOpen ? null : item.id)} style={styles.more}>
                    <Ionicons name="ellipsis-horizontal" size={22} color={darkMode ? darkPalette.text : "#3d2423"} />
                  </Pressable>
                </View>
                {isMenuOpen && <View style={styles.menu}>
                  {item.read ? <Text style={[styles.detail, darkMode && styles.darkText]}>Already read</Text> : <Pressable accessibilityRole="button" onPress={() => { markRead(item.id); setMenu(null); }} style={styles.action}><Text style={[styles.actionText, darkMode && styles.darkAccent]}>Mark as read</Text></Pressable>}
                </View>}
                {isExpanded && <View style={styles.expanded}>
                  <Text style={[styles.detail, darkMode && styles.darkText]}>{item.kind === "guest" ? "Check the guest list to review or update the response." : "Open your tasks to review this reminder."}</Text>
                  <Pressable accessibilityRole="link" onPress={() => router.push(item.kind === "guest" ? "/guest-list" : "/tasks")} style={styles.action}>
                    <Text style={[styles.actionText, darkMode && styles.darkAccent]}>{item.kind === "guest" ? "Go to guest list" : "Go to tasks"} →</Text>
                  </Pressable>
                </View>}
              </View>
            );
          })}
        </Animated.View>
      </View>
    </DashboardLayout>
  );
}

const styles = StyleSheet.create({
  panel: { backgroundColor: "#c65d58", borderRadius: 32, padding: 18, gap: 12 },
  title: { color: "#ffffff", fontFamily: "DMSans_700Bold", fontSize: 26, textAlign: "center" },
  subtitle: { color: "#ffffff", fontFamily: "DMSans_400Regular", fontSize: 16, textAlign: "center" },
  notice: { color: "#ffffff", fontFamily: "DMSans_400Regular", fontSize: 13, lineHeight: 19 },
  summary: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 },
  heading: { color: "#ffffff", fontFamily: "DMSans_700Bold", fontSize: 17 },
  markAll: { minHeight: 44, justifyContent: "center" },
  markAllText: { color: "#ffffff", fontFamily: "DMSans_700Bold", fontSize: 14, textDecorationLine: "underline" },
  empty: { color: "#ffffff", fontFamily: "DMSans_400Regular", fontSize: 15, lineHeight: 21 },
  list: { gap: 10 },
  card: { backgroundColor: "#ffffff", borderRadius: 18, padding: 14, gap: 8 },
  darkCard: { backgroundColor: darkPalette.panel },
  darkText: { color: darkPalette.text },
  darkAccent: { color: darkPalette.accent },
  row: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  iconCircle: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center", backgroundColor: "#f6dcd7" },
  content: { flex: 1, minWidth: 0, gap: 4, minHeight: 48 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  cardTitle: { flexShrink: 1, color: "#1e1e1e", fontFamily: "DMSans_700Bold", fontSize: 16 },
  detail: { color: "#594441", fontFamily: "DMSans_400Regular", fontSize: 14, lineHeight: 20 },
  readState: { color: "#a43f3a", fontFamily: "DMSans_700Bold", fontSize: 12 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#bd3434" },
  more: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  menu: { borderTopWidth: 1, borderTopColor: "#c9b8b5", paddingTop: 4 },
  expanded: { borderTopWidth: 1, borderTopColor: "#c9b8b5", paddingTop: 10 },
  action: { minHeight: 44, justifyContent: "center" },
  actionText: { color: "#a43f3a", fontFamily: "DMSans_700Bold", fontSize: 15 },
});
