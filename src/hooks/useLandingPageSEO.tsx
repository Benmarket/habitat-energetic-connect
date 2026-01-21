import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface LandingPageSEO {
  seoStatus: "seo" | "hidden" | "disabled";
  canonicalUrl: string | null;
  loading: boolean;
}

export const useLandingPageSEO = (slug: string): LandingPageSEO => {
  const [seoStatus, setSeoStatus] = useState<"seo" | "hidden" | "disabled">("seo");
  const [canonicalUrl, setCanonicalUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSEOStatus = async () => {
      try {
        const { data, error } = await supabase
          .from("landing_pages")
          .select("seo_status, path")
          .eq("slug", slug)
          .single();

        if (!error && data) {
          setSeoStatus(data.seo_status as "seo" | "hidden" | "disabled");
          // Generate canonical URL for SEO and hidden pages (not disabled)
          if (data.seo_status !== "disabled" && data.path) {
            setCanonicalUrl(`https://prime-energies.fr${data.path}`);
          }
        }
      } catch (err) {
        console.error("Error fetching landing page SEO status:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSEOStatus();
  }, [slug]);

  return { seoStatus, canonicalUrl, loading };
};
