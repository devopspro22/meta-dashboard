const FB_API = 'https://graph.facebook.com/v19.0';

// Fetch all ad accounts for a token
export async function fetchAdAccounts(token) {
  if (!token) throw new Error('Access token is required');
  const res = await fetch(
    `${FB_API}/me/adaccounts?fields=name,account_id,currency,account_status&access_token=${token}`
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.data || [];
}

// Fetch campaigns with aggregate insights for a date range
// datePreset: 'last_7d' | 'last_14d' | 'last_30d'
export async function fetchCampaigns(accountId, token, datePreset = 'last_30d') {
  if (!token) throw new Error('Access token is required');
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
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.data || [];
}

// Fetch daily time-series data for the chart
// datePreset: 'last_7d' | 'last_14d' | 'last_30d'
export async function fetchDailyInsights(accountId, token, datePreset = 'last_30d') {
  if (!token) throw new Error('Access token is required');
  const res = await fetch(
    `${FB_API}/${accountId}/insights?fields=spend,impressions,clicks,actions&date_preset=${datePreset}&time_increment=1&access_token=${token}`
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
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
