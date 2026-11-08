import Ionicons from "@expo/vector-icons/Ionicons";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { DashboardLayout } from "../components/dashboard-layout";
import { EventSelector } from "../components/event-selector";
import { useAppPreferences } from "../components/app-preferences";
import { darkPalette } from "../components/dark-palette";
import { EventRecord, getEvents } from "../lib/events-api";
import { EventTask, getTasks, updateTask } from "../lib/tasks-api";
import { EventGuest, getGuests } from "../lib/guests-api";

type TaskGroup = "Today" | "Upcoming" | "Overdue" | "Completed" | "To do";
type TaskFilter = "All" | "Assigned" | "Completed";
type DueFilter = "Any" | "Today" | "Upcoming" | "Overdue";
const groups: TaskGroup[] = ["Today", "Upcoming", "Overdue", "Completed"];
const filters: TaskFilter[] = ["All", "Assigned", "Completed"];
const dueFilters: DueFilter[] = ["Any", "Today", "Upcoming", "Overdue"];

function getTaskGroup(task: EventTask, dueDateAvailable = true): TaskGroup {
  if (task.status === "complete") return "Completed";
  if (!dueDateAvailable) return "To do";
  if (!task.due_date) return "Upcoming";
  const due = new Date(`${task.due_date}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (due < today) return "Overdue";
  if (due.getTime() === today.getTime()) return "Today";
  return "Upcoming";
}

function taskDueLabel(task: EventTask) {
  if (task.status === "complete") return "Completed";
  if (!task.due_date) return "No due date";
  const group = getTaskGroup(task);
  return group === "Today" ? "Due today" : group === "Overdue" ? "Overdue" : `Due ${new Date(`${task.due_date}T00:00:00`).toLocaleDateString()}`;
}

export default function TasksScreen() {
  const { darkMode, aiSuggestions } = useAppPreferences();
  const { eventId: routeEventId } = useLocalSearchParams<{ eventId?: string }>();
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [selectedId, setSelectedId] = useState(routeEventId ?? "");
  const [tasks, setTasks] = useState<EventTask[]>([]);
  const [guests, setGuests] = useState<EventGuest[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [dueDateAvailable, setDueDateAvailable] = useState(true);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<TaskFilter>("All");
  const [dueFilter, setDueFilter] = useState<DueFilter>("Any");
  const [showDueFilters, setShowDueFilters] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<TaskGroup[]>([]);
  const [openTask, setOpenTask] = useState<string>();

  useFocusEffect(useCallback(() => {
    let active = true;
    getEvents().then((items) => {
      if (!active) return;
      setEvents(items);
      setSelectedId((current) => items.some((event) => event.id === current) ? current : items.find((event) => event.id === routeEventId)?.id ?? items[0]?.id ?? "");
      setError("");
    }).catch((reason: unknown) => {
      if (active) setError(reason instanceof Error ? reason.message : "Could not load events.");
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [routeEventId]));

  useFocusEffect(useCallback(() => {
    let active = true;
    if (!selectedId) {
      setTasks([]);
      setGuests([]);
      setDueDateAvailable(true);
      return () => { active = false; };
    }
    setLoading(true);
    setDueDateAvailable(true);
    Promise.all([getTasks(selectedId), getGuests(selectedId)]).then(([taskList, nextGuests]) => {
      if (!active) return;
      setTasks(taskList.tasks);
      setDueDateAvailable(taskList.dueDateAvailable);
      setGuests(nextGuests);
      setError("");
    }).catch((reason: unknown) => {
      if (active) setError(reason instanceof Error ? reason.message : "Could not load tasks.");
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [selectedId]));

  const selectedEvent = events.find((event) => event.id === selectedId);
  const guestNames = useMemo(() => new Map(guests.map((guest) => [guest.id, guest.name])), [guests]);
  const completed = tasks.filter((task) => task.status === "complete").length;
  const search = query.trim().toLowerCase();
  const visibleTasks = tasks.filter((task) => {
    const assignee = task.assigned_guest_id ? guestNames.get(task.assigned_guest_id) ?? "Guest" : "Me";
    const matchesSearch = `${task.title} ${assignee} ${dueDateAvailable ? taskDueLabel(task) : ""}`.toLowerCase().includes(search);
    const taskGroup = getTaskGroup(task, dueDateAvailable);
    const matchesFilter = filter === "All" || (filter === "Assigned" && task.assigned_guest_id !== null) || (filter === "Completed" && task.status === "complete");
    return matchesSearch && matchesFilter && (!dueDateAvailable || dueFilter === "Any" || taskGroup === dueFilter);
  });
  const visibleGroups: TaskGroup[] = dueDateAvailable ? groups : ["To do", "Completed"];

  async function completeTask(task: EventTask) {
    try {
      const updated = await updateTask(task.id, { status: "complete" });
      setTasks((current) => current.map((item) => item.id === task.id ? updated : item));
      setOpenTask(undefined);
      setError("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not update task.");
    }
  }

  return (
    <DashboardLayout active="Tasks">
      {aiSuggestions && <View style={[styles.galaCard, darkMode && styles.darkPanel]}>
        <Text style={[styles.cardTitle, darkMode && styles.darkText]}>A little help from Gala</Text>
        <Text style={[styles.detail, darkMode && styles.darkText]}>{tasks.length ? `${tasks.length - completed} tasks remain for this event.` : "Ask Gala for planning help for this event."}</Text>
        <Pressable accessibilityRole="link" onPress={() => router.push("/gala")} style={styles.link}>
          <Text style={[styles.linkText, darkMode && styles.darkAccent]}>Chat with Gala</Text><Ionicons name="arrow-forward" size={18} color={darkMode ? darkPalette.accent : "#a43f3a"} />
        </Pressable>
      </View>}
      <View style={styles.overview}>
        <Text style={styles.title} accessibilityRole="header">My Tasks</Text>
        {events.length > 0 && <EventSelector events={events} selectedId={selectedId} onSelect={setSelectedId} label="Select an event" />}
        {loading && <Text style={styles.subtitle}>Loading tasks...</Text>}
        {!!error && <Text style={styles.error} accessibilityRole="alert">{error}</Text>}
        {!loading && events.length === 0 && <Text style={styles.subtitle}>Create an event to start tracking tasks.</Text>}
        {selectedEvent && <>
          <Text style={styles.subtitle}>{selectedEvent.name}</Text>
          <View style={[styles.card, darkMode && styles.darkPanel]}>
            <Text style={[styles.cardTitle, darkMode && styles.darkText]}>Planning progress</Text>
            <View style={styles.progress} accessibilityRole="progressbar" accessibilityLabel="Task completion" accessibilityValue={{ min: 0, max: tasks.length || 1, now: completed, text: `${completed} of ${tasks.length} tasks completed` }}>
              <View style={[styles.progressFill, { width: `${tasks.length ? completed / tasks.length * 100 : 0}%` }]} />
            </View>
            <View style={styles.row}><Text style={[styles.detail, darkMode && styles.darkText]}>{completed} completed</Text><Text style={[styles.detail, darkMode && styles.darkText]}>{tasks.length - completed} remaining</Text></View>
          </View>
          <View style={[styles.searchRow, darkMode && styles.darkPanel]}>
            <Ionicons name="search" size={20} color={darkMode ? darkPalette.text : "#594441"} />
            <TextInput accessibilityLabel="Search tasks" value={query} onChangeText={setQuery} placeholder="Search tasks..." placeholderTextColor={darkMode ? darkPalette.placeholder : "#6d615e"} style={[styles.searchInput, darkMode && styles.darkText]} returnKeyType="search" />
            {dueDateAvailable && <Pressable accessibilityRole="button" accessibilityLabel="Filter by due date" accessibilityState={{ expanded: showDueFilters }} onPress={() => setShowDueFilters(!showDueFilters)} style={styles.filterIcon}>
              <Ionicons name="options-outline" size={23} color={darkMode ? darkPalette.accent : "#a43f3a"} />
            </Pressable>}
          </View>
          {dueDateAvailable && showDueFilters && <View style={styles.dueFilters}>{dueFilters.map((option) => (
            <Pressable key={option} accessibilityRole="radio" accessibilityState={{ checked: dueFilter === option }} onPress={() => setDueFilter(option)} style={[styles.dueFilter, dueFilter === option && styles.dueFilterSelected]}>
              <Text style={[styles.dueFilterText, dueFilter === option && styles.dueFilterTextSelected]}>{option}</Text>
            </Pressable>
          ))}</View>}
          <View style={styles.tabs} accessibilityRole="radiogroup" accessibilityLabel="Task filter">{filters.map((option) => (
            <Pressable key={option} accessibilityRole="radio" accessibilityState={{ checked: filter === option }} onPress={() => setFilter(option)} style={[styles.tab, filter === option && styles.selectedTab]}>
              <Text style={[styles.tabText, filter === option && styles.selectedTabText]}>{option}</Text>
            </Pressable>
          ))}</View>
          {visibleTasks.length === 0 ? <Text style={styles.empty}>{loading ? "" : "No tasks match your search and filters."}</Text> : visibleGroups.map((group) => {
            const groupTasks = visibleTasks.filter((task) => getTaskGroup(task, dueDateAvailable) === group);
            if (!groupTasks.length) return null;
            const expanded = expandedGroups.includes(group);
            return <View key={group} style={styles.section}>
              <Pressable accessibilityRole="button" accessibilityState={{ expanded }} onPress={() => setExpandedGroups((current) => expanded ? current.filter((value) => value !== group) : [...current, group])} style={styles.sectionToggle}>
                <Text style={styles.sectionTitle}>{group} ({groupTasks.length})</Text><Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={22} color="#ffffff" />
              </Pressable>
              {expanded && groupTasks.map((task) => {
                const assignee = task.assigned_guest_id ? guestNames.get(task.assigned_guest_id) ?? "Guest" : "Me";
                return <View key={task.id} style={[styles.taskCard, darkMode && styles.darkPanel]}>
                  <View style={styles.taskRow}>
                    <Text style={[styles.taskTitle, darkMode && styles.darkText]}>{task.title}</Text>
                    <Pressable accessibilityRole="button" accessibilityLabel={`Options for ${task.title}`} accessibilityState={{ expanded: openTask === task.id }} onPress={() => setOpenTask(openTask === task.id ? undefined : task.id)} style={styles.moreButton}>
                      <Ionicons name="ellipsis-horizontal" size={22} color={darkMode ? darkPalette.text : "#3d2423"} />
                    </Pressable>
                  </View>
                  <View style={styles.taskRow}><Text style={[styles.assignee, darkMode && styles.darkText]}>Assigned to {assignee}</Text>{dueDateAvailable && <Text style={[styles.due, darkMode && styles.darkAccent]}>{taskDueLabel(task)}</Text>}</View>
                  {openTask === task.id && <View style={styles.taskMenu}>
                    <Pressable accessibilityRole="link" onPress={() => router.push({ pathname: "/edit-tasks", params: { task: task.id, eventId: selectedId } })} style={styles.menuItem}><Text style={[styles.linkText, darkMode && styles.darkAccent]}>Edit task</Text></Pressable>
                    {task.status !== "complete" && <Pressable accessibilityRole="button" onPress={() => { void completeTask(task); }} style={styles.menuItem}><Text style={[styles.linkText, darkMode && styles.darkAccent]}>Mark as completed</Text></Pressable>}
                  </View>}
                </View>;
              })}
            </View>;
          })}
          <Pressable accessibilityRole="link" onPress={() => router.push({ pathname: "/create-task", params: { eventId: selectedId } })} style={styles.primary}>
            <Text style={styles.primaryText}>Create a Task</Text>
          </Pressable>
          <Pressable accessibilityRole="link" onPress={() => router.push({ pathname: "/edit-tasks", params: { eventId: selectedId } })} style={[styles.secondary, darkMode && styles.darkPanel]}>
            <Text style={[styles.secondaryText, darkMode && styles.darkAccent]}>Edit Tasks</Text>
          </Pressable>
        </>}
      </View>
    </DashboardLayout>
  );
}

const styles = StyleSheet.create({
  darkPanel: { backgroundColor: darkPalette.panel },
  darkText: { color: darkPalette.text },
  darkAccent: { color: darkPalette.accent },
  galaCard: { backgroundColor: "#ffffff", borderRadius: 18, padding: 15, gap: 8, marginBottom: 12 },
  link: { minHeight: 44, flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start" },
  linkText: { color: "#a43f3a", fontFamily: "DMSans_700Bold", fontSize: 14 },
  overview: { backgroundColor: "#c65d58", borderRadius: 32, padding: 16, gap: 12 },
  title: { color: "#ffffff", fontFamily: "DMSans_700Bold", fontSize: 26, textAlign: "center" },
  subtitle: { color: "#ffffff", fontFamily: "DMSans_400Regular", fontSize: 14, textAlign: "center" },
  error: { color: "#ffffff", fontFamily: "DMSans_700Bold", fontSize: 13 },
  card: { backgroundColor: "#ffffff", borderRadius: 18, padding: 15, gap: 10 },
  cardTitle: { color: "#1e1e1e", fontFamily: "DMSans_700Bold", fontSize: 16 },
  detail: { color: "#3d2423", fontFamily: "DMSans_400Regular", fontSize: 13, lineHeight: 19 },
  row: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  progress: { height: 10, borderRadius: 6, backgroundColor: "#f6e5d8", overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: "#c65d58" },
  searchRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#ffffff", borderRadius: 12, paddingLeft: 12, gap: 8 },
  searchInput: { flex: 1, minWidth: 0, minHeight: 48, color: "#1e1e1e", fontFamily: "DMSans_400Regular", fontSize: 15 },
  filterIcon: { width: 48, minHeight: 48, alignItems: "center", justifyContent: "center" },
  dueFilters: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  dueFilter: { minHeight: 44, paddingHorizontal: 10, borderRadius: 22, justifyContent: "center", borderWidth: 1, borderColor: "#ffffff" },
  dueFilterSelected: { backgroundColor: "#ffffff" },
  dueFilterText: { color: "#ffffff", fontFamily: "DMSans_700Bold", fontSize: 12 },
  dueFilterTextSelected: { color: "#a43f3a" },
  tabs: { flexDirection: "row", gap: 6 },
  tab: { flex: 1, minHeight: 44, borderRadius: 22, borderWidth: 1, borderColor: "#ffffff", alignItems: "center", justifyContent: "center", paddingHorizontal: 4 },
  selectedTab: { backgroundColor: "#ffffff" },
  tabText: { color: "#ffffff", fontFamily: "DMSans_700Bold", fontSize: 13, textAlign: "center" },
  selectedTabText: { color: "#a43f3a" },
  section: { gap: 8 },
  sectionToggle: { minHeight: 48, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  sectionTitle: { color: "#ffffff", fontFamily: "DMSans_700Bold", fontSize: 18 },
  taskCard: { backgroundColor: "#ffffff", borderRadius: 16, paddingHorizontal: 14, paddingVertical: 8, gap: 4 },
  taskRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  taskTitle: { flex: 1, color: "#1e1e1e", fontFamily: "DMSans_700Bold", fontSize: 15 },
  moreButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  taskMenu: { borderTopWidth: 1, borderTopColor: "#ead9d7" },
  menuItem: { minHeight: 44, justifyContent: "center" },
  assignee: { flex: 1, color: "#594441", fontFamily: "DMSans_400Regular", fontSize: 12 },
  due: { flexShrink: 1, color: "#a43f3a", fontFamily: "DMSans_700Bold", fontSize: 12, textAlign: "right" },
  empty: { color: "#ffffff", fontFamily: "DMSans_400Regular", fontSize: 14, textAlign: "center", paddingVertical: 16 },
  primary: { marginTop: 12, minHeight: 48, borderRadius: 24, backgroundColor: "#ffffff", alignItems: "center", justifyContent: "center", padding: 12 },
  primaryText: { color: "#a43f3a", fontFamily: "DMSans_700Bold", fontSize: 16 },
  secondary: { marginTop: 8, minHeight: 48, borderRadius: 24, backgroundColor: "#ffffff", alignItems: "center", justifyContent: "center", padding: 12 },
  secondaryText: { color: "#a43f3a", fontFamily: "DMSans_700Bold", fontSize: 16 },
});
