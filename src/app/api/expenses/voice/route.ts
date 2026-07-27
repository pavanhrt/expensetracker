import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parseExpenseNote } from "@/lib/claude/client";
import { getSttProvider } from "@/lib/stt";
import { todayISO } from "@/lib/dates";
import type { DraftParseResponse, Language } from "@/types";

/**
 * POST /api/expenses/voice
 * multipart/form-data: audio (blob), language ("en"|"te")
 * STT -> Claude parse -> DRAFT line items only, same contract as /text.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const formData = await request.formData();
  const audioFile = formData.get("audio");
  const language: Language = formData.get("language") === "te" ? "te" : "en";

  if (!(audioFile instanceof Blob)) {
    return NextResponse.json({ error: "audio file is required" }, { status: 400 });
  }
  if (audioFile.size === 0) {
    return NextResponse.json({ error: "Empty audio" }, { status: 400 });
  }
  if (audioFile.size > 25 * 1024 * 1024) {
    return NextResponse.json({ error: "Audio too large (max 25MB)" }, { status: 400 });
  }

  const audioBuffer = Buffer.from(await audioFile.arrayBuffer());

  let transcript: string;
  try {
    const stt = await getSttProvider();
    transcript = (await stt.transcribe(audioBuffer, language)).trim();
  } catch (err: any) {
    console.error("[/api/expenses/voice] transcription failed:", err);
    return NextResponse.json({ error: err.message ?? "Transcription failed" }, { status: 502 });
  }

  if (!transcript) {
    return NextResponse.json({ error: "Couldn't hear anything. Try again." }, { status: 422 });
  }

  const { data: categories, error: catErr } = await supabase
    .from("categories")
    .select("name")
    .eq("user_id", user.id);
  if (catErr) return NextResponse.json({ error: catErr.message }, { status: 500 });

  try {
    const items = await parseExpenseNote({
      text: transcript,
      categories: (categories ?? []).map((c) => c.name),
      todayISO: todayISO(),
      language,
    });

    const response: DraftParseResponse = { transcript, language, items, raw_input: transcript };
    return NextResponse.json(response);
  } catch (err: any) {
    console.error("[/api/expenses/voice] parse failed:", err);
    return NextResponse.json({ error: err.message ?? "Parsing failed" }, { status: 502 });
  }
}
