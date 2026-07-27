import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { currentMonth, monthRange, previousMonth } from "@/lib/dates";
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

  const trendMap = new Map<string, number>();
  for (const r of trendRows ?? []) {
    trendMap.set(r.expense_date, (trendMap.get(r.expense_date) ?? 0) + Number(r.amount));
  }
  const trend = Array.from(trendMap.entries())
    .map(([date, total]) => ({ date, total }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="min-h-screen">
      <Nav />
      <main className="mx-auto max-w-3xl space-y-6 px-4 py-6">
        <AddExpenseForm />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="This month" value={monthTotal} />
          <StatCard label="Last month" value={prevTotal} />
          <StatCard
            label="Change"
            value={deltaPct === null ? null : Math.round(deltaPct)}
            suffix={deltaPct === null ? "" : "%"}
            isPct
          />
        </div>

        <div className="rounded-xl border border-black/10 bg-white p-4">
          <h2 className="mb-2 text-sm font-medium text-ink">By category</h2>
          <CategoryPieChart data={byCategory} />
        </div>

        <div className="rounded-xl border border-black/10 bg-white p-4">
          <h2 className="mb-2 text-sm font-medium text-ink">Daily trend this month</h2>
          <MonthlyTrendChart data={trend} />
        </div>
      </main>
    </div>
  );
}

function StatCard({
  label,
  value,
  suffix,
  isPct,
}: {
  label: string;
  value: number | null;
  suffix?: string;
  isPct?: boolean;
}) {
  return (
    <div className="rounded-xl border border-black/10 bg-white p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 text-xl font-semibold text-ink">
        {value === null ? "—" : isPct ? `${value > 0 ? "+" : ""}${value}${suffix}` : `₹${value.toLocaleString("en-IN")}`}
      </p>
    </div>
  );
}
