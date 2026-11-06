"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  PawPrint,
  Menu,
  X,
  ShieldCheck,
  LogOut,
  LayoutDashboard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Notice, PageTitle, Spinner } from "@/components/common/feedback";
import { AuthPage } from "@/components/pages/auth-pages";
import {
  AdminTools,
  Dashboard,
  Donations,
  Messages,
} from "@/components/pages/dashboard-pages";
import {
  CampaignCreate,
  CampaignDetail,
  CreatePet,
  CreateReport,
  Home,
  Listing,
  PetDetail,
  PetMedia,
  ReportDetail,
} from "@/components/pages/public-pages";
import { authService } from "@/services/auth.service";
import { getSupabaseAccessToken } from "@/lib/supabase";
import { clearSession } from "@/lib/session";

const nav = [
  ["/pets", "Find a pet"],
  ["/pets?listingType=adoption", "Adoption"],
  ["/pets?listingType=sale", "For sale"],
  ["/pets?listingType=rehoming", "Rehoming"],
  ["/lost-found", "Lost & found"],
  ["/campaigns", "Fundraising"],
];

export default function PetopiaApp() {
  const pathname = usePathname() || "/",
    router = useRouter(),
    searchParams = useSearchParams();
  const parts = pathname.split("/").filter(Boolean);
  const [user, setUser] = useState(null),
    [profile, setProfile] = useState(null),
    [ready, setReady] = useState(false),
    [mobile, setMobile] = useState(false),
    [toast, setToast] = useState("");
  useEffect(() => {
    const load = async () => {
      setReady(false);
      const token = await getSupabaseAccessToken();
      if (token) {
        try {
          const a = await authService.me();
          setUser(a.data);
          setProfile(a.data?.profile || null);
        } catch {
          setUser(null);
          setProfile(null);
        }
      } else {
        setUser(null);
        setProfile(null);
      }
      setReady(true);
    };
    load();
    window.addEventListener("petopia:auth-changed", load);
    const expired = () => {
      void clearSession();
      setUser(null);
      setProfile(null);
      setReady(true);
      setToast("Your session has expired. Please sign in again.");
    };
    window.addEventListener("petopia:session-expired", expired);
    return () => {
      window.removeEventListener("petopia:auth-changed", load);
      window.removeEventListener("petopia:session-expired", expired);
    };
  }, []);
  const logout = async () => {
    try {
      await authService.logout();
    } catch {}
    await clearSession();
    setUser(null);
    setProfile(null);
    router.push("/");
  };
  const isProtected =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/seller") ||
    pathname.startsWith("/admin");
  useEffect(() => {
    if (ready && isProtected && !user) router.replace("/login");
  }, [ready, isProtected, user, router]);
  const content = () => {
    if (pathname === "/login") return <AuthPage />;
    if (pathname === "/register") return <AuthPage register />;
    if (isProtected) {
      if (!ready || !user) return <Spinner />;
      if (pathname.startsWith("/admin")) {
        if (user.role !== "admin")
          return (
            <Notice>You do not have the admin role required by the API.</Notice>
          );
        return <AdminTools />;
      }
      return (
        <Dashboard
          path={parts[1] || "dashboard"}
          profile={profile}
          setProfile={setProfile}
          auth={{ user }}
          petId={parts[2]}
          mediaId={parts[3] === "media" ? parts[2] : null}
          applicationId={parts[2]}
        />
      );
    }
    if (parts[0] === "pets" && parts[1] && parts[1] !== "new")
      return (
        <>
          <PetDetail id={parts[1]} user={user} profile={profile} />
          <PetMedia
            id={parts[1]}
            profile={profile}
            isAdmin={user?.role === "admin"}
          />
        </>
      );
    if (parts[0] === "pets" && parts[1] === "new")
      return user ? (
        <CreatePet />
      ) : (
        <>
          <Notice>Sign in to create a pet listing.</Notice>
          <Button asChild className="mt-4">
            <Link href="/login">Sign in</Link>
          </Button>
        </>
      );
    if (parts[0] === "pets")
      return (
        <Listing
          type="pets"
          params={{
            ...(searchParams.get("listingType")
              ? { listingType: searchParams.get("listingType") }
              : {}),
          }}
        />
      );
    if (parts[0] === "lost-found" && parts[1] === "new")
      return user ? (
        <CreateReport />
      ) : (
        <>
          <Notice>Sign in to create a report.</Notice>
          <Button asChild className="mt-4">
            <Link href="/login">Sign in</Link>
          </Button>
        </>
      );
    if (parts[0] === "lost-found" && parts[1])
      return <ReportDetail id={parts[1]} profile={profile} />;
    if (parts[0] === "lost-found") return <Listing type="reports" />;
    if (parts[0] === "campaigns" && parts[1] === "new")
      return user ? (
        <CampaignCreate />
      ) : (
        <>
          <Notice>Sign in to create a campaign.</Notice>
          <Button asChild className="mt-4">
            <Link href="/login">Sign in</Link>
          </Button>
        </>
      );
    if (parts[0] === "campaigns" && parts[1])
      return <CampaignDetail id={parts[1]} />;
    if (parts[0] === "campaigns") return <Listing type="campaigns" />;
    if (pathname === "/") return <Home />;
    return (
      <div>
        <PageTitle
          title="Page unavailable"
          description="This page is not part of the backend-connected Petopia experience."
        />
        <Button asChild>
          <Link href="/">Back to home</Link>
        </Button>
      </div>
    );
  };
  return (
    <div className="min-h-screen bg-[#f8fbff] text-slate-800">
      <header className="sticky top-0 z-30 border-b border-slate-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-xl font-extrabold tracking-tight text-blue-700"
          >
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-600 text-white">
              <PawPrint size={20} />
            </span>
            petopia
          </Link>
          <nav className="hidden items-center gap-5 lg:flex">
            {nav.map(([href, label]) => (
              <Link
                key={label}
                href={href}
                className="text-sm font-medium text-slate-600 hover:text-blue-700"
              >
                {label}
              </Link>
            ))}
          </nav>
          <div className="hidden items-center gap-2 sm:flex">
            {user ? (
              <>
                {user.role === "admin" && (
                  <Button variant="ghost" asChild>
                    <Link href="/admin">
                      <ShieldCheck size={16} />
                      Admin review
                    </Link>
                  </Button>
                )}
                <Button variant="ghost" asChild>
                  <Link href="/dashboard">
                    <LayoutDashboard size={16} />
                    Dashboard
                  </Link>
                </Button>
                <Button variant="outline" onClick={logout}>
                  <LogOut size={16} />
                  Log out
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/login">Log in</Link>
                </Button>
                <Button asChild>
                  <Link href="/register">Get started</Link>
                </Button>
              </>
            )}
          </div>
          <button
            className="rounded-lg p-2 lg:hidden"
            onClick={() => setMobile(!mobile)}
            aria-label="Toggle navigation"
          >
            {mobile ? <X /> : <Menu />}
          </button>
        </div>
        {mobile && (
          <div className="space-y-1 border-t p-4 lg:hidden">
            {nav.map(([h, l]) => (
              <Link
                key={l}
                onClick={() => setMobile(false)}
                href={h}
                className="block rounded-lg p-2 text-sm"
              >
                {l}
              </Link>
            ))}
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="block rounded-lg p-2 text-sm font-semibold text-blue-700"
                >
                  Dashboard
                </Link>
                {user.role === "admin" && (
                  <Link
                    href="/admin"
                    className="block rounded-lg p-2 text-sm font-semibold text-blue-700"
                  >
                    Admin review
                  </Link>
                )}
                <button
                  className="w-full rounded-lg p-2 text-left text-sm"
                  onClick={logout}
                >
                  Log out
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="block rounded-lg p-2 text-sm font-semibold text-blue-700"
              >
                Log in
              </Link>
            )}
          </div>
        )}
      </header>
      {toast && (
        <div className="mx-auto max-w-7xl px-4 pt-4">
          <Notice>{toast}</Notice>
        </div>
      )}
      <main className="mx-auto min-h-[calc(100vh-150px)] max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
        {content()}
      </main>
      <footer className="border-t bg-white">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-3 px-4 py-6 text-sm text-slate-500 sm:flex-row sm:px-6">
          <span>© 2026 Petopia · Caring for pets, together.</span>
          <span>
            Connected to PetLink API ·{" "}
            {process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}
          </span>
        </div>
      </footer>
    </div>
  );
}
