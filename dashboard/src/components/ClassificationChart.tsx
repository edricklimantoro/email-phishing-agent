import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';
import { StatsResponse } from '../types';

interface ClassificationChartProps {
  stats: StatsResponse | null;
}

const COLORS = {
  safe: 'var(--color-status-safe)',
  phishing: 'var(--color-status-phishing)',
  violation: 'var(--color-status-violation)',
};

const RADIAN = Math.PI / 180;

function renderLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }: {
  cx: number; cy: number; midAngle: number; innerRadius: number; outerRadius: number; percent: number;
}) {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  if (percent < 0.05) return null;

  return (
    <text x={x} y={y} fill="var(--text-primary)" textAnchor="middle" dominantBaseline="central" fontSize={13} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

export function ClassificationChart({ stats }: ClassificationChartProps) {
  const data = stats
    ? [
        { name: 'Safe', value: stats.safe, color: COLORS.safe },
        { name: 'Phishing', value: stats.phishing, color: COLORS.phishing },
        { name: 'Violation', value: stats.security_violation, color: COLORS.violation },
      ].filter((d) => d.value > 0)
    : [];

  return (
    <div
      className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-primary)] p-6 opacity-0 animate-scale-in stagger-5"
      role="img"
      aria-label={`Email classification breakdown: ${stats?.safe ?? 0} safe, ${stats?.phishing ?? 0} phishing, ${stats?.security_violation ?? 0} violations`}
    >
      <h3 className="mb-5 text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)]">Classification</h3>
      {data.length === 0 ? (
        <div className="flex h-[240px] items-center justify-center text-sm text-[var(--text-muted)]">
          No data yet
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={90}
              paddingAngle={3}
              dataKey="value"
              labelLine={false}
              label={renderLabel}
              animationBegin={0}
              animationDuration={600}
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} strokeWidth={0} />
              ))}
            </Pie>
            <Legend
              verticalAlign="bottom"
              height={40}
              formatter={(value: string) => (
                <span style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 500 }}>{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
