"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = ["#2C3627", "#5A6E4C", "#8CA37A", "#B9C7A6", "#72706A", "#A69F91", "#D8CFC0", "#E4B36A", "#C77B4F"];

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
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value: number) => `₹${value.toLocaleString("en-IN")}`} />
      </PieChart>
    </ResponsiveContainer>
  );
}
