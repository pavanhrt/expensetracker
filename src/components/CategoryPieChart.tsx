"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { CHART_PALETTE, CHART_TOOLTIP_STYLE, PALETTE, formatCurrency } from "@/lib/theme";

export default function CategoryPieChart({
  data,
}: {
  data: { category: string; total: number }[];
}) {
  if (data.length === 0) {
    return <p className="py-8 text-center text-sm text-muted">Nothing logged this month yet.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie data={data} dataKey="total" nameKey="category" innerRadius={55} outerRadius={90} paddingAngle={2}>
          {data.map((_, i) => (
            <Cell
              key={i}
              fill={CHART_PALETTE[i % CHART_PALETTE.length]}
              stroke={PALETTE.canvas}
              strokeWidth={1}
            />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number) => formatCurrency(value)}
          contentStyle={CHART_TOOLTIP_STYLE}
          itemStyle={{ color: PALETTE.ink }}
          labelStyle={{ color: PALETTE.muted }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
