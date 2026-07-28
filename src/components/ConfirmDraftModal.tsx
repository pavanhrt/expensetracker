"use client";

import { useEffect, useState } from "react";
import { Trash2, X } from "lucide-react";
import { formatCurrency } from "@/lib/theme";
import type { DraftLineItem, DraftParseResponse, InputMode } from "@/types";

export default function ConfirmDraftModal({
  draft,
  inputMode,
  onClose,
  onSaved,
}: {
  draft: DraftParseResponse;
  inputMode: InputMode;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [items, setItems] = useState<DraftLineItem[]>(draft.items);
  const [categories, setCategories] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => setCategories((d.categories ?? []).map((c: { name: string }) => c.name)));
  }, []);

  const update = (idx: number, patch: Partial<DraftLineItem>) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  };

  const remove = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const total = items.reduce((sum, it) => sum + (Number(it.amount) || 0), 0);

  const save = async () => {
    if (items.length === 0) {
      setError("Add at least one item, or cancel.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          input_mode: inputMode,
          language: draft.language,
          raw_input: draft.raw_input,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Save failed");
      }
      onSaved();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-20 flex items-end justify-center bg-black/60 sm:items-center">
      <div className="w-full max-w-lg rounded-t-panel border border-hairline bg-panel p-5 shadow-xl sm:rounded-panel">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-ink">Confirm expenses</h2>
          <button onClick={onClose} className="text-muted hover:text-ink">
            <X size={20} />
          </button>
        </div>

        {draft.transcript && (
          <p className="mb-3 rounded-lg bg-panel2 px-3 py-2 text-sm text-muted">
            Heard: “{draft.transcript}”
          </p>
        )}

        <div className="max-h-80 space-y-3 overflow-y-auto">
          {items.map((item, idx) => (
            <div key={idx} className="rounded-lg border border-hairline bg-panel2 p-3">
              <div className="flex items-start gap-2">
                <input
                  className="flex-1 rounded-md border border-hairline bg-panel px-2 py-1 text-sm text-ink"
                  value={item.item_name}
                  onChange={(e) => update(idx, { item_name: e.target.value })}
                />
                <button onClick={() => remove(idx)} className="text-muted hover:text-magenta">
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2">
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  className="rounded-md border border-hairline bg-panel px-2 py-1 text-sm text-ink"
                  value={item.amount}
                  onChange={(e) => update(idx, { amount: parseFloat(e.target.value) || 0 })}
                />
                <select
                  className="rounded-md border border-hairline bg-panel px-2 py-1 text-sm text-ink"
                  value={item.category}
                  onChange={(e) => update(idx, { category: e.target.value })}
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <input
                  type="date"
                  className="rounded-md border border-hairline bg-panel px-2 py-1 text-sm text-ink"
                  value={item.expense_date}
                  onChange={(e) => update(idx, { expense_date: e.target.value })}
                />
              </div>
            </div>
          ))}
          {items.length === 0 && (
            <p className="py-4 text-center text-sm text-muted">No items left to save.</p>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-hairline pt-3">
          <span className="text-sm text-muted">
            Total:{" "}
            <span className="font-mono font-medium text-lime">
              {formatCurrency(total)}
            </span>
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm text-muted hover:bg-panel2"
            >
              Cancel
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="rounded-lg bg-lime px-4 py-2 font-display text-sm font-semibold text-canvas hover:brightness-110 disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
        {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
      </div>
    </div>
  );
}
