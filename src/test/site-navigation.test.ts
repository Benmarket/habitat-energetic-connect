import { describe, expect, it } from 'vitest';
import { sectionDestination } from '@/lib/site-navigation';
describe('Shared site navigation', () => {
  it('uses the configured simulator section instead of a missing page', () => {
    expect(sectionDestination([{ id: 'simulators', anchor: '#simulateurs', visible: true }], 'simulators', '/simulateurs/solaire')).toBe('/#simulateurs');
  });
  it('follows edited anchors for both viewport menus', () => {
    expect(sectionDestination([{ id: 'simulators', anchor: '#calculs', visible: true }], 'simulators', '/simulateurs/solaire')).toBe('/#calculs');
  });
  it('falls back to the existing solar page if the section is hidden', () => {
    expect(sectionDestination([{ id: 'simulators', anchor: '#simulateurs', visible: false }], 'simulators', '/simulateurs/solaire')).toBe('/simulateurs/solaire');
  });
});