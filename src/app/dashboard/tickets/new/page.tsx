"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewTicketPage() {
    const router = useRouter();
    const [subject, setSubject] = useState("");
    const [description, setDescription] = useState("");
    const [priority, setPriority] = useState("MEDIUM");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const res = await fetch("/api/tickets", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ subject, description, priority }),
            });

            if (!res.ok) {
                const data = await res.json();
                setError(data.error || "Failed to create ticket");
                setLoading(false);
                return;
            }

            const ticket = await res.json();
            router.push(`/dashboard/tickets/${ticket.id}`);
        } catch {
            setError("Something went wrong");
            setLoading(false);
        }
    }

    return (
        <div className="fade-in" style={{ maxWidth: 700 }}>
            <div className="page-header">
                <h1>New Ticket</h1>
            </div>

            <div className="card">
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="subject">Subject</label>
                        <input
                            id="subject"
                            type="text"
                            placeholder="Briefly describe your issue"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="description">Description</label>
                        <textarea
                            id="description"
                            placeholder="Provide details about your issue, steps to reproduce, etc."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            required
                            rows={6}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="priority">Priority</label>
                        <select
                            id="priority"
                            value={priority}
                            onChange={(e) => setPriority(e.target.value)}
                        >
                            <option value="LOW">Low</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="HIGH">High</option>
                            <option value="URGENT">Urgent</option>
                        </select>
                    </div>

                    {error && <p className="form-error">⚠ {error}</p>}

                    <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading}
                        >
                            {loading ? <span className="spinner" /> : "Submit Ticket"}
                        </button>
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => router.back()}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
