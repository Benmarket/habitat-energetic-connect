import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const config = readFileSync('.env', 'utf8');
const setting = (key: string) => config.match(new RegExp(`^${key}=["']?([^"'\\r\\n]+)`, 'm'))?.[1] ?? '';
const url = setting('VITE_SUPABASE_URL');
const key = setting('VITE_SUPABASE_PUBLISHABLE_KEY');
const headers = { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };

describe('selected access protections', () => {
  it('does not expose permissions to anonymous visitors', async () => {
    const response = await fetch(`${url}/rest/v1/permissions?select=code`, { headers });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([]);
  });

  it('keeps public simulator references and categories readable', async () => {
    for (const table of ['equipment_savings_reference', 'solar_simulator_regions', 'solar_simulator_powers', 'solar_simulator_global_params', 'categories', 'tags', 'authors', 'landing_pages', 'economies_settings', 'ad_region_featured']) {
      const response = await fetch(`${url}/rest/v1/${table}?select=id&limit=1`, { headers });
      expect(response.status, table).toBe(200);
      expect(Array.isArray(await response.json()), table).toBe(true);
    }
  });

  it('rejects direct anonymous event injection', async () => {
    const response = await fetch(`${url}/rest/v1/simulator_tracking_events`, {
      method: 'POST', headers,
      body: JSON.stringify({ session_id: '00000000-0000-0000-0000-000000000000', simulator_id: 'security-test', event_type: 'session_start' }),
    });
    expect(response.status).toBe(401);
  });

  it('rejects malformed public reviews', async () => {
    const response = await fetch(`${url}/rest/v1/internal_reviews`, {
      method: 'POST', headers,
      body: JSON.stringify({ full_name: 'Security test', email: 'invalid', rating: 6 }),
    });
    expect(response.status).toBe(401);
  });
});