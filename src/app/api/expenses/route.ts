import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateEqualSplits } from "@/lib/splitEngine";

// GET /api/expenses – all expenses across user's teams
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const teamId = searchParams.get("teamId");

  try {
    const where: Record<string, unknown> = {
      team: {
        members: { some: { userId: session.user.id } },
      },
    };
    if (teamId) where.teamId = teamId;

    const expenses = await prisma.expense.findMany({
      where,
      include: {
        paidBy: { select: { id: true, name: true, email: true } },
        team: { select: { id: true, name: true } },
        splits: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
      orderBy: { date: "desc" },
    });

    return NextResponse.json(expenses);
  } catch (error) {
    console.error("Error fetching expenses:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

// POST /api/expenses – create expense with auto-split
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { title, description, amount, date, category, teamId, splitUserIds } =
      await req.json();

    if (!title || !amount || !teamId) {
      return NextResponse.json(
        { message: "title, amount, and teamId are required" },
        { status: 400 }
      );
    }

    // Verify user is a member of the team
    const membership = await prisma.member.findUnique({
      where: { userId_teamId: { userId: session.user.id, teamId } },
    });
    if (!membership) {
      return NextResponse.json({ message: "Not a team member" }, { status: 403 });
    }

    // Determine who to split among
    let userIdsToSplit: string[] = splitUserIds;
    if (!userIdsToSplit || userIdsToSplit.length === 0) {
      // Default: split among all team members
      const members = await prisma.member.findMany({ where: { teamId } });
      userIdsToSplit = members.map((m) => m.userId);
    }

    const splits = calculateEqualSplits(Number(amount), userIdsToSplit);

    const expense = await prisma.expense.create({
      data: {
        title,
        description,
        amount: Number(amount),
        date: date ? new Date(date) : new Date(),
        category: category ?? "OTHER",
        paidById: session.user.id,
        teamId,
        splits: {
          create: splits.map((s) => ({
            userId: s.userId,
            amountOwed: s.amountOwed,
          })),
        },
      },
      include: {
        paidBy: { select: { id: true, name: true } },
        splits: { include: { user: { select: { id: true, name: true } } } },
        team: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    console.error("Error creating expense:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
