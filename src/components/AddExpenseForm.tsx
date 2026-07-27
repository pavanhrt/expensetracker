"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/Toast";
import { useLanguage } from "@/context/LanguageContext";
import VoiceRecorder from "./VoiceRecorder";
import ConfirmDraftModal from "./ConfirmDraftModal";
import type { DraftParseResponse, InputMode } from "@/types";

export default function AddExpenseForm() {
  const router = useRouter();
  const { language } = useLanguage();
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
    <div className="rounded-panel border border-hairline bg-panel p-8 text-center">
      <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted">
        Log an expense
      </p>
      <h2 className="mt-2 font-display text-2xl font-semibold text-ink">
        Speak it, in {language === "en" ? "English or Telugu" : "తెలుగు లేదా English"}
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted">
        “Today I spent 4000 on idols, 100 on oil, and 400 on a recharge” — PRISM splits it into
        line items automatically.
      </p>

      <div className="mt-7 flex justify-center">
        <VoiceRecorder
          language={language}
          size="lg"
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

      <div className="mx-auto mt-7 flex max-w-lg items-center gap-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && parseText()}
          placeholder={
            language === "en"
              ? "...or type: idols 4000, oil 100, recharge 400"
              : 'ఉదా. "నిన్న పెట్రోల్ కి 500 పెట్టాను"'
          }
          className="flex-1 rounded-lg border border-hairline bg-panel2 px-3.5 py-2.5 text-sm text-ink outline-none placeholder:text-muted focus:border-cyan"
        />
        <button
          onClick={parseText}
          disabled={parsing || !text.trim()}
          className="rounded-lg bg-lime px-5 py-2.5 font-display text-sm font-semibold text-canvas transition hover:brightness-110 disabled:opacity-50"
        >
          {parsing ? "…" : "Parse"}
        </button>
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
