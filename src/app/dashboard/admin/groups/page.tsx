"use client";

import { useEffect, useState } from "react";

interface GroupMember {
    id: string;
    user: { id: string; name: string; email: string; role: string };
}

interface Group {
    id: string;
    name: string;
    description: string | null;
    members: GroupMember[];
    _count: { tickets: number };
}

interface TechUser {
    id: string;
    name: string;
    email: string;
    role: string;
}

export default function AdminGroupsPage() {
    const [groups, setGroups] = useState<Group[]>([]);
    const [techs, setTechs] = useState<TechUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [newName, setNewName] = useState("");
    const [newDesc, setNewDesc] = useState("");
    const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        Promise.all([
            fetch("/api/admin/groups").then((r) => r.json()),
            fetch("/api/admin/users").then((r) => r.json()),
        ]).then(([groupsData, usersData]) => {
            if (Array.isArray(groupsData)) setGroups(groupsData);
            if (Array.isArray(usersData)) {
                setTechs(
                    usersData.filter(
                        (u: TechUser) => u.role === "TECH" || u.role === "ADMIN"
                    )
                );
            }
            setLoading(false);
        });
    }, []);

    async function createGroup(e: React.FormEvent) {
        e.preventDefault();
        setCreating(true);

        try {
            const res = await fetch("/api/admin/groups", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: newName,
                    description: newDesc,
                    memberIds: selectedMembers,
                }),
            });

            if (res.ok) {
                const group = await res.json();
                setGroups((prev) => [...prev, { ...group, _count: { tickets: 0 } }]);
                setShowModal(false);
                setNewName("");
                setNewDesc("");
                setSelectedMembers([]);
            }
        } catch {
            console.error("Failed to create group");
        }
        setCreating(false);
    }

    async function deleteGroup(groupId: string) {
        if (!confirm("Delete this group?")) return;

        try {
            await fetch("/api/admin/groups", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ groupId }),
            });
            setGroups((prev) => prev.filter((g) => g.id !== groupId));
        } catch {
            console.error("Failed to delete group");
        }
    }

    function toggleMember(userId: string) {
        setSelectedMembers((prev) =>
            prev.includes(userId)
                ? prev.filter((id) => id !== userId)
                : [...prev, userId]
        );
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
                <h1>Groups</h1>
                <div className="actions">
                    <button
                        className="btn btn-primary"
                        onClick={() => setShowModal(true)}
                    >
                        + New Group
                    </button>
                </div>
            </div>

            {groups.length === 0 ? (
                <div className="empty-state">
                    <div className="icon">🏢</div>
                    <h3>No groups yet</h3>
                    <p>Create a group to organize your techs.</p>
                </div>
            ) : (
                <div className="groups-grid">
                    {groups.map((group) => (
                        <div key={group.id} className="group-card">
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "flex-start",
                                }}
                            >
                                <div>
                                    <h3>{group.name}</h3>
                                    {group.description && (
                                        <p className="group-desc">{group.description}</p>
                                    )}
                                </div>
                                <button
                                    className="btn btn-ghost btn-sm"
                                    onClick={() => deleteGroup(group.id)}
                                    title="Delete group"
                                >
                                    🗑
                                </button>
                            </div>
                            <div
                                style={{
                                    display: "flex",
                                    gap: "0.5rem",
                                    marginBottom: "0.75rem",
                                    fontSize: "0.78rem",
                                    color: "var(--text-muted)",
                                }}
                            >
                                <span>{group.members.length} members</span>
                                <span>·</span>
                                <span>{group._count.tickets} tickets</span>
                            </div>
                            <div className="group-members">
                                {group.members.map((m) => (
                                    <span key={m.id} className="member-chip">
                                        {m.user.name}
                                    </span>
                                ))}
                                {group.members.length === 0 && (
                                    <span
                                        style={{
                                            fontSize: "0.78rem",
                                            color: "var(--text-muted)",
                                        }}
                                    >
                                        No members
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Group Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h2>Create Group</h2>
                        <form onSubmit={createGroup}>
                            <div className="form-group">
                                <label>Group Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g., Network Team"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <input
                                    type="text"
                                    placeholder="Optional description"
                                    value={newDesc}
                                    onChange={(e) => setNewDesc(e.target.value)}
                                />
                            </div>
                            <div className="form-group">
                                <label>Members (Techs & Admins)</label>
                                <div
                                    style={{
                                        maxHeight: 200,
                                        overflow: "auto",
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "0.3rem",
                                    }}
                                >
                                    {techs.map((tech) => (
                                        <label
                                            key={tech.id}
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "0.5rem",
                                                padding: "0.4rem 0.6rem",
                                                borderRadius: "var(--radius-sm)",
                                                cursor: "pointer",
                                                fontSize: "0.88rem",
                                                background: selectedMembers.includes(tech.id)
                                                    ? "var(--accent-subtle)"
                                                    : "transparent",
                                            }}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedMembers.includes(tech.id)}
                                                onChange={() => toggleMember(tech.id)}
                                                style={{ width: "auto" }}
                                            />
                                            {tech.name}
                                            <span
                                                style={{
                                                    color: "var(--text-muted)",
                                                    fontSize: "0.78rem",
                                                }}
                                            >
                                                {tech.email}
                                            </span>
                                        </label>
                                    ))}
                                    {techs.length === 0 && (
                                        <p
                                            style={{
                                                fontSize: "0.82rem",
                                                color: "var(--text-muted)",
                                            }}
                                        >
                                            Promote users to Tech role first.
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setShowModal(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={creating}
                                >
                                    {creating ? <span className="spinner" /> : "Create Group"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
