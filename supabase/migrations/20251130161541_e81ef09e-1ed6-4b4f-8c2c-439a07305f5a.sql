-- Ajouter un champ is_read pour tracker les soumissions lues/non lues
ALTER TABLE form_submissions 
ADD COLUMN is_read BOOLEAN NOT NULL DEFAULT false;

-- Créer un index pour améliorer les performances des requêtes
CREATE INDEX idx_form_submissions_is_read ON form_submissions(form_id, is_read);