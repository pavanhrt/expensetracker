import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/Toast";

export const metadata: Metadata = {
  title: "Vartā — Expense Tracker",
  description: "Voice-enabled personal expense tracker for English and Telugu",
  manifest: "/manifest.json",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-paper text-ink antialiased">
        <Toaster />
        {children}
      </body>
    </html>
  );
}
