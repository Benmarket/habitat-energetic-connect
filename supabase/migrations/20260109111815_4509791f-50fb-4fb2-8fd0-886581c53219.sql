-- Correction de la vue forum_images_safe
-- Supprimer la vue SECURITY DEFINER et la recréer avec SECURITY INVOKER (défaut)
DROP VIEW IF EXISTS public.forum_images_safe;

-- Recréer la vue sans SECURITY DEFINER - elle utilisera les permissions du user appelant
CREATE VIEW public.forum_images_safe AS
SELECT 
  id,
  user_id,
  post_id,
  topic_id,
  storage_path,
  filename,
  mime_type,
  file_size,
  created_at,
  -- Masquer IP et User-Agent sauf pour les admins
  CASE 
    WHEN public.has_role('admin'::app_role, auth.uid()) 
      OR public.has_role('super_admin'::app_role, auth.uid())
    THEN ip_address 
    ELSE NULL 
  END as ip_address,
  CASE 
    WHEN public.has_role('admin'::app_role, auth.uid()) 
      OR public.has_role('super_admin'::app_role, auth.uid())
    THEN user_agent 
    ELSE NULL 
  END as user_agent
FROM forum_images;

-- Explicitement marquer la vue comme SECURITY INVOKER (c'est le défaut mais soyons explicites)
ALTER VIEW public.forum_images_safe SET (security_invoker = on);