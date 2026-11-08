import Ionicons from "@expo/vector-icons/Ionicons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { DashboardLayout } from "./dashboard-layout";
import { EventSelector } from "./event-selector";
import { TaskDatePicker } from "./task-date-picker";
import { useAppPreferences } from "./app-preferences";
import { darkPalette } from "./dark-palette";
import { EventRecord, getEvents } from "../lib/events-api";
import { EventGuest, getGuests } from "../lib/guests-api";
import { createTask, deleteTask, EventTask, getTasks, updateTask } from "../lib/tasks-api";

type Draft = { title: string; date: Date | null; assignedGuestId: string | null };
const emptyDraft: Draft = { title: "", date: null, assignedGuestId: null };

function draftFromTask(task: EventTask): Draft {
  return {
    title: task.title,
    date: task.due_date ? new Date(`${task.due_date}T00:00:00`) : null,
    assignedGuestId: task.assigned_guest_id,
  };
}

function dateToString(date: Date | null) {
  if (!date) return null;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function TaskForm({ mode, initialTask }: { mode: "create" | "edit"; initialTask?: string }) {
  const { darkMode } = useAppPreferences();
  const { eventId: routeEventId } = useLocalSearchParams<{ eventId?: string }>();
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [selectedEventId, setSelectedEventId] = useState(routeEventId ?? "");
  const [tasks, setTasks] = useState<EventTask[]>([]);
  const [guests, setGuests] = useState<EventGuest[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState(initialTask ?? "");
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [baseline, setBaseline] = useState<Draft>(emptyDraft);
  const [taskMenu, setTaskMenu] = useState(false);
  const [assigneeMenu, setAssigneeMenu] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const selectedTask = tasks.find((task) => task.id === selectedTaskId);
  const changed = draft.title !== baseline.title || draft.date?.getTime() !== baseline.date?.getTime() || draft.assignedGuestId !== baseline.assignedGuestId;
  const guestName = useMemo(() => new Map(guests.map((guest) => [guest.id, guest.name])), [guests]);
  const assigneeLabel = draft.assignedGuestId ? guestName.get(draft.assignedGuestId) ?? "Guest" : "Me";

  useEffect(() => {
    let active = true;
    getEvents().then((items) => {
      if (!active) return;
      setEvents(items);
      setSelectedEventId((current) => items.some((event) => event.id === current) ? current : items.find((event) => event.id === routeEventId)?.id ?? items[0]?.id ?? "");
    }).catch((reason: unknown) => {
      if (active) setError(reason instanceof Error ? reason.message : "Could not load events.");
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [routeEventId]);

  useEffect(() => {
    let active = true;
    setTasks([]);
    setGuests([]);
    setSelectedTaskId("");
    setDraft(emptyDraft);
    setBaseline(emptyDraft);
    if (!selectedEventId) return () => { active = false; };
    setLoading(true);
    Promise.all([getTasks(selectedEventId), getGuests(selectedEventId)]).then(([nextTasks, nextGuests]) => {
      if (!active) return;
      setTasks(nextTasks);
      setGuests(nextGuests);
      if (mode === "edit") {
        const task = nextTasks.find((item) => item.id === initialTask) ?? nextTasks[0];
        if (task) {
          setSelectedTaskId(task.id);
          setDraft(draftFromTask(task));
          setBaseline(draftFromTask(task));
        }
      }
      setError("");
    }).catch((reason: unknown) => {
      if (active) setError(reason instanceof Error ? reason.message : "Could not load tasks.");
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [selectedEventId, mode, initialTask]);

  function chooseTask(task: EventTask) {
    const next = draftFromTask(task);
    setSelectedTaskId(task.id);
    setDraft(next);
    setBaseline(next);
    setTaskMenu(false);
    setError("");
  }

  async function save() {
    if (!selectedEventId) { setError("Choose an event before saving a task."); return; }
    if (!draft.title.trim()) { setError("Enter a task title."); return; }
    setSaving(true);
    setError("");
    try {
      if (mode === "create") {
        await createTask(selectedEventId, {
          title: draft.title.trim(),
          dueDate: dateToString(draft.date),
          assignedGuestId: draft.assignedGuestId,
        });
      } else {
        if (!selectedTaskId) { setError("Choose a task to edit."); return; }
        await updateTask(selectedTaskId, {
          title: draft.title.trim(),
          dueDate: dateToString(draft.date),
          assignedGuestId: draft.assignedGuestId,
        });
      }
      router.replace({ pathname: "/tasks", params: { eventId: selectedEventId } });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not save task.");
    } finally {
      setSaving(false);
    }
  }

  async function removeTask() {
    if (!selectedTaskId) return;
    setSaving(true);
    setError("");
    try {
      await deleteTask(selectedTaskId);
      router.replace({ pathname: "/tasks", params: { eventId: selectedEventId } });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not delete task.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <DashboardLayout active="Tasks">
      <View style={styles.card}>
        <Text style={styles.title} accessibilityRole="header">{mode === "create" ? "Create a task" : "Edit task"}</Text>
        <View style={styles.field}>
          <Text style={styles.label}>Event</Text>
          {events.length > 0
            ? <EventSelector events={events} selectedId={selectedEventId} onSelect={setSelectedEventId} label="Choose an event" />
            : <Text style={styles.notice}>{loading ? "Loading events..." : "Create an event before adding tasks."}</Text>}
        </View>
        {mode === "edit" && selectedEventId && <>
          <View style={styles.field}>
            <Text style={styles.label}>Choose a task</Text>
            <Pressable accessibilityRole="button" accessibilityState={{ expanded: taskMenu }} onPress={() => setTaskMenu(!taskMenu)} style={[styles.select, darkMode && styles.darkPanel]}>
              <Text style={[styles.inputText, darkMode && styles.darkText]}>{selectedTask?.title ?? (loading ? "Loading tasks..." : "Select a task")}</Text>
              <Ionicons name={taskMenu ? "chevron-up" : "chevron-down"} size={20} color={darkMode ? darkPalette.accent : "#a43f3a"} />
            </Pressable>
            {taskMenu && <View style={[styles.options, darkMode && styles.darkPanel]}>{tasks.map((task) => (
              <Pressable key={task.id} accessibilityRole="button" onPress={() => chooseTask(task)} style={styles.option}>
                <Text style={[styles.inputText, darkMode && styles.darkText]}>{task.title}</Text>
              </Pressable>
            ))}</View>}
          </View>
        </>}
        {(mode === "create" || selectedTask) && <>
          <View style={styles.field}><Text style={styles.label}>What needs to get done?</Text><TextInput accessibilityLabel="Task title" value={draft.title} onChangeText={(title) => { setDraft((current) => ({ ...current, title })); setError(""); }} placeholder="Enter a task" placeholderTextColor={darkMode ? darkPalette.placeholder : "#777777"} maxLength={200} style={[styles.input, darkMode && styles.darkInput]} /></View>
          <View style={styles.field}><Text style={styles.label}>Due Date (optional)</Text><TaskDatePicker value={draft.date} onChange={(date) => setDraft((current) => ({ ...current, date }))} /></View>
          <View style={styles.field}>
            <Text style={styles.label}>Assign to</Text>
            <Pressable accessibilityRole="button" accessibilityState={{ expanded: assigneeMenu }} onPress={() => setAssigneeMenu(!assigneeMenu)} style={[styles.select, darkMode && styles.darkPanel]}>
              <Text style={[styles.inputText, darkMode && styles.darkText]}>{assigneeLabel}</Text>
              <Ionicons name={assigneeMenu ? "chevron-up" : "chevron-down"} size={20} color={darkMode ? darkPalette.accent : "#a43f3a"} />
            </Pressable>
            {assigneeMenu && <View style={[styles.options, darkMode && styles.darkPanel]}>
              <Pressable accessibilityRole="button" onPress={() => { setDraft((current) => ({ ...current, assignedGuestId: null })); setAssigneeMenu(false); }} style={styles.option}><Text style={[styles.inputText, darkMode && styles.darkText]}>Me</Text></Pressable>
              {guests.map((guest) => <Pressable key={guest.id} accessibilityRole="button" onPress={() => { setDraft((current) => ({ ...current, assignedGuestId: guest.id })); setAssigneeMenu(false); }} style={styles.option}><Text style={[styles.inputText, darkMode && styles.darkText]}>{guest.name}</Text></Pressable>)}
            </View>}
          </View>
          <Text style={styles.hint}>Task notes are not supported by the current database.</Text>
          <Pressable accessibilityRole="button" accessibilityState={{ disabled: saving }} disabled={saving} onPress={() => { void save(); }} style={[styles.button, darkMode && styles.darkPanel, saving && styles.disabled]}>
            <Text style={[styles.buttonText, darkMode && styles.darkAccent]}>{saving ? "Saving..." : mode === "create" ? "Create Task" : "Save Changes"}</Text>
          </Pressable>
          {mode === "edit" && <Pressable accessibilityRole="button" accessibilityState={{ disabled: saving }} disabled={saving} onPress={() => { void removeTask(); }} style={styles.deleteButton}><Text style={styles.deleteText}>Delete Task</Text></Pressable>}
        </>}
        {!!error && <Text style={styles.error} accessibilityRole="alert">{error}</Text>}
        <Pressable accessibilityRole="button" onPress={() => router.replace({ pathname: "/tasks", params: { eventId: selectedEventId } })} style={styles.back}><Text style={styles.backText}>Back to Tasks</Text></Pressable>
      </View>
    </DashboardLayout>
  );
}

const styles = StyleSheet.create({
  darkPanel: { backgroundColor: darkPalette.panel },
  darkInput: { backgroundColor: darkPalette.panel, color: darkPalette.text },
  darkText: { color: darkPalette.text },
  darkAccent: { color: darkPalette.accent },
  card: { backgroundColor: "#c65d58", borderRadius: 32, padding: 20, gap: 12 },
  title: { color: "#ffffff", fontFamily: "DMSans_700Bold", fontSize: 26, textAlign: "center" },
  notice: { color: "#ffffff", fontFamily: "DMSans_400Regular", fontSize: 14, lineHeight: 20, textAlign: "center" },
  field: { gap: 6 },
  label: { color: "#ffffff", fontFamily: "DMSans_700Bold", fontSize: 15 },
  input: { minHeight: 48, borderRadius: 10, backgroundColor: "#ffffff", color: "#1e1e1e", fontFamily: "DMSans_400Regular", fontSize: 16, paddingHorizontal: 12, paddingVertical: 10 },
  inputText: { flexShrink: 1, color: "#1e1e1e", fontFamily: "DMSans_400Regular", fontSize: 16 },
  select: { minHeight: 48, borderRadius: 10, backgroundColor: "#ffffff", paddingHorizontal: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  options: { borderRadius: 10, backgroundColor: "#ffffff", paddingHorizontal: 12, maxHeight: 200, overflow: "scroll" },
  option: { minHeight: 44, justifyContent: "center", borderBottomWidth: 1, borderBottomColor: "#eeeeee" },
  hint: { color: "#ffffff", fontFamily: "DMSans_400Regular", fontSize: 12 },
  button: { minHeight: 48, borderRadius: 24, backgroundColor: "#ffffff", alignItems: "center", justifyContent: "center", padding: 12 },
  disabled: { opacity: 0.6 },
  buttonText: { color: "#a43f3a", fontFamily: "DMSans_700Bold", fontSize: 15, textAlign: "center" },
  deleteButton: { minHeight: 44, alignItems: "center", justifyContent: "center" },
  deleteText: { color: "#ffffff", fontFamily: "DMSans_700Bold", fontSize: 14, textDecorationLine: "underline" },
  error: { color: "#ffffff", fontFamily: "DMSans_700Bold", fontSize: 14 },
  back: { minHeight: 48, alignItems: "center", justifyContent: "center" },
  backText: { color: "#ffffff", fontFamily: "DMSans_700Bold", fontSize: 15, textDecorationLine: "underline" },
});
