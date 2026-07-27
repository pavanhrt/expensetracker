import type { Language } from "@/types";

export interface SttProvider {
  /** Transcribe an audio buffer to text in the given language. */
  transcribe(audio: Buffer, language: Language): Promise<string>;
}

/**
 * Single point of contact for speech-to-text. Never import bhashini.ts or
 * google.ts directly from route handlers/UI — swap providers by changing
 * STT_PROVIDER in .env and, if needed, this file, nowhere else.
 */
export async function getSttProvider(): Promise<SttProvider> {
  const provider = (process.env.STT_PROVIDER || "groq").toLowerCase();
  switch (provider) {
    case "google": {
      const { GoogleSttProvider } = await import("./google");
      return new GoogleSttProvider();
    }
    case "bhashini": {
      const { BhashiniSttProvider } = await import("./bhashini");
      return new BhashiniSttProvider();
    }
    case "groq":
    default: {
      const { GroqSttProvider } = await import("./groq");
      return new GroqSttProvider();
    }
  }
}
