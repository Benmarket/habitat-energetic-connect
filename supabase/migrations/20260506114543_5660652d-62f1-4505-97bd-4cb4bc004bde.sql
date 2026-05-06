
INSERT INTO public.popups (
  name, is_active, target_page, form_id, delay_seconds, frequency,
  template, title, subtitle, accent_color, size, position, animation,
  trigger_type, trigger_id, badge_text, is_custom_template
) VALUES (
  'Téléchargement guide — Merci',
  true,
  '/',
  NULL,
  0,
  'always',
  'guide_download_thanks',
  'Merci de faire confiance à Prime Énergies !',
  'Votre guide est en cours de téléchargement. Nous espérons qu''il vous accompagnera dans la réussite de votre projet de rénovation énergétique.',
  '#10b981',
  'medium',
  'center',
  'scale',
  'click',
  'guide-download-thanks',
  'Téléchargement',
  false
)
ON CONFLICT DO NOTHING;
