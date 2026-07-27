"use client";

import { useState } from "react";
import { Loader2, Send } from "lucide-react";
import LanguageToggle from "@/components/LanguageToggle";
import VoiceRecorder from "@/components/VoiceRecorder";
import type { Language } from "@/types";

interface Turn {
  question: string;
  answer: string;
}

const SUGGESTIONS_EN = ["How much did I spend this month?", "How much on food this week?", "Compare this month to last month"];
const SUGGESTIONS_TE = ["ఈ నెల ఎంత ఖర్చు చేశాను?", "ఈ వారం ఆహారం మీద ఎంత ఖర్చు?", "గత నెలతో పోల్చండి"];

export default function SummaryClient() {
  const [language, setLanguage] = useState<Language>("en");
  const [question, setQuestion] = useState("");
  const [asking, setAsking] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([]);

  const ask = async (q: string) => {
    if (!q.trim()) return;
    setAsking(true);
    try {
      const res = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, language }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Query failed");
      setTurns((prev) => [...prev, { question: q, answer: data.answer }]);
      setQuestion("");
    } catch (err: any) {
      setTurns((prev) => [...prev, { question: q, answer: `⚠️ ${err.message}` }]);
    } finally {
      setAsking(false);
    }
  };

  const suggestions = language === "en" ? SUGGESTIONS_EN : SUGGESTIONS_TE;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-ink">Ask about your spending</h1>
        <LanguageToggle value={language} onChange={setLanguage} />
      </div>

      <div className="min-h-[12rem] space-y-3 rounded-xl border border-black/10 bg-white p-4">
        {turns.length === 0 && (
          <div className="space-y-2">
            <p className="text-sm text-muted">Try asking:</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => ask(s)}
                  className="rounded-full border border-black/10 px-3 py-1 text-xs text-muted hover:border-ink hover:text-ink"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {turns.map((t, i) => (
          <div key={i} className="space-y-1">
            <p className="text-sm font-medium text-ink">{t.question}</p>
            <p className="text-sm text-muted">{t.answer}</p>
          </div>
        ))}
        {asking && <Loader2 className="animate-spin text-muted" size={18} />}
      </div>

      <div className="flex items-center gap-2">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && ask(question)}
          placeholder={language === "en" ? "Ask a question…" : "ప్రశ్న అడగండి…"}
          className="flex-1 rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-ink"
        />
        <button
          onClick={() => ask(question)}
          disabled={asking || !question.trim()}
          className="flex h-10 w-10 items-center justify-center rounded-lg bg-ink text-paper hover:bg-inkDark disabled:opacity-60"
        >
          <Send size={16} />
        </button>
        <VoiceRecorder
          language={language}
          size="sm"
          endpoint="/api/transcribe"
          onParsed={(result) => {
            if ("transcript" in result && result.transcript) ask(result.transcript);
          }}
        />
      </div>
    </div>
  );
}
