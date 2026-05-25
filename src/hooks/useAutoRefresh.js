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
  }, []); // eslint-disable-line

  return { lastUpdated, secondsUntilRefresh, triggerRefresh };
}
