import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { loadMetaPixel, trackMetaPageView } from "@/lib/metaPixel";

/**
 * Charge dynamiquement le Pixel Meta si un Pixel ID est configuré côté admin
 * (site_settings.meta_pixel_id) et déclenche un PageView à chaque changement
 * de route (SPA).
 *
 * À monter UNE seule fois dans App.tsx, à l'intérieur de <BrowserRouter>.
 */
const MetaPixel = () => {
  const location = useLocation();
  const loadedRef = useRef(false);

  // Charge le pixel au 1er mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase
          .from("site_settings")
          .select("value")
          .eq("key", "meta_pixel_id")
          .maybeSingle();
        if (cancelled) return;
        const raw = (data?.value ?? "") as unknown;
        const pixelId =
          typeof raw === "string"
            ? raw.trim()
            : typeof raw === "object" && raw && "id" in (raw as any)
              ? String((raw as any).id ?? "").trim()
              : "";
        if (pixelId && /^\d{6,20}$/.test(pixelId)) {
          loadMetaPixel(pixelId);
          loadedRef.current = true;
        }
      } catch (e) {
        console.debug("[MetaPixel] load error", e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // PageView sur changement de route (le 1er PageView est déjà envoyé par loadMetaPixel)
  useEffect(() => {
    if (!loadedRef.current) return;
    trackMetaPageView();
  }, [location.pathname, location.search]);

  return null;
};

export default MetaPixel;
