import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useAppPreferences } from "../components/app-preferences";
import { DashboardLayout } from "../components/dashboard-layout";
import { darkPalette } from "../components/dark-palette";
import { GuestPreview, GuestResponse, guestResponseLabels, useEventPreview } from "../components/event-preview-context";
import { GatherBrand } from "../components/gather-brand";
import { SaveChangesDialog } from "../components/save-changes-dialog";

type Filter = "all" | GuestResponse | "sent" | "not-sent";
const filters: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "attending", label: "Will be attending" },
  { value: "declined", label: "Won't be attending" },
  { value: "maybe", label: "Maybe" },
  { value: "pending", label: "Awaiting response" },
  { value: "sent", label: "Invite marked sent" },
  { value: "not-sent", label: "Not sent" },
];
const responseOptions: GuestResponse[] = ["pending", "attending", "declined", "maybe"];

export default function GuestListScreen() {
  const { darkMode } = useAppPreferences();
  const { guests, setGuests } = useEventPreview();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [draft, setDraft] = useState<GuestPreview | null>(null);
  const [newName, setNewName] = useState("");
  const [error, setError] = useState("");
  const [addError, setAddError] = useState("");
  const [notice, setNotice] = useState("");
  const [removing, setRemoving] = useState<GuestPreview | null>(null);
  const visible = guests.filter((guest) => {
    const matchesSearch = guest.name.toLowerCase().includes(query.trim().toLowerCase());
    const matchesFilter = filter === "all" || (filter === "sent" ? guest.invited : filter === "not-sent" ? !guest.invited : guest.response === filter);
    return matchesSearch && matchesFilter;
  });

  function addGuest() {
    const name = newName.trim();
    if (!name) { setAddError("Enter a guest name."); return; }
    setGuests((current) => [...current, { id: `${Date.now()}-${Math.random()}`, name, response: "pending", invited: false }]);
    setNewName("");
    setFilter("all");
    setQuery("");
    setAddError("");
    setNotice("Guest added to this preview.");
  }

  function saveGuest() {
    if (!draft) return;
    const name = draft.name.trim();
    if (!name) { setError("Enter a guest name."); return; }
    setGuests((current) => current.map((guest) => guest.id === draft.id ? { ...draft, name } : guest));
    setDraft(null);
    setError("");
    setNotice("Guest updated in this preview.");
  }

  return (
    <DashboardLayout active="Events">
      <GatherBrand />
      <View style={styles.panel}>
        <Text style={styles.title} accessibilityRole="header">Guest List</Text>
        <Text style={styles.subtitle}>Every celebration is better together.</Text>
        <Text style={styles.preview}>Sample guests · Changes last only for this session. No invitations are sent.</Text>
        <View style={[styles.search, darkMode && styles.darkCard]}>
          <Ionicons name="search" size={20} color={darkMode ? darkPalette.text : "#594441"} />
          <TextInput accessibilityLabel="Search guests" value={query} onChangeText={setQuery} placeholder="Search guests..." placeholderTextColor={darkMode ? darkPalette.placeholder : "#6d615e"} style={[styles.searchInput, darkMode && styles.darkText]} />
        </View>
        <View style={styles.filters} accessibilityRole="radiogroup" accessibilityLabel="Filter guests">
          {filters.map((item) => (
            <Pressable key={item.value} accessibilityRole="radio" accessibilityState={{ checked: filter === item.value }} aria-checked={filter === item.value} onPress={() => setFilter(item.value)} style={[styles.filter, darkMode && styles.darkCard, filter === item.value && styles.activeFilter, filter === item.value && darkMode && styles.darkActive]}>
              <Text style={[styles.filterText, darkMode && styles.darkText]}>{item.label}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.sectionTitle}>{visible.length} {visible.length === 1 ? "guest" : "guests"}</Text>
        {visible.length === 0 && <Text style={styles.preview}>No guests match this search and filter.</Text>}
        {visible.map((guest) => (
          <View key={guest.id} style={[styles.card, darkMode && styles.darkCard]}>
            {draft?.id === guest.id ? (
              <>
                <Text style={[styles.cardTitle, darkMode && styles.darkText]}>Edit guest</Text>
                <TextInput accessibilityLabel={`Name for ${guest.name}`} value={draft.name} onChangeText={(name) => { setDraft({ ...draft, name }); setError(""); }} placeholder="Guest name" placeholderTextColor={darkMode ? darkPalette.placeholder : "#6d615e"} style={[styles.editInput, darkMode && styles.darkInput]} />
                <Text style={[styles.detail, darkMode && styles.darkText]}>Response</Text>
                <View style={styles.filters} accessibilityRole="radiogroup" accessibilityLabel={`Response for ${guest.name}`}>
                  {responseOptions.map((option) => (
                    <Pressable key={option} accessibilityRole="radio" accessibilityState={{ checked: draft.response === option }} aria-checked={draft.response === option} onPress={() => setDraft({ ...draft, response: option })} style={[styles.editChip, draft.response === option && styles.activeFilter, draft.response === option && darkMode && styles.darkActive]}>
                      <Text style={[styles.filterText, darkMode && styles.darkText]}>{guestResponseLabels[option]}</Text>
                    </Pressable>
                  ))}
                </View>
                <Pressable accessibilityRole="checkbox" accessibilityLabel={`Invitation marked sent for ${guest.name}`} accessibilityState={{ checked: draft.invited }} aria-checked={draft.invited} onPress={() => setDraft({ ...draft, invited: !draft.invited })} style={styles.action}>
                  <Text style={[styles.actionText, darkMode && styles.darkAccent]}>{draft.invited ? "☑" : "☐"} Invitation marked sent</Text>
                </Pressable>
                <Text style={[styles.detail, darkMode && styles.darkText]}>Tracking only; changing this does not send an invitation.</Text>
                {!!error && <Text accessibilityRole="alert" style={[styles.error, darkMode && styles.darkAccent]}>{error}</Text>}
                <View style={styles.actions}>
                  <Pressable accessibilityRole="button" onPress={saveGuest} style={styles.action}><Text style={[styles.actionText, darkMode && styles.darkAccent]}>Save guest</Text></Pressable>
                  <Pressable accessibilityRole="button" onPress={() => { setDraft(null); setError(""); }} style={styles.action}><Text style={[styles.actionText, darkMode && styles.darkAccent]}>Cancel</Text></Pressable>
                  <Pressable accessibilityRole="button" onPress={() => setRemoving(guest)} style={styles.action}><Text style={[styles.actionText, darkMode && styles.darkAccent]}>Remove guest</Text></Pressable>
                </View>
              </>
            ) : (
              <>
                <View style={styles.cardRow}>
                  <View style={styles.avatar}><Text style={styles.avatarText}>{guest.name.trim().charAt(0).toUpperCase()}</Text></View>
                  <View style={styles.guestInfo}>
                    <Text style={[styles.cardTitle, darkMode && styles.darkText]}>{guest.name}</Text>
                    <Text style={[styles.detail, darkMode && styles.darkText]}>{guestResponseLabels[guest.response]}</Text>
                  </View>
                  <Pressable accessibilityRole="button" accessibilityLabel={`Edit ${guest.name}`} onPress={() => { setDraft({ ...guest }); setError(""); setNotice(""); }} style={styles.editButton}>
                    <Ionicons name="pencil-outline" size={20} color={darkMode ? darkPalette.accent : "#a43f3a"} />
                  </Pressable>
                </View>
                <Text style={[styles.inviteStatus, darkMode && styles.darkText]}>{guest.invited ? "Invitation marked sent" : "Invitation not sent"}</Text>
              </>
            )}
          </View>
        ))}
        <View style={[styles.card, darkMode && styles.darkCard]}>
          <Text style={[styles.cardTitle, darkMode && styles.darkText]}>Add a guest</Text>
          <TextInput accessibilityLabel="New guest name" value={newName} onChangeText={(text) => { setNewName(text); setAddError(""); }} placeholder="Guest name" placeholderTextColor={darkMode ? darkPalette.placeholder : "#6d615e"} style={[styles.editInput, darkMode && styles.darkInput]} />
          {!!addError && <Text accessibilityRole="alert" style={[styles.error, darkMode && styles.darkAccent]}>{addError}</Text>}
          <Pressable accessibilityRole="button" onPress={addGuest} style={styles.action}><Text style={[styles.actionText, darkMode && styles.darkAccent]}>+ Add guest</Text></Pressable>
        </View>
        {!!notice && <Text style={styles.preview} accessibilityLiveRegion="polite">{notice}</Text>}
      </View>
      <Pressable accessibilityRole="link" onPress={() => router.push({ pathname: "/rsvp", params: { from: "guest-list" } })} style={[styles.button, darkMode && styles.darkCard]}><Text style={[styles.buttonText, darkMode && styles.darkAccent]}>Preview RSVP</Text></Pressable>
      <Pressable accessibilityRole="link" onPress={() => router.replace("/events")} style={[styles.button, darkMode && styles.darkCard]}><Text style={[styles.buttonText, darkMode && styles.darkAccent]}>Back to My Event</Text></Pressable>
      <SaveChangesDialog visible={removing !== null} title="Remove guest?" message={`Remove ${removing?.name ?? "this guest"} from the sample guest list?`} saveLabel="Remove guest" cancelLabel="Cancel" onClose={() => setRemoving(null)} onSave={() => {
        if (!removing) return;
        setGuests((current) => current.filter((guest) => guest.id !== removing.id));
        setRemoving(null);
        setDraft(null);
        setError("");
        setNotice("Guest removed from this preview.");
      }} />
    </DashboardLayout>
  );
}

const styles = StyleSheet.create({
  panel: { backgroundColor: "#c65d58", borderRadius: 32, padding: 18, gap: 12 },
  title: { color: "#ffffff", fontFamily: "DMSans_700Bold", fontSize: 26, textAlign: "center" },
  subtitle: { color: "#ffffff", fontFamily: "DMSans_400Regular", fontSize: 15, textAlign: "center" },
  preview: { color: "#ffffff", fontFamily: "DMSans_400Regular", fontSize: 13, lineHeight: 18 },
  search: { backgroundColor: "#ffffff", borderRadius: 14, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", gap: 8 },
  searchInput: { flex: 1, minWidth: 0, minHeight: 48, color: "#1e1e1e", fontFamily: "DMSans_400Regular", fontSize: 16 },
  filters: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  filter: { backgroundColor: "#ffffff", borderRadius: 20, borderWidth: 2, borderColor: "transparent", minHeight: 40, justifyContent: "center", paddingHorizontal: 11 },
  filterText: { color: "#3d2423", fontFamily: "DMSans_700Bold", fontSize: 13 },
  activeFilter: { borderColor: "#4b2826" },
  darkActive: { borderColor: darkPalette.accent },
  sectionTitle: { color: "#ffffff", fontFamily: "DMSans_700Bold", fontSize: 17 },
  card: { backgroundColor: "#ffffff", borderRadius: 18, padding: 14, gap: 8 },
  cardRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center", backgroundColor: "#f6dcd7" },
  avatarText: { color: "#793b37", fontFamily: "DMSans_700Bold", fontSize: 18 },
  guestInfo: { flex: 1, minWidth: 0, gap: 2 },
  cardTitle: { color: "#1e1e1e", fontFamily: "DMSans_700Bold", fontSize: 16 },
  detail: { color: "#594441", fontFamily: "DMSans_400Regular", fontSize: 13, lineHeight: 18 },
  inviteStatus: { color: "#594441", fontFamily: "DMSans_400Regular", fontSize: 12, marginLeft: 52 },
  editButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  editInput: { minHeight: 46, borderWidth: 1, borderColor: "#c7b5b2", borderRadius: 10, paddingHorizontal: 12, color: "#1e1e1e", fontFamily: "DMSans_400Regular", fontSize: 16 },
  editChip: { borderWidth: 2, borderColor: "#d9c8c5", borderRadius: 18, paddingHorizontal: 9, paddingVertical: 8, minHeight: 40, justifyContent: "center" },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 16 },
  action: { minHeight: 44, justifyContent: "center" },
  actionText: { color: "#a43f3a", fontFamily: "DMSans_700Bold", fontSize: 15 },
  error: { color: "#a0221a", fontFamily: "DMSans_700Bold", fontSize: 13 },
  button: { minHeight: 48, marginTop: 12, borderRadius: 24, backgroundColor: "#ffffff", alignItems: "center", justifyContent: "center", padding: 12 },
  buttonText: { color: "#a43f3a", fontFamily: "DMSans_700Bold", fontSize: 16 },
  darkCard: { backgroundColor: darkPalette.panel },
  darkInput: { backgroundColor: "#202020", color: darkPalette.text, borderColor: "#888888" },
  darkText: { color: darkPalette.text },
  darkAccent: { color: darkPalette.accent },
});
