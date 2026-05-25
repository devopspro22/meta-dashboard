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
