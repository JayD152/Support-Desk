import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SupportDesk — Modern Help Desk",
  description: "A streamlined help desk solution for teams and clients",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
