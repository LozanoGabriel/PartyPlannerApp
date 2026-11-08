import { createContext, ReactNode, useContext, useState } from "react";

type PreviewNotification = {
  id: string;
  kind: "guest" | "task";
  title: string;
  message: string;
  read: boolean;
};

const examples: PreviewNotification[] = [
  { id: "guest-1", kind: "guest", title: "A guest is attending!", message: "Claribel Hernandez plans to attend Mario's Birthday Party.", read: false },
  { id: "task-1", kind: "task", title: "A little planning reminder", message: "Confirm the catering menu for Mario's Birthday Party.", read: false },
  { id: "task-2", kind: "task", title: "Check in on your guest list", message: "Review your RSVP reminders and follow up with guests.", read: true },
];

type NotificationPreviewContext = {
  notifications: PreviewNotification[];
  unreadCount: number;
  markRead: (id: string) => void;
  markAllRead: () => void;
};

const Context = createContext<NotificationPreviewContext | null>(null);

export function NotificationPreviewProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState(examples);
  const markRead = (id: string) => setNotifications((current) => current.map((item) => item.id === id ? { ...item, read: true } : item));
  const markAllRead = () => setNotifications((current) => current.map((item) => ({ ...item, read: true })));
  const unreadCount = notifications.filter((item) => !item.read).length;

  return <Context.Provider value={{ notifications, unreadCount, markRead, markAllRead }}>{children}</Context.Provider>;
}

export function useNotificationPreview() {
  const context = useContext(Context);
  if (!context) throw new Error("Notification previews must be used inside NotificationPreviewProvider.");
  return context;
}
