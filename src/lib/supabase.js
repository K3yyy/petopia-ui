import { createClient } from "@supabase/supabase-js";

let browserClient;

export function isSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  );
}

export function getSupabaseBrowserClient() {
  if (typeof window === "undefined") {
    throw new Error("Supabase authentication is only available in the browser.");
  }
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Google sign-in is not configured. Set NEXT_PUBLIC_SUPABASE_URL and a public Supabase key.",
    );
  }
  if (!browserClient) {
    browserClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        auth: {
          flowType: "pkce",
          detectSessionInUrl: false,
          persistSession: true,
          autoRefreshToken: true,
          storageKey: "petopia-supabase-auth",
        },
      },
    );
  }
  return browserClient;
}

export async function getSupabaseAccessToken() {
  if (typeof window === "undefined") return null;
  const fallback = localStorage.getItem("petopia.accessToken");
  if (!isSupabaseConfigured()) return fallback;

  try {
    const { data, error } = await getSupabaseBrowserClient().auth.getSession();
    if (error || !data.session?.access_token) return fallback;
    localStorage.setItem("petopia.accessToken", data.session.access_token);
    if (data.session.refresh_token) {
      localStorage.setItem("petopia.refreshToken", data.session.refresh_token);
    }
    return data.session.access_token;
  } catch {
    return fallback;
  }
}
