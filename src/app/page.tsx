import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function Home() {
  const session = await auth();
  if (session) redirect("/dashboard");

  return (
    <div className="landing">
      <div className="fade-in">
        <h1>SupportDesk</h1>
        <p>
          A modern help desk built for speed. Submit tickets, track progress,
          and resolve issues — all in one place.
        </p>
        <div className="cta-buttons">
          <Link href="/login" className="btn btn-primary">
            Sign In
          </Link>
          <Link href="/register" className="btn btn-secondary">
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
}
