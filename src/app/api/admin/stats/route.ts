import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

// GET /api/admin/stats — dashboard statistics
export async function GET() {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [totalTickets, openTickets, inProgressTickets, resolvedTickets, totalUsers, totalTechs] =
        await Promise.all([
            prisma.ticket.count(),
            prisma.ticket.count({ where: { status: "OPEN" } }),
            prisma.ticket.count({ where: { status: "IN_PROGRESS" } }),
            prisma.ticket.count({ where: { status: "RESOLVED" } }),
            prisma.user.count(),
            prisma.user.count({ where: { role: { in: ["TECH", "ADMIN"] } } }),
        ]);

    return NextResponse.json({
        totalTickets,
        openTickets,
        inProgressTickets,
        resolvedTickets,
        closedTickets: totalTickets - openTickets - inProgressTickets - resolvedTickets,
        totalUsers,
        totalTechs,
    });
}
