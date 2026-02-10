import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const { name, email, password } = await req.json();

        if (!name || !email || !password) {
            return NextResponse.json(
                { error: "Name, email, and password are required" },
                { status: 400 }
            );
        }

        if (password.length < 6) {
            return NextResponse.json(
                { error: "Password must be at least 6 characters" },
                { status: 400 }
            );
        }

        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return NextResponse.json(
                { error: "Email already registered" },
                { status: 409 }
            );
        }

        // First user becomes ADMIN
        const userCount = await prisma.user.count();
        const role = userCount === 0 ? "ADMIN" : "CLIENT";

        const passwordHash = await bcrypt.hash(password, 12);

        const user = await prisma.user.create({
            data: { name, email, passwordHash, role },
            select: { id: true, name: true, email: true, role: true },
        });

        return NextResponse.json(user, { status: 201 });
    } catch {
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
