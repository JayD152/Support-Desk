import { SessionProvider } from "next-auth/react";
import TicketDetailClient from "./TicketDetailClient";

export default async function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return (
        <SessionProvider>
            <TicketDetailClient ticketId={id} />
        </SessionProvider>
    );
}
