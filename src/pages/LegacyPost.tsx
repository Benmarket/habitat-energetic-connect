/**
 * Ancienne URL du blog Wix : /post/<slug> (accentué ou percent-encodé).
 *
 * Ces adresses sont toujours indexées par Google. Le pré-rendu (scripts/prerender.ts)
 * sert à ces chemins un HTML complet contenant l'article et un <link rel="canonical">
 * vers la nouvelle URL, ce qui transfère le signal SEO. Côté navigateur, on renvoie
 * l'internaute vers la fiche article actuelle.
 */

import { useEffect, useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import NotFound from "./NotFound";

export default function LegacyPost() {
  const { legacySlug } = useParams();
  const [target, setTarget] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;

    const resolve = async () => {
      if (!legacySlug) {
        setTarget(null);
        return;
      }

      const decoded = decodeURIComponent(legacySlug);

      const { data } = await supabase
        .from("posts")
        .select("slug, content_type, post_categories(categories(slug))")
        .eq("legacy_slug", decoded)
        .eq("status", "published")
        .maybeSingle();

      if (cancelled) return;

      if (!data) {
        setTarget(null);
        return;
      }

      const categorySlug =
        (data.post_categories as { categories: { slug: string } }[] | null)?.[0]?.categories?.slug ||
        "non-classe";

      setTarget(`/actualites/${categorySlug}/${data.slug}`);
    };

    resolve();
    return () => {
      cancelled = true;
    };
  }, [legacySlug]);

  if (target === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Helmet>
          <meta name="robots" content="noindex,follow" />
        </Helmet>
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (target === null) return <NotFound />;

  return <Navigate to={target} replace />;
}
