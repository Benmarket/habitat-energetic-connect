# Rapport d'Analyse et Améliorations du Système de Chat

## ✅ Améliorations Implémentées

### 1. Détection de fermeture de fenêtre / abandon
- **Heartbeat** : Le chatbot envoie un signal "je suis là" toutes les 30 secondes
- **Colonnes ajoutées** : `last_seen_at`, `closed_at`, `closed_reason`
- **Fonction SQL** : `mark_abandoned_conversations()` marque les conversations sans heartbeat depuis 2 min

### 2. Stockage du parcours et métadonnées
- **Parcours lié** : `flow_id` référence le parcours utilisé
- **Réponses stockées** : `flow_responses` (JSON) contient toutes les Q&R du parcours
- **Métadonnées** : `page_url`, `referrer`, `user_agent`, `ip_address`

### 3. Protection contre les doublons d'agents
- Les notifications filtrent automatiquement les demandes où le user n'a pas de heartbeat récent
- Quand un agent accepte, le statut passe à "accepted" → tous les autres agents ne voient plus la demande
- Realtime déjà en place pour synchroniser les notifications

### 4. Auto-fermeture après timeout
- **Fonction SQL** : `expire_stale_agent_requests()` expire les demandes après X minutes
- **Notification user** : Le chatbot vérifie si sa demande a expiré et affiche un message
- **Colonnes ajoutées** : `expired_at`, `timeout_minutes`, `notified_user`

### 5. Page Historique des conversations
- Nouvelle page : `/admin/chat-history`
- Accès via bouton "Historique" dans Administration > Chatbot
- Filtres par statut, recherche par email/visiteur/page
- Détails : métadonnées, réponses du parcours, tous les messages

---

## Structure de la Base de Données

### `chat_conversations` (mise à jour)
| Colonne | Type | Description |
|---------|------|-------------|
| id | uuid | Identifiant unique |
| user_id | uuid | ID utilisateur (si connecté) |
| visitor_id | text | ID visiteur (si non connecté) |
| status | text | active, awaiting_agent, completed, qualified, expired, abandoned |
| **flow_id** | uuid | Référence au parcours utilisé |
| **flow_responses** | jsonb | Réponses du parcours [{question, answer}] |
| **page_url** | text | URL de la page d'origine |
| **referrer** | text | Page précédente |
| **user_agent** | text | Navigateur/device |
| **ip_address** | text | IP du visiteur |
| **last_seen_at** | timestamp | Dernier heartbeat |
| **closed_at** | timestamp | Date de fermeture |
| **closed_reason** | text | timeout, no_heartbeat, user_closed |

### `chat_agent_requests` (mise à jour)
| Colonne | Type | Description |
|---------|------|-------------|
| **expired_at** | timestamp | Date d'expiration |
| **timeout_minutes** | integer | Délai avant expiration (défaut: 10) |
| **notified_user** | boolean | User notifié de l'expiration |

---

## Flux Utilisateur

```
[Visiteur ouvre le chatbot]
    ↓
[Conversation créée avec métadonnées]
    ↓ (heartbeat toutes les 30s)
[Parcours de qualification]
    ↓ (réponses stockées dans flow_responses)
    ├── [Fin du parcours] → status: completed/qualified
    │
    └── [Demande agent] → status: awaiting_agent
        ↓
        ├── [Agent accepte dans 10 min] → Chat en direct
        │
        ├── [Timeout 10 min] → Expire, notifie le user
        │
        └── [User ferme la page] → Heartbeat s'arrête → Abandonné
```

---

## Accès Admin

1. **Administration > Chatbot** : Gérer les parcours
2. **Bouton "Historique"** : Voir toutes les conversations
3. **Notifications (cloche)** : Demandes d'agent en attente
4. **Chat Support** : Interface agent pour répondre

---

## Prochaines Étapes Suggérées

1. **Collecte de lead** : Ajouter un nœud "formulaire" dans le parcours pour capturer email/téléphone
2. **Export CSV** : Permettre l'export des conversations
3. **Analytics** : Dashboard des stats (taux de qualification, temps moyen, etc.)
4. **IA Assistant** : Connecter un LLM pour répondre automatiquement avant l'agent
