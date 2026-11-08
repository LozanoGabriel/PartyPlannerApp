import { Href, router, useNavigation } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Platform } from "react-native";

export function useSettingsGuard(changed: boolean, apply: () => Promise<boolean>) {
  const navigation = useNavigation();
  const [dialog, setDialog] = useState<"apply" | "leave" | null>(null);
  const [busy, setBusy] = useState(false);
  const allowLeave = useRef(false);
  const pending = useRef<(() => void) | null>(null);

  useEffect(() => navigation.addListener("beforeRemove", (event) => {
    if (allowLeave.current || !changed) return;
    event.preventDefault();
    pending.current = () => navigation.dispatch(event.data.action);
    setDialog("leave");
  }), [changed, navigation]);

  useEffect(() => {
    if (Platform.OS !== "web" || !changed) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [changed]);

  function navigate(href: Href) {
    if (busy) return;
    if (!changed) {
      router.replace(href);
      return;
    }
    pending.current = () => router.replace(href);
    setDialog("leave");
  }

  function leave() {
    allowLeave.current = true;
    const action = pending.current;
    pending.current = null;
    setDialog(null);
    if (action) action();
    else router.replace("/settings");
  }

  async function save() {
    if (busy) return;
    setBusy(true);
    try {
      if (await apply()) leave();
      else setDialog(null);
    } finally {
      setBusy(false);
    }
  }

  return {
    dialog, busy, navigate, leave, save,
    confirm: () => { pending.current = null; setDialog("apply"); },
    close: () => { pending.current = null; setDialog(null); },
  };
}
