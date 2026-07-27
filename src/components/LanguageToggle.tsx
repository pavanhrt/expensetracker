"use client";

import type { Language } from "@/types";

export default function LanguageToggle({
  value,
  onChange,
}: {
  value: Language;
  onChange: (lang: Language) => void;
}) {
  return (
    <div className="inline-flex rounded-full border border-black/10 bg-white p-0.5 text-sm">
      {(["en", "te"] as const).map((lang) => (
        <button
          key={lang}
          type="button"
          onClick={() => onChange(lang)}
          className={`rounded-full px-3 py-1 transition ${
            value === lang ? "bg-ink text-paper" : "text-muted hover:text-ink"
          }`}
        >
          {lang === "en" ? "English" : "తెలుగు"}
        </button>
      ))}
    </div>
  );
}
