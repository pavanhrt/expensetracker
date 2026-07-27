"use client";

import { useRef, useState } from "react";
import { Mic, Square, Loader2 } from "lucide-react";
import type { DraftParseResponse, Language } from "@/types";

export default function VoiceRecorder({
  language,
  onParsed,
  onError,
  size = "lg",
  endpoint = "/api/expenses/voice",
}: {
  language: Language;
  onParsed: (result: DraftParseResponse | { transcript: string }) => void;
  onError?: (message: string) => void;
  size?: "sm" | "lg";
  /** Which route to POST the recording to — defaults to the expense-parsing draft endpoint. */
  endpoint?: string;
}) {
  const [recording, setRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: "audio/webm" });
      chunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        await upload(blob);
      };
      mr.start();
      mediaRef.current = mr;
      setRecording(true);
    } catch {
      onError?.("Microphone permission denied");
    }
  };

  const stop = () => {
    if (mediaRef.current && mediaRef.current.state !== "inactive") {
      mediaRef.current.stop();
    }
    setRecording(false);
  };

  const upload = async (blob: Blob) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("audio", blob, "voice.webm");
      fd.append("language", language);
      const res = await fetch(endpoint, { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        onError?.(data.error || "Transcription failed");
        return;
      }
      onParsed(data);
    } catch {
      onError?.("Transcription failed");
    } finally {
      setUploading(false);
    }
  };

  const dim = size === "sm" ? "h-11 w-11" : "h-16 w-16";
  const icon = size === "sm" ? 18 : 24;

  return (
    <button
      type="button"
      onClick={recording ? stop : start}
      disabled={uploading}
      aria-label={recording ? "Stop recording" : "Start voice recording"}
      className={`${dim} rounded-full flex items-center justify-center bg-ink text-paper hover:bg-inkDark disabled:opacity-60 transition-transform ${
        recording ? "voice-recording" : ""
      }`}
    >
      {uploading ? (
        <Loader2 size={icon} className="animate-spin" strokeWidth={1.5} />
      ) : recording ? (
        <Square size={icon} strokeWidth={1.5} />
      ) : (
        <Mic size={icon} strokeWidth={1.5} />
      )}
    </button>
  );
}
