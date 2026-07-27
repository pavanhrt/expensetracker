import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import VoiceRecorder from "@/components/VoiceRecorder";

export default function AddExpenseDialog({ open, onOpenChange, categories, onCreated, initial }) {
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(new Date());
  const [transcript, setTranscript] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setAmount(initial?.amount ? String(initial.amount) : "");
      setCategory(initial?.category && categories?.includes(initial.category) ? initial.category : (categories?.[0] || "Food"));
      setNote(initial?.note || "");
      setTranscript(initial?.transcript || "");
      setDate(initial?.date ? new Date(initial.date) : new Date());
    }
  }, [open, initial, categories]);

  const handleParsed = (data) => {
    setTranscript(data.transcript || "");
    if (data.amount) setAmount(String(data.amount));
    if (data.category && categories?.includes(data.category)) setCategory(data.category);
    if (data.note) setNote(data.note);
  };

  const submit = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { toast.error("Enter a valid amount"); return; }
    setSaving(true);
    try {
      const { data } = await api.post("/expenses", {
        amount: amt,
        category,
        note,
        date: format(date, "yyyy-MM-dd"),
      });
      toast.success("Expense saved");
      onCreated?.(data);
      onOpenChange(false);
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to save");
    } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white border-[#E5E3DB]" data-testid="add-expense-dialog">
        <DialogHeader>
          <DialogTitle className="font-editorial text-3xl font-light">Log an expense</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-3 py-2">
          <VoiceRecorder onParsed={handleParsed} />
          <p className="text-xs tracking-[0.2em] uppercase text-[#72706A]">Tap mic · say it naturally</p>
          {transcript && (
            <p className="text-sm text-[#1C1B1A] italic bg-[#F7F6F3] rounded px-3 py-2 w-full text-center" data-testid="voice-transcript">
              "{transcript}"
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 sm:col-span-1">
            <Label className="text-[11px] tracking-[0.2em] uppercase text-[#72706A]">Amount (₹)</Label>
            <Input
              data-testid="expense-amount"
              type="number"
              inputMode="decimal"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-2 h-11 font-mono-num bg-white"
              placeholder="0"
            />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <Label className="text-[11px] tracking-[0.2em] uppercase text-[#72706A]">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger data-testid="expense-category" className="mt-2 h-11 bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(categories || []).map((c) => (
                  <SelectItem key={c} value={c} data-testid={`category-option-${c}`}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2">
            <Label className="text-[11px] tracking-[0.2em] uppercase text-[#72706A]">Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" data-testid="expense-date" className="mt-2 h-11 w-full justify-start font-normal bg-white">
                  <CalendarIcon size={15} strokeWidth={1.5} className="mr-2" />
                  {format(date, "EEE, dd MMM yyyy")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} initialFocus />
              </PopoverContent>
            </Popover>
          </div>
          <div className="col-span-2">
            <Label className="text-[11px] tracking-[0.2em] uppercase text-[#72706A]">Note</Label>
            <Textarea
              data-testid="expense-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className="mt-2 bg-white"
              placeholder="Optional context"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} data-testid="expense-cancel">Cancel</Button>
          <Button
            onClick={submit}
            disabled={saving}
            data-testid="expense-save"
            className="bg-[#2C3627] hover:bg-[#1F281B] text-[#F7F6F3] rounded-full px-6"
          >
            {saving ? "Saving…" : "Save expense"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
