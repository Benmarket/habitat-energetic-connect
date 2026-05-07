
# Page /economies — Espace membre "Mes économies réalisées"

## Objectif
Créer une fiche technique du logement de l'utilisateur connecté, visualisée en maison 3D générique avec mise en évidence des équipements possédés, et estimation globale des économies réalisées + potentielles.

## Règles d'accès & SEO
- Réservée aux utilisateurs connectés (redirect `/auth` sinon)
- `noindex, nofollow` + ajout `Disallow: /economies` dans `robots.txt`
- Si **locataire** OU **appartement** → écran de blocage avec explication + CTA forum/contact
- Un toggle admin (`/admin/settings` ou nouvelle page `/admin/economies-access`) permettra de débloquer l'accès aux locataires/appartements globalement

## Parcours utilisateur (wizard 6 étapes, état persisté en BDD)

```
1. Profil logement     → Locataire/Proprio + Maison/Appart (cases style EligibilityForm)
   ↓ (si bloqué : écran "Réservé aux propriétaires de maison")
2. Adresse             → Champ + carte (réutilise composant simulateur solaire)
3. Surface m²          → Pré-rempli depuis dernier lead/simulation, éditable
4. Équipements         → Checklist simple par catégorie (chauffage, solaire,
                          isolation, ECS, ventilation) + champ facultatif
                          "Installé par qui ?" par équipement
                         → Si données existent dans leads/simulations : pré-coche
                            et affiche "Confirmez ou modifiez"
5. DPE                 → Estimation auto (surface + équipements + zone) avec
                          mention "estimation, pas valeur certifiée" + CTA
                          /services/audit-energetique
6. Dashboard final     → Maison 3D + cards économies + recommandations
```

## Dashboard final (étape 6)
- **Maison 3D générique** (extension de `Solar3DShowcase`) : highlight des zones selon équipements cochés (toit = panneaux/solaire thermique, murs = ITE, combles = isolation, intérieur = PAC/poêle…)
- **Card "Vos économies estimées"** : total €/an global + texte explicatif
- **Liste des équipements** : chaque ligne cliquable → modal/panel avec détail "ce que cet équipement vous fait économiser" (ou "vous ferait économiser" si non possédé)
- **Recommandations** : équipements manquants pertinents avec CTA vers simulateur/aides
- **DPE estimé** badge couleur A→G + lien audit énergétique

## Architecture technique

### Tables BDD (migration)
- `member_home_profiles` (1 par user)
  - `user_id` (FK profiles), `housing_status` (proprio/locataire), `housing_type` (maison/appartement)
  - `address`, `postal_code`, `city`, `latitude`, `longitude`
  - `surface_m2`, `dpe_estimated` (A-G), `dpe_user_provided` (bool)
  - `wizard_step_completed` (int), `completed_at`
- `member_home_equipments` (N par profile)
  - `profile_id`, `category` (heating/solar/insulation/water/ventilation), `equipment_key`, `details` (jsonb : nb panneaux, batterie, surface isolée…), `installed_by` (text, nullable), `status` (owned/wanted)
- `equipment_savings_reference` (table admin éditable)
  - `equipment_key`, `category`, `label`, `avg_savings_per_year_eur`, `avg_savings_per_m2_eur`, `description`, `eligible_aids` (text[])
- `economies_settings` (singleton)
  - `allow_tenants` (bool, default false), `allow_apartments` (bool, default false)

### Fichiers à créer
- `src/pages/Economies.tsx` (orchestrateur wizard)
- `src/components/economies/StepHousingProfile.tsx`
- `src/components/economies/StepAddress.tsx`
- `src/components/economies/StepSurface.tsx`
- `src/components/economies/StepEquipments.tsx`
- `src/components/economies/StepDPE.tsx`
- `src/components/economies/Dashboard.tsx`
- `src/components/economies/House3DGeneric.tsx` (Three Fiber)
- `src/components/economies/BlockedAccess.tsx`
- `src/hooks/useMemberHomeProfile.ts`
- `src/lib/dpeCalculator.ts` (estimation simple)
- `src/lib/economiesCalculator.ts`
- `src/pages/AdminEconomiesAccess.tsx` (toggle locataires/appart)

### Fichiers à modifier
- `src/App.tsx` : route `/economies` (auth-guarded) + route admin
- `public/robots.txt` : `Disallow: /economies`
- `index.html` head : meta noindex injectée côté composant via Helmet
- `src/pages/AdminApp.tsx` (ou navigation admin) : entrée vers AdminEconomiesAccess

### RLS
- `member_home_profiles` / `member_home_equipments` : user lit/écrit le sien, admins lisent tout
- `equipment_savings_reference` : public read, admin write
- `economies_settings` : public read, super_admin write

## Ce que je NE fais pas dans ce premier jet
- Pas de calculs DPE ultra-précis (méthode 3CL réglementaire) → estimation simple basée sur ratio kWh/m² par équipement
- Pas d'éditeur admin pour `equipment_savings_reference` (seed initial via migration, édition future)
- Pas de comparatif national / gamification

## Confirmation avant lancement
Si OK je commence par : migration BDD + seed équipements + route + wizard. Le dashboard 3D sera la 2e passe.
