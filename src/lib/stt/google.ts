import type { SttProvider } from "./index";
import type { Language } from "@/types";

const GOOGLE_LANGUAGE_CODES: Record<Language, string> = {
  en: "en-IN",
  te: "te-IN",
};

/**
 * Google Cloud Speech-to-Text fallback provider. Used when STT_PROVIDER=google,
 * or if Bhashini is unreachable. Requires GOOGLE_STT_API_KEY in .env.local
 * (an API key with the Speech-to-Text API enabled).
 */
export class GoogleSttProvider implements SttProvider {
  async transcribe(audio: Buffer, language: Language): Promise<string> {
    const apiKey = process.env.GOOGLE_STT_API_KEY;
    if (!apiKey) {
      throw new Error("GOOGLE_STT_API_KEY is not set in .env.local");
    }

    const res = await fetch(
      `https://speech.googleapis.com/v1/speech:recognize?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          config: {
            encoding: "WEBM_OPUS",
            sampleRateHertz: 48000,
            languageCode: GOOGLE_LANGUAGE_CODES[language] ?? "en-IN",
          },
          audio: { content: audio.toString("base64") },
        }),
      }
    );

    if (!res.ok) {
      throw new Error(`Google STT request failed: ${res.status} ${await res.text()}`);
    }

    const data = await res.json();
    const transcript = data?.results?.[0]?.alternatives?.[0]?.transcript;
    if (!transcript) {
      throw new Error("Google STT returned no transcript");
    }
    return transcript;
  }
}
