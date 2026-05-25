const FB_API = 'https://graph.facebook.com/v19.0';

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
// datePreset: 'last_7d' | 'last_14d' | 'last_30d'
export async function fetchCampaigns(accountId, token, datePreset = 'last_30d') {
  if (!token) throw new Error('Access token is required');
  const fields = [
    'name',
    'status',
    'objective',
    `insights.date_preset(${datePreset}){spend,impressions,clicks,ctr,cpm,reach,actions,purchase_roas}`,
  ].join(',');

  const res = await fetch(
    `${FB_API}/${accountId}/campaigns?fields=${fields}&limit=100&access_token=${token}`
  );
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  return data.data || [];
}

// Fetch daily time-series data for the chart
// datePreset: 'last_7d' | 'last_14d' | 'last_30d'
export async function fetchDailyInsights(accountId, token, datePreset = 'last_30d') {
  if (!token) throw new Error('Access token is required');
  const res = await fetch(
    `${FB_API}/${accountId}/insights?fields=spend,impressions,clicks,actions&date_preset=${datePreset}&time_increment=1&access_token=${token}`
  );
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  return data.data || [];
}

// Conversion action types we treat as "leads"
const CONVERSION_TYPES = [
  'lead',                                                    // Lead Gen form
  'onsite_conversion.lead_grouped',                          // Lead Gen (grouped)
  'onsite_conversion.messaging_conversation_started_7d',     // WhatsApp / Messenger שיחה נפתחה
  'onsite_conversion.messaging_first_reply',                 // WhatsApp תשובה ראשונה
  'onsite_conversion.messaging_welcome_message_views',       // WhatsApp welcome view
];

// Helper: extract conversion count from actions array (leads OR WhatsApp conversations)
export function getLeads(actions = []) {
  // Sum all matching conversion types (campaign might have multiple)
  const total = actions
    .filter((a) => CONVERSION_TYPES.includes(a.action_type))
    .reduce((sum, a) => sum + parseInt(a.value, 10), 0);
  return total;
}

// Helper: extract ROAS from purchase_roas array
export function getRoas(purchaseRoas = []) {
  if (!purchaseRoas || purchaseRoas.length === 0) return null;
  return parseFloat(purchaseRoas[0].value);
}
