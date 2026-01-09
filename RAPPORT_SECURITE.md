# Rapport de Sécurité - Prime Énergies

## Audit effectué le 2026-01-09

Ce document résume les failles de sécurité identifiées et les corrections apportées au projet.

---

## 1. Failles Critiques Corrigées ✅

### 1.1 AdminUsers.tsx - Accès non autorisé

**Problème :** La page `/admin/utilisateurs` n'avait pas de vérification de rôle. N'importe quel utilisateur authentifié pouvait accéder à la gestion des utilisateurs et modifier des rôles.

**Solution :** Ajout d'une vérification du rôle `admin` ou `super_admin` avant de charger les données.

```typescript
// Vérifier que l'utilisateur a un rôle admin ou super_admin
const { data: roles } = await supabase
  .from("user_roles")
  .select("role")
  .eq("user_id", user.id);

const hasAdminAccess = roles?.some(r => r.role === "admin" || r.role === "super_admin");
if (!hasAdminAccess) {
  navigate("/");
  return;
}
```

**Fichier modifié :** `src/pages/AdminUsers.tsx`

---

### 1.2 Edge Function generate-article - Authentification JWT

**Problème :** La fonction recevait le `userId` directement du body de la requête, permettant à n'importe qui d'usurper l'identité d'un autre utilisateur.

**Solution :** 
- Validation du token JWT via l'en-tête `Authorization`
- Extraction du `userId` depuis le token validé (pas du body)
- Retour d'une erreur 401 si non authentifié

**Fichier modifié :** `supabase/functions/generate-article/index.ts`

---

### 1.3 Edge Function generate-images - Authentification JWT ✅ (Phase 2)

**Problème :** Même vulnérabilité que generate-article - le `userId` venait du body.

**Solution :** 
- Validation du token JWT via `supabase.auth.getClaims(token)`
- Extraction du `userId` depuis `claims.sub`
- Retour d'une erreur 401 si non authentifié

**Fichier modifié :** `supabase/functions/generate-images/index.ts`

---

### 1.4 Protection XSS - Sanitization HTML

**Problème :** Le contenu HTML des articles était affiché via `dangerouslySetInnerHTML` sans sanitization, exposant à des attaques XSS.

**Solution :** 
- Installation de DOMPurify
- Création d'un utilitaire `sanitizeHtml.ts`
- Application de la sanitization dans `contentRenderer.tsx`

**Fichiers créés/modifiés :**
- `src/utils/sanitizeHtml.ts` (nouveau)
- `src/utils/contentRenderer.tsx` (modifié)

---

## 2. Nettoyage Console.log ✅ (Phase 2 & 3)

### Fichiers nettoyés :

| Fichier | Logs supprimés |
|---------|----------------|
| `src/hooks/useOnlinePresence.tsx` | ✅ Fait (Phase 1) |
| `src/components/SitePopup.tsx` | ✅ Fait (Phase 2) |
| `src/components/HeroSection.tsx` | ✅ Fait (Phase 2) |
| `src/components/MaintenanceBanner.tsx` | ✅ Fait (Phase 2) |
| `src/components/ChatBot.tsx` | ✅ Fait (Phase 2) |
| `src/components/RichTextEditor/FavoriteCtaBannersBar.tsx` | ✅ Fait (Phase 2) |
| `src/pages/CreatePost.tsx` | ✅ Fait (Phase 3) |
| `src/pages/Index.tsx` | ✅ Fait (Phase 3) |
| `src/pages/NotFound.tsx` | ✅ Fait (Phase 3) |
| `src/pages/AdminUsers.tsx` | ✅ Fait (Phase 3) |
| `src/components/MegaMenu.tsx` | ✅ Fait (Phase 3) |
| `src/components/RichTextEditor/ButtonEditorModal.tsx` | ✅ Fait (Phase 3) |
| `src/components/RichTextEditor/CtaBannerEditorModal.tsx` | ✅ Fait (Phase 3) |
| `src/components/PartnerOffersSection.tsx` | ✅ Fait (Phase 3) |
| `src/components/MaintenanceMode.tsx` | ✅ Fait (Phase 3) |
| `src/components/forum/ForumImageUpload.tsx` | ✅ Fait (Phase 3) |
| `supabase/functions/generate-images/index.ts` | ✅ Fait (Phase 2) |
| `supabase/functions/generate-article/index.ts` | ✅ Fait (Phase 3) |
| `supabase/functions/chat-bot/index.ts` | ✅ Fait (Phase 3) |

---

## 3. Failles Moyennes Corrigées ✅ (Phase 3)

### 3.1 Rate Limiting pour les formulaires ✅

**Problème :** Les politiques RLS `WITH CHECK (true)` permettaient des insertions illimitées.

**Solution :** Création de fonctions de rate limiting :

| Table | Limite |
|-------|--------|
| `form_submissions` | Max 10 par IP par heure |
| `leads` | Max 5 par email par heure |
| `newsletter_subscribers` | Max 3 par email par jour |

**Fonctions créées :**
- `check_form_submission_rate(p_ip)`
- `check_lead_rate(p_email)`
- `check_newsletter_rate(p_email)`

**Politiques RLS mises à jour :**
- `Rate limited form submissions`
- `Rate limited lead creation`
- `Rate limited newsletter subscription`

---

### 3.2 Protection site_settings ✅

**Problème :** La table `site_settings` exposait des configurations sensibles (URLs API IA, modèles).

**Solution :** 
- Ajout de la colonne `is_public` (boolean, default true)
- Settings sensibles marqués comme privés : `ai_generation_api_url`, `ai_generation_model`, `ai_generation_enabled`, `ai_custom_instructions`
- Politique RLS modifiée : seuls les settings `is_public = true` sont visibles publiquement

---

### 3.3 Protection forum_images (IP/User-Agent) ✅

**Problème :** Les colonnes `ip_address` et `user_agent` étaient accessibles à tous.

**Solution :** Création d'une vue sécurisée `forum_images_safe` qui :
- Affiche toutes les colonnes non-sensibles
- Masque `ip_address` et `user_agent` pour les non-admins
- Utilise `SECURITY INVOKER` (permissions de l'utilisateur appelant)

---

### 3.4 Restriction newsletter_subscribers ✅

**Problème :** Le rôle `poster_actualite` pouvait voir les emails des abonnés.

**Solution :** Politique RLS modifiée : seuls `admin` et `super_admin` peuvent lire la table.

---

### 3.5 Correction search_path des fonctions SQL ✅

**Problème :** Certaines fonctions n'avaient pas `SET search_path = public`, risque d'injection de schéma.

**Solution :** Toutes les fonctions corrigées avec `SET search_path = public` :
- `has_role`
- `has_permission`
- `update_updated_at_column`
- `check_form_submission_rate`
- `check_lead_rate`
- `check_newsletter_rate`

---

## 4. Bonnes Pratiques Implémentées ✅

### 4.1 Séparation des rôles

Les rôles sont stockés dans une table séparée `user_roles` avec les types :
- `super_admin`
- `admin`
- `moderator`
- `user`

### 4.2 Fonction `has_role` sécurisée

La fonction utilise `SECURITY DEFINER` avec `SET search_path = public` pour éviter les boucles RLS infinies.

### 4.3 RLS actif sur toutes les tables

Toutes les tables critiques ont Row Level Security activé avec des politiques adaptées.

### 4.4 Authentification JWT dans Edge Functions

Toutes les Edge Functions qui manipulent des données utilisateur valident maintenant le JWT :
- `generate-article` ✅
- `generate-images` ✅

### 4.5 Rate Limiting

Protection contre le spam/DoS sur les formulaires publics via des fonctions de rate limiting.

---

## 5. Actions Recommandées

| Priorité | Action | Statut |
|----------|--------|--------|
| Critique | Sécuriser AdminUsers.tsx | ✅ Fait |
| Critique | Authentifier generate-article | ✅ Fait |
| Critique | Authentifier generate-images | ✅ Fait (Phase 2) |
| Critique | Ajouter sanitization XSS | ✅ Fait |
| Critique | Supprimer console.log sensibles | ✅ Fait (Phase 2 & 3) |
| Moyenne | Séparer site_settings public/privé | ✅ Fait (Phase 3) |
| Moyenne | Rate limiting form_submissions | ✅ Fait (Phase 3) |
| Moyenne | Masquer IP/UA dans forum_images | ✅ Fait (Phase 3) |
| Moyenne | Restreindre newsletter_subscribers aux admins | ✅ Fait (Phase 3) |
| Moyenne | Corriger search_path des fonctions | ✅ Fait (Phase 3) |
| Basse | Activer Leaked Password Protection | 🔶 À faire manuellement |

---

## 6. Action Manuelle Requise

### Activer Leaked Password Protection

**Description :** Cette fonctionnalité empêche les utilisateurs d'utiliser des mots de passe connus comme compromis.

**Comment faire :**
1. Accéder aux paramètres d'authentification Lovable Cloud
2. Activer "Leaked Password Protection"

---

## 7. Tests de Sécurité Recommandés

1. **Test d'escalade de privilèges :**
   - Se connecter avec un compte `user`
   - Essayer d'accéder à `/admin/utilisateurs`
   - Vérifier la redirection vers `/`

2. **Test d'usurpation d'identité (Edge Function) :**
   - Appeler `generate-article` sans token → Vérifier 401
   - Appeler `generate-images` sans token → Vérifier 401

3. **Test XSS :**
   - Créer un article avec du code JavaScript dans le contenu
   - Vérifier que le script n'est pas exécuté

4. **Test Rate Limiting :**
   - Soumettre 11 formulaires depuis la même IP → Vérifier blocage
   - Créer 6 leads avec le même email → Vérifier blocage

5. **Test site_settings :**
   - En tant que visiteur anonyme, tenter de lire `ai_generation_api_url`
   - Vérifier que la valeur n'est pas retournée

---

## Historique des Modifications

| Date | Phase | Modifications |
|------|-------|---------------|
| 2026-01-09 | Phase 1 | Audit initial, corrections AdminUsers, generate-article, XSS |
| 2026-01-09 | Phase 2 | Sécurisation generate-images, nettoyage console.log |
| 2026-01-09 | Phase 3 | Rate limiting, protection site_settings, forum_images, newsletter_subscribers, correction search_path, nettoyage console.log complet |
