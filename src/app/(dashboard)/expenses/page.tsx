"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  IndianRupee,
  Filter,
  ChevronDown,
  SplitSquareVertical,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";

const CATEGORIES = ["FOOD", "TRAVEL", "HOTEL", "FUEL", "SHOPPING", "ENTERTAINMENT", "OTHER"];
const CATEGORY_COLORS: Record<string, string> = {
  FOOD: "#16a34a", TRAVEL: "#2563eb", HOTEL: "#7c3aed",
  FUEL: "#ea580c", SHOPPING: "#db2777", ENTERTAINMENT: "#0891b2", OTHER: "#6b7280",
};

interface Team { id: string; name: string; members?: { userId: string; user: { name: string } }[] }
interface Expense {
  id: string; title: string; description: string | null; amount: number;
  date: string; category: string;
  paidBy: { id: string; name: string };
  team: { id: string; name: string };
  splits: { user: { id: string; name: string }; amountOwed: number }[];
}

const EMPTY_FORM = { title: "", description: "", amount: "", date: "", category: "OTHER", teamId: "", splitUserIds: [] as string[] };

export default function ExpensesPage() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [search, setSearch] = useState("");
  const [filterTeam, setFilterTeam] = useState("all");
  const [filterCat, setFilterCat] = useState("all");
  const [showSplits, setShowSplits] = useState<string | null>(null);

  const { data: expenses = [], isLoading } = useQuery<Expense[]>({
    queryKey: ["expenses", filterTeam],
    queryFn: async () => {
      const params = filterTeam && filterTeam !== "all" ? `?teamId=${filterTeam}` : "";
      const res = await fetch(`/api/expenses${params}`);
      if (!res.ok) throw new Error("Failed to fetch expenses");
      return res.json();
    },
  });

  const { data: teams = [] } = useQuery<Team[]>({
    queryKey: ["teams"],
    queryFn: async () => {
      const res = await fetch("/api/teams");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const createExpense = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, amount: Number(form.amount) }),
      });
      if (!res.ok) throw new Error("Failed to create expense");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expenses"] });
      setShowModal(false);
      setForm({ ...EMPTY_FORM });
      toast.success("Expense added and split calculated!");
    },
    onError: () => toast.error("Failed to add expense"),
  });

  const updateExpense = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/expenses/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, amount: Number(form.amount) }),
      });
      if (!res.ok) throw new Error("Failed to update expense");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expenses"] });
      setShowModal(false);
      setEditingId(null);
      setForm({ ...EMPTY_FORM });
      toast.success("Expense updated and splits recalculated!");
    },
    onError: () => toast.error("Failed to update expense"),
  });

  const deleteExpense = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expenses"] });
      toast.success("Expense deleted");
    },
    onError: () => toast.error("Failed to delete expense"),
  });

  function openEdit(exp: Expense) {
    setEditingId(exp.id);
    setForm({
      title: exp.title,
      description: exp.description ?? "",
      amount: String(exp.amount),
      date: exp.date.slice(0, 10),
      category: exp.category,
      teamId: exp.team.id,
      splitUserIds: exp.splits.map((s) => s.user.id),
    });
    setShowModal(true);
  }

  function openAdd() {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setShowModal(true);
  }

  const filtered = expenses.filter((e) => {
    const matchSearch = e.title.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat === "all" || e.category === filterCat;
    return matchSearch && matchCat;
  });

  const totalAmount = filtered.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Expenses</h1>
          <p className="text-muted-foreground mt-1">All team expenses with automatic split calculation</p>
        </div>
        <Button onClick={openAdd} className="gap-2 self-start sm:self-auto">
          <Plus className="h-4 w-4" /> Add Expense
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4" style={{ borderLeftColor: "var(--primary)" }}>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground mb-1">Total Expenses</p>
            <p className="text-2xl font-bold">₹{totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4" style={{ borderLeftColor: "#2563eb" }}>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground mb-1">Total Records</p>
            <p className="text-2xl font-bold">{filtered.length}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4" style={{ borderLeftColor: "#7c3aed" }}>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground mb-1">Teams</p>
            <p className="text-2xl font-bold">{teams.length}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4" style={{ borderLeftColor: "#ea580c" }}>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground mb-1">Avg. Expense</p>
            <p className="text-2xl font-bold">
              ₹{filtered.length ? (totalAmount / filtered.length).toLocaleString("en-IN", { maximumFractionDigits: 0 }) : 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search expenses…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={filterTeam} onValueChange={(v) => setFilterTeam(v ?? "all")}>
          <SelectTrigger className="w-[160px]">
            <Filter className="h-4 w-4 mr-1.5 text-muted-foreground" />
            <SelectValue placeholder="All Teams" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Teams</SelectItem>
            {teams.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterCat} onValueChange={(v) => setFilterCat(v ?? "all")}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c.charAt(0) + c.slice(1).toLowerCase()}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Expense list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <IndianRupee className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No expenses found</h3>
          <p className="text-muted-foreground text-sm mb-5">Add your first expense to get started</p>
          <Button onClick={openAdd} className="gap-2"><Plus className="h-4 w-4" /> Add Expense</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((exp) => (
            <Card key={exp.id} className="overflow-hidden hover:shadow-sm transition-shadow">
              <div className="flex items-stretch">
                {/* Category color bar */}
                <div
                  className="w-1.5 shrink-0"
                  style={{ background: CATEGORY_COLORS[exp.category] ?? "#6b7280" }}
                />
                <div className="flex-1 p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-base truncate">{exp.title}</span>
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{
                            background: CATEGORY_COLORS[exp.category] + "20",
                            color: CATEGORY_COLORS[exp.category],
                          }}
                        >
                          {exp.category.charAt(0) + exp.category.slice(1).toLowerCase()}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-xs text-muted-foreground">
                        <span>Paid by <strong>{exp.paidBy.name}</strong></span>
                        <span>Team: <strong>{exp.team.name}</strong></span>
                        <span>{format(new Date(exp.date), "dd MMM yyyy")}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-xl font-bold text-primary">
                          ₹{exp.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          ÷ {exp.splits.length} = ₹{(exp.amount / (exp.splits.length || 1)).toFixed(2)} each
                        </p>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 gap-1 text-xs"
                          onClick={() => setShowSplits(showSplits === exp.id ? null : exp.id)}
                        >
                          <SplitSquareVertical className="h-3.5 w-3.5" />
                          <ChevronDown className={`h-3 w-3 transition-transform ${showSplits === exp.id ? "rotate-180" : ""}`} />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => openEdit(exp)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-destructive hover:text-destructive"
                          onClick={() => { if (confirm("Delete this expense?")) deleteExpense.mutate(exp.id); }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Split breakdown */}
                  {showSplits === exp.id && exp.splits.length > 0 && (
                    <div className="mt-3 pt-3 border-t grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {exp.splits.map((s) => (
                        <div key={s.user.id} className="flex items-center gap-2 bg-muted/60 rounded-lg px-2.5 py-1.5 text-xs">
                          <div className="h-6 w-6 rounded-full bg-primary/15 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                            {s.user.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium truncate">{s.user.name}</p>
                            <p className="text-muted-foreground">₹{s.amountOwed.toFixed(2)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add / Edit Expense Dialog */}
      <Dialog open={showModal} onOpenChange={(o) => { if (!o) { setShowModal(false); setEditingId(null); } }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editingId ? <Pencil className="h-5 w-5 text-primary" /> : <Plus className="h-5 w-5 text-primary" />}
              {editingId ? "Edit Expense" : "Add New Expense"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1">
                <label className="text-sm font-medium">Title *</label>
                <Input placeholder="e.g. Dinner at Café" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Amount (₹) *</label>
                <Input type="number" min="0" step="0.01" placeholder="0.00" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Date</label>
                <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Team *</label>
                <Select value={form.teamId} onValueChange={(v) => setForm({ ...form, teamId: v ?? "", splitUserIds: [] })}>
                  <SelectTrigger><SelectValue placeholder="Select team" /></SelectTrigger>
                  <SelectContent>
                    {teams.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Category</label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v ?? "OTHER" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c.charAt(0) + c.slice(1).toLowerCase()}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-1">
                <label className="text-sm font-medium">Description</label>
                <Input placeholder="Optional notes" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 text-sm text-primary flex items-start gap-2">
              <SplitSquareVertical className="h-4 w-4 mt-0.5 shrink-0" />
              <p>The expense will be automatically split equally among all team members. Leave &quot;Split Users&quot; empty to split with everyone.</p>
            </div>

            <div className="flex gap-3 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => { setShowModal(false); setEditingId(null); }}>Cancel</Button>
              <Button
                className="flex-1 gap-2"
                disabled={!form.title || !form.amount || !form.teamId || createExpense.isPending || updateExpense.isPending}
                onClick={() => editingId ? updateExpense.mutate() : createExpense.mutate()}
              >
                {(createExpense.isPending || updateExpense.isPending) && <Loader2 className="h-4 w-4 animate-spin" />}
                {editingId ? "Update & Recalculate" : "Add & Split"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
