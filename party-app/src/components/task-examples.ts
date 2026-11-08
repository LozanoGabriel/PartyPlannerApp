export type TaskGroup = "Today" | "Upcoming" | "Overdue" | "Completed";
export type Task = { id: string; title: string; assignee: string; assignedToMe: boolean; due: string; group: TaskGroup };

export const taskExamples: Task[] = [
  { id: "catering", title: "Confirm catering menu", assignee: "Me", assignedToMe: true, due: "Due today", group: "Today" },
  { id: "reminders", title: "Send RSVP Reminders", assignee: "Claribel Hernandez", assignedToMe: false, due: "Due today", group: "Today" },
  { id: "venue", title: "Confirm venue details", assignee: "Me", assignedToMe: true, due: "Due today", group: "Today" },
  { id: "guests", title: "Finalize guest list", assignee: "Cristian Mantilla", assignedToMe: false, due: "Due Nov 10", group: "Upcoming" },
  { id: "photographer", title: "Book Photographer", assignee: "Gabriel Lozano", assignedToMe: true, due: "Due Nov 12", group: "Upcoming" },
  { id: "invitations", title: "Review invitations", assignee: "Me", assignedToMe: true, due: "Overdue", group: "Overdue" },
  { id: "theme", title: "Choose party theme", assignee: "Me", assignedToMe: true, due: "Completed", group: "Completed" },
  { id: "location", title: "Choose a location", assignee: "Claribel Hernandez", assignedToMe: false, due: "Completed", group: "Completed" },
];
