import { useState, useCallback } from 'react';
import { fetchCampaigns, fetchDailyInsights, getLeads, getRoas } from '../api/metaApi';
import { formatCurrency, formatNumber, formatRoas, formatCpl } from '../utils/formatters';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import { KpiCard } from './KpiCard';
import { DateRangePicker } from './DateRangePicker';
import { RefreshBar } from './RefreshBar';
import { CampaignTable } from './CampaignTable';
import { PerformanceChart } from './PerformanceChart';

export function Dashboard({ token, accounts, onDisconnect }) {
  const [selectedAccount, setSelectedAccount] = useState(accounts[0] || null);
  const [campaigns, setCampaigns] = useState([]);
  const [dailyData, setDailyData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dateConfig, setDateConfig] = useState('last_30d'); // string preset or { since, until }
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const sym = selectedAccount?.currency === 'ILS' ? '₪' : '$';

  const loadData = useCallback(async (account = selectedAccount, dc = dateConfig) => {
    if (!account) return;
    setLoading(true);
    setError('');
    try {
      const [camps, daily] = await Promise.all([
        fetchCampaigns(account.id, token, dc),
        fetchDailyInsights(account.id, token, dc),
      ]);
      setCampaigns(camps);
      setDailyData(daily);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  }, [selectedAccount, dateConfig, token]);

  // Auto-refresh every 15 min
  const { lastUpdated, secondsUntilRefresh, triggerRefresh } = useAutoRefresh(loadData);

  // Switch account
  const handleAccountChange = (acc) => {
    setSelectedAccount(acc);
    loadData(acc, dateConfig);
  };

  // Switch date range (preset string or { since, until } object)
  const handleDateChange = (dc) => {
    setDateConfig(dc);
    loadData(selectedAccount, dc);
  };

  // Compute KPI totals
  const totals = campaigns.reduce(
    (acc, c) => {
      const ins = c.insights?.data?.[0];
      if (ins) {
        acc.spend  += parseFloat(ins.spend || 0);
        acc.leads  += getLeads(ins.actions || []);
        const roas = getRoas(ins.purchase_roas);
        if (roas !== null) { acc.roasSum += roas; acc.roasCount++; }
      }
      return acc;
    },
    { spend: 0, leads: 0, roasSum: 0, roasCount: 0 }
  );

  const avgRoas = totals.roasCount > 0 ? totals.roasSum / totals.roasCount : null;
  const activeCount = campaigns.filter((c) => c.status === 'ACTIVE').length;

  return (
    <div className="dashboard" dir="rtl">
      {/* Header */}
      <header className="dash-header">
        <div>
          <h1><img src="/dashboard.svg" alt="" className="header-svg-icon" /> Meta Ads Dashboard</h1>
          <span className="sub">נתונים בזמן אמת · מתעדכן אוטומטית</span>
        </div>
        <button onClick={onDisconnect} className="btn-outline btn-disconnect">
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18.36 6.64a9 9 0 1 1-12.73 0"/>
            <line x1="12" y1="2" x2="12" y2="12"/>
          </svg>
          התנתק
        </button>
      </header>

      {/* Controls bar: date range + account selector */}
      <div className="controls-bar">
        <DateRangePicker value={dateConfig} onChange={handleDateChange} />
        {accounts.length > 0 && (
          <div className="account-wrap">
            <span className="bar-label">חשבון:</span>
            <select
              className="account-select"
              value={selectedAccount?.id || ''}
              onChange={(e) => {
                const acc = accounts.find((a) => a.id === e.target.value);
                if (acc) handleAccountChange(acc);
              }}
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>{acc.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Refresh bar */}
      <RefreshBar
        lastUpdated={lastUpdated}
        secondsUntilRefresh={secondsUntilRefresh}
        onRefresh={triggerRefresh}
        loading={loading}
      />

      {/* Error */}
      {error && <div className="error">{error}</div>}

      {/* KPI Cards */}
      <div className="kpi-grid">
        <KpiCard icon={<img src="/cost.svg" alt="הוצאות" className="kpi-svg-icon" />} label="הוצאות" value={formatCurrency(totals.spend, sym)} sub={`${activeCount} קמפיינים פעילים`} color="blue" />
        <KpiCard icon={<img src="/conversion.svg" alt="המרות" className="kpi-svg-icon" />} label="המרות" value={totals.leads > 0 ? formatNumber(totals.leads) : '—'} sub={totals.leads > 0 ? `עלות/המרה: ${formatCpl(totals.spend, totals.leads, sym)}` : 'אין המרות בתקופה'} color="green" />
        <KpiCard icon={<img src="/ROAS.svg" alt="ROAS" className="kpi-svg-icon" />} label="ROAS" value={formatRoas(avgRoas)} sub={avgRoas ? 'ממוצע כל הקמפיינים' : 'אין נתוני ROAS'} color="purple" />
        <KpiCard icon={<img src="/campaigns.svg" alt="קמפיינים" className="kpi-svg-icon" />} label="קמפיינים" value={campaigns.length} sub={`${activeCount} פעילים · ${campaigns.length - activeCount} מושהים`} color="orange" />
      </div>

      {/* Chart */}
      {!loading && <PerformanceChart dailyData={dailyData} symbol={sym} />}

      {/* Campaign Table */}
      {!loading && (
        <CampaignTable
          campaigns={campaigns}
          symbol={sym}
          search={search}
          onSearchChange={setSearch}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
        />
      )}

      {loading && <div className="loading">⏳ טוען נתונים...</div>}

      {/* Footer */}
      <footer className="dash-footer">
        Developed by Digital IN
      </footer>
    </div>
  );
}
