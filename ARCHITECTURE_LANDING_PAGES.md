# Architecture Landing Pages — Système Hiérarchique "Tiroirs"

> Document de référence — Mars 2026

---

## 1. Contrainte technique : SPA React (pas de SSG natif)

**Ce projet est un SPA React (Vite + React Router).** Il n'utilise pas Next.js et ne supporte pas nativement SSG/ISR.

### Stratégie de rendu pour le SEO

| Couche | Rôle |
|--------|------|
| **React Router** | Routing dynamique `/landing/:product/:region?/:variant?` |
| **Edge Function `crawler-handler`** | Sert du HTML pré-rendu aux bots (Googlebot, GPTBot, Bingbot) avec meta tags, JSON-LD, et contenu textuel complet |
| **Sitemap dynamique** | Edge Function `generate-sitemap` génère toutes les URLs hiérarchiques |
| **React Helmet** | Meta tags côté client pour les utilisateurs humains |

> **Résultat** : chaque URL est indexable par Google et les moteurs IA, même sans SSG.

---

## 2. Architecture URL

### Structure hiérarchique à 3 niveaux

```
/landing/{product}                          → Niveau 0 : LP nationale (tiroir parent)
/landing/{product}/{region}                 → Niveau 1 : Déclinaison régionale
/landing/{product}/{region}/{variant}       → Niveau 2 : Variante produit régionale
```

### Arborescence complète

```
/landing/solaire                                ← Tiroir parent
├── /landing/solaire/corse
│   ├── /landing/solaire/corse/batterie
│   └── /landing/solaire/corse/autoconsommation
├── /landing/solaire/guadeloupe
│   ├── /landing/solaire/guadeloupe/batterie
│   └── /landing/solaire/guadeloupe/autoconsommation
├── /landing/solaire/martinique
│   └── ...
├── /landing/solaire/guyane
│   └── ...
├── /landing/solaire/reunion
│   └── ...
└── (pas de /landing/solaire/france — la LP parent couvre la métropole)

/landing/isolation                              ← Tiroir parent
├── /landing/isolation/corse
│   ├── /landing/isolation/corse/combles
│   ├── /landing/isolation/corse/exterieure
│   └── /landing/isolation/corse/interieure
├── /landing/isolation/guadeloupe
│   └── ...
└── ...

/landing/pompe-a-chaleur                        ← Tiroir parent
├── /landing/pompe-a-chaleur/corse
├── /landing/pompe-a-chaleur/reunion
└── ...

/landing/renovation-globale                     ← Tiroir parent
├── /landing/renovation-globale/corse
└── ...
```

---

## 3. Produits et variantes

### Produits (tiroirs parents)

| Slug | Titre | Icône | Variantes possibles |
|------|-------|-------|---------------------|
| `solaire` | Solaire Photovoltaïque | Sun | `batterie`, `autoconsommation` |
| `isolation` | Isolation Thermique | Home | `combles`, `exterieure`, `interieure`, `plancher` |
| `pompe-a-chaleur` | Pompe à Chaleur | Thermometer | `air-air`, `air-eau`, `geothermique` |
| `renovation-globale` | Rénovation Globale | Building2 | `copropriete`, `maison-individuelle` |

### Régions (marchés)

| Slug | Nom affiché | Code région |
|------|-------------|-------------|
| *(absent = national)* | France métropolitaine | `fr` |
| `corse` | Corse | `corse` |
| `reunion` | La Réunion | `reunion` |
| `martinique` | Martinique | `martinique` |
| `guadeloupe` | Guadeloupe | `guadeloupe` |
| `guyane` | Guyane | `guyane` |

> La LP parent `/landing/solaire` couvre la France métropolitaine. Pas besoin d'un slug `/landing/solaire/france`.

---

## 4. Logique des "tiroirs"

### Principe

Chaque **produit** est un tiroir qui contient :
- Une **LP nationale** (le tiroir lui-même, niveau 0)
- Des **déclinaisons régionales** (niveau 1)
- Des **variantes produit** par région (niveau 2)

### Héritage de contenu

```
LP nationale (solaire)
│
├── Sections communes : Hero, Témoignages, Certifications, CTA
│
└── LP régionale (solaire/guyane)
    │
    ├── Hérite des sections communes
    ├── Surcharge : Aides locales, Tarifs régionaux, Réglementations
    │
    └── LP variante (solaire/guyane/batterie)
        ├── Hérite de tout le contenu régional
        └── Surcharge : Contenu spécifique batterie (prix, avantages, FAQ)
```

### Règle de fusion

1. Charger le contenu du **produit** (base)
2. Fusionner avec les **surcharges régionales** (si région)
3. Fusionner avec les **surcharges variante** (si variante)
4. Le contenu le plus spécifique gagne (deep merge)

---

## 5. Structure de données

### Table `landing_pages` (évolution)

```sql
ALTER TABLE landing_pages ADD COLUMN parent_id UUID REFERENCES landing_pages(id);
ALTER TABLE landing_pages ADD COLUMN region_code TEXT;           -- null = national
ALTER TABLE landing_pages ADD COLUMN variant_slug TEXT;          -- null = pas de variante
ALTER TABLE landing_pages ADD COLUMN level TEXT DEFAULT 'product'; -- 'product' | 'region' | 'variant'
ALTER TABLE landing_pages ADD COLUMN display_order INT DEFAULT 0;
```

### Exemple de données

| id | slug | title | path | parent_id | region_code | variant_slug | level | seo_status |
|----|------|-------|------|-----------|-------------|--------------|-------|------------|
| A1 | solaire | Solaire Photovoltaïque | /landing/solaire | NULL | NULL | NULL | product | seo |
| A2 | solaire-guyane | Solaire — Guyane | /landing/solaire/guyane | A1 | guyane | NULL | region | seo |
| A3 | solaire-guyane-batterie | Solaire Batterie — Guyane | /landing/solaire/guyane/batterie | A2 | guyane | batterie | variant | seo |

### Sources de contenu structuré (non-BDD)

Le **template React** utilise des données structurées définies en code :

```typescript
// src/data/landing-regions.ts
export const REGION_DATA: Record<string, RegionContent> = {
  guyane: {
    name: "Guyane",
    ensoleillement: "1600-1800 kWh/m²/an",
    aidesLocales: ["Aide régionale Guyane : jusqu'à 3 000€", "TVA 8.5%"],
    tarifRachat: "0.1735 €/kWh",
    reglementations: ["Norme NF C 15-100 tropicale", "Protection cyclonique obligatoire"],
    testimonials: [...],
  },
  corse: { ... },
  // ...
};

// src/data/landing-variants.ts
export const VARIANT_DATA: Record<string, VariantContent> = {
  batterie: {
    name: "avec Batterie de stockage",
    heroSubtitle: "Stockez votre énergie, consommez la nuit",
    specificFAQ: [...],
    priceRange: "9 000€ – 15 000€",
  },
  autoconsommation: { ... },
};
```

> La BDD sert pour : statut SEO, stats, ordre d'affichage, surcharges admin.
> Les données structurées en code servent pour : contenu de base, textes, FAQ, aides.

---

## 6. Template unique réutilisable

### Composant `LandingTemplate`

```tsx
// src/pages/landing/LandingTemplate.tsx

interface LandingTemplateProps {
  product: string;    // "solaire" | "isolation" | ...
  region?: string;    // "guyane" | "corse" | undefined
  variant?: string;   // "batterie" | "combles" | undefined
}

const LandingTemplate = ({ product, region, variant }: LandingTemplateProps) => {
  // 1. Charger les données produit de base
  const productData = PRODUCT_DATA[product];
  
  // 2. Fusionner les surcharges régionales
  const regionData = region ? REGION_DATA[region] : null;
  
  // 3. Fusionner les surcharges variante
  const variantData = variant ? VARIANT_DATA[variant] : null;
  
  // 4. Charger le statut SEO depuis la BDD
  const { seoStatus } = useLandingPageSEO(computeSlug(product, region, variant));
  
  // 5. Construire le contenu final (deep merge)
  const content = mergeContent(productData, regionData, variantData);

  return (
    <>
      <Helmet>
        <title>{content.metaTitle}</title>
        <meta name="description" content={content.metaDescription} />
        <link rel="canonical" href={`https://prime-energies.fr/landing/${product}${region ? `/${region}` : ''}${variant ? `/${variant}` : ''}`} />
        {seoStatus === "hidden" && <meta name="robots" content="noindex, nofollow" />}
      </Helmet>
      
      <HeroSection data={content.hero} />
      <AidesSection data={content.aides} region={region} />
      <WhySection data={content.why} />
      <EligibilitySection data={content.eligibility} />
      <PrestationSection data={content.prestation} />
      <TestimonialsSection data={content.testimonials} />
      <CertificationsSection data={content.certifications} />
      <ContactSection data={content.contact} product={product} region={region} variant={variant} />
    </>
  );
};
```

### Routing dans App.tsx

```tsx
{/* Route dynamique unique pour toutes les LP */}
<Route path="/landing/:product" element={<LandingPageRouter />} />
<Route path="/landing/:product/:region" element={<LandingPageRouter />} />
<Route path="/landing/:product/:region/:variant" element={<LandingPageRouter />} />
```

---

## 7. Exemple concret : `/landing/solaire/guyane/batterie`

### URL
```
https://prime-energies.fr/landing/solaire/guyane/batterie
```

### Meta tags générés
```html
<title>Panneaux Solaires avec Batterie en Guyane | Devis Gratuit | Prime Énergies</title>
<meta name="description" content="Installation de panneaux solaires avec batterie de stockage en Guyane. Profitez des aides locales jusqu'à 3 000€ et du tarif de rachat à 0.1735€/kWh. Devis gratuit." />
<link rel="canonical" href="https://prime-energies.fr/landing/solaire/guyane/batterie" />
```

### JSON-LD
```json
{
  "@context": "https://schema.org",
  "@type": "Service",
  "name": "Installation Panneaux Solaires avec Batterie — Guyane",
  "provider": {
    "@type": "Organization",
    "name": "Prime Énergies"
  },
  "areaServed": {
    "@type": "AdministrativeArea",
    "name": "Guyane"
  },
  "offers": {
    "@type": "Offer",
    "priceCurrency": "EUR",
    "price": "9000",
    "description": "Installation panneaux solaires + batterie de stockage"
  }
}
```

### Contenu affiché
- **Hero** : "Panneaux Solaires + Batterie en Guyane" + image adaptée
- **Aides** : Aides nationales + aide régionale Guyane (3 000€)
- **Tarifs** : Prix adaptés Guyane + surcoût batterie
- **FAQ** : FAQ solaire + FAQ batterie + FAQ Guyane
- **Formulaire** : Pré-rempli avec région = Guyane, besoin = solaire + batterie

---

## 8. Interface Admin (`/admin/pages-ancres`)

### Vue arborescente

```
📁 Solaire Photovoltaïque          [SEO ✅]  [1247 vues]  [▼ Déplier]
│  ├── 🌍 Corse                    [SEO ✅]  [234 vues]
│  │   ├── 🔋 Batterie             [SEO ✅]  [89 vues]
│  │   └── ☀️ Autoconsommation     [Caché 🔒] [12 vues]
│  ├── 🌍 Guyane                   [SEO ✅]  [456 vues]
│  │   └── 🔋 Batterie             [SEO ✅]  [178 vues]
│  ├── 🌍 Guadeloupe               [Désactivé ⛔]
│  └── 🌍 Martinique               [SEO ✅]  [321 vues]
│
📁 Isolation Thermique             [SEO ✅]  [982 vues]   [▶ Replié]
📁 Pompe à Chaleur                 [SEO ✅]  [1534 vues]  [▶ Replié]
📁 Rénovation Globale              [SEO ✅]  [876 vues]   [▶ Replié]
```

### Actions admin par nœud
- Changer le statut SEO (seo / hidden / disabled)
- Voir les statistiques (vues, formulaires, leads)
- Lien vers la page en aperçu
- Ajouter une déclinaison régionale / variante

---

## 9. Sitemap dynamique

L'Edge Function `generate-sitemap` inclut automatiquement toutes les LP avec `seo_status = 'seo'` :

```xml
<url>
  <loc>https://prime-energies.fr/landing/solaire</loc>
  <changefreq>weekly</changefreq>
  <priority>0.9</priority>
</url>
<url>
  <loc>https://prime-energies.fr/landing/solaire/guyane</loc>
  <changefreq>monthly</changefreq>
  <priority>0.8</priority>
</url>
<url>
  <loc>https://prime-energies.fr/landing/solaire/guyane/batterie</loc>
  <changefreq>monthly</changefreq>
  <priority>0.7</priority>
</url>
```

---

## 10. Prochaines étapes d'implémentation

| # | Étape | Priorité |
|---|-------|----------|
| 1 | Migration BDD : `parent_id`, `region_code`, `variant_slug`, `level` | 🔴 Haute |
| 2 | Route dynamique `/landing/:product/:region?/:variant?` + `LandingPageRouter` | 🔴 Haute |
| 3 | Fichiers de données structurées (`landing-regions.ts`, `landing-variants.ts`) | 🔴 Haute |
| 4 | `LandingTemplate` réutilisable avec fusion de contenu | 🔴 Haute |
| 5 | Refactorer `LandingSolaire.tsx` vers le template | 🟡 Moyenne |
| 6 | Admin : vue arborescente dépliable | 🟡 Moyenne |
| 7 | Edge Function `crawler-handler` pour le pré-rendu SEO | 🟡 Moyenne |
| 8 | Mise à jour du sitemap dynamique | 🟢 Basse |
| 9 | Créer les entrées pour les 6 régions solaire + 2 variantes | 🟢 Basse |
