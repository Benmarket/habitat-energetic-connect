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

## 2. Nettoyage Console.log ✅ (Phase 2)

### Fichiers nettoyés :

| Fichier | Logs supprimés |
|---------|----------------|
| `src/hooks/useOnlinePresence.tsx` | ✅ Fait (Phase 1) |
| `src/components/SitePopup.tsx` | ✅ Fait (Phase 2) |
| `src/components/HeroSection.tsx` | ✅ Fait (Phase 2) |
| `src/components/MaintenanceBanner.tsx` | ✅ Fait (Phase 2) |
| `src/components/ChatBot.tsx` | ✅ Fait (Phase 2) |
| `src/components/RichTextEditor/FavoriteCtaBannersBar.tsx` | ✅ Fait (Phase 2) |
| `src/pages/CreatePost.tsx` | ✅ Fait (Phase 2) |
| `supabase/functions/generate-images/index.ts` | ✅ Fait (Phase 2) |

---

## 3. Failles Moyennes à Corriger 🔶

### 3.1 RLS Policies trop permissives

**Tables concernées :**
- `form_submissions` - `WITH CHECK (true)` permet des insertions sans limite
- `leads` - Idem
- `newsletter_subscribers` - Idem

**Recommandation :** Ajouter du rate limiting côté serveur ou via une Edge Function avec validation captcha.

---

### 3.2 site_settings expose des informations sensibles

**Problème :** La table `site_settings` est accessible en lecture publique et contient :
- `ai_generation_api_url`
- `ai_generation_model`

**Recommandation :** 
- Ajouter une colonne `is_public` 
- Modifier le RLS pour ne permettre l'accès public qu'aux settings marqués publics

---

### 3.3 forum_images expose IP et User-Agent

**Problème :** Les colonnes `ip_address` et `user_agent` sont accessibles à tous.

**Recommandation :** Créer une politique RLS qui masque ces colonnes aux non-admins.

---

## 4. Bonnes Pratiques Implémentées ✅

### 4.1 Séparation des rôles

Les rôles sont stockés dans une table séparée `user_roles` avec les types :
- `super_admin`
- `admin`
- `moderator`
- `user`

### 4.2 Fonction `has_role` sécurisée

La fonction utilise `SECURITY DEFINER` pour éviter les boucles RLS infinies.

### 4.3 RLS actif sur toutes les tables

Toutes les tables critiques ont Row Level Security activé.

### 4.4 Authentification JWT dans Edge Functions

Toutes les Edge Functions qui manipulent des données utilisateur valident maintenant le JWT.

---

## 5. Actions Recommandées

| Priorité | Action | Statut |
|----------|--------|--------|
| Critique | Sécuriser AdminUsers.tsx | ✅ Fait |
| Critique | Authentifier generate-article | ✅ Fait |
| Critique | Authentifier generate-images | ✅ Fait (Phase 2) |
| Critique | Ajouter sanitization XSS | ✅ Fait |
| Critique | Supprimer console.log sensibles | ✅ Fait (Phase 2) |
| Moyenne | Séparer site_settings public/privé | 🔶 À faire |
| Moyenne | Rate limiting form_submissions | 🔶 À faire |
| Moyenne | Masquer IP/UA dans forum_images | 🔶 À faire |
| Basse | Activer Leaked Password Protection | 🔶 À faire (dans Lovable Cloud Auth) |

---

## 6. Tests de Sécurité Recommandés

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

---

## Historique des Modifications

| Date | Phase | Modifications |
|------|-------|---------------|
| 2026-01-09 | Phase 1 | Audit initial, corrections AdminUsers, generate-article, XSS |
| 2026-01-09 | Phase 2 | Sécurisation generate-images, nettoyage console.log |
