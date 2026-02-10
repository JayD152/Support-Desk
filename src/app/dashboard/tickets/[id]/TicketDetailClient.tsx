"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface Comment {
    id: string;
    body: string;
    internal: boolean;
    createdAt: string;
    author: { id: string; name: string; role: string };
}

interface TicketData {
    id: string;
    subject: string;
    description: string;
    status: string;
    priority: string;
    flagged: boolean;
    createdAt: string;
    updatedAt: string;
    createdBy: { id: string; name: string; email: string; role: string };
    assignedTo?: { id: string; name: string; email: string } | null;
    group?: { id: string; name: string } | null;
    comments: Comment[];
}

interface TechUser {
    id: string;
    name: string;
    email: string;
}

interface Group {
    id: string;
    name: string;
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

export default function TicketDetailClient({
    ticketId,
}: {
    ticketId: string;
}) {
    const { data: session } = useSession();
    const router = useRouter();
    const [ticket, setTicket] = useState<TicketData | null>(null);
    const [loading, setLoading] = useState(true);
    const [commentBody, setCommentBody] = useState("");
    const [isInternal, setIsInternal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [techs, setTechs] = useState<TechUser[]>([]);
    const [groups, setGroups] = useState<Group[]>([]);

    const isTech =
        session?.user?.role === "TECH" || session?.user?.role === "ADMIN";

    const fetchTicket = useCallback(async () => {
        try {
            const res = await fetch(`/api/tickets/${ticketId}`);
            if (!res.ok) {
                router.push("/dashboard");
                return;
            }
            const data = await res.json();
            setTicket(data);
        } catch {
            router.push("/dashboard");
        } finally {
            setLoading(false);
        }
    }, [ticketId, router]);

    useEffect(() => {
        fetchTicket();
    }, [fetchTicket]);

    useEffect(() => {
        if (isTech) {
            // Fetch tech users and groups for assignment
            fetch("/api/admin/users")
                .then((r) => r.json())
                .then((users) => {
                    if (Array.isArray(users)) {
                        setTechs(
                            users
                                .filter(
                                    (u: { role: string }) =>
                                        u.role === "TECH" || u.role === "ADMIN"
                                )
                                .map((u: { id: string; name: string; email: string }) => ({
                                    id: u.id,
                                    name: u.name,
                                    email: u.email,
                                }))
                        );
                    }
                })
                .catch(() => { });

            fetch("/api/admin/groups")
                .then((r) => r.json())
                .then((data) => {
                    if (Array.isArray(data)) {
                        setGroups(
                            data.map((g: { id: string; name: string }) => ({
                                id: g.id,
                                name: g.name,
                            }))
                        );
                    }
                })
                .catch(() => { });
        }
    }, [isTech]);

    async function updateTicket(updates: Record<string, unknown>) {
        try {
            const res = await fetch(`/api/tickets/${ticketId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updates),
            });
            if (res.ok) {
                const updated = await res.json();
                setTicket((prev) => (prev ? { ...prev, ...updated } : prev));
            }
        } catch {
            console.error("Failed to update ticket");
        }
    }

    async function submitComment(e: React.FormEvent) {
        e.preventDefault();
        if (!commentBody.trim()) return;
        setSubmitting(true);

        try {
            const res = await fetch(`/api/tickets/${ticketId}/comments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ body: commentBody, internal: isInternal }),
            });

            if (res.ok) {
                const comment = await res.json();
                setTicket((prev) =>
                    prev ? { ...prev, comments: [...prev.comments, comment] } : prev
                );
                setCommentBody("");
                setIsInternal(false);
            }
        } catch {
            console.error("Failed to add comment");
        } finally {
            setSubmitting(false);
        }
    }

    if (loading) {
        return (
            <div className="loading-center">
                <span className="spinner" />
            </div>
        );
    }

    if (!ticket) return null;

    return (
        <div className="ticket-detail fade-in">
            <button
                className="btn btn-ghost"
                onClick={() => router.push("/dashboard")}
                style={{ marginBottom: "1rem" }}
            >
                ← Back to tickets
            </button>

            <div className="ticket-detail-header">
                <h1>
                    {ticket.flagged && "🚩 "}
                    {ticket.subject}
                </h1>
                <div className="ticket-detail-meta">
                    <span
                        className={`badge badge-${ticket.status.toLowerCase().replace("_", "-")}`}
                    >
                        {ticket.status.replace("_", " ")}
                    </span>
                    <span
                        className={`badge badge-${ticket.priority.toLowerCase()}`}
                    >
                        {ticket.priority}
                    </span>
                    <div className="detail-row">
                        <span className="label">Created by</span>
                        <span>{ticket.createdBy.name}</span>
                    </div>
                    {ticket.assignedTo && (
                        <div className="detail-row">
                            <span className="label">Assigned to</span>
                            <span>{ticket.assignedTo.name}</span>
                        </div>
                    )}
                    {ticket.group && (
                        <div className="detail-row">
                            <span className="label">Group</span>
                            <span>{ticket.group.name}</span>
                        </div>
                    )}
                    <div className="detail-row">
                        <span className="label">Created</span>
                        <span>{timeAgo(ticket.createdAt)}</span>
                    </div>
                </div>
            </div>

            {/* Tech Actions Bar */}
            {isTech && (
                <div className="ticket-actions-bar">
                    <div className="form-group">
                        <label>Status</label>
                        <select
                            value={ticket.status}
                            onChange={(e) => updateTicket({ status: e.target.value })}
                        >
                            <option value="OPEN">Open</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="RESOLVED">Resolved</option>
                            <option value="CLOSED">Closed</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Priority</label>
                        <select
                            value={ticket.priority}
                            onChange={(e) => updateTicket({ priority: e.target.value })}
                        >
                            <option value="LOW">Low</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="HIGH">High</option>
                            <option value="URGENT">Urgent</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Assign To</label>
                        <select
                            value={ticket.assignedTo?.id || ""}
                            onChange={(e) =>
                                updateTicket({
                                    assignedToId: e.target.value || null,
                                })
                            }
                        >
                            <option value="">Unassigned</option>
                            {techs.map((t) => (
                                <option key={t.id} value={t.id}>
                                    {t.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Group</label>
                        <select
                            value={ticket.group?.id || ""}
                            onChange={(e) =>
                                updateTicket({ groupId: e.target.value || null })
                            }
                        >
                            <option value="">No Group</option>
                            {groups.map((g) => (
                                <option key={g.id} value={g.id}>
                                    {g.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group" style={{ flex: "0 0 auto" }}>
                        <label>&nbsp;</label>
                        <button
                            className={`btn btn-sm ${ticket.flagged ? "btn-danger" : "btn-secondary"}`}
                            onClick={() => updateTicket({ flagged: !ticket.flagged })}
                        >
                            {ticket.flagged ? "🚩 Unflag" : "🏳️ Flag"}
                        </button>
                    </div>
                </div>
            )}

            {/* Ticket Body */}
            <div className="ticket-body">{ticket.description}</div>

            {/* Comments */}
            <div className="comments-section">
                <h2>
                    Comments{" "}
                    <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>
                        ({ticket.comments.length})
                    </span>
                </h2>

                {ticket.comments.length > 0 ? (
                    <div className="comment-list">
                        {ticket.comments.map((comment) => (
                            <div
                                key={comment.id}
                                className={`comment-item ${comment.internal ? "internal" : ""}`}
                            >
                                <div className="comment-header">
                                    <span className="comment-author">{comment.author.name}</span>
                                    <span
                                        className={`badge badge-${comment.author.role.toLowerCase()}`}
                                    >
                                        {comment.author.role}
                                    </span>
                                    {comment.internal && (
                                        <span className="badge badge-high">Internal Note</span>
                                    )}
                                    <span className="comment-time">
                                        {timeAgo(comment.createdAt)}
                                    </span>
                                </div>
                                <div className="comment-body">{comment.body}</div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="empty-state" style={{ padding: "2rem" }}>
                        <p>No comments yet</p>
                    </div>
                )}

                {/* Comment Form */}
                <form className="comment-form" onSubmit={submitComment}>
                    <textarea
                        placeholder="Write a comment…"
                        value={commentBody}
                        onChange={(e) => setCommentBody(e.target.value)}
                        rows={3}
                    />
                    <div className="comment-form-actions">
                        <button
                            type="submit"
                            className="btn btn-primary btn-sm"
                            disabled={submitting || !commentBody.trim()}
                        >
                            {submitting ? <span className="spinner" /> : "Add Comment"}
                        </button>
                        {isTech && (
                            <label className="internal-toggle">
                                <input
                                    type="checkbox"
                                    checked={isInternal}
                                    onChange={(e) => setIsInternal(e.target.checked)}
                                />
                                Internal note (hidden from client)
                            </label>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}
