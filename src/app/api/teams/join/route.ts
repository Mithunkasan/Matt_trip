import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/teams/join – join a team via invite code
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { inviteCode } = await req.json();

    if (!inviteCode) {
      return NextResponse.json({ message: "inviteCode is required" }, { status: 400 });
    }

    const team = await prisma.team.findUnique({ where: { inviteCode } });

    if (!team) {
      return NextResponse.json({ message: "Invalid invite code" }, { status: 404 });
    }

    // Check if already a member
    const existing = await prisma.member.findUnique({
      where: { userId_teamId: { userId: session.user.id, teamId: team.id } },
    });

    if (existing) {
      return NextResponse.json({ team, alreadyMember: true });
    }

    // Add user as member
    await prisma.member.create({
      data: {
        userId: session.user.id,
        teamId: team.id,
        role: "MEMBER",
      },
    });

    return NextResponse.json({ team, alreadyMember: false }, { status: 201 });
  } catch (error) {
    console.error("Error joining team:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

// GET /api/teams/join?code=... – preview a team before joining (public)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.json({ message: "code is required" }, { status: 400 });
  }

  try {
    const team = await prisma.team.findUnique({
      where: { inviteCode: code },
      include: {
        _count: { select: { members: true } },
      },
    });

    if (!team) {
      return NextResponse.json({ message: "Invalid invite code" }, { status: 404 });
    }

    return NextResponse.json({
      id: team.id,
      name: team.name,
      description: team.description,
      memberCount: team._count.members,
    });
  } catch (error) {
    console.error("Error fetching team preview:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
