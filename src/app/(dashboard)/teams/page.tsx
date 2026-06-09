"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Users,
  Plus,
  MessageCircle,
  Copy,
  ChevronRight,
  UserPlus,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface Team {
  id: string;
  name: string;
  description: string | null;
  inviteCode: string;
  _count: { members: number; expenses: number };
}

export default function TeamsPage() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [showInvite, setShowInvite] = useState<Team | null>(null);
  const [teamName, setTeamName] = useState("");
  const [teamDesc, setTeamDesc] = useState("");
  const [phone, setPhone] = useState("");

  const { data: teams = [], isLoading } = useQuery<Team[]>({
    queryKey: ["teams"],
    queryFn: async () => {
      const res = await fetch("/api/teams");
      if (!res.ok) throw new Error("Failed to fetch teams");
      return res.json();
    },
  });

  const createTeam = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: teamName, description: teamDesc }),
      });
      if (!res.ok) throw new Error("Failed to create team");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["teams"] });
      setShowCreate(false);
      setTeamName("");
      setTeamDesc("");
      toast.success("Team created successfully!");
    },
    onError: () => toast.error("Failed to create team"),
  });

  function buildInviteUrl(inviteCode: string) {
    const base = typeof window !== "undefined" ? window.location.origin : "";
    return `${base}/join/${inviteCode}`;
  }

  function handleWhatsAppInvite(team: Team) {
    if (!phone.trim()) {
      toast.error("Please enter a phone number");
      return;
    }
    const e164 = phone.replace(/\D/g, "");
    const link = buildInviteUrl(team.inviteCode);
    const msg = encodeURIComponent(
      `Hey! 👋 You're invited to join the expense group "${team.name}" on SplitWise Pro.\n\nClick to join: ${link}`
    );
    window.open(`https://wa.me/${e164}?text=${msg}`, "_blank");
    toast.success("WhatsApp opened with your invite message!");
    setShowInvite(null);
    setPhone("");
  }

  function copyInviteLink(inviteCode: string) {
    navigator.clipboard.writeText(buildInviteUrl(inviteCode));
    toast.success("Invite link copied to clipboard!");
  }

  const COLORS = ["#16a34a", "#15803d", "#166534", "#14532d", "#4ade80", "#86efac"];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Teams</h1>
          <p className="text-muted-foreground mt-1">Manage your expense-sharing groups</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2 self-start sm:self-auto">
          <Plus className="h-4 w-4" /> New Team
        </Button>
      </div>

      {/* Teams Grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : teams.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
            <Users className="h-10 w-10 text-primary" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No teams yet</h3>
          <p className="text-muted-foreground mb-6 max-w-sm">
            Create your first team and start splitting expenses with friends or colleagues.
          </p>
          <Button onClick={() => setShowCreate(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Create your first team
          </Button>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((team, i) => {
            const color = COLORS[i % COLORS.length];
            return (
              <Card key={team.id} className="group relative overflow-hidden border hover:shadow-md transition-shadow">
                {/* Accent stripe */}
                <div className="absolute top-0 left-0 right-0 h-1 rounded-t-xl" style={{ background: color }} />
                <CardHeader className="pt-5 pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white font-bold text-lg shadow-sm"
                      style={{ background: color }}
                    >
                      {team.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base truncate">{team.name}</CardTitle>
                      <CardDescription className="text-xs mt-0.5 line-clamp-1">
                        {team.description ?? "No description"}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pb-4 space-y-4">
                  <div className="flex gap-4 text-sm">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Users className="h-3.5 w-3.5" />
                      {team._count.members} member{team._count.members !== 1 ? "s" : ""}
                    </span>
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <ChevronRight className="h-3.5 w-3.5" />
                      {team._count.expenses} expense{team._count.expenses !== 1 ? "s" : ""}
                    </span>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 text-xs flex-1 min-w-[100px]"
                      onClick={() => { setShowInvite(team); setPhone(""); }}
                    >
                      <MessageCircle className="h-3.5 w-3.5 text-green-600" />
                      WhatsApp Invite
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 text-xs"
                      onClick={() => copyInviteLink(team.inviteCode)}
                    >
                      <Copy className="h-3.5 w-3.5" />
                      Copy Link
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── Create Team Dialog ── */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" /> Create New Team
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Team Name *</label>
              <Input
                placeholder="e.g. Goa Trip 2025"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Description</label>
              <Input
                placeholder="What is this team for?"
                value={teamDesc}
                onChange={(e) => setTeamDesc(e.target.value)}
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowCreate(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 gap-2"
                onClick={() => createTeam.mutate()}
                disabled={!teamName.trim() || createTeam.isPending}
              >
                {createTeam.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Create Team
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── WhatsApp Invite Dialog ── */}
      <Dialog open={!!showInvite} onOpenChange={(o) => !o && setShowInvite(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-green-600" />
              Invite via WhatsApp
            </DialogTitle>
          </DialogHeader>
          {showInvite && (
            <div className="space-y-5 mt-2">
              {/* Team card */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/60 border">
                <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-white font-bold text-base">
                  {showInvite.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-sm">{showInvite.name}</p>
                  <p className="text-xs text-muted-foreground">{showInvite._count.members} member{showInvite._count.members !== 1 ? "s" : ""}</p>
                </div>
              </div>

              {/* Invite link preview */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-muted-foreground">Invite Link</label>
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={buildInviteUrl(showInvite.inviteCode)}
                    className="text-xs bg-muted"
                  />
                  <Button size="icon" variant="outline" onClick={() => copyInviteLink(showInvite!.inviteCode)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Phone input */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Recipient's WhatsApp Number</label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground px-2">+</span>
                  <Input
                    placeholder="91 98765 43210  (include country code)"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    type="tel"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Include country code without + (e.g. 919876543210 for India)
                </p>
              </div>

              <div className="flex gap-3 pt-1">
                <Button variant="outline" className="flex-1" onClick={() => setShowInvite(null)}>
                  Cancel
                </Button>
                <Button
                  className="flex-1 gap-2 bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => handleWhatsAppInvite(showInvite!)}
                >
                  <MessageCircle className="h-4 w-4" />
                  Send on WhatsApp
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
