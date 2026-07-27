import { useEffect, useState, useCallback } from "react";
import { Sparkles, RefreshCw } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import api, { formatINR } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function Summary() {
  const [month, setMonth] = useState(currentMonth());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/summary/monthly", { params: { month } });
      setData(data);
    } finally { setLoading(false); }
  }, [month]);

  useEffect(() => { load(); }, [load]);

  const comparison = (data?.breakdown || []).map((b) => ({
    category: b.category, "This month": b.current, "Last month": b.previous,
  }));

  return (
    <div className="space-y-10" data-testid="summary-root">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <p className="text-[11px] tracking-[0.3em] uppercase text-[#72706A]">Monthly review</p>
          <h1 className="font-editorial text-5xl font-light leading-none mt-2">Summary.</h1>
        </div>
        <div className="flex items-end gap-3">
          <div>
            <Label className="text-[11px] tracking-[0.2em] uppercase text-[#72706A]">Month</Label>
            <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="mt-2 h-10 bg-white" data-testid="month-picker" />
          </div>
          <Button variant="outline" onClick={load} disabled={loading} data-testid="refresh-btn" className="h-10 border-[#E5E3DB]">
            <RefreshCw size={15} className={`mr-2 ${loading ? "animate-spin" : ""}`} strokeWidth={1.5} /> Refresh
          </Button>
        </div>
      </div>

      {/* AI Editorial ribbon */}
      <section className="border-y border-[#E5E3DB] py-10" data-testid="ai-summary">
        <div className="flex items-center gap-2 text-[11px] tracking-[0.3em] uppercase text-[#697D65] mb-4">
          <Sparkles size={13} strokeWidth={1.5} /> AI Analysis · Claude Sonnet 4.5
        </div>
        <p className="font-editorial text-2xl lg:text-3xl leading-[1.5] font-light text-[#1C1B1A] max-w-4xl" data-testid="ai-summary-text">
          {loading ? "Composing your summary…" : (data?.explanation || "No summary available.")}
        </p>
      </section>

      {/* Numbers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Stat label="This month" value={formatINR(data?.current_month_total)} testid="stat-current" />
        <Stat label="Last month" value={formatINR(data?.previous_month_total)} testid="stat-previous" />
        <Stat
          label="Change"
          value={data?.delta_pct == null ? "—" : `${data.delta_pct > 0 ? "+" : ""}${data.delta_pct.toFixed(1)}%`}
          testid="stat-delta"
          tone={data?.delta_pct != null && data.delta_pct > 0 ? "warn" : "ok"}
        />
      </div>

      {/* Comparison chart */}
      <div className="card-surface p-6">
        <div className="mb-6">
          <p className="text-[11px] tracking-[0.3em] uppercase text-[#72706A]">Category comparison</p>
          <h3 className="font-editorial text-2xl mt-1 font-light">This month vs last month</h3>
        </div>
        {comparison.length === 0 ? (
          <p className="text-[#72706A] py-10 text-center" data-testid="chart-empty">No data for this month.</p>
        ) : (
          <div className="h-80" data-testid="comparison-chart">
            <ResponsiveContainer>
              <BarChart data={comparison}>
                <CartesianGrid strokeDasharray="2 4" stroke="#E5E3DB" vertical={false} />
                <XAxis dataKey="category" tick={{ fontSize: 10, fill: "#72706A" }} interval={0} angle={-20} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 10, fill: "#72706A" }} />
                <Tooltip formatter={(v) => formatINR(v)} contentStyle={{ background: "#fff", border: "1px solid #E5E3DB", borderRadius: 6, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="This month" fill="#C26E60" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Last month" fill="#697D65" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, testid, tone }) {
  const cls = tone === "warn" ? "text-[#C26E60]" : tone === "ok" ? "text-[#697D65]" : "text-[#1C1B1A]";
  return (
    <div className="card-surface p-6" data-testid={testid}>
      <p className="text-[11px] tracking-[0.3em] uppercase text-[#72706A]">{label}</p>
      <p className={`font-editorial text-4xl font-light mt-3 ${cls}`}>{value}</p>
    </div>
  );
}
