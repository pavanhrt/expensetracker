"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = [
  "#22d3ee", // cyan
  "#a855f7", // violet
  "#ec4899", // magenta
  "#d7ff3d", // lime
  "#38bdf8", // sky
  "#f472b6", // pink
  "#c084fc", // light violet
  "#a3e635", // light lime
  "#8b8b96", // muted (fallback / "Other")
];

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
            <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="#08080b" strokeWidth={1} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number) => `₹${value.toLocaleString("en-IN")}`}
          contentStyle={{
            background: "#15151b",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 10,
            color: "#f2f2f5",
            fontSize: 12,
          }}
          itemStyle={{ color: "#f2f2f5" }}
          labelStyle={{ color: "#8b8b96" }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
