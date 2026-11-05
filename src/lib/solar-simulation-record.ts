/** A public reference identifies a report; its separate capability never appears in the report. */
export const isSimulationReference = (value: unknown): value is string =>
  typeof value === 'string' && /^SIM-[A-F0-9]{32}$/.test(value);

export function buildSolarSnapshot(inputs: unknown, engine: unknown, optimal: unknown, comparisons: unknown) {
  return JSON.parse(JSON.stringify({ version: 1, calculatedAt: new Date().toISOString(), inputs, engine, optimal, comparisons }));
}