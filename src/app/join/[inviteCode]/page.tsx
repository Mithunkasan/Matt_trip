"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Users, CheckCircle2, LogIn, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { use } from "react";

interface TeamPreview {
  id: string;
  name: string;
  description: string | null;
  memberCount: number;
}

export default function JoinTeamPage({ params }: { params: Promise<{ inviteCode: string }> }) {
  const { inviteCode } = use(params);
  const { data: session, status } = useSession();
  const router = useRouter();

  const [team, setTeam] = useState<TeamPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  async function handleJoin() {
    if (!session) {
      // Redirect to login then back
      router.push(`/login?callbackUrl=/join/${inviteCode}`);
      return;
    }
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

                {/* CTA */}
                {status === "authenticated" ? (
                  <Button className="w-full h-12 text-base gap-2" onClick={handleJoin} disabled={joining}>
                    {joining ? (
                      <><Loader2 className="h-5 w-5 animate-spin" /> Joining…</>
                    ) : (
                      <><Users className="h-5 w-5" /> Join {team.name}</>
                    )}
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <p className="text-center text-sm text-muted-foreground">
                      You need to be signed in to join this team.
                    </p>
                    <Button className="w-full h-12 text-base gap-2" onClick={handleJoin}>
                      <LogIn className="h-5 w-5" /> Sign In to Join
                    </Button>
                    <Link href={`/register?callbackUrl=/join/${inviteCode}`}>
                      <Button variant="outline" className="w-full h-11">Create Account Instead</Button>
                    </Link>
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
