# 📋 Rapport d'Architecture — Landing Pages Régionales Solaire

> **Date** : 10 avril 2026  
> **Statut** : En attente de validation  
> **Périmètre** : Landing pages `/landing/solaire/:region` et variante `/photovoltaique-batterie`

---

## 1. Schéma JSONB `regional_content`

Nouveau champ ajouté à la table `landing_pages` :

```jsonb
{
  // ─── IDENTITÉ RÉGIONALE ───
  "region_name": "Corse",
  "region_demonym": "corse",           // "corses", "réunionnais", etc.
  
  // ─── HERO ───
  "hero_title": "Panneaux Solaires en Corse : Jusqu'à 70% d'économie",
  "hero_subtitle": "Profitez de 2 800h d'ensoleillement annuel pour produire votre propre électricité",
  "hero_image": "url_image_hero_corse.jpg",
  
  // ─── SECTION 1 : CONTEXTE LOCAL ───
  "context": {
    "title": "Pourquoi le solaire en Corse ?",
    "intro_text": "Avec plus de 2 800 heures d'ensoleillement par an...",
    "highlights": [
      {
        "icon": "Sun",
        "label": "Ensoleillement",
        "value": "2 800h/an",
        "description": "Parmi les plus élevés de France"
      },
      {
        "icon": "Zap",
        "label": "Coût électricité",
        "value": "0,2516 €/kWh",
        "description": "Tarif réglementé en vigueur"
      },
      {
        "icon": "TrendingUp",
        "label": "Économies estimées",
        "value": "1 200 €/an",
        "description": "Pour une installation 6 kWc"
      },
      {
        "icon": "Home",
        "label": "Foyers accompagnés",
        "value": "350+",
        "description": "Dans la région depuis 2020"
      }
    ]
  },
  
  // ─── SECTION 2 : RENTABILITÉ LOCALE ───
  "profitability": {
    "title": "Rentabilité solaire en Corse",
    "intro_text": "L'île de beauté offre un potentiel solaire exceptionnel...",
    "roi_years": 7,
    "annual_production_kwh": 1450,  // par kWc installé
    "savings_25_years": "32 000 €",
    "comparison_text": "Soit 50% de plus que la moyenne nationale",
    "table_data": [
      { "puissance": "3 kWc", "production": "4 350 kWh", "economies": "850 €/an", "amortissement": "8 ans" },
      { "puissance": "6 kWc", "production": "8 700 kWh", "economies": "1 600 €/an", "amortissement": "7 ans" },
      { "puissance": "9 kWc", "production": "13 050 kWh", "economies": "2 200 €/an", "amortissement": "6 ans" }
    ]
  },
  
  // ─── SECTION 3 : AIDES DISPONIBLES ───
  "aids": {
    "title": "Aides et subventions en Corse",
    "intro_text": "Cumulez les aides nationales et les dispositifs locaux...",
    "items": [
      {
        "name": "Prime à l'autoconsommation",
        "amount": "Jusqu'à 2 340 €",
        "description": "Prime versée par EDF OA sur 5 ans",
        "is_local": false
      },
      {
        "name": "Aide territoriale Corse",
        "amount": "Variable",
        "description": "Aide spécifique de la Collectivité de Corse",
        "is_local": true
      },
      {
        "name": "TVA réduite à 10%",
        "amount": "~1 000 €",
        "description": "Sur les installations ≤ 3 kWc",
        "is_local": false
      }
    ]
  },
  
  // ─── SECTION 4 : TÉMOIGNAGES LOCAUX ───
  "testimonials": [
    {
      "text": "Installés en Haute-Corse, nos panneaux produisent même mieux que prévu.",
      "name": "Jean-Pierre M.",
      "location": "Bastia"
    }
  ],
  
  // ─── SECTION 5 : FAQ LOCALE ───
  "faq": [
    {
      "question": "Le solaire est-il rentable en Corse ?",
      "answer": "Oui, la Corse bénéficie d'un ensoleillement supérieur à la moyenne nationale..."
    },
    {
      "question": "Quelles aides spécifiques existent en Corse ?",
      "answer": "En plus des aides nationales, la Collectivité de Corse propose..."
    }
  ],
  
  // ─── IMAGES RÉGIONALES ───
  "images": {
    "hero": "url_hero_corse.jpg",
    "context": "url_context_corse.jpg",
    "profitability": "url_profitability_corse.jpg"
  },
  
  // ─── SEO ───
  "seo": {
    "meta_title": "Panneaux Solaires Corse : Prix, Aides & Rentabilité 2026",
    "meta_description": "Installation de panneaux solaires en Corse. 2800h d'ensoleillement, jusqu'à 70% d'économie. Devis gratuit et aides locales.",
    "h1": "Installation Panneaux Solaires en Corse",
    "focus_keywords": ["panneaux solaires corse", "installation photovoltaique corse", "solaire corse prix"]
  },
  
  // ─── VARIABLES DYNAMIQUES (connectées aux données business) ───
  "dynamic_vars": {
    "clients_count": 350,
    "installations_count": 280,
    "average_rating": 4.8,
    "last_updated": "2026-04-01"
  }
}
```

---

## 2. Logique de Fallback (précise)

```
Résolution du contenu pour /landing/solaire/{region} :

1. Charger le regional_content de la LP régionale (landing_pages WHERE slug = 'solaire-{region}')

2. Pour CHAQUE section du template :
   a. Si regional_content.{section} existe et n'est pas null → UTILISER
   b. Sinon → Charger le contenu de la LP nationale (slug = 'solaire')
   c. Si la LP nationale n'a pas non plus de contenu → Utiliser les DÉFAUTS HARDCODÉS du template

3. Pour les VARIABLES NUMÉRIQUES (prix, primes, tarifs) :
   → Toujours récupérer depuis solar_simulator_regions WHERE name LIKE '%{region}%'
   → Ces données sont TOUJOURS dynamiques, jamais dans le JSONB

4. Pour les TEXTES :
   → Appliquer un template string avec variables : 
     "{region_name}" → "Corse"
     "{ensoleillement}" → "2 800h"
     "{tarif_kwh}" → "0,2516 €"
   → Permet de différencier le contenu même avec le fallback national

5. Pour le SEO (meta tags, H1) :
   → OBLIGATOIREMENT régionalisé (jamais de fallback sur le national)
   → Si pas de seo.h1 régional → Génération automatique : 
     "Installation Panneaux Solaires en {region_name}"
```

### Cascade de priorité :

```
regional_content.section > national_content.section > template_defaults
         ↓                        ↓                        ↓
   Contenu unique          Contenu adapté           Contenu générique
   (meilleur SEO)      (variables injectées)      (dernier recours)
```

---

## 3. Structure complète d'une Landing Page Régionale

### 8 sections obligatoires :

| # | Section | Source données | Différencié ? |
|---|---------|---------------|---------------|
| 1 | **Hero Banner** | `regional_content.hero_*` + `solar_simulator_regions.tarif_kwh` | ✅ Titre H1, sous-titre, image, prix |
| 2 | **Contexte Local** | `regional_content.context` | ✅ Ensoleillement, angles locaux, stats |
| 3 | **Pourquoi le Solaire** | Template base (4 bénéfices) | ⚠️ Identique sauf images optionnelles |
| 4 | **Rentabilité / Économies** | `regional_content.profitability` + `solar_simulator_regions` | ✅ Tableaux, ROI, production/kWc |
| 5 | **Aides & Subventions** | `regional_content.aids` | ✅ Aides locales + nationales |
| 6 | **Témoignages** | `regional_content.testimonials` ou fallback national | ⚠️ Localisés si disponibles |
| 7 | **FAQ Locale** | `regional_content.faq` | ✅ Questions spécifiques = JSON-LD FAQPage |
| 8 | **Formulaire / CTA** | Wizard existant (inchangé) | ⚠️ Code postal pré-rempli si détectable |

### JSON-LD généré automatiquement :

```json
{
  "@context": "https://schema.org",
  "@type": "Service",
  "name": "Installation Panneaux Solaires en Corse",
  "areaServed": { "@type": "Place", "name": "Corse" },
  "provider": { "@type": "Organization", "name": "Prime Énergies" }
}
```

+ `FAQPage` schema si `faq` présent.

---

## 4. Dynamique vs Statique

### ✅ Toujours DYNAMIQUE (jamais dans le JSONB) :

| Donnée | Source |
|--------|--------|
| Tarif kWh | `solar_simulator_regions.tarif_kwh` |
| Primes autoconsommation | `solar_simulator_regions.prime_*` |
| Tarifs rachat surplus | `solar_simulator_regions.tarif_rachat_*` |
| Prix installation | Calculé via `solar_simulator_powers` + `variation_prix_installation` |

### ⚠️ Semi-dynamique (JSONB, éditable en admin) :

| Donnée | Source |
|--------|--------|
| Ensoleillement | `regional_content.context.highlights[0].value` |
| Économies estimées | `regional_content.profitability.table_data` |
| Aides locales | `regional_content.aids.items` |
| Nombre de clients | `regional_content.dynamic_vars.clients_count` |
| Témoignages locaux | `regional_content.testimonials` |

### 🔒 STATIQUE (template React, identique partout) :

| Élément | Description |
|---------|-------------|
| Structure des sections | Ordre et layout des 8 blocs |
| Wizard de contact | Formulaire 3 étapes |
| Badges certifications | RGE, MaPrimeRénov, CEE, etc. |
| Bénéfices "Pourquoi le solaire" | 4 cards (sauf images remplaçables) |

---

## 5. Génération de contenu

### Stratégie en 2 phases :

#### Phase 1 : Templates + Variables (immédiat)
- Le template React utilise des **template strings** avec injection de variables
- Exemple : `"Avec plus de {ensoleillement} d'ensoleillement, {region_name} est idéale pour le solaire"`
- Le contenu reste **éditorialement contrôlé** mais personnalisé par région
- **Avantage** : Contenu unique par page sans effort rédactionnel massif

#### Phase 2 : Génération IA (future, optionnelle)
- Bouton admin "Générer le contenu régional" par page
- Utilise l'API IA (Lovable AI Gateway) pour rédiger :
  - Le contexte local (basé sur données géographiques réelles)
  - Les angles SEO différenciés
  - Les FAQ pertinentes
- L'admin **valide** avant publication (jamais d'auto-publication)
- **Avantage** : Scalabilité à 50+ régions/départements

### Workflow de création d'une LP régionale :

```
1. Admin crée la LP dans /admin/pages-ancres
2. Système initialise le regional_content avec le template par défaut + variables de la région
3. Admin peut éditer/enrichir chaque section
4. (Futur) Bouton "Enrichir avec l'IA" pour générer du contenu spécifique
5. Preview avant publication
6. Activation du statut SEO (seo/hidden/disabled)
```

---

## 6. Impacts SEO

### ✅ Points positifs :

| Aspect | Détail |
|--------|--------|
| **H1 unique** | Chaque page a un H1 différent (obligatoire, jamais de fallback) |
| **Meta title/description** | Uniques par page, avec mots-clés locaux |
| **Contenu différencié** | Minimum 4 sections avec contenu régional spécifique |
| **JSON-LD Service** | `areaServed` spécifique à la région |
| **FAQ Schema** | Questions locales = rich snippets potentiels |
| **Canonical tags** | Chaque page a sa propre URL canonique |
| **Maillage interne** | LP nationale → LP régionales (et inversement) |
| **Crawler-handler** | Pré-rendering HTML statique pour les bots (déjà en place) |

### ⚠️ Risques maîtrisés :

| Risque | Mitigation |
|--------|-----------|
| **Cannibalisation** | H1, angles et mots-clés différents par page. Structure sémantique distincte. |
| **Thin content** | Minimum 4 sections structurées + FAQ. Le fallback national enrichit plutôt que d'appauvrir. |
| **Duplicate content** | `noindex` automatique si `regional_content` est quasi-vide (< 2 sections remplies) |
| **Crawl budget** | Sitemap dynamique n'inclut que les pages avec `seo_status = 'seo'` |

### 🔄 GEO (Generative Engine Optimization) :

- Les données structurées (JSON-LD) aident les moteurs IA (Gemini, ChatGPT) à comprendre le contexte
- Le contenu factuel (chiffres, tableaux, FAQ) est favorisé par les réponses IA
- Le robots.txt autorise déjà GPTBot, Claude-Web, Anthropic-AI

---

## 7. Limites de l'approche

| Limite | Impact | Solution future |
|--------|--------|----------------|
| **Données manuelles** | Ensoleillement, stats clients doivent être saisis manuellement | Phase 2 : API données météo + CRM |
| **Pas de granularité départementale** | Pour l'instant limité à 6 régions | Extensible via ajout de régions + LP |
| **Contenu initial générique** | Sans enrichissement, le fallback reste visible | Bouton "Générer avec l'IA" prévu |
| **Images par région** | Nécessite des visuels spécifiques par région | Banque d'images ou IA de génération |
| **Pas de données business live** | `clients_count` est statique dans le JSONB | Future : compteur dynamique via requête SQL |
| **Maintenance contenu** | Mise à jour des prix/aides nécessite action admin | Les tarifs dynamiques (`solar_simulator_regions`) sont centralisés |

---

## 8. Plan d'implémentation

### Étape 1 : Migration DB
- Ajouter colonne `regional_content JSONB DEFAULT '{}'` à `landing_pages`
- Supprimer les variantes `panneaux-photovoltaiques` (nettoyage)

### Étape 2 : Composant `LandingSolaireRegionale.tsx`
- Template avec 8 sections
- Hook `useRegionalContent(regionCode)` pour résolution fallback
- Injection des données `solar_simulator_regions`

### Étape 3 : Admin — Éditeur de contenu régional
- Interface dans `/admin/pages-ancres` pour éditer le JSONB
- Formulaires par section (contexte, rentabilité, aides, FAQ, témoignages)

### Étape 4 : SEO
- JSON-LD Service + FAQPage automatiques
- Intégration au crawler-handler
- Ajout au sitemap dynamique

### Étape 5 (future) : Génération IA
- Bouton "Enrichir" qui génère le contenu par section
- Validation admin avant activation

---

## ✅ Résumé décisionnel

| Question | Réponse |
|----------|---------|
| Où stocker le contenu régional ? | `landing_pages.regional_content` (JSONB) |
| D'où viennent les prix ? | `solar_simulator_regions` (dynamique) |
| Comment éviter le duplicate content ? | H1/meta/angles différenciés + seuil minimum |
| Comment scaler ? | Templates + variables + IA future |
| Fallback si pas de contenu ? | Contenu national + variables régionales injectées |
| Variantes par région ? | Max 2 : solaire (base) + photovoltaique-batterie (optionnelle) |

---

> **👉 Action requise** : Valider ce rapport pour lancer l'implémentation (Étapes 1 à 4).
