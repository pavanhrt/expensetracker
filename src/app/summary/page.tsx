import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Nav from "@/components/Nav";
import SummaryClient from "./SummaryClient";

export const dynamic = "force-dynamic";

export default async function SummaryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const userLabel = (user.user_metadata?.name as string) || user.email || "?";

  return (
    <div className="min-h-screen">
      <Nav userLabel={userLabel} />
      <main className="mx-auto max-w-3xl px-4 py-6">
        <SummaryClient />
      </main>
    </div>
  );
}
