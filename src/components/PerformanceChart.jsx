import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from 'recharts';
import { getLeads } from '../api/metaApi';

function formatDate(dateStr) {
  // dateStr: "2024-01-15"
  const d = new Date(dateStr);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

export function PerformanceChart({ dailyData, symbol }) {
  if (!dailyData || dailyData.length === 0) {
    return (
      <div className="chart-wrap chart-empty">
        <span>אין נתוני גרף לתקופה זו</span>
      </div>
    );
  }

  const chartData = dailyData.map((day) => ({
    date: formatDate(day.date_start),
    'הוצאות': Math.round(parseFloat(day.spend || 0)),
    'לידים': getLeads(day.actions || []),
  }));

  return (
    <div className="chart-wrap">
      <div className="chart-title">ביצועים יומיים</div>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
          <XAxis dataKey="date" tick={{ fill: '#8b949e', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis yAxisId="left" tick={{ fill: '#8b949e', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis yAxisId="right" orientation="right" tick={{ fill: '#8b949e', fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 8, color: '#e6edf3' }}
            labelStyle={{ color: '#8b949e', marginBottom: 4 }}
            formatter={(value, name) => name === 'הוצאות' ? [`${symbol}${value.toLocaleString()}`, name] : [value, name]}
          />
          <Legend wrapperStyle={{ fontSize: 12, color: '#8b949e' }} />
          <Line yAxisId="left" type="monotone" dataKey="הוצאות" stroke="#1877F2" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
          <Line yAxisId="right" type="monotone" dataKey="לידים" stroke="#3fb950" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
