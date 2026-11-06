"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LoaderCircle, PawPrint } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { authService } from "@/services/auth.service";
import { storeSession } from "@/lib/session";

function safeNextPath(path) {
  if (!path || !path.startsWith("/") || path.startsWith("//")) {
    return "/dashboard";
  }
  if (path.startsWith("/auth/callback")) return "/dashboard";
  return path;
}

export default function AuthCallbackPage() {
  const started = useRef(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const finishOAuth = async () => {
      const params = new URLSearchParams(window.location.search);
      const providerError =
        params.get("error_description") || params.get("error");
      if (providerError) {
        sessionStorage.removeItem("petopia.oauth.next");
        setError(providerError);
        return;
      }

      const code = params.get("code");
      if (!code) {
        sessionStorage.removeItem("petopia.oauth.next");
        setError(
          "The sign-in callback did not include an authorization code. Please start Google sign-in again.",
        );
        return;
      }

      const { data, error: exchangeError } =
        await authService.exchangeOAuthCode(code);
      if (exchangeError) throw exchangeError;
      if (!data.session?.access_token) {
        throw new Error("Google did not return a valid Petopia session.");
      }

      const { data: userData, error: userError } =
        await authService.getSupabaseUser();
      if (userError || !userData.user) {
        throw userError || new Error("The Google session could not be verified.");
      }

      await storeSession(data.session, { alreadyPersisted: true });
      const next = safeNextPath(sessionStorage.getItem("petopia.oauth.next"));
      sessionStorage.removeItem("petopia.oauth.next");
      window.location.replace(next);
    };

    finishOAuth().catch((callbackError) => {
      setError(callbackError.message || "Google sign-in could not be completed.");
      sessionStorage.removeItem("petopia.oauth.next");
    });
  }, []);

  return (
    <main className="grid min-h-screen place-items-center bg-[#f8fbff] px-4 py-10">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-blue-600 text-white">
            <PawPrint size={24} />
          </span>
          <h1 className="mt-5 text-2xl font-bold text-slate-900">
            {error ? "Google sign-in needs attention" : "Signing you in"}
          </h1>
          {error ? (
            <>
              <p role="alert" className="mt-3 text-sm text-rose-700">
                {error}
              </p>
              <Button asChild className="mt-6 w-full">
                <Link href="/login">Return to login</Link>
              </Button>
            </>
          ) : (
            <p className="mt-3 flex items-center justify-center gap-2 text-sm text-slate-500">
              <LoaderCircle size={16} className="animate-spin" />
              Verifying your Google account…
            </p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
