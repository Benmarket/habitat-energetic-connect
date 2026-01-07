# Rapport – Outil de rédaction IA (/creer-contenu)

Ce document décrit **exactement** comment fonctionne l’outil de rédaction IA utilisé sur `/creer-contenu`.

## 1) Où ça se passe

- Page: `src/pages/CreatePost.tsx` (route `/creer-contenu?type=...`)
- Backend function: `supabase/functions/generate-article/index.ts`
- Prévisualisation des variantes: `src/components/ArticleVariantsModal.tsx` (rendu HTML via `dangerouslySetInnerHTML`)

## 2) Types de contenu (actualite / aide / guide)

Le type est lu dans l’URL: `type=actualite|aide|guide`.

- **Guide**: nécessite un `guide_template` (et la génération force une structure en sections `<h2 id="...">`).
- **Actualité / Aide**: contenu “article” classique.

## 3) Appel IA (génération)

Depuis `CreatePost.tsx`, on appelle la fonction backend `generate-article` avec:

- `keywords`: liste de mots-clés
- `contentType`: `actualite|aide|guide`
- `customInstructions`: instructions globales (chargées depuis `site_settings` côté UI)
- `guideTemplate`: uniquement pour les guides
- `userId`: sert à charger vos **boutons** et **bannières CTA** sauvegardés

## 4) Boutons & bannières CTA: comment c’est injecté

### 4.1 Récupération des presets (backend)

La fonction backend charge, si `userId` est présent:

- `button_presets` (vos boutons)
- `cta_banners` (vos bandeaux)

Ensuite elle force l’IA à insérer des CTA via des **placeholders**.

### 4.2 Placeholders (format attendu du modèle)

- Bouton: `[BUTTON:Texte|URL]`
- Bandeau CTA: `[CTA_BANNER:ID]`
- Image: `[IMAGE: Description...]`

### 4.3 Conversion en “format interne” (pour l’éditeur)

Après génération, le backend convertit automatiquement ces placeholders en HTML compatible avec notre éditeur TipTap:

#### Boutons
- Convertis en `div[data-custom-button] ...` avec des `data-*` (texte, url, couleurs, tailles, etc.)
- Le composant TipTap `CustomButton` lit ces attributs et rend le bouton dans l’éditeur.

#### Bandeaux CTA
- Convertis en `div[data-cta-banner] ...` avec les `data-*` attendus par `CustomCtaBanner`
- Le rendu est cohérent dans:
  - la prévisualisation de variantes
  - l’éditeur

## 5) Régénération d’une variante

Quand on “régénère” une variante, on renvoie également `userId`, `customInstructions` et `guideTemplate` pour conserver le même comportement (CTA inclus).

## 6) Points importants

- Les presets **en base** ne sont pas modifiés par l’IA.
- L’IA ne fait qu’insérer des placeholders, et le backend les transforme en composants internes.
