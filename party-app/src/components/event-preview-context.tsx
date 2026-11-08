import { createContext, ReactNode, useContext, useState } from "react";
import { drinkSuggestions, foodSuggestions } from "./event-settings-context";

export type EventPreview = {
  name: string;
  duration: string;
  foods: string;
  drinks: string;
  imageUri: string | null;
};

const initialEvent: EventPreview = {
  name: "Mario's Birthday Party",
  duration: "4",
  foods: foodSuggestions.join(", "),
  drinks: drinkSuggestions.join(", "),
  imageUri: null,
};

const EventPreviewContext = createContext<{
  event: EventPreview;
  setEvent: (event: EventPreview) => void;
} | null>(null);

export function EventPreviewProvider({ children }: { children: ReactNode }) {
  const [event, setEvent] = useState(initialEvent);
  return <EventPreviewContext.Provider value={{ event, setEvent }}>{children}</EventPreviewContext.Provider>;
}

export function useEventPreview() {
  const context = useContext(EventPreviewContext);
  if (!context) throw new Error("Event preview must be used inside EventPreviewProvider.");
  return context;
}
