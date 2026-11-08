import { createContext, ReactNode, useContext, useState } from "react";
import { drinkSuggestions, foodSuggestions } from "./event-settings-context";

export type EventPreferences = { duration: string; invitations: string; rsvp: string; foods: string[]; drinks: string[] };
export type ProfilePreview = { name: string; phone: string; email: string };

type AppPreferences = {
  darkMode: boolean;
  setDarkMode: (value: boolean) => void;
  notifications: boolean;
  setNotifications: (value: boolean) => void;
  aiSuggestions: boolean;
  setAiSuggestions: (value: boolean) => void;
  eventPreferences: EventPreferences;
  setEventPreferences: (value: EventPreferences) => void;
  profile: ProfilePreview;
  setProfile: (value: ProfilePreview) => void;
};

const PreferencesContext = createContext<AppPreferences | null>(null);

export function AppPreferencesProvider({ children }: { children: ReactNode }) {
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState(true);
  const [eventPreferences, setEventPreferences] = useState<EventPreferences>({
    duration: "4", invitations: "42", rsvp: "14", foods: [...foodSuggestions], drinks: [...drinkSuggestions],
  });
  const [profile, setProfile] = useState<ProfilePreview>({ name: "Gabriel Lozano", phone: "", email: "" });

  return (
    <PreferencesContext.Provider value={{ darkMode, setDarkMode, notifications, setNotifications, aiSuggestions, setAiSuggestions, eventPreferences, setEventPreferences, profile, setProfile }}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function useAppPreferences() {
  const preferences = useContext(PreferencesContext);
  if (!preferences) throw new Error("App preferences must be used inside AppPreferencesProvider.");
  return preferences;
}
