// Helper partagé pour transformer une valeur brute de "type de travaux"
// (slug venant des <Select> des formulaires) en libellé lisible humain
// pour l'affichage dans les emails (récap, sujet, etc.).
//
// Utilisé par :
//   - send-transactional-email (réécriture de templateData.requestSummary)
//   - admin-preview-emails (mêmes données réalistes)
//
// Aucune dépendance externe, sûr à importer côté Deno.

const WORK_TYPE_LABELS: Record<string, string> = {
  // Solaire / photovoltaïque
  'energie-solaire': 'Panneaux photovoltaïques',
  'panneaux-photovoltaiques': 'Panneaux photovoltaïques',
  'panneaux-solaires': 'Panneaux photovoltaïques',
  'solaire': 'Panneaux photovoltaïques',
  'photovoltaique': 'Panneaux photovoltaïques',

  // Pompe à chaleur / chauffage
  'pompe-a-chaleur': 'Pompe à chaleur',
  'pac': 'Pompe à chaleur',
  'chauffage': 'Chauffage',

  // Isolation
  'isolation': 'Isolation',
  'isolation-combles': 'Isolation des combles',
  'isolation-murs': 'Isolation des murs',

  // Rénovation
  'renovation-globale': 'Rénovation globale',
  'renovation': 'Rénovation énergétique',

  // Divers
  'ne-sait-pas': 'À définir avec un conseiller',
  'autre': 'Autre projet',
  'other': 'Autre projet',
}

/**
 * Convertit un slug `workType` en libellé lisible.
 * Si la valeur n'est pas connue, on la nettoie en remplaçant les tirets
 * par des espaces et en capitalisant la première lettre.
 */
export function formatWorkTypeLabel(value: string | undefined | null): string {
  if (!value) return ''
  const raw = String(value).trim()
  if (!raw) return ''
  const key = raw.toLowerCase()
  if (WORK_TYPE_LABELS[key]) return WORK_TYPE_LABELS[key]
  // Fallback : "mon-truc-cool" -> "Mon truc cool"
  const cleaned = key.replace(/[-_]+/g, ' ').trim()
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
}

/**
 * Réécrit un `requestSummary` pour remplacer tout token qui ressemble à
 * un slug technique par son libellé humain.
 * Le séparateur " • " (utilisé partout dans le projet) est préservé.
 */
export function humanizeRequestSummary(summary: string | undefined | null): string {
  if (!summary) return ''
  const text = String(summary).trim()
  if (!text) return ''

  // Cas 1 : pas de séparateur, le résumé est juste un slug -> map direct
  if (!text.includes('•') && !text.includes(' ')) {
    return formatWorkTypeLabel(text)
  }

  // Cas 2 : segments séparés par " • " — on traite uniquement le premier
  // (qui contient le type de travaux), les autres sont géo / contexte.
  const parts = text.split('•').map((p) => p.trim())
  if (parts.length > 0 && parts[0]) {
    parts[0] = formatWorkTypeLabel(parts[0]) || parts[0]
  }
  return parts.join(' • ')
}
