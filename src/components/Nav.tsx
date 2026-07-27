"use client";

import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import LanguageToggle from "./LanguageToggle";
import Avatar from "./Avatar";
import SignOutButton from "./SignOutButton";

export default function Nav({ userLabel }: { userLabel: string }) {
  const { language, setLanguage } = useLanguage();

  return (
    <header className="border-b border-hairline">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-5">
        <Link href="/dashboard" className="flex items-center gap-3">
          <img src="/logo.jpeg" alt="PRISM AI" className="h-11 w-11 rounded-[11px] object-cover" />
          <span className="leading-tight">
            <span className="block font-display text-lg font-semibold">
              <span className="text-lime">PRISM</span>
              <span className="text-ink">.</span>
              <span className="text-ink"> Expense Tracker</span>
            </span>
            <span className="block font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
              PRISM AI Technologies
            </span>
          </span>
        </Link>

        <div className="flex items-center gap-4">
          <nav className="hidden items-center gap-5 font-mono text-xs uppercase tracking-wide text-muted sm:flex">
            <Link href="/dashboard" className="hover:text-ink">
              Dashboard
            </Link>
            <Link href="/expenses" className="hover:text-ink">
              Expenses
            </Link>
            <Link href="/summary" className="hover:text-ink">
              Ask
            </Link>
          </nav>
          <LanguageToggle value={language} onChange={setLanguage} />
          <Avatar label={userLabel} />
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}
