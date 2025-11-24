-- Add AI generation settings to site_settings
INSERT INTO public.site_settings (key, value)
VALUES 
  ('ai_generation_api_url', '"https://api.anthropic.com/v1/messages"'::jsonb),
  ('ai_generation_model', '"claude-sonnet-4-5"'::jsonb),
  ('ai_generation_enabled', 'true'::jsonb)
ON CONFLICT (key) DO NOTHING;