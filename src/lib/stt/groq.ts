import type { SttProvider } from "./index";
import type { Language } from "@/types";

const GROQ_TRANSCRIPTION_ENDPOINT = "https://api.groq.com/openai/v1/audio/transcriptions";

// Whisper's ISO-639-1 language codes happen to match our Language type directly.
const WHISPER_LANGUAGE_CODES: Record<Language, string> = { en: "en", te: "te" };

/**
 * Groq-hosted Whisper large-v3 — free tier: 2,000 requests/day, no credit
 * card required. Good default for personal projects since neither Google's
 * billing account nor Bhashini's org registration is needed.
 *
 * Get a key at https://console.groq.com/keys (just an email signup) and set
 * GROQ_API_KEY in .env.local.
 */
export class GroqSttProvider implements SttProvider {
  async transcribe(audio: Buffer, language: Language): Promise<string> {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error(
        "GROQ_API_KEY is not set. Get a free key at https://console.groq.com/keys and add it " +
          "to .env.local, or set STT_PROVIDER to google/bhashini to use a different provider."
      );
    }

    const form = new FormData();
    form.append("file", new Blob([Uint8Array.from(audio)], { type: "audio/webm" }), "audio.webm");
    form.append("model", "whisper-large-v3-turbo");
    form.append("language", WHISPER_LANGUAGE_CODES[language] ?? "en");
    form.append("response_format", "json");

    const res = await fetch(GROQ_TRANSCRIPTION_ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
    });

    if (!res.ok) {
      throw new Error(`Groq transcription failed: ${res.status} ${await res.text()}`);
    }

    const data = await res.json();
    const transcript = (data?.text ?? "").trim();
    if (!transcript) {
      throw new Error("Groq returned no transcript");
    }
    return transcript;
  }
}
