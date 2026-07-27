import { useEffect, useState, useCallback } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import api, { formatINR } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AddExpenseDialog from "@/components/AddExpenseDialog";

export default function Expenses() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cat, setCat] = useState("All");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [dialog, setDialog] = useState(false);

  const load = useCallback(async () => {
    const params = {};
    if (cat && cat !== "All") params.category = cat;
    if (start) params.start = start;
    if (end) params.end = end;
    const { data } = await api.get("/expenses", { params });
    setItems(data);
  }, [cat, start, end]);

  useEffect(() => { api.get("/categories").then((r) => setCategories(r.data.categories)); }, []);
  useEffect(() => { load(); }, [load]);

  const total = items.reduce((s, x) => s + x.amount, 0);

  const del = async (id) => {
    if (!window.confirm("Delete this expense?")) return;
    try {
      await api.delete(`/expenses/${id}`);
      toast.success("Deleted");
      load();
    } catch { toast.error("Failed to delete"); }
  };

  return (
    <div className="space-y-8" data-testid="expenses-root">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <p className="text-[11px] tracking-[0.3em] uppercase text-[#72706A]">Journal</p>
          <h1 className="font-editorial text-5xl font-light leading-none mt-2">Expenses.</h1>
        </div>
        <Button
          onClick={() => setDialog(true)}
          data-testid="expenses-add-btn"
          className="h-11 px-6 rounded-full bg-[#2C3627] hover:bg-[#1F281B] text-[#F7F6F3]"
        >
          <Plus size={16} strokeWidth={1.5} className="mr-2" /> New entry
        </Button>
      </div>

      <div className="card-surface p-6">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
          <div>
            <Label className="text-[11px] tracking-[0.2em] uppercase text-[#72706A]">Category</Label>
            <Select value={cat} onValueChange={setCat}>
              <SelectTrigger className="mt-2 h-10 bg-white" data-testid="filter-category"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All</SelectItem>
                {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-[11px] tracking-[0.2em] uppercase text-[#72706A]">From</Label>
            <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="mt-2 h-10 bg-white" data-testid="filter-start" />
          </div>
          <div>
            <Label className="text-[11px] tracking-[0.2em] uppercase text-[#72706A]">To</Label>
            <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="mt-2 h-10 bg-white" data-testid="filter-end" />
          </div>
          <div className="text-right">
            <p className="text-[11px] tracking-[0.2em] uppercase text-[#72706A]">Filtered total</p>
            <p className="font-editorial text-3xl font-light mt-1" data-testid="filter-total">{formatINR(total)}</p>
          </div>
        </div>
      </div>

      <div className="card-surface overflow-hidden">
        {items.length === 0 ? (
          <p className="text-[#72706A] py-16 text-center" data-testid="expenses-empty">No expenses match these filters.</p>
        ) : (
          <ul className="divide-y divide-[#E5E3DB]" data-testid="expenses-list">
            {items.map((e) => (
              <li key={e.id} className="px-6 py-4 flex items-center gap-4 hover:bg-[#F7F6F3]" data-testid={`expense-row-${e.id}`}>
                <div className="w-24 shrink-0 text-xs text-[#72706A]">{e.date}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[#1C1B1A]">{e.category}</p>
                  <p className="text-xs text-[#72706A] truncate">{e.note || "—"}</p>
                </div>
                <div className="font-mono-num text-lg text-[#1C1B1A] w-28 text-right">{formatINR(e.amount)}</div>
                <button
                  onClick={() => del(e.id)}
                  aria-label="Delete"
                  data-testid={`delete-${e.id}`}
                  className="text-[#72706A] hover:text-[#C26E60] p-2"
                >
                  <Trash2 size={16} strokeWidth={1.5} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <AddExpenseDialog
        open={dialog}
        onOpenChange={(v) => { setDialog(v); if (!v) load(); }}
        categories={categories}
        onCreated={load}
      />
    </div>
  );
}
