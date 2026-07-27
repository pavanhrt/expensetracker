"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

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
          stroke="#8b8b96"
        />
        <YAxis fontSize={11} stroke="#8b8b96" width={36} />
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
          cursor={{ fill: "rgba(255,255,255,0.04)" }}
        />
        <Bar dataKey="total" fill="#22d3ee" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
