import { Platform } from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { getSupabaseClient } from "./supabase";

WebBrowser.maybeCompleteAuthSession();

export async function signInWithGoogle(): Promise<"cancelled" | "success"> {
  const supabase = getSupabaseClient();
  const redirectTo = Linking.createURL("auth/callback");
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      skipBrowserRedirect: Platform.OS !== "web",
    },
  });

  if (error) throw error;
  if (!data.url) throw new Error("Supabase did not return a Google sign-in URL.");

  if (Platform.OS === "web") {
    window.location.assign(data.url);
    return "success";
  }

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== "success") return "cancelled";

  const callbackUrl = new URL(result.url);
  const query = new URLSearchParams(callbackUrl.search);
  const fragment = new URLSearchParams(callbackUrl.hash.replace(/^#/, ""));
  const getParameter = (name: string) => query.get(name) ?? fragment.get(name);
  const oauthError = getParameter("error_description") ?? getParameter("error");

  if (oauthError) throw new Error(oauthError);

  const code = getParameter("code");
  if (!code) throw new Error("Google sign-in did not return an authorization code.");

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) throw exchangeError;

  return "success";
}
