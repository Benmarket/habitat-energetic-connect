import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
const hash = async (value: string) => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)))).map(b => b.toString(16).padStart(2, '0')).join('');
Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  try {
    const body = await req.json();
    if (typeof body.token !== 'string' || !/^[a-f0-9-]{36}$/i.test(body.token)) return json({ error: 'Invalid capability' }, 400);
    const url = Deno.env.get('SUPABASE_URL'); const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!url || !key) return json({ error: 'Unavailable' }, 503);
    const admin = createClient(url, key, { auth: { persistSession: false } });
    const access_hash = await hash(body.token);
    if (body.action === 'create') {
      const snapshot = body.snapshot;
      if (!snapshot || JSON.stringify(snapshot).length > 180000 || !/^\d{5}$/.test(snapshot.inputs?.postalCode ?? '') || snapshot.engine?.statut !== 'OK') return json({ error: 'Invalid snapshot' }, 400);
      const ip = req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
      const { data: allowed, error: rateError } = await admin.rpc('check_edge_rate', { p_identifier: ip, p_endpoint: 'solar-simulation', p_max_per_hour: 30 });
      if (rateError || !allowed) return json({ error: 'Rate limited' }, 429);
      // The unique constraint is authoritative; a collision generates a new reference.
      for (let attempt = 0; attempt < 3; attempt++) {
        const { data, error } = await admin.from('solar_simulations').insert({ snapshot, access_hash }).select('reference').single();
        if (!error && data) {
          await admin.from('edge_rate_limits').insert({ identifier: ip, endpoint: 'solar-simulation' });
          return json({ reference: data.reference });
        }
        if (error?.code !== '23505') return json({ error: 'Unable to save simulation' }, 500);
      }
      return json({ error: 'Unable to allocate reference' }, 503);
    }
    if (typeof body.reference !== 'string' || !/^SIM-[A-F0-9]{32}$/.test(body.reference)) return json({ error: 'Invalid reference' }, 400);
    if (body.action === 'attach') {
      const contact = body.contact;
      if (!contact || typeof contact.email !== 'string' || contact.email.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email) || typeof contact.phone !== 'string' || !/^[\d\s+\-().]{8,30}$/.test(contact.phone) || contact.consent?.form_rgpd !== true || contact.consent?.terms_accepted !== true) return json({ error: 'Invalid contact or consent' }, 400);
      const { data, error } = await admin.rpc('attach_solar_simulation', { p_reference: body.reference, p_access_hash: access_hash, p_contact: contact });
      if (error) return json({ error: 'Unable to save contact' }, 400);
      return json(data);
    }
    if (body.action === 'name') {
      if (typeof body.fullName !== 'string' || body.fullName.trim().length < 2 || body.fullName.length > 120) return json({ error: 'Invalid name' }, 400);
      const { data: s } = await admin.from('solar_simulations').select('lead_id,created_at').eq('reference', body.reference).eq('access_hash', access_hash).maybeSingle();
      if (!s?.lead_id || Date.now() - new Date(s.created_at).getTime() > 86400000) return json({ error: 'Forbidden' }, 403);
      const parts = body.fullName.trim().split(/\s+/);
      const { error } = await admin.from('leads').update({ first_name: parts[0], last_name: parts.slice(1).join(' ') || parts[0] }).eq('id', s.lead_id);
      return error ? json({ error: 'Unable to save name' }, 500) : json({ ok: true });
    }
    return json({ error: 'Unknown action' }, 400);
  } catch { return json({ error: 'Invalid request' }, 400); }
});