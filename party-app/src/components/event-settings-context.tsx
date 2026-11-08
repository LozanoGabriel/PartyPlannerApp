import { createContext, ReactNode, useContext, useState } from "react";

export type TimelineItem = { label: string; minutes: string };
export type EventSettings = {
  duration: string;
  invitations: string;
  rsvp: string;
  foods: string[];
  drinks: string[];
  customFoods: string[];
  customDrinks: string[];
  timeline: TimelineItem[];
};

export const foodSuggestions = ["Hors d'ouvres", "Main Course", "Dessert"];
export const drinkSuggestions = ["Cocktail", "Mocktail", "Soda", "Water"];

function createGalaConversationId() {
  return `draft:${Date.now()}:${Math.random().toString(36).slice(2)}`;
}

function emptySettings(): EventSettings {
  return {
    duration: "",
    invitations: "",
    rsvp: "",
    foods: [],
    drinks: [],
    customFoods: [],
    customDrinks: [],
    timeline: [{ label: "", minutes: "" }],
  };
}

type SettingsContext = {
  galaConversationId: string;
  settings: EventSettings;
  setSettings: (value: EventSettings) => void;
  editing: boolean;
  setEditing: (value: boolean) => void;
  reset: () => void;
  guestCount: string;
  setGuestCount: (value: string) => void;
  eventDate: Date | null;
  setEventDate: (value: Date | null) => void;
  eventStartTime: Date | null;
  setEventStartTime: (value: Date | null) => void;
  budgetChoice: BudgetChoice;
  setBudgetChoice: (value: BudgetChoice) => void;
  budgetAmount: string;
  setBudgetAmount: (value: string) => void;
  resetPreview: () => void;
};

export type BudgetChoice = "generate" | "manual" | "skip" | null;

const Context = createContext<SettingsContext | null>(null);

export function EventSettingsProvider({ children }: { children: ReactNode }) {
  const [galaConversationId, setGalaConversationId] = useState(createGalaConversationId);
  const [settings, setSettings] = useState<EventSettings>(emptySettings);
  const [editing, setEditing] = useState(false);
  const [guestCount, setGuestCount] = useState("");
  const [eventDate, setEventDate] = useState<Date | null>(null);
  const [eventStartTime, setEventStartTime] = useState<Date | null>(null);
  const [budgetChoice, setBudgetChoice] = useState<BudgetChoice>(null);
  const [budgetAmount, setBudgetAmount] = useState("");

  function reset() {
    setSettings(emptySettings());
    setEditing(false);
  }

  function resetPreview() {
    reset();
    setGalaConversationId(createGalaConversationId());
    setGuestCount("");
    setEventDate(null);
    setEventStartTime(null);
    setBudgetChoice(null);
    setBudgetAmount("");
  }

  return <Context.Provider value={{ galaConversationId, settings, setSettings, editing, setEditing, reset, guestCount, setGuestCount, eventDate, setEventDate, eventStartTime, setEventStartTime, budgetChoice, setBudgetChoice, budgetAmount, setBudgetAmount, resetPreview }}>{children}</Context.Provider>;
}

export function useEventSettings() {
  const context = useContext(Context);
  if (!context) throw new Error("Event settings must be used inside EventSettingsProvider.");
  return context;
}
