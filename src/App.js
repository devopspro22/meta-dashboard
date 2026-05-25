import { useState, useCallback } from 'react';
import './App.css';

const FB_API = 'https://graph.facebook.com/v19.0';

function App() {
  const [token, setToken] = useState('');
  const [inputToken, setInputToken] = useState('');
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  const connect = async () => {
    if (!inputToken.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${FB_API}/me/adaccounts?fields=name,account_id,currency,account_status&access_token=${inputToken}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      const accs = data.data || [];
      setToken(inputToken);
      setAccounts(accs);
      if (accs.length === 0) {
        setError('לא נמצאו חשבונות פרסום בטוקן זה. בדוק שה-Token כולל הרשאות ads_read.');
        setToken('');
      } else {
        loadCampaigns(accs[0], inputToken);
      }
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  const loadCampaigns = async (account, tok = token) => {
    setSelectedAccount(account);
    setCampaigns([]);
    setLoading(true);
    setError('');
    try {
      const fields = 'name,status,daily_budget,lifetime_budget,objective,insights.date_preset(last_30d){spend,impressions,clicks,ctr,cpm,reach}';
      const res = await fetch(`${FB_API}/${account.id}/campaigns?fields=${fields}&limit=100&access_token=${tok}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      setCampaigns(data.data || []);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  const disconnect = () => {
    setToken('');
    setInputToken('');
    setAccounts([]);
    setSelectedAccount(null);
    setCampaigns([]);
    setError('');
  };

  const filtered = campaigns.filter(c => {
    const matchStatus = statusFilter === 'all' || c.status.toLowerCase() === statusFilter;
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const getInsight = (c) => c.insights?.data?.[0] || null;
  const sym = selectedAccount?.currency === 'ILS' ? '₪' : '$';

  const totals = campaigns.reduce((acc, c) => {
    const ins = getInsight(c);
    if (ins) {
      acc.spend += parseFloat(ins.spend || 0);
      acc.impressions += parseInt(ins.impressions || 0);
      acc.clicks += parseInt(ins.clicks || 0);
    }
    return acc;
  }, { spend: 0, impressions: 0, clicks: 0 });

  const activeCount = campaigns.filter(c => c.status === 'ACTIVE').length;
  const maxSpend = Math.max(...campaigns.map(c => {
    const ins = getInsight(c);
    return ins ? parseFloat(ins.spend) : 0;
  }), 1);

  if (!token) {
    return (
      <div className="page">
        <div className="connect-card">
          <div className="logo">📊</div>
          <h1>Matarot — דשבורד קמפיינים</h1>
          <p className="desc">
            התחבר עם Meta Access Token לצפייה בכל הקמפיינים, ביצועים ונתוני 30 יום אחרון.
          </p>
          <div className="input-row">
            <input
              type="password"
              value={inputToken}
              onChange={e => setInputToken(e.target.value)}
              placeholder="EAAxxxxxxxxxxxxxxx..."
              onKeyDown={e => e.key === 'Enter' && connect()}
            />
            <button onClick={connect} disabled={loading} className="btn-primary">
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

  return (
    <div className="dashboard" dir="rtl">
      <header className="dash-header">
        <div>
          <h1>📊 דשבורד קמפיינים</h1>
          <span className="sub">Meta Ads — נתונים בזמן אמת</span>
        </div>
        <button onClick={disconnect} className="btn-outline">🔌 התנתק</button>
      </header>

      {accounts.length > 1 && (
        <div className="accounts-bar">
          <span className="bar-label">חשבון:</span>
          {accounts.map(acc => (
            <button
              key={acc.id}
              onClick={() => loadCampaigns(acc)}
              className={`chip ${selectedAccount?.id === acc.id ? 'chip-active' : ''}`}
            >
              {acc.name}
            </button>
          ))}
        </div>
      )}

      {loading && <div className="loading">⏳ טוען נתונים...</div>}
      {error && <div className="error">{error}</div>}

      {!selectedAccount && !loading && !error && accounts.length > 0 && (
        <div className="loading">בחר חשבון מהרשימה למעלה</div>
      )}

      {selectedAccount && !loading && (
        <>
          <div className="metrics">
            <div className="metric">
              <div className="metric-label">קמפיינים</div>
              <div className="metric-value">{campaigns.length}</div>
            </div>
            <div className="metric">
              <div className="metric-label">פעילים</div>
              <div className="metric-value green">{activeCount}</div>
            </div>
            <div className="metric">
              <div className="metric-label">הוצאות 30 יום</div>
              <div className="metric-value">{sym}{Math.round(totals.spend).toLocaleString()}</div>
            </div>
            <div className="metric">
              <div className="metric-label">חשיפות</div>
              <div className="metric-value">{totals.impressions.toLocaleString()}</div>
            </div>
            <div className="metric">
              <div className="metric-label">קליקים</div>
              <div className="metric-value">{totals.clicks.toLocaleString()}</div>
            </div>
          </div>

          <div className="table-controls">
            <input
              type="text"
              placeholder="חפש קמפיין..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="search-input"
            />
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="filter-select">
              <option value="all">כל הסטטוסים</option>
              <option value="active">פעיל בלבד</option>
              <option value="paused">מושהה בלבד</option>
            </select>
            <button onClick={() => loadCampaigns(selectedAccount)} className="btn-outline">🔄 רענן</button>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>שם קמפיין</th>
                  <th>סטטוס</th>
                  <th>הוצאות</th>
                  <th>חשיפות</th>
                  <th>קליקים</th>
                  <th>CTR</th>
                  <th>CPM</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan="7" className="no-data">לא נמצאו קמפיינים</td></tr>
                )}
                {filtered.map(c => {
                  const ins = getInsight(c);
                  const spend = ins ? parseFloat(ins.spend) : 0;
                  const impressions = ins ? parseInt(ins.impressions) : 0;
                  const clicks = ins ? parseInt(ins.clicks) : 0;
                  const ctr = ins ? parseFloat(ins.ctr) : 0;
                  const cpm = ins ? parseFloat(ins.cpm) : 0;
                  const isActive = c.status === 'ACTIVE';
                  const barW = Math.round((spend / maxSpend) * 60);
                  return (
                    <tr key={c.id}>
                      <td className="name-cell">{c.name}</td>
                      <td>
                        <span className={`badge ${isActive ? 'badge-active' : 'badge-paused'}`}>
                          <span className={`dot ${isActive ? 'dot-active' : 'dot-paused'}`}></span>
                          {isActive ? 'פעיל' : 'מושהה'}
                        </span>
                      </td>
                      <td>
                        <div className="spend-cell">
                          <span>{sym}{Math.round(spend).toLocaleString()}</span>
                          <div className="spend-bar" style={{width: barW}}></div>
                        </div>
                      </td>
                      <td>{impressions.toLocaleString()}</td>
                      <td>{clicks.toLocaleString()}</td>
                      <td>{ctr.toFixed(2)}%</td>
                      <td>{sym}{cpm.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

export default App;
