# Professional FB Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the existing basic React dashboard into a professional dark-mode Meta Ads dashboard with KPI cards, campaign table with leads/ROAS/CPL, a daily performance chart, auto-refresh every 15 minutes, date range selector (7/14/30 days), and env variable token support for Vercel deployments.

**Architecture:** Single-page React app (CRA). Token is read from `REACT_APP_META_TOKEN` env variable first; if missing, show login screen with localStorage persistence. All Meta API calls are centralized in `src/api/metaApi.js`. Components are split by responsibility: KpiCards, CampaignTable, PerformanceChart, DateRangePicker, RefreshBar.

**Tech Stack:** React 18, Create React App, Recharts (charts), Meta Graph API v19.0, CSS Modules (keep existing App.css pattern)

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/api/metaApi.js` | Create | All Meta Graph API calls |
| `src/utils/formatters.js` | Create | Currency, number, percentage formatting |
| `src/hooks/useAutoRefresh.js` | Create | 15-minute auto-refresh logic |
| `src/components/LoginScreen.jsx` | Create | Token input screen |
| `src/components/KpiCard.jsx` | Create | Single KPI card (Spend/Leads/CPL/ROAS) |
| `src/components/DateRangePicker.jsx` | Create | 7/14/30 day selector tabs |
| `src/components/RefreshBar.jsx` | Create | "Last updated X min ago" + refresh button |
| `src/components/CampaignTable.jsx` | Create | Full campaign table with all metrics |
| `src/components/PerformanceChart.jsx` | Create | Line chart: daily Spend + Leads |
| `src/components/Dashboard.jsx` | Create | Assembles all components |
| `src/App.js` | Modify | Route between LoginScreen / Dashboard |
| `src/App.css` | Modify | Add new component styles |
| `.env.example` | Create | Template for token setup |
| `README.md` | Modify | Fork + Deploy instructions |

---

## Task 1: Install Recharts + Create API Layer

**Files:**
- Create: `src/api/metaApi.js`

- [ ] **Step 1: Install recharts**

```bash
cd c:\Users\nidal\Downloads\fb-dashboard
npm install recharts
```

Expected: recharts added to package.json dependencies.

- [ ] **Step 2: Create `src/api/metaApi.js`**

```js
const FB_API = 'https://graph.facebook.com/v19.0';

// Fetch all ad accounts for a token
export async function fetchAdAccounts(token) {
  const res = await fetch(
    `${FB_API}/me/adaccounts?fields=name,account_id,currency,account_status&access_token=${token}`
  );
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.data || [];
}

// Fetch campaigns with aggregate insights for a date range
// datePreset: 'last_7d' | 'last_14d' | 'last_30d'
export async function fetchCampaigns(accountId, token, datePreset = 'last_30d') {
  const fields = [
    'name',
    'status',
    'daily_budget',
    'lifetime_budget',
    'objective',
    `insights.date_preset(${datePreset}){spend,impressions,clicks,ctr,cpm,reach,actions,cost_per_action_type,purchase_roas}`,
  ].join(',');

  const res = await fetch(
    `${FB_API}/${accountId}/campaigns?fields=${fields}&limit=100&access_token=${token}`
  );
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.data || [];
}

// Fetch daily time-series data for the chart
// datePreset: 'last_7d' | 'last_14d' | 'last_30d'
export async function fetchDailyInsights(accountId, token, datePreset = 'last_30d') {
  const res = await fetch(
    `${FB_API}/${accountId}/insights?fields=spend,impressions,clicks,actions&date_preset=${datePreset}&time_increment=1&access_token=${token}`
  );
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.data || [];
}

// Helper: extract lead count from actions array
export function getLeads(actions = []) {
  const leadAction = actions.find(
    (a) => a.action_type === 'lead' || a.action_type === 'onsite_conversion.lead_grouped'
  );
  return leadAction ? parseInt(leadAction.value, 10) : 0;
}

// Helper: extract ROAS from purchase_roas array
export function getRoas(purchaseRoas = []) {
  if (!purchaseRoas || purchaseRoas.length === 0) return null;
  return parseFloat(purchaseRoas[0].value);
}
```

- [ ] **Step 3: Commit**

```bash
cd c:\Users\nidal\Downloads\fb-dashboard
git init
git add src/api/metaApi.js package.json package-lock.json
git commit -m "feat: add metaApi layer with leads + ROAS helpers"
```

---

## Task 2: Utility Formatters

**Files:**
- Create: `src/utils/formatters.js`

- [ ] **Step 1: Create `src/utils/formatters.js`**

```js
// Format currency based on account currency symbol
export function formatCurrency(value, symbol = '₪') {
  if (value === null || value === undefined) return '—';
  return `${symbol}${Math.round(value).toLocaleString('he-IL')}`;
}

// Format a number with thousands separators
export function formatNumber(value) {
  if (value === null || value === undefined) return '—';
  return parseInt(value, 10).toLocaleString('he-IL');
}

// Format a percentage to 2 decimal places
export function formatPercent(value) {
  if (value === null || value === undefined) return '—';
  return `${parseFloat(value).toFixed(2)}%`;
}

// Format ROAS to 2 decimal places with x suffix
export function formatRoas(value) {
  if (value === null || value === undefined) return '—';
  return `${parseFloat(value).toFixed(2)}x`;
}

// Format CPL (cost per lead)
export function formatCpl(spend, leads, symbol = '₪') {
  if (!leads || leads === 0) return '—';
  return formatCurrency(spend / leads, symbol);
}

// Convert date_preset key to human label
export const DATE_PRESETS = [
  { key: 'last_7d', label: '7 ימים' },
  { key: 'last_14d', label: '14 ימים' },
  { key: 'last_30d', label: '30 ימים' },
];
```

- [ ] **Step 2: Commit**

```bash
git add src/utils/formatters.js
git commit -m "feat: add formatting utilities for currency, numbers, ROAS, CPL"
```

---

## Task 3: useAutoRefresh Hook

**Files:**
- Create: `src/hooks/useAutoRefresh.js`

- [ ] **Step 1: Create `src/hooks/useAutoRefresh.js`**

```js
import { useState, useEffect, useCallback, useRef } from 'react';

const REFRESH_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes

// Uses a ref for the callback so the interval never restarts when loadData changes
// (e.g., when user switches date range or account).
// Returns: { lastUpdated: Date|null, secondsUntilRefresh: number, triggerRefresh: fn }
export function useAutoRefresh(onRefresh) {
  const [lastUpdated, setLastUpdated] = useState(null);
  const [secondsUntilRefresh, setSecondsUntilRefresh] = useState(REFRESH_INTERVAL_MS / 1000);
  const onRefreshRef = useRef(onRefresh);   // always holds latest callback
  const intervalRef  = useRef(null);
  const countdownRef = useRef(null);

  // Keep ref current without restarting the interval
  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  const startCountdown = useCallback(() => {
    setSecondsUntilRefresh(REFRESH_INTERVAL_MS / 1000);
    if (countdownRef.current) clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      setSecondsUntilRefresh((prev) => (prev <= 1 ? REFRESH_INTERVAL_MS / 1000 : prev - 1));
    }, 1000);
  }, []);

  const triggerRefresh = useCallback(async () => {
    await onRefreshRef.current();   // use ref, not closure
    setLastUpdated(new Date());
    startCountdown();
  }, [startCountdown]);

  useEffect(() => {
    // Initial load on mount
    onRefreshRef.current();
    setLastUpdated(new Date());
    startCountdown();

    // Auto-refresh every 15 minutes — empty deps so interval is created only once
    intervalRef.current = setInterval(() => {
      triggerRefresh();
    }, REFRESH_INTERVAL_MS);

    return () => {
      clearInterval(intervalRef.current);
      clearInterval(countdownRef.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { lastUpdated, secondsUntilRefresh, triggerRefresh };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useAutoRefresh.js
git commit -m "feat: add useAutoRefresh hook with 15min interval and countdown"
```

---

## Task 4: LoginScreen Component

**Files:**
- Create: `src/components/LoginScreen.jsx`

- [ ] **Step 1: Create `src/components/LoginScreen.jsx`**

```jsx
import { useState } from 'react';

export function LoginScreen({ onConnect, loading, error }) {
  const [inputToken, setInputToken] = useState('');

  const handleConnect = () => {
    if (inputToken.trim()) onConnect(inputToken.trim());
  };

  return (
    <div className="page">
      <div className="connect-card">
        <div className="logo">📊</div>
        <h1>Meta Ads Dashboard</h1>
        <p className="desc">
          התחבר עם Meta Access Token לצפייה בביצועי הקמפיינים שלך.
          <br />
          הנתונים מתעדכנים אוטומטית כל 15 דקות.
        </p>
        <div className="input-row">
          <input
            type="password"
            value={inputToken}
            onChange={(e) => setInputToken(e.target.value)}
            placeholder="EAAxxxxxxxxxxxxxxx..."
            onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
            autoFocus
          />
          <button onClick={handleConnect} disabled={loading || !inputToken.trim()} className="btn-primary">
            {loading ? '...' : 'התחבר'}
          </button>
        </div>
        {error && <div className="error">{error}</div>}
        <a
          href="https://developers.facebook.com/tools/explorer/"
          target="_blank"
          rel="noreferrer"
          className="help-link"
        >
          🔑 קבל Access Token מ-Graph API Explorer
        </a>
        <div className="scopes-note">
          נדרשות הרשאות: <code>ads_read</code> + <code>ads_management</code>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/LoginScreen.jsx
git commit -m "feat: extract LoginScreen component"
```

---

## Task 5: KpiCard Component

**Files:**
- Create: `src/components/KpiCard.jsx`

- [ ] **Step 1: Create `src/components/KpiCard.jsx`**

```jsx
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
```

- [ ] **Step 2: Add KpiCard styles to `src/App.css`**

Append to end of `src/App.css`:

```css
/* ── KPI Cards ─────────────────────────────────────────── */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 1.5rem;
}

.kpi-card {
  background: #161b22;
  border: 1px solid #21262d;
  border-radius: 12px;
  padding: 1.25rem 1.5rem;
  position: relative;
  overflow: hidden;
  transition: border-color 0.2s;
}

.kpi-card:hover { border-color: #30363d; }

.kpi-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 3px;
  border-radius: 12px 12px 0 0;
}

.kpi-blue::before   { background: #1877F2; }
.kpi-green::before  { background: #3fb950; }
.kpi-purple::before { background: #a371f7; }
.kpi-orange::before { background: #f0883e; }
.kpi-default::before { background: #30363d; }

.kpi-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 0.75rem;
}

.kpi-icon { font-size: 16px; }

.kpi-label {
  font-size: 12px;
  color: #8b949e;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.kpi-value {
  font-size: 28px;
  font-weight: 700;
  color: #e6edf3;
  line-height: 1;
  margin-bottom: 0.4rem;
}

.kpi-sub {
  font-size: 12px;
  color: #8b949e;
  display: flex;
  align-items: center;
  gap: 4px;
}

.trend-up   { color: #3fb950; }
.trend-down { color: #f48771; }
.kpi-trend-icon { font-size: 11px; }

@media (max-width: 900px) {
  .kpi-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 500px) {
  .kpi-grid { grid-template-columns: 1fr 1fr; }
  .kpi-value { font-size: 22px; }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/KpiCard.jsx src/App.css
git commit -m "feat: add KpiCard component with colored top-border accent"
```

---

## Task 6: DateRangePicker + RefreshBar

**Files:**
- Create: `src/components/DateRangePicker.jsx`
- Create: `src/components/RefreshBar.jsx`

- [ ] **Step 1: Create `src/components/DateRangePicker.jsx`**

```jsx
import { DATE_PRESETS } from '../utils/formatters';

export function DateRangePicker({ value, onChange }) {
  return (
    <div className="date-range-picker">
      {DATE_PRESETS.map((preset) => (
        <button
          key={preset.key}
          className={`range-btn ${value === preset.key ? 'range-btn-active' : ''}`}
          onClick={() => onChange(preset.key)}
        >
          {preset.label}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Create `src/components/RefreshBar.jsx`**

```jsx
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
```

- [ ] **Step 3: Add styles to `src/App.css`**

Append to end of `src/App.css`:

```css
/* ── Date Range Picker ──────────────────────────────────── */
.date-range-picker {
  display: flex;
  gap: 4px;
  background: #161b22;
  border: 1px solid #21262d;
  border-radius: 8px;
  padding: 3px;
}

.range-btn {
  padding: 5px 14px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  border: none;
  background: transparent;
  color: #8b949e;
  cursor: pointer;
  transition: all 0.15s;
}

.range-btn:hover { color: #e6edf3; }
.range-btn-active { background: #21262d; color: #e6edf3; }

/* ── Refresh Bar ────────────────────────────────────────── */
.refresh-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 14px;
  background: #161b22;
  border: 1px solid #21262d;
  border-radius: 8px;
  margin-bottom: 1.25rem;
  font-size: 12px;
  color: #8b949e;
}

.refresh-status {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
}

.refresh-next { margin-right: auto; }

.refresh-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}

.dot-live    { background: #3fb950; box-shadow: 0 0 6px #3fb950; }
.dot-loading { background: #f0883e; animation: pulse 1s infinite; }

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.4; }
}

.btn-sm { padding: 4px 10px; font-size: 12px; }
```

- [ ] **Step 4: Commit**

```bash
git add src/components/DateRangePicker.jsx src/components/RefreshBar.jsx src/App.css
git commit -m "feat: add DateRangePicker and RefreshBar components"
```

---

## Task 7: CampaignTable Component

**Files:**
- Create: `src/components/CampaignTable.jsx`

- [ ] **Step 1: Create `src/components/CampaignTable.jsx`**

```jsx
import { useState } from 'react';
import { getLeads, getRoas } from '../api/metaApi';
import { formatCurrency, formatNumber, formatPercent, formatRoas, formatCpl } from '../utils/formatters';

export function CampaignTable({ campaigns, symbol, search, onSearchChange, statusFilter, onStatusChange }) {
  const [sortKey, setSortKey] = useState('spend');
  const [sortDir, setSortDir] = useState('desc');

  const getInsight = (c) => c.insights?.data?.[0] || null;

  const getRow = (c) => {
    const ins = getInsight(c);
    const spend  = ins ? parseFloat(ins.spend || 0) : 0;
    const leads  = ins ? getLeads(ins.actions || []) : 0;
    const roas   = ins ? getRoas(ins.purchase_roas) : null;
    const ctr    = ins ? parseFloat(ins.ctr || 0) : 0;
    const cpm    = ins ? parseFloat(ins.cpm || 0) : 0;
    const reach  = ins ? parseInt(ins.reach || 0, 10) : 0;
    return { spend, leads, roas, ctr, cpm, reach };
  };

  const handleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    else { setSortKey(key); setSortDir('desc'); }
  };

  const SortIcon = ({ col }) => {
    if (sortKey !== col) return <span className="sort-icon">↕</span>;
    return <span className="sort-icon active">{sortDir === 'desc' ? '↓' : '↑'}</span>;
  };

  const filtered = campaigns
    .filter((c) => {
      const matchStatus = statusFilter === 'all' || c.status.toLowerCase() === statusFilter;
      const matchSearch = c.name.toLowerCase().includes(search.toLowerCase());
      return matchStatus && matchSearch;
    })
    .sort((a, b) => {
      const ra = getRow(a);
      const rb = getRow(b);
      const va = ra[sortKey] ?? 0;
      const vb = rb[sortKey] ?? 0;
      return sortDir === 'desc' ? vb - va : va - vb;
    });

  const maxSpend = Math.max(...campaigns.map((c) => getRow(c).spend), 1);

  return (
    <>
      <div className="table-controls">
        <input
          type="text"
          placeholder="🔍 חפש קמפיין..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="search-input"
        />
        <select value={statusFilter} onChange={(e) => onStatusChange(e.target.value)} className="filter-select">
          <option value="all">כל הסטטוסים</option>
          <option value="active">פעיל</option>
          <option value="paused">מושהה</option>
        </select>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>שם קמפיין</th>
              <th>סטטוס</th>
              <th className="sortable" onClick={() => handleSort('spend')}>
                הוצאות <SortIcon col="spend" />
              </th>
              <th className="sortable" onClick={() => handleSort('leads')}>
                לידים <SortIcon col="leads" />
              </th>
              <th>CPL</th>
              <th className="sortable" onClick={() => handleSort('roas')}>
                ROAS <SortIcon col="roas" />
              </th>
              <th className="sortable" onClick={() => handleSort('ctr')}>
                CTR <SortIcon col="ctr" />
              </th>
              <th>CPM</th>
              <th>Reach</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan="9" className="no-data">לא נמצאו קמפיינים</td></tr>
            )}
            {filtered.map((c) => {
              const { spend, leads, roas, ctr, cpm, reach } = getRow(c);
              const isActive = c.status === 'ACTIVE';
              const barW = Math.round((spend / maxSpend) * 80);
              return (
                <tr key={c.id}>
                  <td className="name-cell" title={c.name}>{c.name}</td>
                  <td>
                    <span className={`badge ${isActive ? 'badge-active' : 'badge-paused'}`}>
                      <span className={`dot ${isActive ? 'dot-active' : 'dot-paused'}`}></span>
                      {isActive ? 'פעיל' : 'מושהה'}
                    </span>
                  </td>
                  <td>
                    <div className="spend-cell">
                      <span>{formatCurrency(spend, symbol)}</span>
                      <div className="spend-bar" style={{ width: barW }}></div>
                    </div>
                  </td>
                  <td className={leads > 0 ? 'leads-positive' : ''}>{leads > 0 ? formatNumber(leads) : '—'}</td>
                  <td>{formatCpl(spend, leads, symbol)}</td>
                  <td className={roas && roas >= 1 ? 'roas-positive' : ''}>{formatRoas(roas)}</td>
                  <td>{formatPercent(ctr)}</td>
                  <td>{formatCurrency(cpm, symbol)}</td>
                  <td>{formatNumber(reach)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
```

- [ ] **Step 2: Add table styles to `src/App.css`**

Append to end of `src/App.css`:

```css
/* ── Table Enhancements ─────────────────────────────────── */
.sortable { cursor: pointer; user-select: none; }
.sortable:hover { color: #e6edf3; }
.sort-icon { margin-right: 4px; opacity: 0.4; font-size: 10px; }
.sort-icon.active { opacity: 1; color: #58a6ff; }

.leads-positive { color: #3fb950; font-weight: 600; }
.roas-positive  { color: #a371f7; font-weight: 600; }
```

- [ ] **Step 3: Commit**

```bash
git add src/components/CampaignTable.jsx src/App.css
git commit -m "feat: add CampaignTable with leads, CPL, ROAS, sortable columns"
```

---

## Task 8: PerformanceChart Component

**Files:**
- Create: `src/components/PerformanceChart.jsx`

- [ ] **Step 1: Create `src/components/PerformanceChart.jsx`**

```jsx
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
```

- [ ] **Step 2: Add chart styles to `src/App.css`**

Append to end of `src/App.css`:

```css
/* ── Performance Chart ──────────────────────────────────── */
.chart-wrap {
  background: #161b22;
  border: 1px solid #21262d;
  border-radius: 12px;
  padding: 1.25rem 1.5rem;
  margin-bottom: 1.5rem;
}

.chart-title {
  font-size: 13px;
  font-weight: 600;
  color: #8b949e;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 1rem;
}

.chart-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 120px;
  color: #8b949e;
  font-size: 13px;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/PerformanceChart.jsx src/App.css
git commit -m "feat: add PerformanceChart with dual-axis spend + leads lines"
```

---

## Task 9: Dashboard Component (Assembly)

**Files:**
- Create: `src/components/Dashboard.jsx`

- [ ] **Step 1: Create `src/components/Dashboard.jsx`**

```jsx
import { useState, useCallback } from 'react';
import { fetchCampaigns, fetchDailyInsights, fetchAdAccounts, getLeads, getRoas } from '../api/metaApi';
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
        <KpiCard icon="🎯" label="לידים" value={totals.leads > 0 ? formatNumber(totals.leads) : '—'} sub={totals.leads > 0 ? `CPL: ${formatCpl(totals.spend, totals.leads, sym)}` : 'אין לידים בתקופה'} color="green" />
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
```

- [ ] **Step 2: Add header-actions styles to `src/App.css`**

Append to end of `src/App.css`:

```css
/* ── Header Actions ─────────────────────────────────────── */
.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/Dashboard.jsx src/App.css
git commit -m "feat: add Dashboard component assembling all KPIs, chart, table"
```

---

## Task 10: Rewrite App.js — Token + Env Variable Support

**Files:**
- Modify: `src/App.js`

- [ ] **Step 1: Replace `src/App.js` entirely**

```js
import { useState, useEffect } from 'react';
import './App.css';
import { fetchAdAccounts } from './api/metaApi';
import { LoginScreen } from './components/LoginScreen';
import { Dashboard } from './components/Dashboard';

const LS_KEY = 'meta_ads_token';

function App() {
  const [token, setToken] = useState('');
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // On mount: check env variable first, then localStorage
  useEffect(() => {
    const envToken = process.env.REACT_APP_META_TOKEN;
    const savedToken = localStorage.getItem(LS_KEY);
    const tok = envToken || savedToken;
    if (tok) connectWithToken(tok);
  }, []);

  const connectWithToken = async (tok) => {
    setLoading(true);
    setError('');
    try {
      const accs = await fetchAdAccounts(tok);
      if (accs.length === 0) {
        setError('לא נמצאו חשבונות פרסום בטוקן זה.');
        setLoading(false);
        return;
      }
      localStorage.setItem(LS_KEY, tok);
      setToken(tok);
      setAccounts(accs);
    } catch (e) {
      setError(e.message);
      localStorage.removeItem(LS_KEY);
    }
    setLoading(false);
  };

  const handleDisconnect = () => {
    localStorage.removeItem(LS_KEY);
    setToken('');
    setAccounts([]);
    setError('');
  };

  if (!token) {
    return <LoginScreen onConnect={connectWithToken} loading={loading} error={error} />;
  }

  return <Dashboard token={token} accounts={accounts} onDisconnect={handleDisconnect} />;
}

export default App;
```

- [ ] **Step 2: Verify app starts correctly**

```bash
# In a terminal, navigate to the project and start
npm start
# Should open http://localhost:3001 (or 3000)
# Expected: login screen appears (or dashboard if REACT_APP_META_TOKEN is set)
```

- [ ] **Step 3: Commit**

```bash
git add src/App.js
git commit -m "feat: rewrite App.js with env token + localStorage persistence"
```

---

## Task 11: .env.example + README

**Files:**
- Create: `.env.example`
- Modify: `README.md`

- [ ] **Step 1: Create `.env.example`**

```
# Copy this file to .env.local and fill in your token
# Get your token from: https://developers.facebook.com/tools/explorer/
# Required permissions: ads_read, ads_management

REACT_APP_META_TOKEN=EAAxxxxxxxxxxxxxxxxxxxxxxx
```

- [ ] **Step 2: Replace `README.md`**

```markdown
# 📊 Meta Ads Dashboard

דשבורד מקצועי לניטור ביצועי קמפיינים ב-Meta Ads (Facebook / Instagram).

מציג: הוצאות · לידים · ROAS · CTR · CPM · CPL · גרף יומי
מתעדכן אוטומטית כל 15 דקות.

---

## 🚀 Deploy בלחיצה אחת

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/fb-dashboard&env=REACT_APP_META_TOKEN&envDescription=Meta%20Access%20Token%20from%20Graph%20API%20Explorer)

---

## 📋 הוראות Fork + Deploy

### שלב 1 — Fork
לחץ על `Fork` בפינה הימנית העליונה של הרפו.

### שלב 2 — קבל Meta Access Token
1. כנס ל-[Graph API Explorer](https://developers.facebook.com/tools/explorer/)
2. בחר את ה-App שלך
3. הוסף הרשאות: `ads_read` + `ads_management`
4. לחץ `Generate Access Token`
5. העתק את ה-Token

### שלב 3 — Deploy ל-Vercel
1. כנס ל-[vercel.com](https://vercel.com) וחבר את ה-GitHub שלך
2. בחר את ה-Fork שלך
3. בהגדרות `Environment Variables` הוסף:
   - **Key:** `REACT_APP_META_TOKEN`
   - **Value:** הטוקן שהעתקת
4. לחץ `Deploy`

### שלב 4 — גמור! ✅
הדשבורד שלך זמין בכתובת שסיפקה Vercel.

---

## 🛠️ הרצה מקומית

```bash
git clone https://github.com/YOUR_USERNAME/fb-dashboard
cd fb-dashboard
npm install
cp .env.example .env.local
# ערוך .env.local והוסף את הטוקן שלך
npm start
```

---

## 📊 מדדים מוצגים

| מדד | תיאור |
|---|---|
| **Spend** | סך הוצאות בתקופה הנבחרת |
| **Leads** | מספר לידים (Lead Gen campaigns) |
| **CPL** | עלות לליד |
| **ROAS** | החזר על ההשקעה |
| **CTR** | אחוז הקלקות |
| **CPM** | עלות ל-1000 חשיפות |
| **Reach** | טווח הגעה |

---

## ⚙️ הגדרות

| משתנה | תיאור |
|---|---|
| `REACT_APP_META_TOKEN` | Meta Access Token (חובה אם לא נכנסים ידנית) |

---

Built with React · Meta Graph API v19.0
```

- [ ] **Step 3: Commit**

```bash
git add .env.example README.md
git commit -m "docs: add .env.example and full README with Fork + Deploy guide"
```

---

## Task 12: Final Polish — Verify Full Flow

- [ ] **Step 1: Start the app locally**

```bash
npm start
```

- [ ] **Step 2: Test login flow**
  - פתח `http://localhost:3001`
  - הכנס Meta Token תקני
  - ודא שמסך הדשבורד עולה עם KPI cards
  - ודא שהגרף מופיע
  - ודא שטבלת הקמפיינים מציגה Leads + ROAS

- [ ] **Step 3: Test auto-refresh**
  - ודא שה-RefreshBar מציג "עודכן לפני פחות מדקה"
  - לחץ "רענן עכשיו" ובדוק שה-spinner מופיע ונעלם

- [ ] **Step 4: Test date range**
  - החלף בין 7 / 14 / 30 ימים
  - ודא שהנתונים משתנים

- [ ] **Step 5: Test localStorage persistence**
  - רענן את הדף
  - ודא שהדשבורד נפתח ישירות בלי צורך להכניס Token שוב

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "feat: complete professional Meta Ads dashboard v1.0"
```
