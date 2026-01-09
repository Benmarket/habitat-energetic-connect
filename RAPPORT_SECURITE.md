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

### 1.2 Edge Function generate-article - Authentification manquante

**Problème :** La fonction recevait le `userId` directement du body de la requête, permettant à n'importe qui d'usurper l'identité d'un autre utilisateur.

**Solution :** 
- Validation du token JWT via l'en-tête `Authorization`
- Extraction du `userId` depuis le token validé (pas du body)
- Retour d'une erreur 401 si non authentifié

```typescript
// Valider le token en récupérant l'utilisateur
const { data: userData, error: userError } = await supabaseClient.auth.getUser();

if (userError || !userData?.user) {
  return new Response(
    JSON.stringify({ success: false, error: 'Non autorisé - Token invalide' }),
    { status: 401, headers: corsHeaders }
  );
}

// Extraire le userId du JWT validé
const userId = userData.user.id;
```

**Fichier modifié :** `supabase/functions/generate-article/index.ts`

---

### 1.3 Protection XSS - Sanitization HTML

**Problème :** Le contenu HTML des articles était affiché via `dangerouslySetInnerHTML` sans sanitization, exposant à des attaques XSS.

**Solution :** 
- Installation de DOMPurify
- Création d'un utilitaire `sanitizeHtml.ts`
- Application de la sanitization dans `contentRenderer.tsx`

**Fichiers créés/modifiés :**
- `src/utils/sanitizeHtml.ts` (nouveau)
- `src/utils/contentRenderer.tsx` (modifié)

---

## 2. Failles Moyennes à Corriger 🔶

### 2.1 RLS Policies trop permissives

**Tables concernées :**
- `form_submissions` - `WITH CHECK (true)` permet des insertions sans limite
- `leads` - Idem
- `newsletter_subscribers` - Idem

**Recommandation :** Ajouter du rate limiting côté serveur ou via une Edge Function avec validation captcha.

---

### 2.2 site_settings expose des informations sensibles

**Problème :** La table `site_settings` est accessible en lecture publique et contient :
- `ai_generation_api_url`
- `ai_generation_model`

**Recommandation :** 
- Ajouter une colonne `is_public` 
- Modifier le RLS pour ne permettre l'accès public qu'aux settings marqués publics

---

### 2.3 Console.log en production

**Problème :** Des `console.log` exposaient des informations de débogage.

**Solution :** Suppression des logs sensibles dans `useOnlinePresence.tsx`.

**Fichier modifié :** `src/hooks/useOnlinePresence.tsx`

---

## 3. Bonnes Pratiques Implémentées ✅

### 3.1 Séparation des rôles

Les rôles sont stockés dans une table séparée `user_roles` avec les types :
- `super_admin`
- `admin`
- `moderator`
- `user`

### 3.2 Fonction `has_role` sécurisée

La fonction utilise `SECURITY DEFINER` pour éviter les boucles RLS infinies.

### 3.3 RLS actif sur toutes les tables

Toutes les tables critiques ont Row Level Security activé.

---

## 4. Actions Recommandées

| Priorité | Action | Statut |
|----------|--------|--------|
| Critique | Sécuriser AdminUsers.tsx | ✅ Fait |
| Critique | Authentifier Edge Functions | ✅ Fait |
| Critique | Ajouter sanitization XSS | ✅ Fait |
| Moyenne | Séparer site_settings public/privé | 🔶 À faire |
| Moyenne | Rate limiting form_submissions | 🔶 À faire |
| Basse | Supprimer tous les console.log | ✅ Partiellement fait |
| Basse | Activer Leaked Password Protection | 🔶 À faire (dans Lovable Cloud Auth) |

---

## 5. Tests de Sécurité Recommandés

1. **Test d'escalade de privilèges :**
   - Se connecter avec un compte `user`
   - Essayer d'accéder à `/admin/utilisateurs`
   - Vérifier la redirection vers `/`

2. **Test d'usurpation d'identité (Edge Function) :**
   - Appeler `generate-article` sans token
   - Vérifier la réponse 401

3. **Test XSS :**
   - Créer un article avec du code JavaScript dans le contenu
   - Vérifier que le script n'est pas exécuté

---

## Historique des Modifications

| Date | Auteur | Modifications |
|------|--------|---------------|
| 2026-01-09 | Lovable AI | Audit initial et corrections critiques |
