import { useLocalSearchParams } from "expo-router";
import { TaskForm } from "../components/task-form";

export default function EditTasksScreen() {
  const { task } = useLocalSearchParams<{ task?: string }>();
  return <TaskForm mode="edit" initialTask={task} />;
}
