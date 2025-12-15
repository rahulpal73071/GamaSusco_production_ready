// frontend/src/components/PieChart.jsx
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, Brush } from 'recharts';

const COLORS = [
  '#ef4444', // Red
  '#f59e0b', // Amber
  '#8b5cf6', // Purple
  '#06b6d4', // Cyan
  '#10b981', // Emerald
  '#f97316', // Orange
  '#6366f1', // Indigo
  '#ec4899', // Pink
  '#84cc16', // Lime
  '#14b8a6', // Teal
];

function EmissionPieChart({ data }) {
  // Use the provided data directly
  const chartData = data || [];

  if (data.length === 0) {
    return (
      <div style={styles.emptyState}>
        <div style={styles.emptyIcon}>📊</div>
        <p style={styles.emptyText}>No emission data yet</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={renderCustomLabel}
          outerRadius={90}
          fill="#8884d8"
          dataKey={data[0]?.value !== undefined ? "value" : "emissions"}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value) => `${value.toFixed(2)} tonnes`}
          contentStyle={{
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            fontSize: '12px'
          }}
        />
        <Legend
          verticalAlign="bottom"
          height={36}
          iconType="circle"
          formatter={(value, entry) => `${value}: ${(entry.payload.value || entry.payload.emissions).toFixed(2)}t`}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

// Custom label renderer
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      style={{ fontSize: '14px', fontWeight: '600' }}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const styles = {
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '280px',
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '12px',
    opacity: 0.3,
  },
  emptyText: {
    fontSize: '14px',
    color: '#9ca3af',
  },
};

export default EmissionPieChart;