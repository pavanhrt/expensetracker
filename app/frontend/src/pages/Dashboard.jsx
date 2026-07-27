import { useEffect, useState, useCallback } from "react";
import { Plus, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from "recharts";
import api, { formatINR } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import AddExpenseDialog from "@/components/AddExpenseDialog";
import VoiceRecorder from "@/components/VoiceRecorder";

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [categories, setCategories] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [prefill, setPrefill] = useState(null);

  const load = useCallback(async () => {
    const [s, r, c] = await Promise.all([
      api.get("/stats/overview"),
      api.get("/expenses", { params: { limit: 8 } }),
      api.get("/categories"),
    ]);
    setStats(s.data); setRecent(r.data); setCategories(c.data.categories);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openManual = () => { setPrefill(null); setDialogOpen(true); };
  const openFromVoice = (data) => { setPrefill(data); setDialogOpen(true); };

  const delta = stats?.delta_pct;

  return (
    <div className="space-y-10" data-testid="dashboard-root">
      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-6">
        <div>
          <p className="text-[11px] tracking-[0.3em] uppercase text-[#72706A]">Good to see you</p>
          <h1 className="font-editorial text-5xl lg:text-6xl font-light leading-none mt-2" data-testid="greeting-name">{user?.name?.split(" ")[0]}.</h1>
        </div>
        <div className="flex items-center gap-4">
          <VoiceRecorder size="sm" onParsed={openFromVoice} />
          <Button
            onClick={openManual}
            data-testid="add-expense-btn"
            className="h-11 px-6 rounded-full bg-[#2C3627] hover:bg-[#1F281B] text-[#F7F6F3]"
          >
            <Plus size={16} strokeWidth={1.5} className="mr-2" /> Add expense
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KPI
          label="Today"
          value={formatINR(stats?.today)}
          testid="kpi-today"
          hint="All entries dated today"
          Icon={Wallet}
        />
        <KPI
          label="This month"
          value={formatINR(stats?.month_total)}
          testid="kpi-month"
          hint="Running total"
          Icon={Wallet}
        />
        <KPI
          label="Vs last month"
          value={delta == null ? "—" : `${delta > 0 ? "+" : ""}${delta.toFixed(1)}%`}
          testid="kpi-delta"
          hint={`Prev: ${formatINR(stats?.prev_month_total)}`}
          Icon={delta != null && delta > 0 ? TrendingUp : TrendingDown}
          tone={delta != null && delta > 0 ? "warn" : "ok"}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="card-surface p-6 lg:col-span-3">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-[11px] tracking-[0.3em] uppercase text-[#72706A]">Daily flow</p>
              <h3 className="font-editorial text-2xl mt-1 font-light">Last 30 days</h3>
            </div>
          </div>
          <div className="h-64" data-testid="chart-trend">
            <ResponsiveContainer>
              <LineChart data={stats?.trend || []}>
                <CartesianGrid strokeDasharray="2 4" stroke="#E5E3DB" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#72706A" }} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fontSize: 10, fill: "#72706A" }} width={40} />
                <Tooltip formatter={(v) => formatINR(v)} contentStyle={{ background: "#fff", border: "1px solid #E5E3DB", borderRadius: 6, fontSize: 12 }} />
                <Line type="monotone" dataKey="total" stroke="#2C3627" strokeWidth={2} dot={{ r: 2, fill: "#C26E60" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-surface p-6 lg:col-span-2">
          <div className="mb-6">
            <p className="text-[11px] tracking-[0.3em] uppercase text-[#72706A]">By category</p>
            <h3 className="font-editorial text-2xl mt-1 font-light">This month</h3>
          </div>
          <div className="h-64" data-testid="chart-category">
            <ResponsiveContainer>
              <BarChart data={stats?.by_category || []} layout="vertical" margin={{ left: 8 }}>
                <CartesianGrid strokeDasharray="2 4" stroke="#E5E3DB" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: "#72706A" }} />
                <YAxis type="category" dataKey="category" tick={{ fontSize: 11, fill: "#1C1B1A" }} width={90} />
                <Tooltip formatter={(v) => formatINR(v)} contentStyle={{ background: "#fff", border: "1px solid #E5E3DB", borderRadius: 6, fontSize: 12 }} />
                <Bar dataKey="total" fill="#C26E60" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent */}
      <div className="card-surface p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[11px] tracking-[0.3em] uppercase text-[#72706A]">Journal</p>
            <h3 className="font-editorial text-2xl mt-1 font-light">Recent entries</h3>
          </div>
        </div>
        {recent.length === 0 ? (
          <p className="text-[#72706A] py-8 text-center" data-testid="recent-empty">No entries yet. Tap the mic and speak an expense — e.g. &ldquo;200 rupees on food&rdquo;.</p>
        ) : (
          <ul className="divide-y divide-[#E5E3DB]" data-testid="recent-list">
            {recent.map((e) => (
              <li key={e.id} className="py-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#1C1B1A]">{e.category}</p>
                  <p className="text-xs text-[#72706A] truncate">{e.note || "—"} · {e.date}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono-num text-lg text-[#1C1B1A]">{formatINR(e.amount)}</p>
                  <p className="text-[10px] tracking-widest uppercase text-[#72706A]">{e.source}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <AddExpenseDialog
        open={dialogOpen}
        onOpenChange={(v) => { setDialogOpen(v); if (!v) { load(); } }}
        categories={categories}
        initial={prefill}
        onCreated={() => load()}
      />
    </div>
  );
}

function KPI({ label, value, hint, Icon, testid, tone }) {
  const toneCls = tone === "warn" ? "text-[#C26E60]" : tone === "ok" ? "text-[#697D65]" : "text-[#1C1B1A]";
  return (
    <div className="card-surface p-6 hover-lift" data-testid={testid}>
      <div className="flex items-start justify-between">
        <p className="text-[11px] tracking-[0.3em] uppercase text-[#72706A]">{label}</p>
        {Icon && <Icon size={16} strokeWidth={1.5} className="text-[#72706A]" />}
      </div>
      <p className={`font-editorial text-4xl font-light mt-4 ${toneCls}`}>{value}</p>
      <p className="text-xs text-[#72706A] mt-1">{hint}</p>
    </div>
  );
}
