import { redirect } from "next/navigation";
import Link from "next/link";
import { addDays, format, parseISO } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { todayISO } from "@/lib/dates";
import { formatCurrency } from "@/lib/theme";
import Nav from "@/components/Nav";
import AddExpenseForm from "@/components/AddExpenseForm";
import ExpenseList from "@/components/ExpenseList";
import type { Expense } from "@/types";

export const dynamic = "force-dynamic";

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const userLabel = (user.user_metadata?.name as string) || user.email || "?";

  const { date: dateParam } = await searchParams;
  const date = dateParam || todayISO();

  const [{ data: rows }, { data: categoryRows }] = await Promise.all([
    supabase
      .from("expenses")
      .select("id, item_name, amount, category_id, expense_date, raw_input, input_mode, language, created_at, categories(name)")
      .eq("user_id", user.id)
      .eq("expense_date", date)
      .order("created_at", { ascending: false }),
    supabase.from("categories").select("name").eq("user_id", user.id).order("name"),
  ]);

  const expenses: Expense[] = (rows ?? []).map((r: any) => ({
    id: r.id,
    user_id: user.id,
    item_name: r.item_name,
    amount: Number(r.amount),
    category_id: r.category_id,
    category_name: r.categories?.name ?? "Other",
    expense_date: r.expense_date,
    raw_input: r.raw_input,
    input_mode: r.input_mode,
    language: r.language,
    created_at: r.created_at,
  }));

  const dayTotal = expenses.reduce((sum, e) => sum + e.amount, 0);
  const categories = (categoryRows ?? []).map((c) => c.name);

  const parsedDate = parseISO(date);
  const prevDate = format(addDays(parsedDate, -1), "yyyy-MM-dd");
  const nextDate = format(addDays(parsedDate, 1), "yyyy-MM-dd");

  return (
    <div className="min-h-screen">
      <Nav userLabel={userLabel} />
      <main className="mx-auto max-w-3xl space-y-6 px-4 py-6">
        <AddExpenseForm />

        <div className="flex items-center gap-2.5">
          <Link
            href={`/expenses?date=${prevDate}`}
            className="font-mono text-xs text-muted hover:text-ink"
          >
            ← {prevDate}
          </Link>
          <span className="h-px flex-1 bg-gradient-to-r from-cyan via-violet to-lime opacity-40" />
          <div className="text-center font-mono text-xs uppercase tracking-[0.06em] text-muted">
            {format(parsedDate, "EEEE, MMM d")} · {formatCurrency(dayTotal)}
          </div>
          <span className="h-px flex-1 bg-gradient-to-r from-lime via-magenta to-cyan opacity-40" />
          <Link
            href={`/expenses?date=${nextDate}`}
            className="font-mono text-xs text-muted hover:text-ink"
          >
            {nextDate} →
          </Link>
        </div>

        <div className="overflow-hidden rounded-panel border border-hairline bg-panel">
          <ExpenseList expenses={expenses} categories={categories} />
        </div>

        <a
          href="/api/expenses/export"
          className="inline-block font-mono text-xs text-muted underline underline-offset-4 hover:text-ink"
        >
          Export this month as CSV
        </a>
      </main>
    </div>
  );
}
