
DO $$
DECLARE
  guide_popup_id   text := '2169c65b-05fa-4a54-b344-856b8a1c8f5d';
  solar_popup_id   text := '310c53d4-b541-48a5-a87a-13b2fdb48447';
  general_popup_id text := '7d435e72-261b-4b98-8276-4900fd98c595';
BEGIN
  UPDATE public.posts p
  SET content = replace(content, guide_popup_id, solar_popup_id),
      updated_at = now()
  WHERE content_type IN ('actualite', 'aide')
    AND content LIKE '%' || guide_popup_id || '%'
    AND EXISTS (
      SELECT 1 FROM public.post_categories pc
      JOIN public.categories c ON c.id = pc.category_id
      WHERE pc.post_id = p.id
        AND c.slug IN ('solaire', 'photovoltaique', 'stockage-energie-solaire')
    );

  UPDATE public.posts p
  SET content = replace(content, guide_popup_id, general_popup_id),
      updated_at = now()
  WHERE content_type IN ('actualite', 'aide')
    AND content LIKE '%' || guide_popup_id || '%';
END $$;
