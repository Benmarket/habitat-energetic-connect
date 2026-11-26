import { useState } from 'react';
import { ResultsPanel, detectRegion } from '@/pages/SimulateurSolaireLead';
import { getSolarReportState } from '@/lib/solar-archived-report';
import type { SolarSimulationRow } from '@/lib/solar-simulation-export';

/** The same result panel as the public simulator, fed only with saved values. */
export default function SolarArchivedReport({ row, exportMode = false }: { row: SolarSimulationRow; exportMode?: boolean }) {
  const [battery, setBattery] = useState<boolean | undefined>();
  const [optimal, setOptimal] = useState(false);
  const { engine, scenario, withBattery, mismatch, optimalValid } = getSolarReportState(row, optimal, battery);
  const sim = row.snapshot.inputs ?? {};
  const region = detectRegion(String(sim.postalCode ?? ''));
  const annualBill = Number(sim.monthlyBill || 0) * 12;
  const co2 = engine?.sans?.co2KgAn ?? 0;
  const props = {
    sim, region, annualBill, engine, engineOptimal: optimalValid ? row.snapshot.optimal : null,
    savingsMid: engine?.sans?.economiesAn ?? 0, savings25: engine?.sans?.economies25ans ?? 0,
    aidesMin: engine?.sans?.AIDES ?? 0, aidesMax: engine?.sans?.AIDES ?? 0,
    roi: engine?.sans?.rentabiliteAns ?? null, co2, trees: Math.round(co2 / 25),
    installCost: engine?.sans?.cout ?? 0,
    suggest: { kwc: scenario?.puissanceKwc ?? 0, panels: scenario?.nbPanneaux ?? 0 },
    showBattery: withBattery, setShowBattery: setBattery,
    savingsWithBattery: engine?.avec?.economiesAn ?? 0, batteryCost: engine?.batterie?.surcout ?? 0,
    roiWithBattery: engine?.avec?.rentabiliteAns ?? null,
    unlocked: true, viewOptimal: optimal, setViewOptimal: optimalValid ? setOptimal : undefined,
    // Comparison rows were saved for the actual orientation, not necessarily for the optimal view.
    compRows: optimal ? null : row.snapshot.comparisons,
    simulationCode: row.reference, archived: true, reportDate: row.snapshot.calculatedAt ?? row.created_at,
  };
  return <div className="min-w-0">
    {mismatch && <p role="alert" className="border border-destructive text-destructive rounded-lg p-4 mb-4">Le territoire du calcul enregistré ne correspond pas au code postal. Les résultats historiques sont conservés sans correction automatique.</p>}
    {!exportMode && <p className="text-sm text-muted-foreground mb-4">Rapport reconstitué à partir des résultats enregistrés, avec la présentation du simulateur. Aucun recalcul. La vue complète est ouverte ici, même sans contact recueilli ; les changements de vue du prospect n’étaient pas enregistrés.</p>}
    <ResultsPanel {...props} />
  </div>;
}
