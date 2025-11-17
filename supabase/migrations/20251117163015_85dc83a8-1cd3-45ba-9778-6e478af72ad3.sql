-- Supprimer le rôle "user" pour les utilisateurs qui ont déjà un rôle supérieur
DELETE FROM user_roles 
WHERE role = 'user' 
AND user_id IN (
  SELECT user_id 
  FROM user_roles 
  WHERE role IN ('super_admin', 'admin', 'moderator')
);

-- Supprimer l'ancienne contrainte unique qui permettait plusieurs rôles
ALTER TABLE user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_role_key;

-- Ajouter une contrainte unique sur user_id pour garantir un seul rôle par utilisateur
ALTER TABLE user_roles ADD CONSTRAINT user_roles_user_id_unique UNIQUE (user_id);

-- Créer un commentaire pour documenter la règle
COMMENT ON TABLE user_roles IS 'Chaque utilisateur ne peut avoir qu''un seul rôle à la fois';