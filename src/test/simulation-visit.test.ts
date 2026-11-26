import { describe, expect, it } from 'vitest';
import { simulationVisit } from '../../supabase/functions/_shared/simulation-visit';

describe('simulation visit metadata', () => {
  it('captures the request IP, not the proxy chain', () => {
    expect(simulationVisit(new Headers({ 'x-forwarded-for': '192.0.2.10, 10.0.0.1' })).ip_address).toBe('192.0.2.10');
    expect(simulationVisit(new Headers({ 'cf-connecting-ip': '2001:db8::1', 'x-forwarded-for': '192.0.2.10' })).ip_address).toBe('2001:db8::1');
  });
  it('identifies a mobile device', () => {
    expect(simulationVisit(new Headers({ 'user-agent': 'Mozilla/5.0 (iPhone) Version/18.0 Mobile/15E148 Safari/604.1' })).device_type).toBe('Mobile');
    expect(simulationVisit(new Headers({ 'user-agent': 'Mozilla/5.0 (iPad) Version/18.0 Safari/604.1' })).device_type).toBe('Tablette');
  });
  it('identifies the browser rather than its compatibility tokens', () => {
    expect(simulationVisit(new Headers({ 'user-agent': 'Mozilla/5.0 (Windows NT 10.0) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.1' })).browser).toBe('Microsoft Edge 130.0.1');
    expect(simulationVisit(new Headers({ 'user-agent': 'Mozilla/5.0 (iPhone) Version/18.0 Mobile/15E148 Safari/604.1' })).browser).toBe('Safari 18.0');
  });
  it('does not invent metadata for historical records or missing headers', () => {
    expect(simulationVisit(new Headers())).toEqual({ ip_address: null, user_agent: null, device_type: null, browser: null });
  });
});