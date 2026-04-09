UPDATE form_configurations 
SET fields_schema = '[
  {"name": "fullName", "label": "Nom complet", "type": "text", "required": true, "placeholder": "Jean Dupont"},
  {"name": "phone", "label": "Téléphone", "type": "tel", "required": true, "placeholder": "06 12 34 56 78"},
  {"name": "email", "label": "Email", "type": "email", "required": true, "placeholder": "jean.dupont@email.com"}
]'::jsonb
WHERE form_identifier = 'lead-annonce';