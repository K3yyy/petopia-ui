import { request } from "./api-client";
import { getSupabaseBrowserClient } from "@/lib/supabase";

export const authService = {
  register: (body) => request("post", "/auth/register", body),
  login: (body) => request("post", "/auth/login", body),
  logout: () => request("post", "/auth/logout"),
  me: () => request("get", "/auth/me"),
  password: (password) => request("patch", "/auth/password", { password }),
  signInWithGoogle: (redirectTo) =>
    getSupabaseBrowserClient().auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        queryParams: { prompt: "select_account" },
      },
    }),
  exchangeOAuthCode: (code) =>
    getSupabaseBrowserClient().auth.exchangeCodeForSession(code),
  getSupabaseUser: () => getSupabaseBrowserClient().auth.getUser(),
};
