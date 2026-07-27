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
          stroke="#72706A"
        />
        <YAxis fontSize={11} stroke="#72706A" width={36} />
        <Tooltip formatter={(value: number) => `₹${value.toLocaleString("en-IN")}`} />
        <Bar dataKey="total" fill="#2C3627" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
