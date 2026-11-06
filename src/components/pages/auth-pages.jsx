"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { LoaderCircle, PawPrint } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/field";
import { Notice, Field } from "@/components/common/feedback";
import { authService } from "@/services/auth.service";
import { storeSession } from "@/lib/session";

export function AuthPage({ register = false }) {
  const router = useRouter(),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [googleBusy, setGoogleBusy] = useState(false),
    [info, setInfo] = useState("");
  const schema = useMemo(
    () =>
      register
        ? z.object({
            full_name: z.string().min(1, "Enter your name"),
            email: z.string().email(),
            password: z.string().min(8, "Use at least 8 characters"),
          })
        : z.object({ email: z.string().email(), password: z.string().min(1) }),
    [register],
  );
  const {
    register: field,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });
  const submit = handleSubmit(async (values) => {
    setBusy(true);
    setError("");
    try {
      if (register) {
        const r = await authService.register(values);
        if (r.data?.session) await storeSession(r.data.session);
        if (r.data?.session) {
          router.push("/dashboard");
        } else {
          setInfo(
            `${r.message || "Registration successful."} Check your email for the next sign-in step. Your Petopia profile was provisioned by the API.`,
          );
        }
      } else {
        const r = await authService.login(values);
        const session = r.data?.session;
        if (!session?.access_token) {
          throw new Error(
            "Login succeeded, but the API did not return an access token. Please try again or contact support.",
          );
        }
        await storeSession(session);
        router.replace("/dashboard");
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  });

  const continueWithGoogle = async () => {
    setGoogleBusy(true);
    setError("");
    setInfo("");
    try {
      sessionStorage.setItem("petopia.oauth.next", "/dashboard");
      const { error: oauthError } = await authService.signInWithGoogle(
        `${window.location.origin}/auth/callback`,
      );
      if (oauthError) throw oauthError;
    } catch (oauthError) {
      sessionStorage.removeItem("petopia.oauth.next");
      setError(oauthError.message || "Google sign-in could not be started.");
      setGoogleBusy(false);
    }
  };
  return (
    <div className="mx-auto grid min-h-[70vh] max-w-5xl items-center gap-10 md:grid-cols-2">
      <div className="hidden rounded-3xl bg-gradient-to-br from-blue-600 to-sky-400 p-10 text-white md:block">
        <PawPrint size={42} />
        <h1 className="mt-8 text-4xl font-bold">
          Every pet deserves a loving home.
        </h1>
        <p className="mt-4 text-blue-50">
          Find a friend, support a rescue, and help your community care for
          animals.
        </p>
      </div>
      <Card>
        <CardContent className="p-7 sm:p-9">
          <p className="mb-2 text-sm font-semibold text-blue-600">
            WELCOME TO PETOPIA
          </p>
          <h1 className="mb-2 text-3xl font-bold">
            {register ? "Create your account" : "Welcome back"}
          </h1>
          <p className="mb-6 text-sm text-slate-500">
            {register
              ? "Join a community that cares."
              : "Sign in to manage your Petopia account."}
          </p>
          {error && <Notice>{error}</Notice>}
          {info && <Notice kind="success">{info}</Notice>}
          <Button
            type="button"
            variant="outline"
            className="mt-5 h-11 w-full border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            onClick={continueWithGoogle}
            disabled={busy || googleBusy}
          >
            {googleBusy ? (
              <LoaderCircle className="animate-spin" size={18} />
            ) : (
              <GoogleMark />
            )}
            {googleBusy ? "Connecting to Google…" : "Continue with Google"}
          </Button>
          <div className="my-5 flex items-center gap-3 text-xs font-medium text-slate-400">
            <span className="h-px flex-1 bg-slate-200" />
            OR
            <span className="h-px flex-1 bg-slate-200" />
          </div>
          <form onSubmit={submit} className="mt-5 space-y-4">
            {register && (
              <Field label="Full name" error={errors.full_name?.message}>
                <Input {...field("full_name")} autoComplete="name" />
              </Field>
            )}
            <Field label="Email" error={errors.email?.message}>
              <Input type="email" autoComplete="email" {...field("email")} />
            </Field>
            <Field label="Password" error={errors.password?.message}>
              <Input
                type="password"
                autoComplete={register ? "new-password" : "current-password"}
                {...field("password")}
              />
            </Field>
            <Button className="w-full" disabled={busy || googleBusy}>
              {busy ? "Please wait…" : register ? "Create account" : "Sign in"}
            </Button>
          </form>
          <p className="mt-5 text-center text-sm text-slate-500">
            {register ? "Already registered? " : "New to Petopia? "}
            <Link
              className="font-semibold text-blue-600"
              href={register ? "/login" : "/register"}
            >
              {register ? "Log in" : "Create an account"}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 48 48" className="h-[18px] w-[18px]">
      <path
        fill="#4285F4"
        d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5.1h6.7c3.9-3.6 6-8.8 6-15Z"
      />
      <path
        fill="#34A853"
        d="M24 44c5.5 0 10.1-1.8 13.5-4.8l-6.7-5.1c-1.8 1.2-4.1 2-6.8 2-5.2 0-9.6-3.5-11.2-8.2H5.9v5.2A20 20 0 0 0 24 44Z"
      />
      <path
        fill="#FBBC05"
        d="M12.8 27.9a12 12 0 0 1 0-7.7V15H5.9a20 20 0 0 0 0 18.1l6.9-5.2Z"
      />
      <path
        fill="#EA4335"
        d="M24 12c3 0 5.7 1 7.8 3l5.9-5.9A19.7 19.7 0 0 0 24 4 20 20 0 0 0 5.9 15l6.9 5.2C14.4 15.5 18.8 12 24 12Z"
      />
    </svg>
  );
}
