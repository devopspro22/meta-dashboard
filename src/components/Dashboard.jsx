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
  const [datePreset, setDatePreset] = useState('last_30d');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const sym = selectedAccount?.currency === 'ILS' ? '₪' : '$';

  const loadData = useCallback(async (account = selectedAccount, preset = datePreset) => {
    if (!account) return;
    setLoading(true);
    setError('');
    try {
      const [camps, daily] = await Promise.all([
        fetchCampaigns(account.id, token, preset),
        fetchDailyInsights(account.id, token, preset),
      ]);
      setCampaigns(camps);
      setDailyData(daily);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  }, [selectedAccount, datePreset, token]);

  // Auto-refresh every 15 min
  const { lastUpdated, secondsUntilRefresh, triggerRefresh } = useAutoRefresh(loadData);

  // Switch account
  const handleAccountChange = (acc) => {
    setSelectedAccount(acc);
    loadData(acc, datePreset);
  };

  // Switch date range
  const handleDateChange = (preset) => {
    setDatePreset(preset);
    loadData(selectedAccount, preset);
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
          <h1>📊 Meta Ads Dashboard</h1>
          <span className="sub">נתונים בזמן אמת · מתעדכן אוטומטית</span>
        </div>
        <div className="header-actions">
          <DateRangePicker value={datePreset} onChange={handleDateChange} />
          <button onClick={onDisconnect} className="btn-outline">🔌 התנתק</button>
        </div>
      </header>

      {/* Multi-account tabs */}
      {accounts.length > 1 && (
        <div className="accounts-bar">
          <span className="bar-label">חשבון:</span>
          {accounts.map((acc) => (
            <button
              key={acc.id}
              onClick={() => handleAccountChange(acc)}
              className={`chip ${selectedAccount?.id === acc.id ? 'chip-active' : ''}`}
            >
              {acc.name}
            </button>
          ))}
        </div>
      )}

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
        <KpiCard icon="💸" label="הוצאות" value={formatCurrency(totals.spend, sym)} sub={`${activeCount} קמפיינים פעילים`} color="blue" />
        <KpiCard icon="🎯" label="המרות" value={totals.leads > 0 ? formatNumber(totals.leads) : '—'} sub={totals.leads > 0 ? `עלות/המרה: ${formatCpl(totals.spend, totals.leads, sym)}` : 'אין המרות בתקופה'} color="green" />
        <KpiCard icon="📈" label="ROAS" value={formatRoas(avgRoas)} sub={avgRoas ? 'ממוצע כל הקמפיינים' : 'אין נתוני ROAS'} color="purple" />
        <KpiCard icon="🖱️" label="קמפיינים" value={campaigns.length} sub={`${activeCount} פעילים · ${campaigns.length - activeCount} מושהים`} color="orange" />
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
    </div>
  );
}
