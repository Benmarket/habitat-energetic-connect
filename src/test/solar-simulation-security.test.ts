import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
const config = readFileSync('.env', 'utf8');
const setting = (key: string) => config.match(new RegExp(`^${key}=["']?([^"'\\r\\n]+)`, 'm'))?.[1] ?? '';
const url = setting('VITE_SUPABASE_URL');
const key = setting('VITE_SUPABASE_PUBLISHABLE_KEY');
const headers = { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };
describe('private solar report access', () => {
  it('anonymous visitors cannot list private simulations', async () => {
    const response = await fetch(`${url}/rest/v1/solar_simulations?select=reference`, { headers });
    const body = await response.json();
    expect(response.status === 401 || (response.status === 200 && Array.isArray(body) && body.length === 0)).toBe(true);
  });
  it('anonymous visitors cannot invoke admin search', async () => {
    const response = await fetch(`${url}/rest/v1/rpc/get_solar_simulations`, { method: 'POST', headers, body: '{}' });
    expect(response.status).toBe(401);
  });
  it('a public reference alone cannot link a contact', async () => {
    const response = await fetch(`${url}/functions/v1/solar-simulation`, { method: 'POST', headers, body: JSON.stringify({ action: 'attach', reference: 'SIM-33563FBC7FC04564AB356F3F0327816A', token: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', contact: { email: 'security-test@example.com', phone: '0600000000', consent: { form_rgpd: true, terms_accepted: true } } }) });
    expect(response.status).toBe(400);
  });
});