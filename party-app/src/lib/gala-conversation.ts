import AsyncStorage from "@react-native-async-storage/async-storage";

export type GalaConversationEntry = {
  context: string;
  userPrompt?: string;
  assistantResponse: string;
};

const STORAGE_PREFIX = "gala-conversation:";

function storageKey(id: string) {
  return `${STORAGE_PREFIX}${id}`;
}

export async function readGalaConversation(id: string): Promise<GalaConversationEntry[]> {
  const stored = await AsyncStorage.getItem(storageKey(id));
  if (!stored) return [];

  let entries: unknown;
  try {
    entries = JSON.parse(stored) as unknown;
  } catch (error) {
    throw new Error("Gala's saved conversation is corrupted and could not be read.", { cause: error });
  }
  if (
    !Array.isArray(entries) ||
    !entries.every((entry) =>
      typeof entry === "object" &&
      entry !== null &&
      !Array.isArray(entry) &&
      typeof entry.context === "string" &&
      (entry.userPrompt === undefined || typeof entry.userPrompt === "string") &&
      typeof entry.assistantResponse === "string"
    )
  ) {
    throw new Error("Gala's saved conversation has an unexpected format.");
  }
  return entries as GalaConversationEntry[];
}

export async function appendGalaConversation(
  id: string,
  entry: GalaConversationEntry,
): Promise<void> {
  const entries = await readGalaConversation(id);
  entries.push(entry);
  await AsyncStorage.setItem(storageKey(id), JSON.stringify(entries));
}

export async function archiveGalaConversation(
  draftId: string,
  eventId: string,
): Promise<void> {
  const draftKey = storageKey(draftId);
  const eventKey = storageKey(`event:${eventId}`);
  const history = await AsyncStorage.getItem(draftKey);
  if (history === null) return;

  await AsyncStorage.setItem(eventKey, history);
  await AsyncStorage.removeItem(draftKey);
}
