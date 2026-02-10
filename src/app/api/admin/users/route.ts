import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

// GET /api/admin/users — list all users
export async function GET() {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const users = await prisma.user.findMany({
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
            _count: { select: { createdTickets: true } },
        },
        orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(users);
}

// PATCH /api/admin/users — update user role
export async function PATCH(req: NextRequest) {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { userId, role } = await req.json();

    if (!userId || !["CLIENT", "TECH", "ADMIN"].includes(role)) {
        return NextResponse.json(
            { error: "Valid userId and role are required" },
            { status: 400 }
        );
    }

    // Prevent self-demotion
    if (userId === session.user.id) {
        return NextResponse.json(
            { error: "Cannot change your own role" },
            { status: 400 }
        );
    }

    const user = await prisma.user.update({
        where: { id: userId },
        data: { role },
        select: { id: true, name: true, email: true, role: true },
    });

    return NextResponse.json(user);
}
