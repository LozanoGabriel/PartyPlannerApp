import { createContext, Dispatch, ReactNode, SetStateAction, useContext, useState } from "react";
import { drinkSuggestions, foodSuggestions } from "./event-settings-context";

export type EventPreview = {
  name: string;
  duration: string;
  foods: string;
  drinks: string;
  imageUri: string | null;
};

export type GuestResponse = "pending" | "attending" | "declined" | "maybe";
export type GuestPreview = { id: string; name: string; response: GuestResponse; invited: boolean };
export const guestResponseLabels: Record<GuestResponse, string> = {
  pending: "Awaiting response",
  attending: "Will be attending",
  declined: "Won't be attending",
  maybe: "Maybe",
};

const initialGuests: GuestPreview[] = [
  { id: "1", name: "Claribel Hernandez", response: "attending", invited: true },
  { id: "2", name: "Cristian Mantilla", response: "maybe", invited: true },
  { id: "3", name: "Gabriel Lozano", response: "declined", invited: true },
  { id: "4", name: "Audrey Jones", response: "pending", invited: true },
  { id: "5", name: "Sofia Rivera", response: "pending", invited: false },
];

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
  guests: GuestPreview[];
  setGuests: Dispatch<SetStateAction<GuestPreview[]>>;
} | null>(null);

export function EventPreviewProvider({ children }: { children: ReactNode }) {
  const [event, setEvent] = useState(initialEvent);
  const [guests, setGuests] = useState(initialGuests);
  return <EventPreviewContext.Provider value={{ event, setEvent, guests, setGuests }}>{children}</EventPreviewContext.Provider>;
}

export function useEventPreview() {
  const context = useContext(EventPreviewContext);
  if (!context) throw new Error("Event preview must be used inside EventPreviewProvider.");
  return context;
}
