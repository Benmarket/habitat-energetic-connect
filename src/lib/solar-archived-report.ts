import { territoireFromPostal } from './solar-data';
import type { SolarSimulationRow } from './solar-simulation-export';

/** Presentation-only selection: all financial and energy values come from the immutable snapshot. */
export function getSolarReportState(row: SolarSimulationRow, optimal = false, battery?: boolean) {
  const original = row.snapshot.engine;
  const expected = territoireFromPostal(String(row.snapshot.inputs?.postalCode ?? ''));
  const mismatch = !!(expected && original?.territoireId && expected !== original.territoireId);
  const optimalValid = !!row.snapshot.optimal && (!original?.territoireId || row.snapshot.optimal.territoireId === original.territoireId);
  const engine = optimal && optimalValid ? row.snapshot.optimal : original;
  const withBattery = battery ?? engine?.configRecommandee?.batterie ?? false;
  return { engine, scenario: withBattery ? engine?.avec : engine?.sans, withBattery, mismatch, expected, optimalValid };
}

const labels: Record<string, string> = {
  maison: 'Maison', appartement: 'Appartement', pro: 'Local professionnel', oui: 'Oui', non: 'Non', achat: 'Achat en cours',
  tuiles: 'Tuiles', ardoise: 'Ardoises', 'bac-acier': 'Bac acier', tole: 'Tôle', 'toit-plat': 'Toit plat',
  '3m': 'Le plus vite possible', '6m': 'Dans les six mois', '1a': 'Dans l’année', info: 'Je me renseigne',
  N: 'Nord', NE: 'Nord-Est', E: 'Est', SE: 'Sud-Est', S: 'Sud', SO: 'Sud-Ouest', O: 'Ouest', NO: 'Nord-Ouest', '?': 'À confirmer',
};
export const solarInputLabel = (value: unknown) => value == null || value === '' ? '' : labels[String(value)] ?? String(value);

/** Fixed readable CSV columns; no technical blobs, alternate territories or duplicate optimal scenarios. */
export function solarSummary(row: SolarSimulationRow): Record<string, unknown> {
  const { engine, scenario, withBattery, mismatch } = getSolarReportState(row);
  const inputs = row.snapshot.inputs ?? {};
  const result: Record<string, unknown> = {
    'Code simulation': row.reference, 'Date': new Date(row.created_at).toLocaleString('fr-FR'),
    'Prénom': row.first_name, 'Nom': row.last_name, 'Email': row.email, 'Téléphone': row.phone,
    'Contact recueilli': row.lead_id ? 'Oui' : 'Non', 'Ville': inputs.city, 'Code postal': inputs.postalCode,
    'Territoire du calcul': engine?.territoire, 'Cohérence territoire': mismatch ? 'À vérifier' : 'Cohérent',
    'Logement': solarInputLabel(inputs.housing), 'Surface (m²)': inputs.surface,
    'Propriétaire': solarInputLabel(inputs.ownership), 'Toiture': solarInputLabel(inputs.roofType),
    'Orientation renseignée': solarInputLabel(inputs.orientation), 'Délai du projet': solarInputLabel(inputs.projectHorizon),
    'Devis déjà reçu': solarInputLabel(inputs.hasQuote), 'Équipements': inputs.equipments?.join(', '),
    'Facture actuelle (€/mois)': inputs.monthlyBill, 'Consommation estimée (kWh/an)': engine?.consoAnnuelleKwh,
    'Configuration recommandée': engine ? (withBattery ? 'Avec batterie' : 'Sans batterie') : 'Étude personnalisée',
    'Puissance recommandée (kWc)': scenario?.puissanceKwc, 'Panneaux recommandés': scenario?.nbPanneaux,
  };
  const fields: Record<string, string> = {
    cout: 'Prix indicatif TTC (€)', AIDES: 'Aides estimées (€)', resteACharge: 'Reste à charge estimé (€)',
    economiesAn: 'Gains (€/an)', gainsMensuels: 'Gains (€/mois)', gainsMensuelsAutoconso: 'Autoconsommation (€/mois)',
    gainsMensuelsRevente: 'Revente nette (€/mois)', nouvelleFactureMensuelle: 'Nouvelle facture (€/mois)',
    couvertureBesoinsPct: 'Besoins couverts (%)', productionAnnuelleKwh: 'Production (kWh/an)',
    autoconsommee: 'Production consommée (kWh/an)', surplus: 'Surplus revendu (kWh/an)',
    gains25ans: 'Gains cumulés sur 25 ans (€)', gainNet25ans: 'Gain net sur 25 ans (€)', rentabiliteAns: 'Rentabilité (ans)',
  };
  for (const [key, label] of Object.entries(fields)) result[`Recommandation — ${label}`] = scenario?.[key];
  for (const [name, scenarioKey] of [['Sans batterie', 'sans'], ['Avec batterie', 'avec']]) {
    for (const key of ['cout', 'AIDES', 'resteACharge', 'economiesAn', 'nouvelleFactureMensuelle', 'couvertureBesoinsPct', 'gainNet25ans', 'rentabiliteAns']) {
      result[`${name} — ${fields[key]}`] = engine?.[scenarioKey]?.[key];
    }
  }
  return result;
}
