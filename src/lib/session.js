import {
  getSupabaseBrowserClient,
  isSupabaseConfigured,
} from "@/lib/supabase";

export async function storeSession(session, { alreadyPersisted = false } = {}) {
  if (typeof window === "undefined") return null;
  if (!session?.access_token) {
    throw new Error("The authentication provider did not return an access token.");
  }

  let currentSession = session;
  if (
    !alreadyPersisted &&
    isSupabaseConfigured() &&
    session.refresh_token
  ) {
    const { data, error } = await getSupabaseBrowserClient().auth.setSession({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    });
    if (error) throw new Error(error.message);
    currentSession = data.session || session;
  }

  localStorage.setItem("petopia.accessToken", currentSession.access_token);
  if (currentSession.refresh_token) {
    localStorage.setItem("petopia.refreshToken", currentSession.refresh_token);
  }
  window.dispatchEvent(new Event("petopia:auth-changed"));
  return currentSession;
}

export async function clearSession({ notify = false } = {}) {
  if (typeof window === "undefined") return;
  if (isSupabaseConfigured()) {
    try {
      await getSupabaseBrowserClient().auth.signOut({ scope: "local" });
    } catch {
      // Clear the local session even if Supabase cannot be reached.
    }
  }
  localStorage.removeItem("petopia-supabase-auth");
  localStorage.removeItem("petopia.accessToken");
  localStorage.removeItem("petopia.refreshToken");
  if (notify) window.dispatchEvent(new Event("petopia:auth-changed"));
}
