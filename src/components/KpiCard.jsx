export function KpiCard({ label, value, sub, trend, icon, color = 'default' }) {
  const trendIcon = trend === null || trend === undefined ? null : trend >= 0 ? '↑' : '↓';
  const trendClass = trend === null || trend === undefined ? '' : trend >= 0 ? 'trend-up' : 'trend-down';

  return (
    <div className={`kpi-card kpi-${color}`}>
      {/* תוכן — ימין (ראשון ב-RTL) */}
      <div className="kpi-content">
        <div className="kpi-label">{label}</div>
        <div className="kpi-value">{value}</div>
        {sub && (
          <div className={`kpi-sub ${trendClass}`}>
            {trendIcon && <span className="kpi-trend-icon">{trendIcon}</span>}
            {sub}
          </div>
        )}
      </div>
      {/* אייקון — שמאל (אחרון ב-RTL) */}
      <div className="kpi-icon-area">
        <span className="kpi-icon">{icon}</span>
      </div>
    </div>
  );
}
