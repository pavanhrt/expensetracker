import type { SttProvider } from "./index";
import {
  BHASHINI_ASR_ENDPOINT,
  BHASHINI_COMPUTE_ENDPOINT,
  BHASHINI_SAMPLE_RATE,
} from "@/lib/config";
import type { Language } from "@/types";

// Bhashini's ASR model ids for the languages we support (from their public catalog).
const LANGUAGE_CODES: Record<Language, string> = { en: "en", te: "te" };

/**
 * Bhashini (bhashini.gov.in) speech-to-text — free, government-run, strong
 * Indian-language support including Telugu. This is the default provider.
 *
 * Requires BHASHINI_API_KEY, BHASHINI_USER_ID, and
 * BHASHINI_INFERENCE_PIPELINE_ID in .env.local (get these from
 * https://bhashini.gov.in/ulca after registering as a developer).
 */
export class BhashiniSttProvider implements SttProvider {
  async transcribe(audio: Buffer, language: Language): Promise<string> {
    const apiKey = process.env.BHASHINI_API_KEY;
    const userId = process.env.BHASHINI_USER_ID;
    const pipelineId = process.env.BHASHINI_INFERENCE_PIPELINE_ID;

    if (!apiKey || !userId || !pipelineId) {
      throw new Error(
        "Bhashini is not configured. Set BHASHINI_API_KEY, BHASHINI_USER_ID and " +
          "BHASHINI_INFERENCE_PIPELINE_ID in .env.local, or set STT_PROVIDER=google to use " +
          "Google Cloud STT instead."
      );
    }

    const sourceLanguage = LANGUAGE_CODES[language] ?? "en";
    const base64Audio = audio.toString("base64");

    const res = await fetch(BHASHINI_COMPUTE_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        userID: userId,
        ulcaApiKey: apiKey,
      },
      body: JSON.stringify({
        pipelineTasks: [
          {
            taskType: "asr",
            config: {
              language: { sourceLanguage },
              serviceId: pipelineId,
              audioFormat: "webm",
              samplingRate: BHASHINI_SAMPLE_RATE,
            },
          },
        ],
        inputData: {
          audio: [{ audioContent: base64Audio }],
        },
      }),
    });

    if (!res.ok) {
      throw new Error(`Bhashini request failed: ${res.status} ${await res.text()}`);
    }

    const data = await res.json();
    const transcript =
      data?.pipelineResponse?.[0]?.output?.[0]?.source ??
      data?.pipelineResponse?.[0]?.output?.[0]?.target;

    if (!transcript) {
      throw new Error("Bhashini returned no transcript");
    }
    return transcript;
  }
}
