import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parseExpenseNote } from "@/lib/claude/client";
import { todayISO } from "@/lib/dates";
import type { DraftParseResponse, Language } from "@/types";

/**
 * POST /api/expenses/text
 * Body: { text: string, language: "en"|"te" }
 * Returns DRAFT line items only — nothing is saved. The client must call
 * POST /api/expenses with the (possibly edited) items to persist them.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await request.json();
  const text: string = (body.text ?? "").trim();
  const language: Language = body.language === "te" ? "te" : "en";

  if (!text) {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }

  const { data: categories, error: catErr } = await supabase
    .from("categories")
    .select("name")
    .eq("user_id", user.id);
  if (catErr) return NextResponse.json({ error: catErr.message }, { status: 500 });

  try {
    const items = await parseExpenseNote({
      text,
      categories: (categories ?? []).map((c) => c.name),
      todayISO: todayISO(),
      language,
    });

    const response: DraftParseResponse = { language, items, raw_input: text };
    return NextResponse.json(response);
  } catch (err: any) {
    console.error("[/api/expenses/text] parse failed:", err);
    return NextResponse.json({ error: err.message ?? "Parsing failed" }, { status: 502 });
  }
}
