export function KpiCard({ label, value, sub, trend, icon, color = 'default' }) {
  // trend: positive number = green arrow up, negative = red arrow down, null = no arrow
  const trendIcon = trend === null || trend === undefined ? null : trend >= 0 ? '↑' : '↓';
  const trendClass = trend === null || trend === undefined ? '' : trend >= 0 ? 'trend-up' : 'trend-down';

  return (
    <div className={`kpi-card kpi-${color}`}>
      <div className="kpi-header">
        <span className="kpi-icon">{icon}</span>
        <span className="kpi-label">{label}</span>
      </div>
      <div className="kpi-value">{value}</div>
      {sub && (
        <div className={`kpi-sub ${trendClass}`}>
          {trendIcon && <span className="kpi-trend-icon">{trendIcon}</span>}
          {sub}
        </div>
      )}
    </div>
  );
}
