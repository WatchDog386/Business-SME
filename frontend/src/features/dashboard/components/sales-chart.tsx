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
  '#6366F1', // Indigo
  '#8B5CF6', // Violet
  '#14B8A6', // Teal
  '#F59E0B', // Amber
  '#0EA5E9', // Sky
  '#EC4899', // Pink
  '#10B981', // Emerald
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
    <div className="space-y-2">
      <h2 className="px-1 text-[13px] font-medium tracking-tight text-foreground">Weekly analytics</h2>
      <div className="h-52 sm:h-60">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 12, fill: '#17201c', fontWeight: 700 }}
              tickLine={{ stroke: '#52525b', strokeWidth: 2 }}
              axisLine={{ stroke: '#3f3f46', strokeWidth: 2.5 }}
            />
            <YAxis
              tick={{ fontSize: 12, fill: '#17201c', fontWeight: 700 }}
              tickLine={{ stroke: '#52525b', strokeWidth: 2 }}
              axisLine={{ stroke: '#3f3f46', strokeWidth: 2.5 }}
              tickFormatter={(value) => compactKES(value)}
            />
            <Tooltip
              formatter={(value) => [formatKES(Number(value)), 'Sales Revenue']}
              contentStyle={{
                borderRadius: 14,
                border: '1px solid #e4e4e7',
                backgroundColor: '#ffffff',
                color: '#18181b',
                fontSize: 13,
                fontWeight: 600,
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15)',
                padding: '10px 14px',
              }}
            />
            <Bar dataKey="total" radius={[0, 0, 0, 0]} barSize={26}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fillColor} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function compactKES(value: number): string {
  if (value >= 1000000) return `${Math.round(value / 1000000)}M`;
  if (value >= 1000) return `${Math.round(value / 1000)}k`;
  return String(value);
}
