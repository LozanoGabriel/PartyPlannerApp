import Ionicons from "@expo/vector-icons/Ionicons";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useAppPreferences } from "../components/app-preferences";
import { DashboardLayout } from "../components/dashboard-layout";
import { darkPalette } from "../components/dark-palette";
import { EventSelector } from "../components/event-selector";
import { GatherBrand } from "../components/gather-brand";
import { SaveChangesDialog } from "../components/save-changes-dialog";
import { EventRecord, getEvents } from "../lib/events-api";
import {
  createGuest,
  deleteGuest,
  EventGuest,
  generateGuestInviteLink,
  GuestResponse,
  getGuests,
  markGuestInvitationSent,
  updateGuest,
} from "../lib/guests-api";

type Filter = "all" | GuestResponse | "sent" | "not-sent";
type GuestDraft = { id: string; name: string; response: GuestResponse };

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
const guestResponseLabels: Record<GuestResponse, string> = {
  pending: "Awaiting response",
  attending: "Will be attending",
  declined: "Won't be attending",
  maybe: "Maybe",
};

export default function GuestListScreen() {
  const { darkMode } = useAppPreferences();
  const { eventId: routeEventId } = useLocalSearchParams<{ eventId?: string }>();
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [selectedId, setSelectedId] = useState(routeEventId ?? "");
  const [guests, setGuests] = useState<EventGuest[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [guestsLoading, setGuestsLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [draft, setDraft] = useState<GuestDraft | null>(null);
  const [newName, setNewName] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [removing, setRemoving] = useState<EventGuest | null>(null);
  const [saving, setSaving] = useState(false);
  const [invitingGuestId, setInvitingGuestId] = useState<string | null>(null);
  const selectedEvent = events.find((event) => event.id === selectedId);

  useFocusEffect(useCallback(() => {
    let active = true;
    setEventsLoading(true);
    getEvents().then((items) => {
      if (!active) return;
      setEvents(items);
      setSelectedId((current) =>
        items.some((event) => event.id === current)
          ? current
          : items.find((event) => event.id === routeEventId)?.id ?? items[0]?.id ?? "",
      );
      setError("");
    }).catch((reason: unknown) => {
      if (active) setError(reason instanceof Error ? reason.message : "Could not load your events.");
    }).finally(() => {
      if (active) setEventsLoading(false);
    });
    return () => { active = false; };
  }, [routeEventId]));

  useFocusEffect(useCallback(() => {
    let active = true;
    if (!selectedId) {
      setGuests([]);
      setGuestsLoading(false);
      return () => { active = false; };
    }

    setGuestsLoading(true);
    getGuests(selectedId).then((items) => {
      if (!active) return;
      setGuests(items);
      setError("");
    }).catch((reason: unknown) => {
      if (active) setError(reason instanceof Error ? reason.message : "Could not load guests.");
    }).finally(() => {
      if (active) setGuestsLoading(false);
    });
    return () => { active = false; };
  }, [selectedId]));

  const visible = guests.filter((guest) => {
    const matchesSearch = guest.name.toLowerCase().includes(query.trim().toLowerCase());
    const invited = guest.invitation_last_sent_at !== null;
    const matchesFilter = filter === "all" ||
      (filter === "sent" ? invited : filter === "not-sent" ? !invited : guest.rsvp_status === filter);
    return matchesSearch && matchesFilter;
  });

  async function addGuest() {
    const name = newName.trim();
    if (!selectedId) { setError("Choose an event before adding a guest."); return; }
    if (!name) { setError("Enter a guest name."); return; }
    setSaving(true);
    setError("");
    try {
      const guest = await createGuest(selectedId, { name });
      setGuests((current) => [...current, guest]);
      setNewName("");
      setFilter("all");
      setQuery("");
      setNotice("Guest added to this event.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not add the guest.");
    } finally {
      setSaving(false);
    }
  }

  async function saveGuest() {
    if (!draft) return;
    const name = draft.name.trim();
    if (!name) { setError("Enter a guest name."); return; }
    setSaving(true);
    setError("");
    try {
      const updated = await updateGuest(draft.id, { name, rsvpStatus: draft.response });
      setGuests((current) => current.map((guest) => guest.id === updated.id ? updated : guest));
      setDraft(null);
      setNotice("Guest updated.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not update the guest.");
    } finally {
      setSaving(false);
    }
  }

  async function markSent(guest: EventGuest) {
    setSaving(true);
    setError("");
    try {
      const updated = await markGuestInvitationSent(guest.id);
      setGuests((current) => current.map((item) => item.id === updated.id ? updated : item));
      setNotice(`Invitation status updated for ${guest.name}.`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not update invitation status.");
    } finally {
      setSaving(false);
    }
  }

  async function createInviteLink(guest: EventGuest) {
    setInvitingGuestId(guest.id);
    setError("");
    setNotice("");
    try {
      const inviteLink = await generateGuestInviteLink(guest.id);
      console.info(`RSVP invitation link for ${guest.name}: ${inviteLink}`);
      setNotice(`Invitation link for ${guest.name} was generated and printed to the console.`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not generate the invitation link.");
    } finally {
      setInvitingGuestId(null);
    }
  }

  async function removeGuest() {
    if (!removing) return;
    setSaving(true);
    setError("");
    try {
      await deleteGuest(removing.id);
      setGuests((current) => current.filter((guest) => guest.id !== removing.id));
      setRemoving(null);
      setDraft(null);
      setNotice("Guest removed from this event.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not remove the guest.");
      setRemoving(null);
    } finally {
      setSaving(false);
    }
  }

  return (
    <DashboardLayout active="Events">
      <GatherBrand />
      <View style={styles.panel}>
        <Text style={styles.title} accessibilityRole="header">Guest List</Text>
        <Text style={styles.subtitle}>Every celebration is better together.</Text>
        {events.length > 0 && <EventSelector events={events} selectedId={selectedId} onSelect={(id) => {
          setSelectedId(id);
          setDraft(null);
          setNotice("");
        }} label="Select an event" />}
        {(eventsLoading || guestsLoading) && <Text style={styles.preview}>Loading guest list...</Text>}
        {!eventsLoading && events.length === 0 && !error && <Text style={styles.preview}>Create an event before adding guests.</Text>}
        {selectedEvent && <Text style={styles.preview}>{selectedEvent.name} · Invite generates an RSVP link; it does not contact the guest automatically.</Text>}
        {!!error && <Text accessibilityRole="alert" style={[styles.error, darkMode && styles.darkAccent]}>{error}</Text>}
        {!!notice && <Text style={styles.preview} accessibilityLiveRegion="polite">{notice}</Text>}

        {!!selectedId && <>
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
          {!guestsLoading && visible.length === 0 && <Text style={styles.preview}>{guests.length ? "No guests match this search and filter." : "No guests have been added to this event yet."}</Text>}
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
                  {!!error && <Text accessibilityRole="alert" style={[styles.error, darkMode && styles.darkAccent]}>{error}</Text>}
                  <View style={styles.actions}>
                    <Pressable accessibilityRole="button" disabled={saving} onPress={() => { void saveGuest(); }} style={styles.action}><Text style={[styles.actionText, darkMode && styles.darkAccent]}>{saving ? "Saving..." : "Save guest"}</Text></Pressable>
                    <Pressable accessibilityRole="button" disabled={saving} onPress={() => { setDraft(null); setError(""); }} style={styles.action}><Text style={[styles.actionText, darkMode && styles.darkAccent]}>Cancel</Text></Pressable>
                    <Pressable accessibilityRole="button" disabled={saving} onPress={() => setRemoving(guest)} style={styles.action}><Text style={[styles.actionText, darkMode && styles.darkAccent]}>Remove guest</Text></Pressable>
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.cardRow}>
                    <View style={styles.avatarColumn}>
                      <View style={styles.avatar}><Text style={styles.avatarText}>{guest.name.trim().charAt(0).toUpperCase()}</Text></View>
                      <Pressable accessibilityRole="button" accessibilityLabel={`Generate invitation link for ${guest.name}`} disabled={saving || invitingGuestId !== null} onPress={() => { void createInviteLink(guest); }} style={styles.inviteButton}>
                        <Text style={[styles.inviteButtonText, darkMode && styles.darkAccent]}>{invitingGuestId === guest.id ? "Creating..." : "Invite"}</Text>
                      </Pressable>
                    </View>
                    <View style={styles.guestInfo}>
                      <Text style={[styles.cardTitle, darkMode && styles.darkText]}>{guest.name}</Text>
                      <Text style={[styles.detail, darkMode && styles.darkText]}>{guestResponseLabels[guest.rsvp_status]}</Text>
                    </View>
                    <Pressable accessibilityRole="button" accessibilityLabel={`Edit ${guest.name}`} onPress={() => { setDraft({ id: guest.id, name: guest.name, response: guest.rsvp_status }); setError(""); setNotice(""); }} style={styles.editButton}>
                      <Ionicons name="pencil-outline" size={20} color={darkMode ? darkPalette.accent : "#a43f3a"} />
                    </Pressable>
                  </View>
                  <View style={styles.invitationRow}>
                    <Text style={[styles.inviteStatus, darkMode && styles.darkText]}>{guest.invitation_last_sent_at ? "Invitation marked sent" : "Invitation not sent"}</Text>
                    {!guest.invitation_last_sent_at && <Pressable accessibilityRole="button" disabled={saving} onPress={() => { void markSent(guest); }} style={styles.action}>
                      <Text style={[styles.actionText, darkMode && styles.darkAccent]}>Mark sent</Text>
                    </Pressable>}
                  </View>
                </>
              )}
            </View>
          ))}
          <View style={[styles.card, darkMode && styles.darkCard]}>
            <Text style={[styles.cardTitle, darkMode && styles.darkText]}>Add a guest</Text>
            <TextInput accessibilityLabel="New guest name" value={newName} onChangeText={(text) => { setNewName(text); setError(""); }} placeholder="Guest name" placeholderTextColor={darkMode ? darkPalette.placeholder : "#6d615e"} style={[styles.editInput, darkMode && styles.darkInput]} />
            <Pressable accessibilityRole="button" disabled={saving} onPress={() => { void addGuest(); }} style={styles.action}><Text style={[styles.actionText, darkMode && styles.darkAccent]}>{saving ? "Saving..." : "+ Add guest"}</Text></Pressable>
          </View>
        </>}
      </View>
      <Pressable accessibilityRole="link" onPress={() => router.replace("/events")} style={[styles.button, darkMode && styles.darkCard]}><Text style={[styles.buttonText, darkMode && styles.darkAccent]}>Back to My Events</Text></Pressable>
      <SaveChangesDialog
        visible={removing !== null}
        title="Remove guest?"
        message={`Remove ${removing?.name ?? "this guest"} from this event?`}
        saveLabel="Remove guest"
        cancelLabel="Cancel"
        busy={saving}
        onClose={() => setRemoving(null)}
        onSave={() => { void removeGuest(); }}
      />
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
  avatarColumn: { alignItems: "center", gap: 2 },
  avatar: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center", backgroundColor: "#f6dcd7" },
  avatarText: { color: "#793b37", fontFamily: "DMSans_700Bold", fontSize: 18 },
  inviteButton: { minHeight: 34, justifyContent: "center", paddingHorizontal: 4 },
  inviteButtonText: { color: "#a43f3a", fontFamily: "DMSans_700Bold", fontSize: 12 },
  guestInfo: { flex: 1, minWidth: 0, gap: 2 },
  cardTitle: { color: "#1e1e1e", fontFamily: "DMSans_700Bold", fontSize: 16 },
  detail: { color: "#594441", fontFamily: "DMSans_400Regular", fontSize: 13, lineHeight: 18 },
  invitationRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginLeft: 52 },
  inviteStatus: { color: "#594441", fontFamily: "DMSans_400Regular", fontSize: 12 },
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
