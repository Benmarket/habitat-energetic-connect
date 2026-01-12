# Système de Contexte Région - Documentation

## Vue d'ensemble

Le site Prime Énergies dispose d'un système de contexte région global permettant aux utilisateurs de sélectionner leur zone géographique. Cette sélection est persistante et influence potentiellement le contenu affiché.

---

## Régions disponibles

| Code | Nom affiché | Statut |
|------|-------------|--------|
| `fr` | France | Par défaut |
| `corse` | Corse | - |
| `reunion` | Réunion | - |
| `martinique` | Martinique | - |
| `guadeloupe` | Guadeloupe | - |
| `guyane` | Guyane | - |

---

## Fonctionnement technique

### 1. Détermination de la région active

La région active (`activeRegion`) est déterminée selon cet ordre de priorité :

1. **Query param URL** : `?region=xxx` si présent et valide
2. **LocalStorage** : clé `prime-energies-region` si présente
3. **Défaut** : `fr` (France métropolitaine)

### 2. Interaction utilisateur

Au clic sur une région dans le sous-header :

- ✅ Mise à jour du state global `activeRegion`
- ✅ Mise à jour de l'URL via `history.pushState` → `/?region=xxx`
- ✅ Stockage en localStorage pour persistance
- ❌ Pas de redirection automatique
- ❌ Pas de rechargement de page

### 3. Comportement URL

| Région | URL résultante |
|--------|----------------|
| France (défaut) | `/` (pas de param) |
| Autres régions | `/?region=corse`, `/?region=reunion`, etc. |

---

## Architecture du code

### Fichiers impliqués

```
src/
├── hooks/
│   └── useRegionContext.tsx    # Context + Provider + Hook
├── components/
│   └── RegionSubHeader.tsx     # UI de sélection des régions
└── App.tsx                     # Intégration du RegionProvider
```

### Hook `useRegionContext`

```typescript
import { useRegionContext } from "@/hooks/useRegionContext";

// Dans un composant
const { activeRegion, setActiveRegion } = useRegionContext();

// activeRegion : RegionCode ("fr" | "corse" | "reunion" | ...)
// setActiveRegion : (region: RegionCode) => void
```

### Helpers disponibles

```typescript
import { 
  RegionCode,
  regionNameToCode,  // { "France": "fr", "Corse": "corse", ... }
  regionCodeToName   // { "fr": "France", "corse": "Corse", ... }
} from "@/hooks/useRegionContext";
```

---

## Interface utilisateur

### Sous-header région (`RegionSubHeader`)

**Position** : Sous le header principal, visible uniquement sur la page d'accueil.

**Comportement** :
- Se replie automatiquement au scroll
- Peut être déplié/replié manuellement via le chevron
- Se rouvre automatiquement au retour en haut de page

### Feedback visuel

| État | Style |
|------|-------|
| **Région active** | Glow subtil (halo primary), texte en `font-semibold` + couleur `primary`, légère mise en valeur (`scale-105`, `brightness-110`) |
| **Région inactive** | Opacité réduite (`opacity-60`), hover avec montée d'opacité + scale |

**Principes UX** :
- Rendu institutionnel, sobre, premium
- Pas d'animation permanente
- L'indicateur reste secondaire par rapport au hero

---

## Phases d'implémentation

### ✅ Phase 1 : Contexte région (TERMINÉE)

- [x] Contexte global React
- [x] Persistance localStorage
- [x] Synchronisation URL (`?region=xxx`)
- [x] Feedback visuel premium
- [x] France active par défaut

### ✅ Phase 2 : Visibilité régionale des bandes (TERMINÉE)

- [x] Champ `regionVisibility` ajouté à chaque section
- [x] Interface d'administration avec popover de sélection des régions
- [x] Filtrage dynamique des sections selon la région active
- [x] Documentation dans Admin > Paramètres généraux > Bandes accueil

### 🔜 Phase 3 : Variantes de contenu (À VENIR)

- [ ] Contenu hero adapté par région
- [ ] Offres partenaires filtrées par région
- [ ] Témoignages régionaux
- [ ] Aides spécifiques aux DOM-TOM

---

## Configuration admin des bandes

### Accès
**Administration > Paramètres généraux > Bandes accueil**

### Fonctionnalités

| Action | Description |
|--------|-------------|
| 🔘 Visible/Masqué | Active ou désactive la section globalement |
| 🌍 Globe (icône) | Configure la visibilité par région |
| 👁️ Aperçu | Prévisualise la section |
| ↕️ Drag & Drop | Réordonne les sections |

### Logique de visibilité régionale

```
Si regionVisibility = [] (vide)
  → Section visible dans TOUTES les régions

Si regionVisibility = ["reunion", "martinique"]
  → Section visible UNIQUEMENT pour Réunion et Martinique
  
Si region active = "fr" et regionVisibility = ["reunion"]
  → Section MASQUÉE pour France métropolitaine
```

### Exemple d'utilisation

Pour afficher une section "Aides DOM-TOM" uniquement pour les régions d'outre-mer :

1. Créer la section dans les bandes d'accueil
2. Cliquer sur l'icône 🌍 (Globe)
3. Cocher : Réunion, Martinique, Guadeloupe, Guyane
4. NE PAS cocher : France, Corse
5. Enregistrer

---

## Utilisation dans d'autres composants

Pour accéder à la région active dans n'importe quel composant :

```tsx
import { useRegionContext } from "@/hooks/useRegionContext";

const MonComposant = () => {
  const { activeRegion } = useRegionContext();
  
  // Exemple : contenu conditionnel
  if (activeRegion === "reunion") {
    return <div>Contenu spécifique Réunion</div>;
  }
  
  return <div>Contenu France métropolitaine</div>;
};
```

---

## Contraintes respectées

- ❌ Pas de sous-domaines régionaux
- ❌ Pas de landing pages régionales séparées
- ❌ Pas de modification de l'ordre des bandes
- ❌ Pas de conditionnement d'affichage des sections (Phase 1)
- ✅ URL propre avec query param
- ✅ Persistance entre sessions
- ✅ Navigation fluide sans rechargement
