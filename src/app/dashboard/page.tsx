import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { currentMonth, monthRange, previousMonth } from "@/lib/dates";
import { formatCurrency } from "@/lib/theme";
import Nav from "@/components/Nav";
import AddExpenseForm from "@/components/AddExpenseForm";
import CategoryPieChart from "@/components/CategoryPieChart";
import MonthlyTrendChart from "@/components/MonthlyTrendChart";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const userLabel = (user.user_metadata?.name as string) || user.email || "?";

  const month = currentMonth();
  const { start, endExclusive } = monthRange(month);
  const { start: prevStart, endExclusive: prevEnd } = monthRange(previousMonth(month));

  const [{ data: monthRows }, { data: prevRows }, { data: trendRows }] = await Promise.all([
    supabase
      .from("expenses")
      .select("amount, categories(name)")
      .eq("user_id", user.id)
      .gte("expense_date", start)
      .lt("expense_date", endExclusive),
    supabase
      .from("expenses")
      .select("amount")
      .eq("user_id", user.id)
      .gte("expense_date", prevStart)
      .lt("expense_date", prevEnd),
    supabase
      .from("expenses")
      .select("expense_date, amount")
      .eq("user_id", user.id)
      .gte("expense_date", start)
      .lt("expense_date", endExclusive)
      .order("expense_date"),
  ]);

  const monthTotal = (monthRows ?? []).reduce((sum, r: any) => sum + Number(r.amount), 0);
  const prevTotal = (prevRows ?? []).reduce((sum, r: any) => sum + Number(r.amount), 0);
  const deltaPct = prevTotal > 0 ? ((monthTotal - prevTotal) / prevTotal) * 100 : null;

  const byCategoryMap = new Map<string, number>();
  for (const r of monthRows ?? []) {
    const name = (r as any).categories?.name ?? "Other";
    byCategoryMap.set(name, (byCategoryMap.get(name) ?? 0) + Number((r as any).amount));
  }
  const byCategory = Array.from(byCategoryMap.entries())
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);
  const topCategory = byCategory[0]?.category ?? "—";

  const trendMap = new Map<string, number>();
  for (const r of trendRows ?? []) {
    trendMap.set(r.expense_date, (trendMap.get(r.expense_date) ?? 0) + Number(r.amount));
  }
  const trend = Array.from(trendMap.entries())
    .map(([date, total]) => ({ date, total }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="min-h-screen">
      <Nav userLabel={userLabel} />
      <main className="mx-auto max-w-3xl space-y-6 px-4 py-6">
        <AddExpenseForm />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <StatCard label="Spent this month" value={monthTotal} accent="text-cyan" />
          <StatCard label="Spent last month" value={prevTotal} accent="text-violet" />
          <StatCard
            label="Change vs last month"
            value={deltaPct === null ? null : Math.round(deltaPct)}
            suffix={deltaPct === null ? "" : "%"}
            isPct
            accent="text-lime"
          />
          <StatCard label="Top category" text={topCategory} accent="text-magenta" />
        </div>

        <div className="rounded-panel border border-hairline bg-panel p-5">
          <h2 className="mb-3 font-mono text-xs uppercase tracking-[0.14em] text-muted">
            By category
          </h2>
          <CategoryPieChart data={byCategory} />
        </div>

        <div className="rounded-panel border border-hairline bg-panel p-5">
          <h2 className="mb-3 font-mono text-xs uppercase tracking-[0.14em] text-muted">
            Daily trend this month
          </h2>
          <MonthlyTrendChart data={trend} />
        </div>
      </main>
    </div>
  );
}

function StatCard({
  label,
  value,
  text,
  suffix,
  isPct,
  accent,
}: {
  label: string;
  value?: number | null;
  text?: string;
  suffix?: string;
  isPct?: boolean;
  accent: string;
}) {
  const display =
    text ??
    (value === null || value === undefined
      ? "—"
      : isPct
        ? `${value > 0 ? "+" : ""}${value}${suffix}`
        : formatCurrency(value));

  return (
    <div className="rounded-panel border border-hairline bg-panel p-4">
      <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-muted">{label}</p>
      <p className={`mt-1.5 font-display text-xl font-semibold ${accent}`}>{display}</p>
    </div>
  );
}
