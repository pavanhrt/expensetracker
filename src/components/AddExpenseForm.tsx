"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/Toast";
import LanguageToggle from "./LanguageToggle";
import VoiceRecorder from "./VoiceRecorder";
import ConfirmDraftModal from "./ConfirmDraftModal";
import type { DraftParseResponse, InputMode, Language } from "@/types";

export default function AddExpenseForm() {
  const router = useRouter();
  const [language, setLanguage] = useState<Language>("en");
  const [text, setText] = useState("");
  const [parsing, setParsing] = useState(false);
  const [draft, setDraft] = useState<DraftParseResponse | null>(null);
  const [inputMode, setInputMode] = useState<InputMode>("text");

  const parseText = async () => {
    if (!text.trim()) return;
    setParsing(true);
    try {
      const res = await fetch("/api/expenses/text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, language }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Parsing failed");
      if (!data.items?.length) {
        toast("Couldn't find any expenses in that. Try rephrasing.");
        return;
      }
      setInputMode("text");
      setDraft(data);
    } catch (err: any) {
      toast(err.message || "Something went wrong");
    } finally {
      setParsing(false);
    }
  };

  return (
    <div className="rounded-xl border border-black/10 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-medium text-ink">Log an expense</p>
        <LanguageToggle value={language} onChange={setLanguage} />
      </div>

      <div className="flex items-center gap-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && parseText()}
          placeholder={
            language === "en"
              ? 'e.g. "idols 4000, oil 100, recharge 400"'
              : 'ఉదా. "నిన్న పెట్రోల్ కి 500 పెట్టాను"'
          }
          className="flex-1 rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-ink"
        />
        <button
          onClick={parseText}
          disabled={parsing || !text.trim()}
          className="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-paper hover:bg-inkDark disabled:opacity-60"
        >
          {parsing ? "…" : "Add"}
        </button>
        <VoiceRecorder
          language={language}
          size="sm"
          onParsed={(result) => {
            if (!("items" in result) || !result.items.length) {
              toast("Couldn't find any expenses in that. Try again.");
              return;
            }
            setInputMode("voice");
            setDraft(result);
          }}
          onError={(msg) => toast(msg)}
        />
      </div>

      {draft && (
        <ConfirmDraftModal
          draft={draft}
          inputMode={inputMode}
          onClose={() => setDraft(null)}
          onSaved={() => {
            setDraft(null);
            setText("");
            toast("Saved");
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
