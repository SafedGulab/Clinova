"use client";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function TrendChart({ data }: { data: { date: string; bookings: number }[] }) {
  return (
    <div className="h-56 w-full" role="img" aria-label="Bookings created per day over the last 14 days">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
          <YAxis allowDecimals={false} width={28} tick={{ fontSize: 12 }} />
          <Tooltip />
          <Bar dataKey="bookings" fill="#13A89E" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
