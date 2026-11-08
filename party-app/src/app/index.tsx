import { useEffect, useState } from "react";
import { ActivityIndicator, AppState, Text, View } from "react-native";
import { Redirect } from "expo-router";
import type { Session } from "@supabase/supabase-js";
import { getSupabaseClient } from "../lib/supabase";

export default function Index() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>();

  useEffect(() => {
    let active = true;
    let supabase;

    try {
      supabase = getSupabaseClient();
    } catch (clientError) {
      setError(clientError instanceof Error ? clientError.message : "Unable to initialize Supabase.");
      setIsLoading(false);
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (active) {
        setSession(nextSession);
        setIsLoading(false);
      }
    });

    void supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!active) return;
      if (sessionError) {
        setError(sessionError.message);
      } else {
        setSession(data.session);
      }
      setIsLoading(false);
    }).catch((sessionError: unknown) => {
      if (active) {
        setError(sessionError instanceof Error ? sessionError.message : "Unable to restore the Supabase session.");
        setIsLoading(false);
      }
    });

    const refreshSubscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        void supabase.auth.startAutoRefresh();
      } else {
        void supabase.auth.stopAutoRefresh();
      }
    });

    if (AppState.currentState === "active") {
      void supabase.auth.startAutoRefresh();
    }

    return () => {
      active = false;
      subscription.unsubscribe();
      refreshSubscription.remove();
      void supabase.auth.stopAutoRefresh();
    };
  }, []);

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: "center", padding: 24 }}>
        <Text accessibilityRole="alert">{error}</Text>
      </View>
    );
  }

  if (isLoading) {
    return <ActivityIndicator style={{ flex: 1 }} accessibilityLabel="Restoring session" />;
  }

  return <Redirect href={session ? "/dashboard" : "/login"} />;
}
