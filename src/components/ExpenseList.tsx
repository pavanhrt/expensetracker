"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Check, X } from "lucide-react";
import { toast } from "@/components/Toast";
import { categoryTagClass } from "@/lib/categoryColors";
import type { Expense } from "@/types";

export default function ExpenseList({
  expenses,
  categories,
}: {
  expenses: Expense[];
  categories: string[];
}) {
  if (expenses.length === 0) {
    return <p className="py-8 text-center text-sm text-muted">No expenses here yet.</p>;
  }

  return (
    <div className="divide-y divide-hairline">
      {expenses.map((expense) => (
        <ExpenseRow key={expense.id} expense={expense} categories={categories} />
      ))}
    </div>
  );
}

function ExpenseRow({ expense, categories }: { expense: Expense; categories: string[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [itemName, setItemName] = useState(expense.item_name);
  const [amount, setAmount] = useState(expense.amount);
  const [category, setCategory] = useState(expense.category_name ?? "Other");
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    try {
      const res = await fetch(`/api/expenses/${expense.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item_name: itemName, amount, category }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Update failed");
      setEditing(false);
      router.refresh();
    } catch (err: any) {
      toast(err.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!confirm(`Delete "${expense.item_name}"?`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/expenses/${expense.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error || "Delete failed");
      router.refresh();
    } catch (err: any) {
      toast(err.message);
      setBusy(false);
    }
  };

  if (editing) {
    return (
      <div className="flex flex-wrap items-center gap-2 bg-panel2 px-4 py-3">
        <input
          value={itemName}
          onChange={(e) => setItemName(e.target.value)}
          className="min-w-[8rem] flex-1 rounded-md border border-hairline bg-panel px-2 py-1 text-sm text-ink"
        />
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
          className="w-24 rounded-md border border-hairline bg-panel px-2 py-1 text-sm text-ink"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-md border border-hairline bg-panel px-2 py-1 text-sm text-ink"
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <button onClick={save} disabled={busy} className="text-cyan hover:brightness-125">
          <Check size={18} />
        </button>
        <button onClick={() => setEditing(false)} className="text-muted hover:text-ink">
          <X size={18} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-ink">{expense.item_name}</p>
        <div className="mt-1 flex items-center gap-2">
          <span className={`rounded-full px-2 py-0.5 font-mono text-[10.5px] ${categoryTagClass(expense.category_name)}`}>
            {expense.category_name}
          </span>
          <span className="font-mono text-[11px] text-muted">{expense.expense_date}</span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="font-mono font-medium text-ink">
          ₹{expense.amount.toLocaleString("en-IN")}
        </span>
        <button onClick={() => setEditing(true)} className="text-muted hover:text-ink">
          <Pencil size={16} />
        </button>
        <button onClick={remove} disabled={busy} className="text-muted hover:text-magenta">
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}
