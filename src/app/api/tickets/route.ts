import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

// GET /api/tickets — list tickets based on role
export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const filter = searchParams.get("filter") || "all"; // all, my, group, flagged, recent
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { groupMembers: true },
    });

    if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let where: any = {};

    // Role-based filtering
    if (user.role === "CLIENT") {
        where.createdById = user.id;
    } else if (user.role === "TECH") {
        const groupIds = user.groupMembers.map((gm) => gm.groupId);

        switch (filter) {
            case "my":
                where.assignedToId = user.id;
                break;
            case "group":
                where.groupId = { in: groupIds };
                break;
            case "flagged":
                where.flagged = true;
                where.OR = [
                    { assignedToId: user.id },
                    { groupId: { in: groupIds } },
                ];
                break;
            case "recent":
                where.OR = [
                    { assignedToId: user.id },
                    { groupId: { in: groupIds } },
                ];
                break;
            default:
                where.OR = [
                    { assignedToId: user.id },
                    { groupId: { in: groupIds } },
                    { createdById: user.id },
                ];
        }
    }
    // ADMIN sees everything — no where filter needed

    if (user.role === "ADMIN") {
        switch (filter) {
            case "my":
                where.assignedToId = user.id;
                break;
            case "flagged":
                where.flagged = true;
                break;
            case "recent":
                break;
            default:
                break;
        }
    }

    // Search
    if (search) {
        where.OR = [
            { subject: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
            { id: { contains: search } },
        ];
    }

    const orderBy =
        filter === "recent"
            ? { updatedAt: "desc" as const }
            : { createdAt: "desc" as const };

    const [tickets, total] = await Promise.all([
        prisma.ticket.findMany({
            where,
            include: {
                createdBy: { select: { id: true, name: true, email: true } },
                assignedTo: { select: { id: true, name: true, email: true } },
                group: { select: { id: true, name: true } },
                _count: { select: { comments: true } },
            },
            orderBy,
            skip,
            take: limit,
        }),
        prisma.ticket.count({ where }),
    ]);

    return NextResponse.json({
        tickets,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
}

// POST /api/tickets — create a ticket
export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { subject, description, priority } = await req.json();

        if (!subject || !description) {
            return NextResponse.json(
                { error: "Subject and description are required" },
                { status: 400 }
            );
        }

        const ticket = await prisma.ticket.create({
            data: {
                subject,
                description,
                priority: priority || "MEDIUM",
                createdById: session.user.id,
            },
            include: {
                createdBy: { select: { id: true, name: true, email: true } },
            },
        });

        return NextResponse.json(ticket, { status: 201 });
    } catch {
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
