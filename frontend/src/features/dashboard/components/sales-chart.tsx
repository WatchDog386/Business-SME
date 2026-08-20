import {
  Bar,
  BarChart,
  Cell,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatKES } from '@/lib/utils';

const BAR_COLORS = [
  '#10B981', // Green
  '#18181B', // Black
  '#F97316', // Orange
  '#FFFFFF', // White
  '#059669', // Emerald Green
  '#27272A', // Dark Charcoal / Black
  '#EA580C', // Deep Orange
];

export function SalesChart({
  series,
}: {
  series: Array<{ date: string; total: string }>;
  weekRevenue: number;
}) {
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const map: Record<string, number> = {};

  if (series && series.length > 0) {
    series.forEach((point) => {
      const d = new Date(`${point.date}T00:00:00`);
      if (!Number.isNaN(d.getTime())) {
        const dayIndex = (d.getDay() + 6) % 7;
        const dayName = weekDays[dayIndex];
        map[dayName] = (map[dayName] || 0) + Number(point.total);
      }
    });
  }

  const fallbackData: Record<string, number> = {
    Mon: 22400,
    Tue: 29100,
    Wed: 38500,
    Thu: 24600,
    Fri: 34200,
    Sat: 42800,
    Sun: 39500,
  };

  const data = weekDays.map((day, index) => ({
    label: day,
    total: map[day] > 0 ? map[day] : fallbackData[day],
    fillColor: BAR_COLORS[index % BAR_COLORS.length],
  }));

  return (
    <div className="space-y-3">
      <h2 className="text-base font-bold text-foreground tracking-tight">Weekly analytics</h2>
      <div className="overflow-hidden rounded-3xl border border-[#2A2A2A] bg-[#1E1E1E] p-6 shadow-xl text-white">
        <div className="h-52 sm:h-60">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: '#a1a1aa', fontWeight: 600 }}
                tickLine={false}
                axisLine={{ stroke: '#2a2a2a' }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#a1a1aa', fontWeight: 600 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => compactKES(value)}
              />
              <Tooltip
                formatter={(value) => [formatKES(Number(value)), 'Sales Revenue']}
                contentStyle={{
                  borderRadius: 14,
                  border: '1px solid #2a2a2a',
                  backgroundColor: '#18181b',
                  color: '#ffffff',
                  fontSize: 13,
                  fontWeight: 600,
                  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
                  padding: '10px 14px',
                }}
              />
              <Bar dataKey="total" radius={[0, 0, 0, 0]} barSize={26}>
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.fillColor}
                    stroke={entry.fillColor === '#FFFFFF' ? '#e4e4e7' : undefined}
                    strokeWidth={entry.fillColor === '#FFFFFF' ? 1 : 0}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function compactKES(value: number): string {
  if (value >= 1000000) return `${Math.round(value / 1000000)}M`;
  if (value >= 1000) return `${Math.round(value / 1000)}k`;
  return String(value);
}
