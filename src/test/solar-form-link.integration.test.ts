import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';

// Run after a real browser submission with SOLAR_TEST_FIXTURE pointing to its temporary capability file.
// No credentials or prospect data are retained in the repository.
const fixturePath = process.env.SOLAR_TEST_FIXTURE;
describe.skipIf(!fixturePath)('solar simulation linked form submission', () => {
  let reference: string; let token: string; let url: string; let key: string;
  let adminHeaders: Record<string, string>;
  const rpc = async (name: string, body = {}) => {
    const response = await fetch(`${url}/rest/v1/rpc/${name}`, { method: 'POST', headers: adminHeaders, body: JSON.stringify(body) });
    expect(response.status).toBe(200);
    return response.json();
  };
  const linked = async () => (await rpc('get_admin_form_submissions')).filter((row: any) => row.data.simulationCode === reference);
  beforeAll(() => {
    if (!fixturePath) throw new Error('Browser fixture required');
    ({ reference, token } = JSON.parse(readFileSync(fixturePath, 'utf8')));
    const config = readFileSync('.env', 'utf8');
    const setting = (name: string) => config.match(new RegExp(`^${name}=["']?([^"'\\r\\n]+)`, 'm'))?.[1] ?? '';
    url = setting('VITE_SUPABASE_URL'); key = setting('VITE_SUPABASE_PUBLISHABLE_KEY');
    const session = JSON.parse(readFileSync(`${homedir()}/.cache/lovable-auth/session.json`, 'utf8'));
    adminHeaders = { apikey: key, Authorization: `Bearer ${session.session.access_token}`, 'Content-Type': 'application/json' };
  });
  it('counts one saved simulation as exactly one form submission', async () => {
    expect(await linked()).toHaveLength(1);
    const rows = await linked();
    const stats = await rpc('get_admin_form_submission_stats');
    const all = await rpc('get_admin_form_submissions', { p_form_id: rows[0].form_id });
    expect(stats[rows[0].form_id].total).toBe(all.length);
  });
  it('retains the server-captured IP, device and browser on the same form record', async () => {
    const { items } = await rpc('get_solar_simulations', { p_reference: reference });
    const [form] = await linked();
    expect(items[0].ip_address).toEqual(expect.any(String));
    expect(form.ip_address).toBe(items[0].ip_address);
    expect(items[0].device_type).toBe('Ordinateur');
    expect(items[0].browser).toMatch(/^Chrome /);
    expect(form.data.deviceType).toBe(items[0].device_type);
    expect(form.data.browser).toBe(items[0].browser);
  });
  it('completes contact details without duplicating the form record on retries', async () => {
    const [before] = await linked();
    const response = await fetch(`${url}/functions/v1/solar-simulation`, { method: 'POST', headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'attach', reference, token, contact: { email: 'solar-visit-check@example.com', phone: '0600000000', consent: { form_rgpd: true, terms_accepted: true } } }) });
    expect(response.status).toBe(200);
    const after = await linked();
    expect(after).toHaveLength(1);
    expect(after[0].id).toBe(before.id);
    expect(after[0].data.email).toBe('solar-visit-check@example.com');
    expect(after[0].data.firstName).toBe('Contrôle');
    expect(after[0].data.lastName).toBe('Solaire');
    expect(after[0].data.contactStatus).toBe('Coordonnées reçues');
  });
});