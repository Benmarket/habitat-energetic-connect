# Rapport d'Analyse du Système de Chat

## État Actuel du Système

### 1. Tables Existantes

#### `chat_conversations`
| Colonne | Type | Description |
|---------|------|-------------|
| id | uuid | Identifiant unique |
| user_id | uuid | ID utilisateur (si connecté) |
| visitor_id | text | ID visiteur (si non connecté) |
| status | text | Statut: active, awaiting_agent, closed |
| created_at | timestamp | Date de création |
| updated_at | timestamp | Dernière mise à jour |

#### `chat_messages`
| Colonne | Type | Description |
|---------|------|-------------|
| id | uuid | Identifiant unique |
| conversation_id | uuid | Référence conversation |
| sender_type | text | user, bot, agent |
| sender_id | uuid | ID de l'agent (si agent) |
| content | text | Contenu du message |
| sender_name | text | Nom affiché |
| created_at | timestamp | Date d'envoi |

#### `chat_agent_requests`
| Colonne | Type | Description |
|---------|------|-------------|
| id | uuid | Identifiant unique |
| conversation_id | uuid | Référence conversation |
| status | text | pending, accepted, closed |
| assigned_agent_id | uuid | Agent assigné |
| created_at | timestamp | Date de demande |
| accepted_at | timestamp | Date d'acceptation |

---

## Problèmes Identifiés et Solutions

### ❌ Problème 1: Pas de détection de fermeture de fenêtre
**État actuel**: Si un utilisateur ferme la fenêtre/onglet, la demande d'agent reste active indéfiniment.

**Solution**: 
- Ajouter un système de "heartbeat" côté client
- Ajouter des colonnes `last_seen_at`, `closed_reason`, `closed_at`
- Auto-fermer les demandes après X minutes d'inactivité

### ❌ Problème 2: Pas de stockage du parcours de qualification
**État actuel**: Les réponses du parcours ne sont pas enregistrées dans la conversation. Le nom du parcours n'est pas lié.

**Solution**:
- Ajouter `flow_id`, `flow_responses` à `chat_conversations`
- Enregistrer les réponses JSON du parcours

### ❌ Problème 3: Métadonnées manquantes
**État actuel**: Pas d'IP, User-Agent, page d'origine dans les conversations.

**Solution**:
- Ajouter `ip_address`, `user_agent`, `page_url`, `referrer` à `chat_conversations`

### ❌ Problème 4: Pas de protection contre les doublons d'agents
**État actuel**: Quand un agent accepte une demande, les autres voient toujours la notification jusqu'au prochain refresh.

**Solution**: 
- Utiliser Realtime pour mettre à jour immédiatement le statut chez tous les agents
- ✅ Déjà partiellement implémenté avec le channel `agent-requests-notifications`

### ❌ Problème 5: Pas d'auto-fermeture après timeout
**État actuel**: Les demandes non prises restent en attente indéfiniment.

**Solution**:
- Ajouter une Edge Function cron ou un check côté client
- Après X minutes, fermer automatiquement et notifier l'utilisateur

### ❌ Problème 6: Pas de page "Historique des conversations"
**État actuel**: Impossible de consulter les anciennes conversations.

**Solution**:
- Créer une page `/admin/chat-history` avec filtres et recherche

---

## Migrations Requises

```sql
-- 1. Enrichir chat_conversations avec métadonnées et parcours
ALTER TABLE chat_conversations
ADD COLUMN IF NOT EXISTS flow_id uuid REFERENCES chatbot_flows(id),
ADD COLUMN IF NOT EXISTS flow_responses jsonb DEFAULT '[]',
ADD COLUMN IF NOT EXISTS ip_address text,
ADD COLUMN IF NOT EXISTS user_agent text,
ADD COLUMN IF NOT EXISTS page_url text,
ADD COLUMN IF NOT EXISTS referrer text,
ADD COLUMN IF NOT EXISTS last_seen_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS closed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS closed_reason text;

-- 2. Enrichir chat_agent_requests pour le timeout
ALTER TABLE chat_agent_requests
ADD COLUMN IF NOT EXISTS expired_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS timeout_minutes integer DEFAULT 10,
ADD COLUMN IF NOT EXISTS notified_user boolean DEFAULT false;
```

---

## Fonctionnalités à Implémenter

### Phase 1: Métadonnées et Parcours (Priorité Haute)
1. ✅ Migration base de données
2. ✅ Enregistrer le flow_id et flow_responses à la fin du parcours
3. ✅ Capturer IP, User-Agent, page_url côté client
4. ✅ Système de heartbeat (last_seen_at)

### Phase 2: Timeout et Fermeture (Priorité Haute)
1. ✅ Auto-fermer les demandes après X minutes
2. ✅ Notifier l'utilisateur si aucun agent n'a répondu
3. ✅ Proposer une alternative (formulaire de contact)

### Phase 3: Historique (Priorité Moyenne)
1. ⏳ Page admin pour consulter les conversations
2. ⏳ Filtres par date, parcours, statut
3. ⏳ Export des données

---

## Architecture Cible

```
[Visiteur] 
    ↓
[ChatBot Widget]
    ↓ (parcours actif)
[ChatbotFlowRunner] → Enregistre flow_responses
    ↓
[Demande Agent] → chat_agent_requests (status: pending)
    ↓
    ├── [Heartbeat toutes les 30s] → met à jour last_seen_at
    │
    ├── [Agent accepte] → status: accepted, notification Realtime
    │
    ├── [Timeout 10min sans agent] → status: expired, notifie user
    │
    └── [User ferme la page] → heartbeat s'arrête → status: abandoned
```
