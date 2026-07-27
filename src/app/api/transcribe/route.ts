import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSttProvider } from "@/lib/stt";
import type { Language } from "@/types";

/**
 * POST /api/transcribe — STT only, no expense parsing. Used by the
 * "ask a question" voice input on the summary page.
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

  if (!(audioFile instanceof Blob) || audioFile.size === 0) {
    return NextResponse.json({ error: "audio file is required" }, { status: 400 });
  }

  const audioBuffer = Buffer.from(await audioFile.arrayBuffer());

  try {
    const stt = await getSttProvider();
    const transcript = (await stt.transcribe(audioBuffer, language)).trim();
    if (!transcript) {
      return NextResponse.json({ error: "Couldn't hear anything. Try again." }, { status: 422 });
    }
    return NextResponse.json({ transcript });
  } catch (err: any) {
    console.error("[/api/transcribe] failed:", err);
    return NextResponse.json({ error: err.message ?? "Transcription failed" }, { status: 502 });
  }
}
