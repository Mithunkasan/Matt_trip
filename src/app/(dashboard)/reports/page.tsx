"use client";

import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  Printer, Download, FileText, Users, Layers, ArrowLeftRight,
  TrendingUp, IndianRupee, Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";

const TABS = [
  { id: "summary", label: "Expense Summary", icon: TrendingUp },
  { id: "individual", label: "Individual Contributions", icon: Users },
  { id: "team", label: "Team-wise Report", icon: Layers },
  { id: "settlement", label: "Settlement Report", icon: ArrowLeftRight },
];

const GREEN_SHADES = ["#15803d", "#16a34a", "#22c55e", "#4ade80", "#86efac", "#bbf7d0"];

interface Team { id: string; name: string }

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("summary");
  const [teamId, setTeamId] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const { data: teams = [] } = useQuery<Team[]>({
    queryKey: ["teams"],
    queryFn: async () => (await fetch("/api/teams")).json(),
  });

  const params = new URLSearchParams({ type: activeTab });
  if (teamId && teamId !== "all") params.set("teamId", teamId);
  if (from) params.set("from", from);
  if (to) params.set("to", to);

  const { data: report, isLoading } = useQuery({
    queryKey: ["reports", activeTab, teamId, from, to],
    queryFn: async () => {
      const res = await fetch(`/api/reports?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch report");
      return res.json();
    },
  });

  function handlePrint() { window.print(); }

  const exportCSV = useCallback(() => {
    if (!report) return;
    let csv = "";

    if (activeTab === "summary") {
      csv = "Category,Amount (₹)\n" +
        (report.categoryBreakdown ?? []).map((r: { name: string; value: number }) => `${r.name},${r.value.toFixed(2)}`).join("\n");
    } else if (activeTab === "individual") {
      csv = "Name,Email,Total Owed (₹),Expense Count\n" +
        (report.members ?? []).map((m: { name: string; email: string; total: number; count: number }) =>
          `${m.name},${m.email},${m.total.toFixed(2)},${m.count}`).join("\n");
    } else if (activeTab === "team") {
      csv = "Team,Members,Expenses,Total (₹)\n" +
        (report.teams ?? []).map((t: { name: string; memberCount: number; expenseCount: number; totalAmount: number }) =>
          `${t.name},${t.memberCount},${t.expenseCount},${t.totalAmount.toFixed(2)}`).join("\n");
    } else if (activeTab === "settlement") {
      csv = "From,To,Amount (₹)\n" +
        (report.settlements ?? []).map((s: { fromUserName: string; toUserName: string; amount: number }) =>
          `${s.fromUserName},${s.toUserName},${s.amount.toFixed(2)}`).join("\n");
    }

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `splitwise_${activeTab}_report_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [report, activeTab]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground mt-1">Comprehensive expense analytics and settlements</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" className="gap-2" onClick={exportCSV}>
            <Download className="h-4 w-4" /> Export CSV
          </Button>
          <Button variant="outline" className="gap-2" onClick={handlePrint}>
            <Printer className="h-4 w-4" /> Print / PDF
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 no-print">
        <Select value={teamId} onValueChange={(v) => setTeamId(v ?? "all")}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Teams" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Teams</SelectItem>
            {teams.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-[140px]" placeholder="From" />
          <span className="text-muted-foreground text-sm">—</span>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-[140px]" placeholder="To" />
        </div>
      </div>

      {/* Tabs */}
      <div className="no-print">
        <div className="flex gap-1 flex-wrap rounded-xl bg-muted p-1 w-fit">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                activeTab === id
                  ? "bg-background shadow-sm text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Print-only tab label */}
      <div className="print-only hidden">
        <h2 className="text-xl font-bold mb-1">
          {TABS.find((t) => t.id === activeTab)?.label ?? "Report"}
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Generated on {format(new Date(), "dd MMM yyyy, HH:mm")}
          {teamId !== "all" && teams.find((t) => t.id === teamId) ? ` · Team: ${teams.find((t) => t.id === teamId)?.name}` : ""}
        </p>
      </div>

      {/* Report Content */}
      <div className="print-content">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          </div>
        ) : (
          <>
            {/* ── SUMMARY ── */}
            {activeTab === "summary" && report && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-5">
                      <p className="text-xs text-muted-foreground mb-1">Total Spent</p>
                      <p className="text-3xl font-bold text-primary">
                        ₹{(report.totalAmount ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-5">
                      <p className="text-xs text-muted-foreground mb-1">Total Transactions</p>
                      <p className="text-3xl font-bold">{report.totalCount ?? 0}</p>
                    </CardContent>
                  </Card>
                  <Card className="col-span-2 lg:col-span-1">
                    <CardContent className="pt-5">
                      <p className="text-xs text-muted-foreground mb-1">Average per Expense</p>
                      <p className="text-3xl font-bold">
                        ₹{report.totalCount
                          ? ((report.totalAmount ?? 0) / report.totalCount).toLocaleString("en-IN", { maximumFractionDigits: 2 })
                          : "0"}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Monthly Trend</CardTitle>
                      <CardDescription>Total spending per month</CardDescription>
                    </CardHeader>
                    <CardContent className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={report.monthlyTrend ?? []}>
                          <XAxis dataKey="month" fontSize={11} tickLine={false} axisLine={false} />
                          <YAxis fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v}`} />
                          <Tooltip formatter={(v) => [`₹${Number(v).toFixed(2)}`, "Total"]} />
                          <Bar dataKey="total" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Category Breakdown</CardTitle>
                      <CardDescription>Spending by category</CardDescription>
                    </CardHeader>
                    <CardContent className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={report.categoryBreakdown ?? []}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            paddingAngle={3}
                          >
                            {(report.categoryBreakdown ?? []).map((_: unknown, i: number) => (
                              <Cell key={i} fill={GREEN_SHADES[i % GREEN_SHADES.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(v) => [`₹${Number(v).toFixed(2)}`, ""]} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                {/* Recent expenses table */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" /> Recent Expenses
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Title</th>
                            <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Team</th>
                            <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Paid By</th>
                            <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Category</th>
                            <th className="text-right py-2 font-medium text-muted-foreground">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(report.recentExpenses ?? []).map((e: { id: string; title: string; team: { name: string }; paidBy: { name: string }; category: string; amount: number; date: string }) => (
                            <tr key={e.id} className="border-b last:border-0 hover:bg-muted/40">
                              <td className="py-2.5 pr-4 font-medium">{e.title}</td>
                              <td className="py-2.5 pr-4 text-muted-foreground">{e.team.name}</td>
                              <td className="py-2.5 pr-4 text-muted-foreground">{e.paidBy.name}</td>
                              <td className="py-2.5 pr-4">
                                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">{e.category}</span>
                              </td>
                              <td className="py-2.5 text-right font-bold text-primary">
                                ₹{e.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* ── INDIVIDUAL ── */}
            {activeTab === "individual" && report && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" /> Member Contributions
                  </CardTitle>
                  <CardDescription>How much each team member owes in total</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Member</th>
                          <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Email</th>
                          <th className="text-center py-2 pr-4 font-medium text-muted-foreground">Expenses</th>
                          <th className="text-right py-2 font-medium text-muted-foreground">Total Owed</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(report.members ?? []).map((m: { id: string; name: string; email: string; total: number; count: number }) => (
                          <tr key={m.id} className="border-b last:border-0 hover:bg-muted/40">
                            <td className="py-3 pr-4">
                              <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-full bg-primary/15 flex items-center justify-center text-primary font-bold text-sm">
                                  {m.name.charAt(0).toUpperCase()}
                                </div>
                                <span className="font-medium">{m.name}</span>
                              </div>
                            </td>
                            <td className="py-3 pr-4 text-muted-foreground">{m.email}</td>
                            <td className="py-3 pr-4 text-center">{m.count}</td>
                            <td className="py-3 text-right font-bold text-primary">
                              ₹{m.total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ── TEAM-WISE ── */}
            {activeTab === "team" && report && (
              <div className="space-y-5">
                {(report.teams ?? []).map((t: { id: string; name: string; memberCount: number; expenseCount: number; totalAmount: number; expenses: { id: string; title: string; paidBy: { name: string }; category: string; amount: number; date: string }[] }) => (
                  <Card key={t.id}>
                    <CardHeader className="pb-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-white font-bold">
                            {t.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <CardTitle className="text-base">{t.name}</CardTitle>
                            <CardDescription>{t.memberCount} members · {t.expenseCount} expenses</CardDescription>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-primary">₹{t.totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
                          <p className="text-xs text-muted-foreground">Total Spent</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-2 pr-3 font-medium text-muted-foreground">Expense</th>
                              <th className="text-left py-2 pr-3 font-medium text-muted-foreground">Paid By</th>
                              <th className="text-left py-2 pr-3 font-medium text-muted-foreground">Category</th>
                              <th className="text-left py-2 pr-3 font-medium text-muted-foreground">Date</th>
                              <th className="text-right py-2 font-medium text-muted-foreground">Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            {t.expenses.map((e) => (
                              <tr key={e.id} className="border-b last:border-0 hover:bg-muted/40">
                                <td className="py-2 pr-3 font-medium">{e.title}</td>
                                <td className="py-2 pr-3 text-muted-foreground">{e.paidBy.name}</td>
                                <td className="py-2 pr-3">
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">{e.category}</span>
                                </td>
                                <td className="py-2 pr-3 text-muted-foreground">{format(new Date(e.date), "dd MMM yyyy")}</td>
                                <td className="py-2 text-right font-bold">₹{e.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* ── SETTLEMENT ── */}
            {activeTab === "settlement" && report && (
              <div className="space-y-6">
                {(report.settlements ?? []).length === 0 ? (
                  <div className="flex flex-col items-center py-16 text-center">
                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <IndianRupee className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">All settled up! 🎉</h3>
                    <p className="text-muted-foreground text-sm">No outstanding balances.</p>
                  </div>
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <ArrowLeftRight className="h-5 w-5 text-primary" /> Settlement Transactions
                      </CardTitle>
                      <CardDescription>Minimum transactions to settle all debts</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {(report.settlements ?? []).map((s: { fromUserId: string; toUserId: string; fromUserName: string; toUserName: string; amount: number }, i: number) => (
                          <div
                            key={i}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border bg-muted/30"
                          >
                            <div className="flex items-center gap-3 flex-wrap">
                              <div className="flex items-center gap-2">
                                <div className="h-9 w-9 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold text-sm">
                                  {s.fromUserName.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <p className="font-semibold text-sm">{s.fromUserName}</p>
                                  <p className="text-xs text-muted-foreground">pays</p>
                                </div>
                              </div>
                              <ArrowLeftRight className="h-4 w-4 text-muted-foreground hidden sm:block" />
                              <div className="flex items-center gap-2">
                                <div className="h-9 w-9 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-sm">
                                  {s.toUserName.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <p className="font-semibold text-sm">{s.toUserName}</p>
                                  <p className="text-xs text-muted-foreground">receives</p>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-primary">
                                ₹{s.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
