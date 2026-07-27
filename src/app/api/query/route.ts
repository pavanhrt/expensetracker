import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { answerExpenseQuery } from "@/lib/claude/client";
import { normalizeExclusiveRange, todayISO } from "@/lib/dates";
import type { Language } from "@/types";

/**
 * POST /api/query
 * Body: { question: string, language: "en"|"te" }
 * The model answers using the query_expenses tool, which runs the
 * query_expense_summary Postgres function (parameterized, scoped to auth.uid()).
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await request.json();
  const question: string = (body.question ?? "").trim();
  const language: Language = body.language === "te" ? "te" : "en";

  if (!question) {
    return NextResponse.json({ error: "question is required" }, { status: 400 });
  }

  const { data: categoryRows, error: catErr } = await supabase
    .from("categories")
    .select("name")
    .eq("user_id", user.id);
  if (catErr) return NextResponse.json({ error: catErr.message }, { status: 500 });
  const categories = (categoryRows ?? []).map((c) => c.name);

  try {
    const answer = await answerExpenseQuery({
      question,
      language,
      todayISO: todayISO(),
      categories,
      runQuery: async ({ start_date, end_date, category }) => {
        // Safety net: if the model passes a category that doesn't exactly match
        // one of the user's real categories (e.g. "petrol" instead of
        // "Fuel/Transport"), drop the filter rather than silently returning an
        // empty result — the model can still find the right line in the full
        // per-category breakdown it gets back.
        const resolvedCategory = category
          ? categories.find((c) => c.toLowerCase() === category.toLowerCase()) ?? null
          : null;
        // Safety net: fix the "start_date === end_date" mistake (see normalizeExclusiveRange).
        const { start, end } = normalizeExclusiveRange(start_date, end_date);
        console.log("[/api/query] query_expenses", { start, end, category, resolvedCategory });

        const { data, error } = await supabase.rpc("query_expense_summary", {
          p_start_date: start,
          p_end_date: end,
          p_category: resolvedCategory,
        });
        if (error) throw new Error(error.message);

        const byCategory = (data ?? []).map((row: any) => ({
          category: row.category,
          total: Number(row.total),
          count: Number(row.count),
        }));
        const total = byCategory.reduce((sum: number, r: any) => sum + r.total, 0);
        const count = byCategory.reduce((sum: number, r: any) => sum + r.count, 0);

        return { total, count, by_category: byCategory };
      },
      runSearch: async ({ start_date, end_date, search }) => {
        const { start, end } = normalizeExclusiveRange(start_date, end_date);
        console.log("[/api/query] search_expenses", { start, end, search });

        const { data, error } = await supabase.rpc("search_expenses", {
          p_start_date: start,
          p_end_date: end,
          p_search: search,
        });
        if (error) throw new Error(error.message);

        const items = (data ?? []).map((row: any) => ({
          item_name: row.item_name,
          amount: Number(row.amount),
          expense_date: row.expense_date,
          category: row.category,
        }));

        return { items };
      },
    });

    return NextResponse.json({ answer });
  } catch (err: any) {
    console.error("[/api/query] failed:", err);
    return NextResponse.json({ error: err.message ?? "Query failed" }, { status: 502 });
  }
}
