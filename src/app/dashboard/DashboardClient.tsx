"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

interface Ticket {
    id: string;
    subject: string;
    status: string;
    priority: string;
    flagged: boolean;
    createdAt: string;
    updatedAt: string;
    createdBy: { id: string; name: string; email: string };
    assignedTo?: { id: string; name: string; email: string } | null;
    group?: { id: string; name: string } | null;
    _count: { comments: number };
}

function StatusBadge({ status }: { status: string }) {
    const cls = status.toLowerCase().replace("_", "-");
    return <span className={`badge badge-${cls}`}>{status.replace("_", " ")}</span>;
}

function PriorityBadge({ priority }: { priority: string }) {
    return (
        <span className={`badge badge-${priority.toLowerCase()}`}>{priority}</span>
    );
}

function timeAgo(date: string) {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(date).toLocaleDateString();
}

export default function DashboardPage() {
    const { data: session } = useSession();
    const searchParams = useSearchParams();
    const filterParam = searchParams.get("filter");

    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState(filterParam || "all");
    const [search, setSearch] = useState("");
    const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

    const isTech =
        session?.user?.role === "TECH" || session?.user?.role === "ADMIN";

    const fetchTickets = useCallback(
        async (filter: string, searchQuery?: string) => {
            setLoading(true);
            try {
                const params = new URLSearchParams();
                params.set("filter", filter);
                if (searchQuery) params.set("search", searchQuery);

                const res = await fetch(`/api/tickets?${params}`);
                const data = await res.json();
                setTickets(data.tickets || []);
            } catch {
                console.error("Failed to fetch tickets");
            } finally {
                setLoading(false);
            }
        },
        []
    );

    useEffect(() => {
        fetchTickets(activeTab);
    }, [activeTab, fetchTickets]);

    useEffect(() => {
        if (filterParam) setActiveTab(filterParam);
    }, [filterParam]);

    function handleSearch(value: string) {
        setSearch(value);
        if (searchTimeout) clearTimeout(searchTimeout);
        const timeout = setTimeout(() => {
            fetchTickets(activeTab, value);
        }, 400);
        setSearchTimeout(timeout);
    }

    const tabs = isTech
        ? [
            { key: "all", label: "All Tickets", icon: "📋" },
            { key: "my", label: "My Tickets", icon: "🎯" },
            { key: "group", label: "Group", icon: "👥" },
            { key: "flagged", label: "Flagged", icon: "🚩" },
            { key: "recent", label: "Recent", icon: "🕐" },
        ]
        : [{ key: "all", label: "My Tickets", icon: "📋" }];

    return (
        <div className="fade-in">
            <div className="page-header">
                <h1>
                    {isTech ? "Tickets" : "My Tickets"}
                </h1>
                <div className="actions">
                    {isTech && (
                        <div className="search-bar">
                            <span className="search-icon">🔍</span>
                            <input
                                type="text"
                                placeholder="Search tickets…"
                                value={search}
                                onChange={(e) => handleSearch(e.target.value)}
                            />
                        </div>
                    )}
                    <Link href="/dashboard/tickets/new" className="btn btn-primary">
                        + New Ticket
                    </Link>
                </div>
            </div>

            {tabs.length > 1 && (
                <div className="tab-nav">
                    {tabs.map((tab) => (
                        <button
                            key={tab.key}
                            className={`tab-btn ${activeTab === tab.key ? "active" : ""}`}
                            onClick={() => setActiveTab(tab.key)}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>
            )}

            {loading ? (
                <div className="loading-center">
                    <span className="spinner" />
                </div>
            ) : tickets.length === 0 ? (
                <div className="empty-state">
                    <div className="icon">📭</div>
                    <h3>No tickets found</h3>
                    <p>
                        {activeTab === "my"
                            ? "You don't have any assigned tickets yet."
                            : activeTab === "flagged"
                                ? "No flagged tickets."
                                : "Create a new ticket to get started."}
                    </p>
                </div>
            ) : (
                <div className="tickets-grid">
                    {tickets.map((ticket) => (
                        <Link
                            key={ticket.id}
                            href={`/dashboard/tickets/${ticket.id}`}
                            className="ticket-row"
                        >
                            <div className="ticket-info">
                                <div className="ticket-subject">
                                    {ticket.flagged && <span className="flag">🚩 </span>}
                                    {ticket.subject}
                                </div>
                                <div className="ticket-meta">
                                    <span>#{ticket.id.slice(-6)}</span>
                                    <span>by {ticket.createdBy.name}</span>
                                    {ticket.assignedTo && (
                                        <span>→ {ticket.assignedTo.name}</span>
                                    )}
                                    {ticket.group && <span>📁 {ticket.group.name}</span>}
                                    <span>{timeAgo(ticket.updatedAt)}</span>
                                    {ticket._count.comments > 0 && (
                                        <span>💬 {ticket._count.comments}</span>
                                    )}
                                </div>
                            </div>
                            <StatusBadge status={ticket.status} />
                            <PriorityBadge priority={ticket.priority} />
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
