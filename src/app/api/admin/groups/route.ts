import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

// GET /api/admin/groups — list all groups with members
export async function GET() {
    const session = await auth();
    if (!session?.user || !["ADMIN", "TECH"].includes(session.user.role)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const groups = await prisma.group.findMany({
        include: {
            members: {
                include: {
                    user: { select: { id: true, name: true, email: true, role: true } },
                },
            },
            _count: { select: { tickets: true } },
        },
        orderBy: { name: "asc" },
    });

    return NextResponse.json(groups);
}

// POST /api/admin/groups — create a group
export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { name, description, memberIds } = await req.json();

    if (!name) {
        return NextResponse.json(
            { error: "Group name is required" },
            { status: 400 }
        );
    }

    const group = await prisma.group.create({
        data: {
            name,
            description,
            members: memberIds?.length
                ? {
                    create: memberIds.map((userId: string) => ({ userId })),
                }
                : undefined,
        },
        include: {
            members: {
                include: {
                    user: { select: { id: true, name: true, email: true } },
                },
            },
        },
    });

    return NextResponse.json(group, { status: 201 });
}

// PATCH /api/admin/groups — update group members
export async function PATCH(req: NextRequest) {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { groupId, memberIds } = await req.json();

    if (!groupId || !Array.isArray(memberIds)) {
        return NextResponse.json(
            { error: "groupId and memberIds array are required" },
            { status: 400 }
        );
    }

    // Remove all existing members and re-add
    await prisma.groupMember.deleteMany({ where: { groupId } });

    if (memberIds.length > 0) {
        await prisma.groupMember.createMany({
            data: memberIds.map((userId: string) => ({ userId, groupId })),
        });
    }

    const group = await prisma.group.findUnique({
        where: { id: groupId },
        include: {
            members: {
                include: {
                    user: { select: { id: true, name: true, email: true } },
                },
            },
        },
    });

    return NextResponse.json(group);
}

// DELETE /api/admin/groups
export async function DELETE(req: NextRequest) {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { groupId } = await req.json();
    await prisma.group.delete({ where: { id: groupId } });

    return NextResponse.json({ success: true });
}
