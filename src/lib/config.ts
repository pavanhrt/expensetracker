/**
 * Centralized, environment-overridable configuration for every external API
 * endpoint and model/tuning parameter this app calls. Nothing here should be
 * hardcoded again in a route handler or lib file — import from here instead.
 * Every value has a working default, so none of these env vars are required;
 * set one only if you need to point at a different model/endpoint/tuning
 * value than the default.
 */

// ---------- Groq: LLM (expense parsing + Q&A tool-calling) ----------
export const GROQ_CHAT_ENDPOINT =
  process.env.GROQ_CHAT_ENDPOINT || "https://api.groq.com/openai/v1/chat/completions";
export const GROQ_LLM_MODEL = process.env.GROQ_LLM_MODEL || "llama-3.3-70b-versatile";
export const LLM_TEMPERATURE = Number(process.env.LLM_TEMPERATURE ?? 0);
export const LLM_MAX_TOOL_TURNS = Number(process.env.LLM_MAX_TOOL_TURNS ?? 4);

// ---------- Groq: speech-to-text (hosted Whisper) ----------
export const GROQ_TRANSCRIPTION_ENDPOINT =
  process.env.GROQ_TRANSCRIPTION_ENDPOINT || "https://api.groq.com/openai/v1/audio/transcriptions";
export const GROQ_WHISPER_MODEL = process.env.GROQ_WHISPER_MODEL || "whisper-large-v3-turbo";

// ---------- STT provider selection ----------
/** Fallback used by src/lib/stt/index.ts when STT_PROVIDER isn't set. */
export const DEFAULT_STT_PROVIDER = "groq";

// ---------- Google Cloud STT (fallback provider) ----------
export const GOOGLE_STT_ENDPOINT =
  process.env.GOOGLE_STT_ENDPOINT || "https://speech.googleapis.com/v1/speech:recognize";
export const GOOGLE_STT_ENCODING = process.env.GOOGLE_STT_ENCODING || "WEBM_OPUS";
export const GOOGLE_STT_SAMPLE_RATE = Number(process.env.GOOGLE_STT_SAMPLE_RATE ?? 48000);

// ---------- Bhashini STT (fallback provider) ----------
export const BHASHINI_ASR_ENDPOINT =
  process.env.BHASHINI_ASR_ENDPOINT ||
  "https://meity-auth.ulcacontrib.org/ulca/apis/v0/model/getModelsPipeline";
export const BHASHINI_COMPUTE_ENDPOINT =
  process.env.BHASHINI_COMPUTE_ENDPOINT ||
  "https://dhruva-api.bhashini.gov.in/services/inference/pipeline";
export const BHASHINI_SAMPLE_RATE = Number(process.env.BHASHINI_SAMPLE_RATE ?? 16000);
