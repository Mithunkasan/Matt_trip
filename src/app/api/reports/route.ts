import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateSettlements } from "@/lib/splitEngine";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") ?? "summary";
  const teamId = searchParams.get("teamId");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  try {
    // Build date filter
    const dateFilter: Record<string, unknown> = {};
    if (from) dateFilter.gte = new Date(from);
    if (to) dateFilter.lte = new Date(to);

    // Expense base filter – only expenses from user's teams
    const expenseWhere: Record<string, unknown> = {
      team: { members: { some: { userId: session.user.id } } },
    };
    if (teamId) expenseWhere.teamId = teamId;
    if (from || to) expenseWhere.date = dateFilter;

    if (type === "summary") {
      const expenses = await prisma.expense.findMany({
        where: expenseWhere,
        include: { paidBy: { select: { name: true } }, team: { select: { name: true } } },
        orderBy: { date: "desc" },
      });

      // Category breakdown
      const categoryTotals: Record<string, number> = {};
      const monthlyTotals: Record<string, number> = {};

      for (const e of expenses) {
        categoryTotals[e.category] = (categoryTotals[e.category] ?? 0) + e.amount;
        const monthKey = new Date(e.date).toLocaleString("default", {
          month: "short",
          year: "numeric",
        });
        monthlyTotals[monthKey] = (monthlyTotals[monthKey] ?? 0) + e.amount;
      }

      return NextResponse.json({
        totalAmount: expenses.reduce((s, e) => s + e.amount, 0),
        totalCount: expenses.length,
        categoryBreakdown: Object.entries(categoryTotals).map(([name, value]) => ({ name, value })),
        monthlyTrend: Object.entries(monthlyTotals).map(([month, total]) => ({ month, total })),
        recentExpenses: expenses.slice(0, 10),
      });
    }

    if (type === "individual") {
      const splits = await prisma.expenseSplit.findMany({
        where: {
          expense: expenseWhere as Record<string, unknown>,
        },
        include: {
          user: { select: { id: true, name: true, email: true } },
          expense: {
            include: {
              paidBy: { select: { id: true, name: true } },
              team: { select: { name: true } },
            },
          },
        },
      });

      // Group by user
      const byUser: Record<string, { name: string; email: string; total: number; count: number }> = {};
      for (const split of splits) {
        const uid = split.user.id;
        if (!byUser[uid]) {
          byUser[uid] = { name: split.user.name, email: split.user.email, total: 0, count: 0 };
        }
        byUser[uid].total += split.amountOwed;
        byUser[uid].count += 1;
      }

      return NextResponse.json({
        members: Object.entries(byUser).map(([id, data]) => ({ id, ...data })),
      });
    }

    if (type === "team") {
      const teams = await prisma.team.findMany({
        where: {
          members: { some: { userId: session.user.id } },
          ...(teamId ? { id: teamId } : {}),
        },
        include: {
          expenses: {
            where: from || to ? { date: dateFilter } : undefined,
            include: {
              paidBy: { select: { name: true } },
              splits: { include: { user: { select: { name: true } } } },
            },
            orderBy: { date: "desc" },
          },
          _count: { select: { members: true, expenses: true } },
        },
      });

      return NextResponse.json({
        teams: teams.map((t) => ({
          id: t.id,
          name: t.name,
          memberCount: t._count.members,
          expenseCount: t._count.expenses,
          totalAmount: t.expenses.reduce((s, e) => s + e.amount, 0),
          expenses: t.expenses,
        })),
      });
    }

    if (type === "settlement") {
      const members = await prisma.member.findMany({
        where: {
          ...(teamId ? { teamId } : {}),
          team: { members: { some: { userId: session.user.id } } },
        },
        include: { user: { select: { id: true, name: true } } },
      });

      const expenses = await prisma.expense.findMany({
        where: expenseWhere,
        include: { splits: true },
      });

      // Calculate net balances per user
      const balanceMap: Record<string, number> = {};
      for (const exp of expenses) {
        balanceMap[exp.paidById] = (balanceMap[exp.paidById] ?? 0) + exp.amount;
        for (const split of exp.splits) {
          balanceMap[split.userId] = (balanceMap[split.userId] ?? 0) - split.amountOwed;
        }
      }

      const uniqueUsers: Record<string, string> = {};
      for (const m of members) {
        uniqueUsers[m.user.id] = m.user.name;
      }

      const balances = Object.entries(balanceMap).map(([userId, amount]) => ({
        userId,
        amount: Math.round(amount * 100) / 100,
      }));

      const settlements = calculateSettlements(balances).map((s) => ({
        ...s,
        fromUserName: uniqueUsers[s.fromUserId] ?? s.fromUserId,
        toUserName: uniqueUsers[s.toUserId] ?? s.toUserId,
      }));

      return NextResponse.json({ settlements, balances });
    }

    return NextResponse.json({ message: "Unknown report type" }, { status: 400 });
  } catch (error) {
    console.error("Error generating report:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
