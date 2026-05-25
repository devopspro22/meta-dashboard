const FB_API = 'https://graph.facebook.com/v19.0';

// Build date parameter string for API calls
// dateConfig: string preset ('last_30d') or object ({ since: 'YYYY-MM-DD', until: 'YYYY-MM-DD' })
function buildDateParam(dateConfig) {
  if (dateConfig && typeof dateConfig === 'object') {
    return `time_range=${encodeURIComponent(JSON.stringify({ since: dateConfig.since, until: dateConfig.until }))}`;
  }
  return `date_preset=${dateConfig || 'last_30d'}`;
}

// Fetch all ad accounts for a token
export async function fetchAdAccounts(token) {
  if (!token) throw new Error('Access token is required');
  const res = await fetch(
    `${FB_API}/me/adaccounts?fields=name,currency,account_status&access_token=${token}`
  );
  // Always parse JSON first — Meta API returns error details in JSON even on 4xx
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  return data.data || [];
}

// Fetch campaigns with aggregate insights for a date range
// dateConfig: preset string ('last_30d') or { since, until } object
export async function fetchCampaigns(accountId, token, dateConfig = 'last_30d') {
  if (!token) throw new Error('Access token is required');

  // For nested insights, date must be embedded in the field selector itself.
  // Presets use date_preset(X), custom dates use time_range({"since":...,"until":...})
  let insightsParam;
  if (typeof dateConfig === 'object') {
    const tr = JSON.stringify({ since: dateConfig.since, until: dateConfig.until });
    insightsParam = `insights.time_range(${tr}){spend,impressions,clicks,ctr,cpm,reach,actions,purchase_roas}`;
  } else {
    insightsParam = `insights.date_preset(${dateConfig}){spend,impressions,clicks,ctr,cpm,reach,actions,purchase_roas}`;
  }

  const fields = ['name', 'status', 'objective', insightsParam].join(',');

  const res = await fetch(
    `${FB_API}/${accountId}/campaigns?fields=${encodeURIComponent(fields)}&limit=100&access_token=${token}`
  );
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  return data.data || [];
}

// Fetch daily time-series data for the chart
// dateConfig: preset string ('last_30d') or { since, until } object
export async function fetchDailyInsights(accountId, token, dateConfig = 'last_30d') {
  if (!token) throw new Error('Access token is required');
  const dateParam = buildDateParam(dateConfig);
  const res = await fetch(
    `${FB_API}/${accountId}/insights?fields=spend,impressions,clicks,actions&${dateParam}&time_increment=1&access_token=${token}`
  );
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  return data.data || [];
}

// Helper: extract conversion count from actions array
// Uses a priority system to avoid double-counting across action types.
export function getLeads(actions = []) {
  if (!actions || actions.length === 0) return 0;

  const find = (type) => actions.find((a) => a.action_type === type);
  const val  = (a)    => parseInt(a.value, 10) || 0;

  // 1. Lead Gen form submit — the canonical metric for lead-form campaigns
  const formLead = find('lead');
  if (formLead) return val(formLead);

  // 2. WhatsApp conversation started — for messaging/WhatsApp campaigns
  const waConv = find('onsite_conversion.messaging_conversation_started_7d');
  if (waConv) return val(waConv);

  // 3. Messenger first reply — fallback for messaging campaigns
  const reply = find('onsite_conversion.messaging_first_reply');
  if (reply) return val(reply);

  return 0;
}

// Helper: extract ROAS from purchase_roas array
export function getRoas(purchaseRoas = []) {
  if (!purchaseRoas || purchaseRoas.length === 0) return null;
  return parseFloat(purchaseRoas[0].value);
}
