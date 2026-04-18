export default function KPICard({ label, value, icon, trend, color = 'blue' }) {
  const trendClass = trend >= 0 ? 'positive' : 'negative';
  const trendIcon = trend >= 0 ? '↑' : '↓';

  return (
    <div className="kpi-card fade-in">
      <div className={`kpi-icon ${color}`}>
        {icon}
      </div>
      <div className="kpi-content">
        <p className="kpi-label">{label}</p>
        <h3 className="kpi-value">{value}</h3>
        {trend !== undefined && (
          <span className={`kpi-trend ${trendClass}`}>
            {trendIcon} {Math.abs(trend)}%
          </span>
        )}
      </div>
    </div>
  );
}
