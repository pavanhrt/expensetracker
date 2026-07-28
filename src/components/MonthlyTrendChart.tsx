"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CHART_TOOLTIP_STYLE, PALETTE, formatCurrency } from "@/lib/theme";

export default function MonthlyTrendChart({
  data,
}: {
  data: { date: string; total: number }[];
}) {
  if (data.length === 0) {
    return <p className="py-8 text-center text-sm text-muted">No trend data yet.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data}>
        <XAxis
          dataKey="date"
          tickFormatter={(d: string) => d.slice(5)}
          fontSize={11}
          stroke={PALETTE.muted}
        />
        <YAxis fontSize={11} stroke={PALETTE.muted} width={36} />
        <Tooltip
          formatter={(value: number) => formatCurrency(value)}
          contentStyle={CHART_TOOLTIP_STYLE}
          itemStyle={{ color: PALETTE.ink }}
          labelStyle={{ color: PALETTE.muted }}
          cursor={{ fill: "rgba(255,255,255,0.04)" }}
        />
        <Bar dataKey="total" fill={PALETTE.cyan} radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
