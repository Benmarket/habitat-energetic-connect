INSERT INTO public.form_configurations (form_identifier, name, send_confirmation_email, include_signup_link)
VALUES ('contact_general', 'Contact général (page Contact)', true, true)
ON CONFLICT (form_identifier) DO NOTHING;