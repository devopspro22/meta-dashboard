export function RefreshBar({ lastUpdated, secondsUntilRefresh, onRefresh, loading }) {
  const formatLastUpdated = () => {
    if (!lastUpdated) return 'טוען...';
    const diffMs = Date.now() - lastUpdated.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'עודכן לפני פחות מדקה';
    return `עודכן לפני ${diffMin} דק'`;
  };

  const nextRefreshMin = Math.ceil(secondsUntilRefresh / 60);

  return (
    <div className="refresh-bar">
      <span className="refresh-status">
        <span className={`refresh-dot ${loading ? 'dot-loading' : 'dot-live'}`}></span>
        {formatLastUpdated()}
      </span>
      <span className="refresh-next">רענון אוטומטי בעוד {nextRefreshMin} דק'</span>
      <button className="btn-outline btn-sm" onClick={onRefresh} disabled={loading}>
        {loading ? '⏳' : '🔄'} רענן עכשיו
      </button>
    </div>
  );
}
