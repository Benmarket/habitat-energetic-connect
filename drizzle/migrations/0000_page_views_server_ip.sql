CREATE OR REPLACE FUNCTION public.page_views_fill_ip()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE h json;
BEGIN
  BEGIN h := current_setting('request.headers', true)::json; EXCEPTION WHEN others THEN h := NULL; END;
  IF h IS NOT NULL THEN
    IF NEW.ip_address IS NULL THEN
      NEW.ip_address := COALESCE(h->>'cf-connecting-ip', h->>'x-real-ip', split_part(h->>'x-forwarded-for', ',', 1));
      IF NEW.ip_address = '' THEN NEW.ip_address := NULL; END IF;
    END IF;
    IF NEW.country IS NULL THEN NEW.country := NULLIF(h->>'cf-ipcountry', ''); END IF;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_page_views_fill_ip ON public.page_views;
CREATE TRIGGER trg_page_views_fill_ip BEFORE INSERT ON public.page_views FOR EACH ROW EXECUTE FUNCTION public.page_views_fill_ip();