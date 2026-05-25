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
