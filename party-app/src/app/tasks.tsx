import Ionicons from "@expo/vector-icons/Ionicons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Animated, Image, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { DashboardLayout } from "../components/dashboard-layout";
import { Task, TaskGroup, taskExamples } from "../components/task-examples";
import { usePreviewProgress } from "../components/use-preview-progress";
import { useAppPreferences } from "../components/app-preferences";
import { darkPalette } from "../components/dark-palette";

const gala = require("../../assets/images/gala_front_facing.png");

type TaskFilter = "All" | "Assigned" | "Completed";
type DueFilter = "Any" | "Today" | "Upcoming" | "Overdue";

const groups: TaskGroup[] = ["Today", "Upcoming", "Overdue", "Completed"];
const filters: TaskFilter[] = ["All", "Assigned", "Completed"];
const dueFilters: DueFilter[] = ["Any", "Today", "Upcoming", "Overdue"];

function TaskCard({ task, open, onToggle, onComplete }: { task: Task; open: boolean; onToggle: () => void; onComplete: () => void }) {
  const { darkMode } = useAppPreferences();
  return (
    <View style={[styles.taskCard, darkMode && styles.darkPanel]}>
      <View style={styles.taskRow}>
        <Text style={[styles.taskTitle, darkMode && styles.darkText]}>{task.title}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Options for ${task.title}`}
          accessibilityState={{ expanded: open }}
          onPress={onToggle}
          style={styles.moreButton}
        >
          <Ionicons name="ellipsis-horizontal" size={22} color={darkMode ? darkPalette.text : "#3d2423"} />
        </Pressable>
      </View>
      <View style={styles.taskRow}>
        <Text style={[styles.assignee, darkMode && styles.darkText]}>Assigned to {task.assignee}</Text>
        <Text style={[styles.due, darkMode && styles.darkAccent]}>{task.due}</Text>
      </View>
      {open && <View style={styles.taskMenu}>
        <Pressable accessibilityRole="link" onPress={() => router.push({ pathname: "/edit-tasks", params: { task: task.id } })} style={styles.menuItem}><Text style={[styles.linkText, darkMode && styles.darkAccent]}>Edit task</Text></Pressable>
        {task.group !== "Completed" && <Pressable accessibilityRole="button" onPress={onComplete} style={styles.menuItem}><Text style={[styles.linkText, darkMode && styles.darkAccent]}>Mark as completed</Text></Pressable>}
      </View>}
    </View>
  );
}

export default function TasksScreen() {
  const { darkMode, aiSuggestions } = useAppPreferences();
  const { progress, fraction } = usePreviewProgress();
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [openTask, setOpenTask] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<TaskGroup[]>([]);
  const [notice, setNotice] = useState(false);
  useFocusEffect(useCallback(() => () => { setCompletedIds([]); setOpenTask(null); setExpandedGroups([]); setNotice(false); }, []));
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(false), 3500);
    return () => clearTimeout(timer);
  }, [notice, completedIds]);
  const tasks = taskExamples.map((task) => completedIds.includes(task.id) ? { ...task, group: "Completed" as const, due: "Completed" } : task);
  const completed = 12 + completedIds.length;
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<TaskFilter>("All");
  const [dueFilter, setDueFilter] = useState<DueFilter>("Any");
  const [showDueFilters, setShowDueFilters] = useState(false);
  const search = query.trim().toLowerCase();
  const visibleTasks = tasks.filter((task) => {
    const matchesSearch = `${task.title} ${task.assignee} ${task.due}`.toLowerCase().includes(search);
    const matchesFilter = filter === "All" || (filter === "Assigned" && task.assignedToMe) || (filter === "Completed" && task.group === "Completed");
    const matchesDue = dueFilter === "Any" || task.group === dueFilter;
    return matchesSearch && matchesFilter && matchesDue;
  });

  return (
    <DashboardLayout active="Tasks" overlay={notice ? <View style={styles.toast} accessibilityLiveRegion="polite"><Ionicons name="sparkles" size={20} color="#ffffff" /><Text style={styles.primaryText}>Task completed! (preview)</Text></View> : undefined}>
      {aiSuggestions && <View style={[styles.galaCard, darkMode && styles.darkPanel]}>
        <View style={styles.galaHeader}>
          <View style={styles.galaFrame}><Image source={gala} style={styles.gala} resizeMode="contain" accessible={false} /></View>
          <Text style={[styles.cardTitle, darkMode && styles.darkText]}>A little help from Gala</Text>
        </View>
        <Text style={[styles.detail, darkMode && styles.darkText]}>You have three tasks due today. Want me to help you prioritize them?</Text>
        <Pressable accessibilityRole="link" onPress={() => router.push("/gala")} style={styles.link}>
          <Text style={[styles.linkText, darkMode && styles.darkAccent]}>Chat with Gala</Text><Ionicons name="arrow-forward" size={18} color={darkMode ? darkPalette.accent : "#a43f3a"} />
        </Pressable>
      </View>}

      <View style={styles.overview}>
        <Text style={styles.title} accessibilityRole="header">My Tasks</Text>
        <Text style={styles.subtitle}>A little progress goes a long way.</Text>
        <Text style={styles.preview}>Summary and task list are separate examples.</Text>

        <View style={[styles.card, darkMode && styles.darkPanel]}>
          <Text style={[styles.cardTitle, darkMode && styles.darkText]}>Planning progress</Text>
          <View style={styles.progress} accessibilityRole="progressbar" accessibilityLabel="Planning progress" accessibilityValue={{ min: 0, max: 20, now: completed, text: `${completed} completed, ${20 - completed} remaining` }}>
            <Animated.View style={[styles.progressFill, { width: progress.interpolate({ inputRange: [0, 1], outputRange: ["0%", `${completed * 5}%`] }) }]} />
          </View>
          <View style={styles.row}><Text style={[styles.detail, darkMode && styles.darkText]} accessibilityLabel={`${completed} completed`}>{Math.round(completed * fraction)} completed</Text><Text style={[styles.detail, darkMode && styles.darkText]} accessibilityLabel={`${20 - completed} remaining`}>{20 - Math.round(completed * fraction)} remaining</Text></View>
        </View>

        <View style={styles.metrics}>
          {[{ label: "Due today", count: "3", unit: "Tasks" }, { label: "Upcoming", count: "5", unit: "Tasks" }, { label: "Overdue", count: "1", unit: "Task" }].map((item) => (
            <View key={item.label} style={[styles.metric, darkMode && styles.darkPanel]}>
              <Text style={[styles.metricLabel, darkMode && styles.darkText]}>{item.label}</Text>
              <Text style={[styles.metricCount, darkMode && styles.darkText]}>{item.count}</Text>
              <Text style={[styles.metricLabel, darkMode && styles.darkText]}>{item.unit}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.searchRow, darkMode && styles.darkPanel]}>
          <Ionicons name="search" size={20} color={darkMode ? darkPalette.text : "#594441"} />
          <TextInput accessibilityLabel="Search tasks" value={query} onChangeText={setQuery} placeholder="Search tasks..." placeholderTextColor={darkMode ? darkPalette.placeholder : "#6d615e"} style={[styles.searchInput, darkMode && styles.darkText]} returnKeyType="search" />
          <Pressable accessibilityRole="button" accessibilityLabel="Filter by due date" accessibilityState={{ expanded: showDueFilters }} onPress={() => setShowDueFilters(!showDueFilters)} style={styles.filterIcon}>
            <Ionicons name="options-outline" size={23} color={darkMode ? darkPalette.accent : "#a43f3a"} />
          </Pressable>
        </View>
        {showDueFilters && (
          <View style={styles.dueFilters} accessibilityRole="radiogroup" accessibilityLabel="Due date">
            {dueFilters.map((option) => (
              <Pressable key={option} accessibilityRole="radio" accessibilityState={{ checked: dueFilter === option }} onPress={() => setDueFilter(option)} style={[styles.dueFilter, dueFilter === option && styles.dueFilterSelected]}>
                <Text style={[styles.dueFilterText, dueFilter === option && styles.dueFilterTextSelected]}>{option}</Text>
              </Pressable>
            ))}
          </View>
        )}
        {dueFilter !== "Any" && <Text style={styles.activeFilter}>Due date filter: {dueFilter}</Text>}

        <View style={styles.tabs} accessibilityRole="radiogroup" accessibilityLabel="Task filter">
          {filters.map((option) => (
            <Pressable key={option} accessibilityRole="radio" accessibilityState={{ checked: filter === option }} onPress={() => setFilter(option)} style={[styles.tab, filter === option && styles.selectedTab]}>
              <Text style={[styles.tabText, filter === option && styles.selectedTabText]}>{option}</Text>
            </Pressable>
          ))}
        </View>

        {visibleTasks.length === 0 ? (
          <Text style={styles.empty} accessibilityLiveRegion="polite">No tasks match your search and filters.</Text>
        ) : groups.map((group) => {
          const groupTasks = visibleTasks.filter((task) => task.group === group);
          if (!groupTasks.length) return null;
          const expanded = expandedGroups.includes(group);
          return (
            <View key={group} style={styles.section}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${group}, ${groupTasks.length} ${groupTasks.length === 1 ? "task" : "tasks"}`}
                accessibilityState={{ expanded }}
                aria-expanded={expanded}
                onPress={() => {
                  setExpandedGroups((current) => expanded ? current.filter((item) => item !== group) : [...current, group]);
                  if (expanded) setOpenTask(null);
                }}
                style={styles.sectionToggle}
              >
                <Text style={styles.sectionTitle}>{group} ({groupTasks.length})</Text>
                <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={22} color="#ffffff" />
              </Pressable>
              {expanded && groupTasks.map((task) => <TaskCard key={task.id} task={task} open={openTask === task.id} onToggle={() => setOpenTask(openTask === task.id ? null : task.id)} onComplete={() => { setCompletedIds((current) => [...current, task.id]); setOpenTask(null); setNotice(true); }} />)}
            </View>
          );
        })}
      </View>
      <Pressable accessibilityRole="link" onPress={() => router.push("/create-task")} style={styles.primary}>
        <Text style={styles.primaryText}>Create a Task</Text>
      </Pressable>
      <Pressable accessibilityRole="link" onPress={() => router.push("/edit-tasks")} style={[styles.secondary, darkMode && styles.darkPanel]}>
        <Text style={[styles.secondaryText, darkMode && styles.darkAccent]}>Edit Tasks</Text>
      </Pressable>
    </DashboardLayout>
  );
}

const styles = StyleSheet.create({
  darkPanel: { backgroundColor: darkPalette.panel },
  darkText: { color: darkPalette.text },
  darkAccent: { color: darkPalette.accent },
  galaCard: { backgroundColor: "#ffffff", borderRadius: 18, padding: 15, gap: 8, marginBottom: 12 },
  galaHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  galaFrame: { width: 52, height: 52, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  gala: { width: 86, height: 86 },
  link: { minHeight: 44, flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start" },
  linkText: { color: "#a43f3a", fontFamily: "DMSans_700Bold", fontSize: 14 },
  overview: { backgroundColor: "#c65d58", borderRadius: 32, padding: 16, gap: 12 },
  title: { color: "#ffffff", fontFamily: "DMSans_700Bold", fontSize: 26, textAlign: "center" },
  subtitle: { color: "#ffffff", fontFamily: "DMSans_400Regular", fontSize: 14, textAlign: "center" },
  preview: { color: "#ffffff", fontFamily: "DMSans_400Regular", fontSize: 14, lineHeight: 19, textAlign: "center" },
  card: { backgroundColor: "#ffffff", borderRadius: 18, padding: 15, gap: 10 },
  cardTitle: { flexShrink: 1, color: "#1e1e1e", fontFamily: "DMSans_700Bold", fontSize: 16 },
  detail: { color: "#3d2423", fontFamily: "DMSans_400Regular", fontSize: 13, lineHeight: 19 },
  row: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  progress: { height: 10, borderRadius: 6, backgroundColor: "#f6e5d8", overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: "#c65d58" },
  metrics: { flexDirection: "row", gap: 8 },
  metric: { flex: 1, minWidth: 0, backgroundColor: "#ffffff", borderRadius: 16, padding: 10, gap: 3 },
  metricLabel: { color: "#594441", fontFamily: "DMSans_400Regular", fontSize: 12 },
  metricCount: { color: "#1e1e1e", fontFamily: "DMSans_700Bold", fontSize: 22 },
  searchRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#ffffff", borderRadius: 12, paddingLeft: 12, gap: 8 },
  searchInput: { flex: 1, minWidth: 0, minHeight: 48, color: "#1e1e1e", fontFamily: "DMSans_400Regular", fontSize: 15 },
  filterIcon: { width: 48, minHeight: 48, alignItems: "center", justifyContent: "center" },
  dueFilters: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  dueFilter: { minHeight: 44, paddingHorizontal: 10, borderRadius: 22, justifyContent: "center", borderWidth: 1, borderColor: "#ffffff" },
  dueFilterSelected: { backgroundColor: "#ffffff" },
  dueFilterText: { color: "#ffffff", fontFamily: "DMSans_700Bold", fontSize: 12 },
  dueFilterTextSelected: { color: "#a43f3a" },
  activeFilter: { color: "#ffffff", fontFamily: "DMSans_400Regular", fontSize: 12 },
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
  toast: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#783b38", borderRadius: 24, paddingHorizontal: 16, paddingVertical: 12 },
  assignee: { flex: 1, color: "#594441", fontFamily: "DMSans_400Regular", fontSize: 12 },
  due: { flexShrink: 1, color: "#a43f3a", fontFamily: "DMSans_700Bold", fontSize: 12, textAlign: "right" },
  empty: { color: "#ffffff", fontFamily: "DMSans_400Regular", fontSize: 14, textAlign: "center", paddingVertical: 16 },
  primary: { marginTop: 12, minHeight: 48, borderRadius: 24, backgroundColor: "#c65d58", alignItems: "center", justifyContent: "center", padding: 12 },
  primaryText: { color: "#ffffff", fontFamily: "DMSans_700Bold", fontSize: 16 },
  secondary: { marginTop: 8, minHeight: 48, borderRadius: 24, backgroundColor: "#ffffff", alignItems: "center", justifyContent: "center", padding: 12 },
  secondaryText: { color: "#a43f3a", fontFamily: "DMSans_700Bold", fontSize: 16 },
});
