# 📊 Système de Tracking des Simulateurs — Documentation interne

> Document interne — non exposé en ligne (à la racine du repo, ignoré par le build public).
> Dernière mise à jour : 15 juillet 2026.

---

## 1. Objectif

Mesurer **le taux d'abandon** sur les formulaires de simulateurs, étape par étape, avec identification du visiteur (session + IP + email si saisi), source de trafic (referrer + UTM + détection IA/social/SEO), et historique des tentatives multiples par visiteur.

Périmètre : **tous les simulateurs** listés dans `Admin › Simulateurs` (actuellement instrumenté : Simulateur Solaire Lead, extensible aux autres).

---

## 2. Architecture

### 2.1 Base de données

Deux tables créées via migration `20260715164744_*.sql` :

#### `simulator_tracking_sessions`
Une ligne = une tentative de remplissage par un visiteur.

| Champ | Rôle |
|---|---|
| `session_id` | UUID stable stocké en `localStorage` côté visiteur |
| `visitor_fingerprint` | Empreinte navigateur (UA + langue + résolution + timezone hashés) |
| `ip_address` | IP capturée côté edge (headers `x-forwarded-for`) |
| `user_id` | Rempli si visiteur connecté |
| `email` | Rempli rétroactivement quand le lead est capturé |
| `simulator_slug` | Ex. `solaire-lead` |
| `source` | `google`, `bing`, `chatgpt`, `perplexity`, `gemini`, `claude`, `copilot`, `facebook`, `instagram`, `tiktok`, `linkedin`, `direct`, `other` |
| `referrer_url` | URL brute du referrer |
| `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term` | Paramètres UTM parsés |
| `landing_url` | 1re URL sur laquelle le visiteur a atterri |
| `max_step_reached` | Étape max atteinte (1 → N) |
| `completed` | `true` si le lead final a été enregistré |
| `abandoned_at` | Timestamp du dernier `beforeunload` sans complétion |
| `attempt_number` | Nb de tentatives du visiteur sur ce simulateur (2 = revenu, 3 = 3e essai…) |

#### `simulator_tracking_events`
Une ligne = un événement dans une session.

| Champ | Rôle |
|---|---|
| `session_id` | FK vers `simulator_tracking_sessions` |
| `event_type` | `session_start` \| `step_view` \| `step_complete` \| `lead_captured` \| `completion` \| `abandon` |
| `step_number` | Étape concernée (nullable) |
| `step_label` | Ex. `nom_complet`, `email_phone` |
| `payload` | JSONB libre (temps passé, champ modifié…) |

### 2.2 RLS
- **Lecture** : `admin` et `super_admin` uniquement (via `has_role`).
- **Insertion** : ouverte à `anon` + `authenticated` (visiteur anonyme doit pouvoir tracker).
- **Update** : uniquement sur ses propres lignes via `session_id` (pas de PII exposée).

### 2.3 RPC
- `get_simulator_tracking_stats(p_simulator_slug, p_from, p_to)` — `SECURITY DEFINER`, admin-only : renvoie KPIs, funnel, timeline, sources agrégés.

---

## 3. Frontend

### 3.1 Hook `useSimulatorTracking`
`src/hooks/useSimulatorTracking.tsx`

```ts
const { trackStep, trackLead, trackCompletion } = useSimulatorTracking({
  simulatorSlug: "solaire-lead",
  totalSteps: 9,
});
```

Cycle de vie :
1. **Mount** → génère/récupère `session_id` en localStorage → `INSERT` session (avec detection source) → `event: session_start`.
2. **Chaque étape** → `trackStep(n, label)` → `event: step_view` + update `max_step_reached`.
3. **Capture email/tel** → `trackLead(email)` → update `email` sur la session.
4. **Fin du formulaire** → `trackCompletion()` → `completed=true` + `event: completion`.
5. **`beforeunload`** avant complétion → `event: abandon` + `abandoned_at`.

### 3.2 Détection de source
Regex sur `document.referrer` + `URLSearchParams`. Ordre de priorité :
1. UTM (`utm_source` gagne toujours).
2. Referrer hostname matché contre une table (`google.*`, `chatgpt.com`, `perplexity.ai`, `gemini.google.com`, `claude.ai`, `copilot.microsoft.com`, `bing.com`, `duckduckgo.com`, `qwant.com`, `ecosia.org`, `facebook.com`, `l.facebook.com`, `instagram.com`, `t.co`, `linkedin.com`, `tiktok.com`, `youtube.com`).
3. Sinon `direct`.

### 3.3 Fingerprint
Léger — pas de librairie externe : `btoa(navigator.userAgent + '|' + navigator.language + '|' + screen.width + 'x' + screen.height + '|' + Intl.DateTimeFormat().resolvedOptions().timeZone)`. Suffisant pour rapprocher plusieurs sessions d'un même visiteur qui vide ses cookies.

---

## 4. Admin — `Admin › Simulateurs › Statistiques`

Composant : `src/components/admin/SimulatorTrackingStats.tsx`.

### 4.1 KPIs (7 cartes)
- Tentatives totales
- Complétions
- Taux de conversion global
- Abandons
- Visiteurs uniques (distinct `visitor_fingerprint`)
- Utilisateurs récurrents (visiteurs avec `attempt_number ≥ 2`)
- Étape moyenne atteinte

### 4.2 Visualisations
- **Funnel** — bar chart : nb de sessions ayant atteint étape N, avec % de drop-off entre chaque étape.
- **Timeline** — courbe quotidienne : tentatives vs complétions.
- **Sources** — pie + tableau avec taux de conversion par source.

### 4.3 Table sessions
Colonnes : `session_id` (tronqué), email, source, UTM, étape max, nb tentatives, dernière activité, statut (complété / abandonné / en cours).

### 4.4 Sélecteur de date
Presets : 7j / 30j / 90j / custom range.

---

## 5. Extension à d'autres simulateurs

Pour instrumenter un nouveau simulateur :

```tsx
// 1. Ajouter dans le composant simulateur
const tracking = useSimulatorTracking({
  simulatorSlug: "<slug-unique>",
  totalSteps: <N>,
});

// 2. À chaque changement d'étape
useEffect(() => {
  tracking.trackStep(currentStep, stepLabels[currentStep]);
}, [currentStep]);

// 3. Après capture email
tracking.trackLead(email);

// 4. Après enregistrement lead final
tracking.trackCompletion();
```

Le slug doit correspondre à celui listé dans `AdminSimulators.tsx` pour que le tab Stats affiche les bonnes données.

---

## 6. Points d'attention

- **RGPD** : le tracking IP + fingerprint tourne sans consentement explicite pour l'instant (choix produit). Si le cookie banner évolue en mode "refuse tracking", il faudra gater `useSimulatorTracking` derrière `hasConsent('analytics')`.
- **Volume** : 1 session ≈ 3-10 events. Prévoir une purge (ex. `DELETE FROM simulator_tracking_events WHERE created_at < now() - interval '12 months'`) via cron edge si le volume explose.
- **Fingerprint** : peu précis (collisions entre navigateurs identiques). Utile en complément, pas en identifiant primaire.
- **IP** : capturée uniquement si la table est écrite via une edge function relay. Actuellement écrite en direct depuis le client → IP absente sauf si on ajoute une edge function `track-simulator-event`. **À faire si besoin d'attribution géographique fiable.**

---

## 7. Fichiers concernés

- `supabase/migrations/20260715164744_*.sql`
- `src/hooks/useSimulatorTracking.tsx`
- `src/components/admin/SimulatorTrackingStats.tsx`
- `src/pages/AdminSimulators.tsx` (ajout du tab)
- `src/pages/SimulateurSolaireLead.tsx` (instrumentation)
- `src/integrations/supabase/types.ts` (regénéré auto)

---

_Document interne Prime Énergies — ne pas publier._
