import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateEqualSplits } from "@/lib/splitEngine";

// PUT /api/expenses/[id] – update expense, recalculate splits
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const existing = await prisma.expense.findUnique({
      where: { id },
      include: { team: { include: { members: true } } },
    });

    if (!existing) {
      return NextResponse.json({ message: "Expense not found" }, { status: 404 });
    }

    // Only payer or team admin can edit
    const isMember = existing.team.members.find((m) => m.userId === session.user.id);
    const isAdmin = isMember?.role === "ADMIN" || isMember?.role === "MANAGER";
    if (existing.paidById !== session.user.id && !isAdmin) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { title, description, amount, date, category, splitUserIds } =
      await req.json();

    let userIdsToSplit: string[] = splitUserIds;
    if (!userIdsToSplit || userIdsToSplit.length === 0) {
      userIdsToSplit = existing.team.members.map((m) => m.userId);
    }

    const newAmount = amount !== undefined ? Number(amount) : existing.amount;
    const splits = calculateEqualSplits(newAmount, userIdsToSplit);

    // Delete old splits and create new ones
    await prisma.expenseSplit.deleteMany({ where: { expenseId: id } });

    const updated = await prisma.expense.update({
      where: { id },
      data: {
        title: title ?? existing.title,
        description: description ?? existing.description,
        amount: newAmount,
        date: date ? new Date(date) : existing.date,
        category: category ?? existing.category,
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

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating expense:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/expenses/[id] – remove expense and splits
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const existing = await prisma.expense.findUnique({
      where: { id },
      include: { team: { include: { members: true } } },
    });

    if (!existing) {
      return NextResponse.json({ message: "Expense not found" }, { status: 404 });
    }

    const isMember = existing.team.members.find((m) => m.userId === session.user.id);
    const isAdmin = isMember?.role === "ADMIN" || isMember?.role === "MANAGER";
    if (existing.paidById !== session.user.id && !isAdmin) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    await prisma.expense.delete({ where: { id } });
    return NextResponse.json({ message: "Deleted successfully" });
  } catch (error) {
    console.error("Error deleting expense:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
