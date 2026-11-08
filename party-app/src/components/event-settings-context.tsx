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

function suggestedSettings(): EventSettings {
  return {
    duration: "4",
    invitations: "42",
    rsvp: "14",
    foods: [...foodSuggestions],
    drinks: [...drinkSuggestions],
    customFoods: [],
    customDrinks: [],
    timeline: [
      { label: "Set up", minutes: "0" },
      { label: "Arrival", minutes: "30" },
      { label: "Build", minutes: "60" },
      { label: "Peak", minutes: "120" },
      { label: "Wind down", minutes: "180" },
      { label: "Tear down", minutes: "210" },
    ],
  };
}

type SettingsContext = {
  settings: EventSettings;
  setSettings: (value: EventSettings) => void;
  editing: boolean;
  setEditing: (value: boolean) => void;
  reset: () => void;
  guestCount: string;
  setGuestCount: (value: string) => void;
  budgetChoice: BudgetChoice;
  setBudgetChoice: (value: BudgetChoice) => void;
  budgetAmount: string;
  setBudgetAmount: (value: string) => void;
  resetPreview: () => void;
};

export type BudgetChoice = "generate" | "manual" | "skip" | null;

const Context = createContext<SettingsContext | null>(null);

export function EventSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<EventSettings>(suggestedSettings);
  const [editing, setEditing] = useState(false);
  const [guestCount, setGuestCount] = useState("");
  const [budgetChoice, setBudgetChoice] = useState<BudgetChoice>(null);
  const [budgetAmount, setBudgetAmount] = useState("");

  function reset() {
    setSettings(suggestedSettings());
    setEditing(false);
  }

  function resetPreview() {
    reset();
    setGuestCount("");
    setBudgetChoice(null);
    setBudgetAmount("");
  }

  return <Context.Provider value={{ settings, setSettings, editing, setEditing, reset, guestCount, setGuestCount, budgetChoice, setBudgetChoice, budgetAmount, setBudgetAmount, resetPreview }}>{children}</Context.Provider>;
}

export function useEventSettings() {
  const context = useContext(Context);
  if (!context) throw new Error("Event settings must be used inside EventSettingsProvider.");
  return context;
}
