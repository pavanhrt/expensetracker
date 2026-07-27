import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { currentMonth, monthRange } from "@/lib/dates";

/** GET /api/expenses/export?month=YYYY-MM — CSV export, defaults to the current month. */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month") ?? currentMonth();
  const { start, endExclusive } = monthRange(month);

  const { data, error } = await supabase
    .from("expenses")
    .select("expense_date, item_name, amount, categories(name), input_mode, language, raw_input")
    .eq("user_id", user.id)
    .gte("expense_date", start)
    .lt("expense_date", endExclusive)
    .order("expense_date");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const header = "Date,Item,Amount,Category,Input Mode,Language,Original Note";
  const rows = (data ?? []).map((r: any) =>
    [
      r.expense_date,
      csvEscape(r.item_name),
      r.amount,
      csvEscape(r.categories?.name ?? "Other"),
      r.input_mode,
      r.language,
      csvEscape(r.raw_input ?? ""),
    ].join(",")
  );
  const csv = [header, ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="varta-expenses-${month}.csv"`,
    },
  });
}

function csvEscape(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
