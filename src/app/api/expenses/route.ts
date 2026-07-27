import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { monthRange, todayISO } from "@/lib/dates";
import type { DraftLineItem } from "@/types";

/**
 * GET /api/expenses?date=YYYY-MM-DD    -> day-wise ledger
 * GET /api/expenses?month=YYYY-MM      -> month's expenses + per-category totals
 * (falls back to the current month if neither is given)
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const month = searchParams.get("month") ?? undefined;

  let query = supabase
    .from("expenses")
    .select("id, item_name, amount, category_id, expense_date, raw_input, input_mode, language, created_at, categories(name)")
    .eq("user_id", user.id)
    .order("expense_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (date) {
    query = query.eq("expense_date", date);
  } else {
    const { start, endExclusive } = monthRange(month);
    query = query.gte("expense_date", start).lt("expense_date", endExclusive);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const expenses = (data ?? []).map((row: any) => ({
    id: row.id,
    item_name: row.item_name,
    amount: Number(row.amount),
    category_id: row.category_id,
    category_name: row.categories?.name ?? "Other",
    expense_date: row.expense_date,
    raw_input: row.raw_input,
    input_mode: row.input_mode,
    language: row.language,
    created_at: row.created_at,
  }));

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  const byCategory = Object.values(
    expenses.reduce((acc: Record<string, { category: string; total: number; count: number }>, e) => {
      const key = e.category_name || "Other";
      if (!acc[key]) acc[key] = { category: key, total: 0, count: 0 };
      acc[key].total += e.amount;
      acc[key].count += 1;
      return acc;
    }, {})
  ).sort((a, b) => b.total - a.total);

  return NextResponse.json({ expenses, total, by_category: byCategory });
}

/**
 * POST /api/expenses
 * Body: { items: DraftLineItem[], input_mode: "voice"|"text", language: "en"|"te", raw_input: string }
 *
 * This is the ONLY endpoint that writes expense rows. /text and /voice only
 * return drafts — the user must confirm here before anything is persisted.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await request.json();
  const items: DraftLineItem[] = body.items;
  const inputMode: "voice" | "text" = body.input_mode ?? "text";
  const language: "en" | "te" = body.language ?? "en";
  const rawInput: string = body.raw_input ?? "";

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "items must be a non-empty array" }, { status: 400 });
  }
  for (const item of items) {
    if (!item.item_name || typeof item.amount !== "number" || item.amount <= 0) {
      return NextResponse.json({ error: "Each item needs item_name and a positive amount" }, { status: 400 });
    }
  }

  const { data: categories, error: catErr } = await supabase
    .from("categories")
    .select("id, name")
    .eq("user_id", user.id);
  if (catErr) return NextResponse.json({ error: catErr.message }, { status: 500 });

  const categoryByName = new Map((categories ?? []).map((c) => [c.name, c.id]));
  const otherId = categoryByName.get("Other") ?? null;

  const rows = items.map((item) => ({
    user_id: user.id,
    item_name: item.item_name,
    amount: item.amount,
    category_id: categoryByName.get(item.category) ?? otherId,
    expense_date: item.expense_date || todayISO(),
    raw_input: rawInput,
    input_mode: inputMode,
    language,
  }));

  const { data: inserted, error } = await supabase.from("expenses").insert(rows).select("id");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ inserted: inserted?.length ?? 0 }, { status: 201 });
}
