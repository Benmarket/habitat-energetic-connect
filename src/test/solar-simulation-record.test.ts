import { describe, it, expect } from 'vitest';
import { buildSolarSnapshot, isSimulationReference } from '../lib/solar-simulation-record';
describe('simulation reference and preserved results', () => {
  it('uses a simulation code, not an internal UUID', () => {
    expect(isSimulationReference('SIM-AABBCCDDEEFF00112233445566778899')).toBe(true);
    expect(isSimulationReference('aabbccdd-eeff-0011-2233-445566778899')).toBe(false);
  });
  it('keeps original inputs and result values without recalculation', () => {
    const inputs = { monthlyBill: 150, postalCode: '97400' }; const engine = { sans: { economiesAn: 860 }, avec: { economiesAn: 869 } };
    const snapshot = buildSolarSnapshot(inputs, engine, null, []);
    engine.avec.economiesAn = 0; inputs.monthlyBill = 200;
    expect(snapshot.inputs.monthlyBill).toBe(150); expect(snapshot.engine.avec.economiesAn).toBe(869); expect(snapshot.engine.sans.economiesAn).toBe(860);
  });
});