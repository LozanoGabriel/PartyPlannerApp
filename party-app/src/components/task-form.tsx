import Ionicons from "@expo/vector-icons/Ionicons";
import { Href, router, useNavigation } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Image, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { DashboardLayout } from "./dashboard-layout";
import { SaveChangesDialog } from "./save-changes-dialog";
import { TaskDatePicker } from "./task-date-picker";
import { taskExamples } from "./task-examples";

const gala = require("../../assets/images/gala_front_facing.png");
const guests = ["Me", "Claribel Hernandez", "Cristian Mantilla", "Gabriel Lozano"];
type Draft = { event: string; title: string; date: Date | null; assignee: string; notes: string };
const emptyDraft: Draft = { event: "", title: "", date: null, assignee: "Me", notes: "" };

function exampleDraft(id: string): Draft {
  const task = taskExamples.find((item) => item.id === id);
  return task ? { event: "Mario's Birthday Party", title: task.title, date: null, assignee: task.assignee, notes: "" } : emptyDraft;
}

export function TaskForm({ mode, initialTask }: { mode: "create" | "edit"; initialTask?: string }) {
  const [selected, setSelected] = useState(taskExamples.some((task) => task.id === initialTask) ? initialTask : undefined);
  const [draft, setDraft] = useState<Draft>(() => initialTask ? exampleDraft(initialTask) : emptyDraft);
  const [baseline, setBaseline] = useState<Draft>(() => initialTask ? exampleDraft(initialTask) : emptyDraft);
  const [taskMenu, setTaskMenu] = useState(false);
  const [guestMenu, setGuestMenu] = useState(false);
  const [dialog, setDialog] = useState<"leave" | "save" | "select" | null>(null);
  const [discardPrompt, setDiscardPrompt] = useState(false);
  const [notice, setNotice] = useState("");
  const [previewEdits, setPreviewEdits] = useState<Record<string, Draft>>({});
  const pending = useRef<(() => void) | null>(null);
  const allowLeave = useRef(false);
  const navigation = useNavigation();
  const changed = draft.event !== baseline.event || draft.title !== baseline.title || draft.date?.getTime() !== baseline.date?.getTime() || draft.assignee !== baseline.assignee || draft.notes !== baseline.notes;
  const hasPreview = changed || Object.keys(previewEdits).length > 0;

  useEffect(() => navigation.addListener("beforeRemove", (event) => {
    if (!hasPreview || allowLeave.current) return;
    event.preventDefault();
    pending.current = () => navigation.dispatch(event.data.action);
    setDialog("leave");
  }), [hasPreview, navigation]);

  useEffect(() => {
    if (Platform.OS !== "web" || !hasPreview) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [hasPreview]);

  function leave() {
    allowLeave.current = true;
    setDialog(null);
    setDiscardPrompt(false);
    if (pending.current) pending.current();
    else router.replace("/events");
  }

  function navigate(href: Href) {
    pending.current = () => router.replace(href);
    setDialog("leave");
  }

  function selectTask(id: string) {
    const next = previewEdits[id] || exampleDraft(id);
    setSelected(id);
    setDraft(next);
    setBaseline(next);
    setTaskMenu(false);
    setNotice("");
  }

  function save() {
    if (!selected || !draft.event.trim() || !draft.title.trim()) {
      setDialog(null);
      setNotice("Enter an event and task name before saving a preview.");
      return;
    }
    setPreviewEdits({ ...previewEdits, [selected]: draft });
    setBaseline(draft);
    setDialog(null);
    setNotice("Preview updated for this page only. Nothing was saved to a server.");
  }

  const overlay = discardPrompt ? (
    <View style={styles.discardPrompt} accessibilityLiveRegion="polite">
      <Text style={styles.discardText}>Discard this task and return to Events?</Text>
      <View style={styles.discardButtons}>
        <Pressable accessibilityRole="button" onPress={() => { pending.current = null; leave(); }} style={styles.promptButton}><Text style={styles.buttonText}>Discard Task</Text></Pressable>
        <Pressable accessibilityRole="button" onPress={() => setDiscardPrompt(false)} style={styles.promptButton}><Text style={styles.buttonText}>Keep Editing</Text></Pressable>
      </View>
    </View>
  ) : undefined;

  return (
    <DashboardLayout active="Tasks" onNavigate={navigate} overlay={overlay}>
      <View style={styles.galaFrame}><Image source={gala} style={styles.gala} resizeMode="contain" accessible={false} /></View>
      <View style={styles.card}>
        <Text style={styles.title} accessibilityRole="header">{mode === "create" ? "Create a task" : "Edit Tasks"}</Text>
        <Text style={styles.notice}>Preview only. Tasks are not saved to a server.</Text>
        {mode === "edit" && <>
          <Text style={styles.label}>Choose a task</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Choose a task" accessibilityState={{ expanded: taskMenu }} onPress={() => setTaskMenu(!taskMenu)} style={styles.select}>
            <Text style={styles.inputText}>{selected ? taskExamples.find((item) => item.id === selected)?.title : "Select a task"}</Text>
            <Ionicons name={taskMenu ? "chevron-up" : "chevron-down"} size={20} color="#a43f3a" />
          </Pressable>
          {taskMenu && <View style={styles.options}>{taskExamples.map((task) => <Pressable key={task.id} accessibilityRole="button" onPress={() => {
            if (changed) { pending.current = () => selectTask(task.id); setDialog("select"); }
            else selectTask(task.id);
          }} style={styles.option}><Text style={styles.inputText}>{task.title}</Text></Pressable>)}</View>}
        </>}
        {(mode === "create" || selected) && <>
          <View style={styles.field}><Text style={styles.label}>Event</Text><TextInput accessibilityLabel="Event" value={draft.event} onChangeText={(event) => setDraft({ ...draft, event })} placeholder="Mario's Birthday Party" placeholderTextColor="#777777" style={styles.input} /></View>
          <View style={styles.field}><Text style={styles.label}>What needs to get done?</Text><TextInput accessibilityLabel="What needs to get done?" value={draft.title} onChangeText={(title) => setDraft({ ...draft, title })} placeholder="What needs to get done?" placeholderTextColor="#777777" style={styles.input} /></View>
          <View style={styles.field}><Text style={styles.label}>Due Date</Text><TaskDatePicker value={draft.date} onChange={(date) => setDraft({ ...draft, date })} /></View>
          <View style={styles.field}>
            <Text style={styles.label}>Assign to</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Assign to" accessibilityState={{ expanded: guestMenu }} onPress={() => setGuestMenu(!guestMenu)} style={styles.select}>
              <Text style={styles.inputText}>{draft.assignee}</Text><Ionicons name={guestMenu ? "chevron-up" : "chevron-down"} size={20} color="#a43f3a" />
            </Pressable>
            {guestMenu && <View style={styles.options}>{guests.map((guest) => <Pressable key={guest} accessibilityRole="button" onPress={() => { setDraft({ ...draft, assignee: guest }); setGuestMenu(false); }} style={styles.option}><Text style={styles.inputText}>{guest}</Text></Pressable>)}</View>}
          </View>
          <View style={styles.field}><Text style={styles.label}>Notes (optional)</Text><TextInput accessibilityLabel="Notes (optional)" value={draft.notes} onChangeText={(notes) => setDraft({ ...draft, notes })} placeholder="Add more details..." placeholderTextColor="#777777" multiline style={[styles.input, styles.notes]} /></View>
          {!!notice && <Text style={styles.notice} accessibilityLiveRegion="polite">{notice}</Text>}
          {mode === "create" ? <Pressable accessibilityRole="button" onPress={() => setNotice("Task creation is not connected yet. Nothing was saved.")} style={styles.button}><Text style={styles.buttonText}>Create Task</Text></Pressable> : <Pressable accessibilityRole="button" disabled={!changed} accessibilityState={{ disabled: !changed }} onPress={() => setDialog("save")} style={[styles.button, !changed && styles.disabled]}><Text style={styles.buttonText}>Save Changes</Text></Pressable>}
        </>}
        <Pressable accessibilityRole="button" onPress={() => setDiscardPrompt(true)} style={styles.back}><Text style={styles.backText}>{mode === "create" ? "Discard Task" : "Back to Events"}</Text></Pressable>
      </View>
      <SaveChangesDialog visible={dialog !== null} onClose={() => { pending.current = null; setDialog(null); }} onSave={dialog === "save" ? save : undefined} onDiscard={dialog === "select" ? () => { setDialog(null); pending.current?.(); pending.current = null; } : dialog === "leave" ? leave : undefined} message={dialog === "save" ? "This edit is only available on this page and will be lost when you leave." : "Task saving is not connected. Leaving or switching tasks will discard unsaved changes."} />
    </DashboardLayout>
  );
}

const styles = StyleSheet.create({
  galaFrame: { width: 48, height: 48, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  gala: { width: 80, height: 80 },
  card: { backgroundColor: "#c65d58", borderRadius: 32, padding: 20, gap: 12 },
  title: { color: "#ffffff", fontFamily: "DMSans_700Bold", fontSize: 26, textAlign: "center" },
  notice: { color: "#ffffff", fontFamily: "DMSans_400Regular", fontSize: 13, textAlign: "center" },
  field: { gap: 6 },
  label: { color: "#ffffff", fontFamily: "DMSans_700Bold", fontSize: 15 },
  input: { minHeight: 48, borderRadius: 10, backgroundColor: "#ffffff", color: "#1e1e1e", fontFamily: "DMSans_400Regular", fontSize: 16, paddingHorizontal: 12, paddingVertical: 10 },
  inputText: { flexShrink: 1, color: "#1e1e1e", fontFamily: "DMSans_400Regular", fontSize: 16 },
  notes: { minHeight: 80, textAlignVertical: "top" },
  select: { minHeight: 48, borderRadius: 10, backgroundColor: "#ffffff", paddingHorizontal: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  options: { borderRadius: 10, backgroundColor: "#ffffff", paddingHorizontal: 12 },
  option: { minHeight: 44, justifyContent: "center", borderBottomWidth: 1, borderBottomColor: "#eeeeee" },
  button: { minHeight: 48, borderRadius: 24, backgroundColor: "#ffffff", alignItems: "center", justifyContent: "center", padding: 12 },
  disabled: { opacity: 0.6 },
  buttonText: { color: "#a43f3a", fontFamily: "DMSans_700Bold", fontSize: 15, textAlign: "center" },
  back: { minHeight: 48, alignItems: "center", justifyContent: "center" },
  backText: { color: "#ffffff", fontFamily: "DMSans_700Bold", fontSize: 15, textDecorationLine: "underline" },
  discardPrompt: { width: "100%", maxWidth: 450, borderRadius: 16, backgroundColor: "#ffffff", padding: 12, gap: 6 },
  discardText: { color: "#3d2423", fontFamily: "DMSans_700Bold", fontSize: 14, textAlign: "center" },
  discardButtons: { flexDirection: "row", justifyContent: "space-around" },
  promptButton: { minHeight: 44, justifyContent: "center", paddingHorizontal: 8 },
});
