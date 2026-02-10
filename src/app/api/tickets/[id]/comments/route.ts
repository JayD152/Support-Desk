import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

// GET /api/tickets/[id]/comments
export async function GET(
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

    if (
        session.user.role === "CLIENT" &&
        ticket.createdById !== session.user.id
    ) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const comments = await prisma.comment.findMany({
        where: {
            ticketId: id,
            ...(session.user.role === "CLIENT" ? { internal: false } : {}),
        },
        include: {
            author: { select: { id: true, name: true, role: true } },
        },
        orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(comments);
}

// POST /api/tickets/[id]/comments
export async function POST(
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

    if (
        session.user.role === "CLIENT" &&
        ticket.createdById !== session.user.id
    ) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { body, internal } = await req.json();

    if (!body?.trim()) {
        return NextResponse.json(
            { error: "Comment body is required" },
            { status: 400 }
        );
    }

    // Clients cannot post internal comments
    const isInternal =
        session.user.role !== "CLIENT" ? Boolean(internal) : false;

    const comment = await prisma.comment.create({
        data: {
            body,
            internal: isInternal,
            ticketId: id,
            authorId: session.user.id,
        },
        include: {
            author: { select: { id: true, name: true, role: true } },
        },
    });

    return NextResponse.json(comment, { status: 201 });
}
