"use client";

import { useEffect, useState } from "react";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Users,
  CheckCircle2,
  LogIn,
  Loader2,
  AlertCircle,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { use } from "react";

interface TeamPreview {
  id: string;
  name: string;
  description: string | null;
  memberCount: number;
}

type AuthTab = "signin" | "register";

export default function JoinTeamPage({ params }: { params: Promise<{ inviteCode: string }> }) {
  const { inviteCode } = use(params);
  const { data: session, status } = useSession();
  const router = useRouter();

  const [team, setTeam] = useState<TeamPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Inline auth form state
  const [authTab, setAuthTab] = useState<AuthTab>("signin");
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // Fetch team preview
  useEffect(() => {
    if (!inviteCode) return;
    fetch(`/api/teams/join?code=${inviteCode}`)
      .then((res) => {
        if (!res.ok) throw new Error("Invalid invite link");
        return res.json();
      })
      .then(setTeam)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [inviteCode]);

  /** Join the team using the current session (must be signed in). */
  async function joinTeam() {
    setJoining(true);
    try {
      const res = await fetch("/api/teams/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setJoined(true);
      setTimeout(() => router.push("/teams"), 2500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to join team");
    } finally {
      setJoining(false);
    }
  }

  /** Called when the user clicks "Join Team" while already authenticated. */
  async function handleJoin() {
    if (!session) {
      router.push(`/login?callbackUrl=/join/${inviteCode}`);
      return;
    }
    await joinTeam();
  }

  /** Sign in with credentials then auto-join the team. */
  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setAuthLoading(true);
    try {
      const res = await signIn("credentials", {
        redirect: false,
        email: authEmail,
        password: authPassword,
      });

      if (res?.error) {
        toast.error("Invalid email or password. Please try again.");
        return;
      }

      toast.success("Signed in! Joining the team…");
      await joinTeam();
    } finally {
      setAuthLoading(false);
    }
  }

  /** Register a new account, auto-sign-in, then auto-join the team. */
  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!authName.trim()) {
      toast.error("Please enter your full name.");
      return;
    }
    setAuthLoading(true);
    try {
      // 1. Create account
      const regRes = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: authName, email: authEmail, password: authPassword }),
      });
      if (!regRes.ok) {
        const data = await regRes.json();
        toast.error(data.message || "Registration failed. Please try again.");
        return;
      }

      // 2. Auto sign-in
      const signInRes = await signIn("credentials", {
        redirect: false,
        email: authEmail,
        password: authPassword,
      });
      if (signInRes?.error) {
        toast.error("Account created but sign-in failed. Please sign in manually.");
        router.push(`/login?callbackUrl=/join/${inviteCode}`);
        return;
      }

      toast.success("Account created! Joining the team…");
      // 3. Auto-join
      await joinTeam();
    } finally {
      setAuthLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 40%, #bbf7d0 100%)",
      }}
    >
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl shadow-sm"
            style={{ background: "var(--primary)" }}
          >
            <Users className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight text-gray-800">SplitWise Pro</span>
        </div>

        <Card className="shadow-xl border-0">
          <CardContent className="pt-8 pb-8 px-8">
            {loading ? (
              <div className="flex flex-col items-center py-8 gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground text-sm">Loading invite details…</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center py-6 text-center gap-4">
                <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertCircle className="h-8 w-8 text-red-500" />
                </div>
                <div>
                  <h2 className="text-lg font-bold mb-1 text-gray-900">Invalid Invite Link</h2>
                  <p className="text-muted-foreground text-sm">{error}</p>
                </div>
                <Link href="/dashboard">
                  <Button variant="outline">Go to Dashboard</Button>
                </Link>
              </div>
            ) : joined ? (
              <div className="flex flex-col items-center py-6 text-center gap-4">
                <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold mb-1 text-gray-900">You've joined!</h2>
                  <p className="text-muted-foreground text-sm">
                    Welcome to <strong>{team?.name}</strong>. Redirecting to your teams…
                  </p>
                </div>
              </div>
            ) : team ? (
              <div className="space-y-6">
                {/* Team info */}
                <div className="text-center">
                  <div
                    className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl text-white font-bold text-3xl shadow-sm"
                    style={{ background: "var(--primary)" }}
                  >
                    {team.name.charAt(0).toUpperCase()}
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">{team.name}</h2>
                  {team.description && (
                    <p className="text-muted-foreground text-sm">{team.description}</p>
                  )}
                </div>

                {/* Stats */}
                <div className="flex items-center justify-center gap-6 py-3 px-4 rounded-xl bg-muted/50">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">{team.memberCount}</p>
                    <p className="text-xs text-muted-foreground">Member{team.memberCount !== 1 ? "s" : ""}</p>
                  </div>
                  <div className="h-8 w-px bg-border" />
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">✓</p>
                    <p className="text-xs text-muted-foreground">Active Group</p>
                  </div>
                </div>

                {/* CTA — authenticated */}
                {status === "authenticated" ? (
                  <Button className="w-full h-12 text-base gap-2" onClick={handleJoin} disabled={joining}>
                    {joining ? (
                      <><Loader2 className="h-5 w-5 animate-spin" /> Joining…</>
                    ) : (
                      <><Users className="h-5 w-5" /> Join {team.name}</>
                    )}
                  </Button>
                ) : (
                  /* CTA — unauthenticated: inline credential form */
                  <div className="space-y-4">
                    <p className="text-center text-sm text-muted-foreground">
                      Sign in or create an account to join this team.
                    </p>

                    {/* Tab switcher */}
                    <div className="flex rounded-lg border overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setAuthTab("signin")}
                        className={`flex-1 py-2 text-sm font-medium transition-colors ${
                          authTab === "signin"
                            ? "bg-primary text-white"
                            : "bg-background text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        Sign In
                      </button>
                      <button
                        type="button"
                        onClick={() => setAuthTab("register")}
                        className={`flex-1 py-2 text-sm font-medium transition-colors ${
                          authTab === "register"
                            ? "bg-primary text-white"
                            : "bg-background text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        Register
                      </button>
                    </div>

                    {/* Sign In form */}
                    {authTab === "signin" && (
                      <form onSubmit={handleSignIn} className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-gray-700" htmlFor="signin-email">
                            Email
                          </label>
                          <Input
                            id="signin-email"
                            type="email"
                            placeholder="you@example.com"
                            value={authEmail}
                            onChange={(e) => setAuthEmail(e.target.value)}
                            required
                            disabled={authLoading}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-gray-700" htmlFor="signin-password">
                            Password
                          </label>
                          <Input
                            id="signin-password"
                            type="password"
                            placeholder="Your password"
                            value={authPassword}
                            onChange={(e) => setAuthPassword(e.target.value)}
                            required
                            disabled={authLoading}
                          />
                        </div>
                        <Button
                          type="submit"
                          className="w-full h-11 text-sm gap-2"
                          disabled={authLoading}
                        >
                          {authLoading ? (
                            <><Loader2 className="h-4 w-4 animate-spin" /> Signing in…</>
                          ) : (
                            <><LogIn className="h-4 w-4" /> Sign In &amp; Join {team.name}</>
                          )}
                        </Button>
                      </form>
                    )}

                    {/* Register form */}
                    {authTab === "register" && (
                      <form onSubmit={handleRegister} className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-gray-700" htmlFor="reg-name">
                            Full Name
                          </label>
                          <Input
                            id="reg-name"
                            type="text"
                            placeholder="John Doe"
                            value={authName}
                            onChange={(e) => setAuthName(e.target.value)}
                            required
                            disabled={authLoading}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-gray-700" htmlFor="reg-email">
                            Email
                          </label>
                          <Input
                            id="reg-email"
                            type="email"
                            placeholder="you@example.com"
                            value={authEmail}
                            onChange={(e) => setAuthEmail(e.target.value)}
                            required
                            disabled={authLoading}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-gray-700" htmlFor="reg-password">
                            Password
                          </label>
                          <Input
                            id="reg-password"
                            type="password"
                            placeholder="Create a password"
                            value={authPassword}
                            onChange={(e) => setAuthPassword(e.target.value)}
                            required
                            disabled={authLoading}
                          />
                        </div>
                        <Button
                          type="submit"
                          className="w-full h-11 text-sm gap-2"
                          disabled={authLoading}
                        >
                          {authLoading ? (
                            <><Loader2 className="h-4 w-4 animate-spin" /> Creating account…</>
                          ) : (
                            <><UserPlus className="h-4 w-4" /> Register &amp; Join {team.name}</>
                          )}
                        </Button>
                      </form>
                    )}
                  </div>
                )}
              </div>
            ) : null}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-gray-500 mt-6">
          © 2026 SplitWise Pro · Expense sharing made easy
        </p>
      </div>
    </div>
  );
}
