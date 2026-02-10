import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
    const { nextUrl } = req;
    const token = await getToken({ req, secret: process.env.AUTH_SECRET });

    const isLoggedIn = !!token;

    const isAuthPage =
        nextUrl.pathname.startsWith("/login") ||
        nextUrl.pathname.startsWith("/register");

    const isDashboard = nextUrl.pathname.startsWith("/dashboard");

    if (isDashboard && !isLoggedIn) {
        return NextResponse.redirect(new URL("/login", nextUrl));
    }

    if (isAuthPage && isLoggedIn) {
        return NextResponse.redirect(new URL("/dashboard", nextUrl));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/dashboard/:path*", "/login", "/register"],
};
