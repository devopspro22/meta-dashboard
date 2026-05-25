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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
