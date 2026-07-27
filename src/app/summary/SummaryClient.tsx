"use client";

import { useState } from "react";
import { Loader2, Send } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import VoiceRecorder from "@/components/VoiceRecorder";

interface Turn {
  question: string;
  answer: string;
}

const SUGGESTIONS_EN = ["How much did I spend this month?", "How much on food this week?", "Compare this month to last month"];
const SUGGESTIONS_TE = ["ఈ నెల ఎంత ఖర్చు చేశాను?", "ఈ వారం ఆహారం మీద ఎంత ఖర్చు?", "గత నెలతో పోల్చండి"];

export default function SummaryClient() {
  const { language } = useLanguage();
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
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted">Ask</p>
        <h1 className="font-display text-xl font-semibold text-ink">Ask about your spending</h1>
      </div>

      <div className="min-h-[12rem] space-y-4 rounded-panel border border-hairline bg-panel p-5">
        {turns.length === 0 && (
          <div className="space-y-2">
            <p className="text-sm text-muted">Try asking:</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => ask(s)}
                  className="rounded-full border border-hairline px-3 py-1 font-mono text-xs text-muted transition hover:border-cyan hover:text-ink"
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
        {asking && <Loader2 className="animate-spin text-cyan" size={18} />}
      </div>

      <div className="flex items-center gap-2">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && ask(question)}
          placeholder={language === "en" ? "Ask a question…" : "ప్రశ్న అడగండి…"}
          className="flex-1 rounded-lg border border-hairline bg-panel2 px-3 py-2 text-sm text-ink outline-none placeholder:text-muted focus:border-cyan"
        />
        <button
          onClick={() => ask(question)}
          disabled={asking || !question.trim()}
          className="flex h-11 w-11 items-center justify-center rounded-lg bg-lime text-canvas transition hover:brightness-110 disabled:opacity-60"
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
