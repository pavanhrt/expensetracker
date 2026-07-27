import { useRef, useState } from "react";
import { Mic, Square, Loader2 } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

export default function VoiceRecorder({ onParsed, size = "lg" }) {
  const [recording, setRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const mediaRef = useRef(null);
  const chunksRef = useRef([]);

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: "audio/webm" });
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        await upload(blob);
      };
      mr.start();
      mediaRef.current = mr;
      setRecording(true);
    } catch (err) {
      toast.error("Microphone permission denied");
    }
  };

  const stop = () => {
    if (mediaRef.current && mediaRef.current.state !== "inactive") {
      mediaRef.current.stop();
    }
    setRecording(false);
  };

  const upload = async (blob) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("audio", blob, "voice.webm");
      const { data } = await api.post("/voice/transcribe", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (!data.transcript) {
        toast.warning("Couldn't hear anything. Try again.");
      } else {
        toast.success("Heard: " + data.transcript.slice(0, 80));
        onParsed?.(data);
      }
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Transcription failed");
    } finally { setUploading(false); }
  };

  const dim = size === "sm" ? "h-11 w-11" : "h-16 w-16";
  const icon = size === "sm" ? 18 : 24;

  return (
    <button
      type="button"
      data-testid="voice-record-button"
      onClick={recording ? stop : start}
      disabled={uploading}
      aria-label={recording ? "Stop recording" : "Start voice recording"}
      className={`${dim} rounded-full flex items-center justify-center bg-[#2C3627] text-[#F7F6F3] hover:bg-[#1F281B] disabled:opacity-60 transition-transform ${recording ? "voice-recording" : ""}`}
      style={{ transitionProperty: "transform, background-color" }}
    >
      {uploading ? <Loader2 size={icon} className="animate-spin" strokeWidth={1.5} />
        : recording ? <Square size={icon} strokeWidth={1.5} />
        : <Mic size={icon} strokeWidth={1.5} />}
    </button>
  );
}
