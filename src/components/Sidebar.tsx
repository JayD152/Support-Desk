"use client";

import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";

interface SidebarProps {
    user: {
        name: string;
        email: string;
        role: string;
    };
}

export default function Sidebar({ user }: SidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const isTechOrAdmin = user.role === "TECH" || user.role === "ADMIN";

    function isActive(path: string) {
        if (path === "/dashboard") return pathname === "/dashboard";
        return pathname.startsWith(path);
    }

    async function handleSignOut() {
        await signOut({ redirect: false });
        router.push("/login");
    }

    return (
        <>
            <button
                className="mobile-menu-btn"
                onClick={() => setOpen(!open)}
                aria-label="Toggle menu"
            >
                &#9776;
            </button>

            <aside className={`sidebar ${open ? "open" : ""}`}>
                <div className="sidebar-brand">
                    <span>SupportDesk</span>
                </div>

                <nav className="sidebar-nav">
                    <div className="sidebar-section">
                        <div className="sidebar-section-title">Navigation</div>
                        <Link
                            href="/dashboard"
                            className={`sidebar-link ${isActive("/dashboard") && !pathname.includes("/admin") && !pathname.includes("/tickets") ? "active" : ""}`}
                            onClick={() => setOpen(false)}
                        >
                            <span className="symbol">&#9636;</span>
                            Dashboard
                        </Link>
                        <Link
                            href="/dashboard/tickets/new"
                            className={`sidebar-link ${isActive("/dashboard/tickets/new") ? "active" : ""}`}
                            onClick={() => setOpen(false)}
                        >
                            <span className="symbol">+</span>
                            New Ticket
                        </Link>
                    </div>

                    {isTechOrAdmin && (
                        <div className="sidebar-section">
                            <div className="sidebar-section-title">Tickets</div>
                            <Link
                                href="/dashboard?filter=my"
                                className={`sidebar-link ${pathname === "/dashboard" && typeof window !== "undefined" && window.location.search.includes("filter=my") ? "active" : ""}`}
                                onClick={() => setOpen(false)}
                            >
                                <span className="symbol">&#8226;</span>
                                Assigned to Me
                            </Link>
                            <Link
                                href="/dashboard?filter=group"
                                className={`sidebar-link`}
                                onClick={() => setOpen(false)}
                            >
                                <span className="symbol">&#8801;</span>
                                Group Queue
                            </Link>
                            <Link
                                href="/dashboard?filter=flagged"
                                className={`sidebar-link`}
                                onClick={() => setOpen(false)}
                            >
                                <span className="symbol">&#9873;</span>
                                Flagged
                            </Link>
                        </div>
                    )}

                    {user.role === "ADMIN" && (
                        <div className="sidebar-section">
                            <div className="sidebar-section-title">Administration</div>
                            <Link
                                href="/dashboard/admin/users"
                                className={`sidebar-link ${isActive("/dashboard/admin/users") ? "active" : ""}`}
                                onClick={() => setOpen(false)}
                            >
                                <span className="symbol">&#9775;</span>
                                Users
                            </Link>
                            <Link
                                href="/dashboard/admin/groups"
                                className={`sidebar-link ${isActive("/dashboard/admin/groups") ? "active" : ""}`}
                                onClick={() => setOpen(false)}
                            >
                                <span className="symbol">&#9670;</span>
                                Groups
                            </Link>
                        </div>
                    )}
                </nav>

                <div className="sidebar-user">
                    <div className="avatar">{user.name?.charAt(0)?.toUpperCase()}</div>
                    <div className="user-info">
                        <div className="user-name">{user.name}</div>
                        <div className="user-role">{user.role.toLowerCase()}</div>
                    </div>
                    <button
                        className="btn btn-ghost btn-sm"
                        onClick={handleSignOut}
                        title="Sign out"
                    >
                        &#8594;
                    </button>
                </div>
            </aside>

            {open && (
                <div className="sidebar-overlay" onClick={() => setOpen(false)} />
            )}
        </>
    );
}
