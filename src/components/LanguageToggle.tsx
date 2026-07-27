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
    <div className="inline-flex rounded-full border border-hairline bg-panel p-[3px] font-mono text-xs">
      {(["en", "te"] as const).map((lang) => (
        <button
          key={lang}
          type="button"
          onClick={() => onChange(lang)}
          className={`rounded-full px-3.5 py-[7px] transition ${
            value === lang
              ? "bg-gradient-to-br from-cyan to-violet font-semibold text-canvas"
              : "text-muted hover:text-ink"
          }`}
        >
          {lang === "en" ? "EN" : "TE"}
        </button>
      ))}
    </div>
  );
}
