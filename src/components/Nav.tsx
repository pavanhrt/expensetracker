import Link from "next/link";
import SignOutButton from "./SignOutButton";

export default function Nav() {
  return (
    <header className="sticky top-0 z-10 border-b border-black/10 bg-paper/95 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
        <Link href="/dashboard" className="text-lg font-semibold text-ink">
          Vartā
        </Link>
        <nav className="flex items-center gap-5 text-sm">
          <Link href="/dashboard" className="text-muted hover:text-ink">
            Dashboard
          </Link>
          <Link href="/expenses" className="text-muted hover:text-ink">
            Expenses
          </Link>
          <Link href="/summary" className="text-muted hover:text-ink">
            Ask
          </Link>
          <SignOutButton />
        </nav>
      </div>
    </header>
  );
}
