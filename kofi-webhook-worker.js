// Cloudflare Worker for Ko-fi webhook → auto-assign donation to campaign
// Deploy this and set the URL in your Ko-fi webhooks page.

const KOFI_TOKEN = '0ce82fe4-d09f-4dbc-8613-ab8812d78e6d';
const SUPABASE_URL = 'https://dmvldmffdwzgqnjfrrww.supabase.co';
const SUPABASE_KEY = 'sb_publishable_hSBxsefa3AzA7sLngR07Vw_ruW60q_h';

export default {
  async fetch(request) {
    if (request.method !== 'POST') return new Response('ok', { status: 200 });

    let form;
    try {
      form = await request.formData();
    } catch (e) {
      return new Response('bad form', { status: 400 });
    }

    const raw = form.get('data');
    if (!raw) return new Response('no data', { status: 400 });

    let payload;
    try {
      payload = JSON.parse(raw);
    } catch (e) {
      return new Response('bad json', { status: 400 });
    }

    if (payload.verification_token !== KOFI_TOKEN) {
      return new Response('unauthorized', { status: 401 });
    }

    if (payload.type !== 'Donation' && payload.type !== 'Subscription') {
      return new Response('ignored', { status: 200 });
    }

    const amount = Number(payload.amount) || 0;
    const donor = payload.from_name || 'Anonymous';
    const note = payload.message || '';

    // Find most recent intent in last 10 minutes
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const intentRes = await fetch(
      SUPABASE_URL + '/rest/v1/donation_intents?created_at=gte.' + encodeURIComponent(tenMinAgo) + '&order=created_at.desc&limit=5',
      { headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY } }
    );
    const intents = await intentRes.json().catch(() => []);

    let campaignId = '';
    if (Array.isArray(intents) && intents.length) {
      // Prefer exact amount match if possible, else most recent
      const exact = intents.find(i => Number(i.amount) === amount);
      campaignId = (exact || intents[0]).campaign_id || '';
    }

    if (!campaignId) {
      return new Response(JSON.stringify({ ok: true, matched: false }), { status: 200 });
    }

    // Insert gift
    const gift = {
      id: 'g_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      campaign_id: campaignId,
      donor: donor,
      amount: amount,
      note: note,
      title: ''
    };

    await fetch(SUPABASE_URL + '/rest/v1/gifts', {
      method: 'POST',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: 'Bearer ' + SUPABASE_KEY,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal'
      },
      body: JSON.stringify(gift)
    });

    // Optional: delete used intent
    if (intents[0] && intents[0].id) {
      await fetch(SUPABASE_URL + '/rest/v1/donation_intents?id=eq.' + encodeURIComponent(intents[0].id), {
        method: 'DELETE',
        headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY }
      }).catch(() => {});
    }

    return new Response(JSON.stringify({ ok: true, matched: true, campaignId, amount, donor }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
