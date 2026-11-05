import { describe, it, expect, vi } from 'vitest';
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: vi.fn() } }));
import { applyNewsletterChoice } from '@/lib/articleNewsletter';
describe('Explicit publication newsletter choice', () => {
  it('Non does not request or send any newsletter', async () => {
    const request = vi.fn();
    expect(await applyNewsletterChoice('article-1', false, request)).toEqual({ status: 'not_requested' });
    expect(request).not.toHaveBeenCalled();
  });
  it('Oui requests only the published article selected', async () => {
    const request = vi.fn().mockResolvedValue({ status: 'blocked_provider' });
    await applyNewsletterChoice('article-2', true, request);
    expect(request).toHaveBeenCalledExactlyOnceWith('article-2');
  });
  it('A request failure is surfaced, not reported as delivered', async () => {
    const request = vi.fn().mockRejectedValue(new Error('Forbidden'));
    await expect(applyNewsletterChoice('article-3', true, request)).rejects.toThrow('Forbidden');
  });
});