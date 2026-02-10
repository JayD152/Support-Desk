"use client";

import { useEffect, useState } from "react";

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    createdAt: string;
    _count: { createdTickets: number };
}

interface Stats {
    totalTickets: number;
    openTickets: number;
    inProgressTickets: number;
    resolvedTickets: number;
    closedTickets: number;
    totalUsers: number;
    totalTechs: number;
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState<string | null>(null);

    useEffect(() => {
        Promise.all([
            fetch("/api/admin/users").then((r) => r.json()),
            fetch("/api/admin/stats").then((r) => r.json()),
        ]).then(([usersData, statsData]) => {
            if (Array.isArray(usersData)) setUsers(usersData);
            setStats(statsData);
            setLoading(false);
        });
    }, []);

    async function changeRole(userId: string, role: string) {
        setUpdating(userId);
        try {
            const res = await fetch("/api/admin/users", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, role }),
            });

            if (res.ok) {
                const updated = await res.json();
                setUsers((prev) =>
                    prev.map((u) => (u.id === updated.id ? { ...u, role: updated.role } : u))
                );
            }
        } catch {
            console.error("Failed to update role");
        }
        setUpdating(null);
    }

    if (loading) {
        return (
            <div className="loading-center">
                <span className="spinner" />
            </div>
        );
    }

    return (
        <div className="fade-in">
            <div className="page-header">
                <h1>User Management</h1>
            </div>

            {stats && (
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-value">{stats.totalTickets}</div>
                        <div className="stat-label">Total Tickets</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">{stats.openTickets}</div>
                        <div className="stat-label">Open</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">{stats.inProgressTickets}</div>
                        <div className="stat-label">In Progress</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">{stats.totalUsers}</div>
                        <div className="stat-label">Total Users</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">{stats.totalTechs}</div>
                        <div className="stat-label">Techs & Admins</div>
                    </div>
                </div>
            )}

            <div className="card" style={{ padding: 0, overflow: "auto" }}>
                <table className="users-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Tickets</th>
                            <th>Joined</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user) => (
                            <tr key={user.id}>
                                <td style={{ fontWeight: 600 }}>{user.name}</td>
                                <td style={{ color: "var(--text-secondary)" }}>{user.email}</td>
                                <td>
                                    <select
                                        value={user.role}
                                        onChange={(e) => changeRole(user.id, e.target.value)}
                                        disabled={updating === user.id}
                                        className={`badge-${user.role.toLowerCase()}`}
                                    >
                                        <option value="CLIENT">Client</option>
                                        <option value="TECH">Tech</option>
                                        <option value="ADMIN">Admin</option>
                                    </select>
                                </td>
                                <td>{user._count.createdTickets}</td>
                                <td style={{ color: "var(--text-muted)" }}>
                                    {new Date(user.createdAt).toLocaleDateString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
