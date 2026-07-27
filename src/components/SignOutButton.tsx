"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LogOut } from "lucide-react";

export default function SignOutButton() {
  const router = useRouter();
  const supabase = createClient();

  return (
    <button
      onClick={async () => {
        await supabase.auth.signOut();
        router.push("/login");
        router.refresh();
      }}
      title="Sign out"
      aria-label="Sign out"
      className="flex h-9 w-9 items-center justify-center rounded-full text-muted transition hover:bg-panel2 hover:text-ink"
    >
      <LogOut size={16} strokeWidth={1.5} />
    </button>
  );
}
