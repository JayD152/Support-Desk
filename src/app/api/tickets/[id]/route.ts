import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

// GET /api/tickets/[id]
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const ticket = await prisma.ticket.findUnique({
        where: { id },
        include: {
            createdBy: { select: { id: true, name: true, email: true, role: true } },
            assignedTo: { select: { id: true, name: true, email: true } },
            group: { select: { id: true, name: true } },
            comments: {
                include: {
                    author: { select: { id: true, name: true, role: true } },
                },
                orderBy: { createdAt: "asc" },
            },
        },
    });

    if (!ticket) {
        return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // Clients can only see their own tickets
    if (
        session.user.role === "CLIENT" &&
        ticket.createdById !== session.user.id
    ) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Hide internal comments from clients
    if (session.user.role === "CLIENT") {
        ticket.comments = ticket.comments.filter((c) => !c.internal);
    }

    return NextResponse.json(ticket);
}

// PATCH /api/tickets/[id] — update ticket
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const ticket = await prisma.ticket.findUnique({ where: { id } });
    if (!ticket) {
        return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    const body = await req.json();

    // Clients can only update subject/description of their own open tickets
    if (session.user.role === "CLIENT") {
        if (ticket.createdById !== session.user.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        const allowed = ["subject", "description"];
        const data: Record<string, string> = {};
        for (const key of allowed) {
            if (body[key] !== undefined) data[key] = body[key];
        }
        const updated = await prisma.ticket.update({ where: { id }, data });
        return NextResponse.json(updated);
    }

    // Techs and Admins can update more fields
    const allowed = [
        "status",
        "priority",
        "assignedToId",
        "groupId",
        "flagged",
        "subject",
        "description",
    ];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: Record<string, any> = {};
    for (const key of allowed) {
        if (body[key] !== undefined) data[key] = body[key];
    }

    const updated = await prisma.ticket.update({
        where: { id },
        data,
        include: {
            createdBy: { select: { id: true, name: true, email: true } },
            assignedTo: { select: { id: true, name: true, email: true } },
            group: { select: { id: true, name: true } },
        },
    });

    return NextResponse.json(updated);
}

// DELETE /api/tickets/[id] — admin only
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    await prisma.ticket.delete({ where: { id } });
    return NextResponse.json({ success: true });
}
