import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

// ─── Types for regional content JSONB ───
export interface RegionalHighlight {
  icon: string;
  label: string;
  value: string;
  description: string;
}

export interface RegionalContext {
  title: string;
  intro_text: string;
  highlights: RegionalHighlight[];
}

export interface ProfitabilityRow {
  puissance: string;
  production: string;
  economies: string;
  amortissement: string;
}

export interface RegionalProfitability {
  title: string;
  intro_text: string;
  roi_years: number;
  annual_production_kwh: number;
  savings_25_years: string;
  comparison_text?: string;
  table_data: ProfitabilityRow[];
}

export interface RegionalAidItem {
  name: string;
  amount: string;
  description: string;
  is_local: boolean;
  year?: number;
}

export interface RegionalAids {
  title: string;
  intro_text?: string;
  items: RegionalAidItem[];
}

export interface RegionalTestimonial {
  text: string;
  name: string;
  location?: string;
}

export interface RegionalFAQ {
  question: string;
  answer: string;
}

export interface RegionalSEO {
  meta_title: string;
  meta_description: string;
  h1: string;
  focus_keywords?: string[];
}

export interface RegionalDynamicVars {
  clients_count?: number;
  installations_count?: number;
  average_rating?: number;
  last_updated?: string;
}

export interface RegionalImages {
  hero?: string;
  context?: string;
  profitability?: string;
  aids?: string;
  eligibility?: string;
  prestation?: string;
  testimonials?: string;
  faq?: string;
  cta?: string;
}

export interface RegionalContent {
  region_name?: string;
  region_demonym?: string;
  hero_title?: string;
  hero_subtitle?: string;
  hero_image?: string;
  hero_slides?: { src: string; alt: string; caption?: string; name?: string }[];
  context?: RegionalContext;
  profitability?: RegionalProfitability;
  aids?: RegionalAids;
  testimonials?: RegionalTestimonial[];
  faq?: RegionalFAQ[];
  images?: RegionalImages;
  seo?: RegionalSEO;
  dynamic_vars?: RegionalDynamicVars;
}

export interface SimulatorRegionData {
  name: string;
  tarif_kwh: number;
  prime_0_3: number;
  prime_4_9: number;
  prime_10_36: number;
  tarif_rachat_0_3: number;
  tarif_rachat_4_9: number;
  tarif_rachat_10_36: number;
  variation_prix_installation: number;
}

export interface ResolvedRegionalContent {
  content: RegionalContent;
  simulatorData: SimulatorRegionData | null;
  seoStatus: "seo" | "hidden" | "disabled";
  canonicalUrl: string | null;
  loading: boolean;
  isRegional: boolean;
  regionCode: string;
  filledSections: number;
}

// ─── Region code to display name mapping ───
const regionDisplayNames: Record<string, string> = {
  fr: "France métropolitaine",
  corse: "Corse",
  reunion: "La Réunion",
  martinique: "Martinique",
  guadeloupe: "Guadeloupe",
  guyane: "Guyane",
};

// ─── Region code to simulator region name matching ───
const regionToSimulatorName: Record<string, string> = {
  fr: "France métropolitaine",
  corse: "Corse",
  reunion: "La Réunion",
  martinique: "Martinique",  
  guadeloupe: "Guadeloupe",
  guyane: "Guyane",
};

function countFilledSections(content: RegionalContent): number {
  let count = 0;
  if (content.context?.intro_text) count++;
  if (content.profitability?.table_data?.length) count++;
  if (content.aids?.items?.length) count++;
  if (content.testimonials?.length) count++;
  if (content.faq?.length) count++;
  if (content.seo?.h1) count++;
  return count;
}

function generateDefaultSEO(regionName: string): RegionalSEO {
  return {
    meta_title: `Panneaux Solaires ${regionName} : Prix, Aides & Rentabilité 2026`,
    meta_description: `Installation de panneaux solaires en ${regionName}. Profitez des aides et subventions pour réduire vos factures d'électricité. Devis gratuit.`,
    h1: `Installation Panneaux Solaires en ${regionName}`,
    focus_keywords: [`panneaux solaires ${regionName.toLowerCase()}`, `photovoltaique ${regionName.toLowerCase()}`],
  };
}

/**
 * Resolves regional content with fallback cascade:
 * 1. Regional content (from landing_pages.regional_content)
 * 2. National content (from base solaire LP)
 * 3. Template defaults (hardcoded)
 */
export const useRegionalContent = (regionCode: string): ResolvedRegionalContent => {
  const [content, setContent] = useState<RegionalContent>({});
  const [simulatorData, setSimulatorData] = useState<SimulatorRegionData | null>(null);
  const [seoStatus, setSeoStatus] = useState<"seo" | "hidden" | "disabled">("seo");
  const [canonicalUrl, setCanonicalUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const regionName = regionDisplayNames[regionCode] || regionCode;
  const isRegional = regionCode !== "fr" && regionCode !== "";

  useEffect(() => {
    const fetchContent = async () => {
      setLoading(true);
      try {
        // Fetch regional LP and national LP in parallel
        const regionalSlug = `solaire-${regionCode === "fr" ? "metropole" : regionCode}`;
        
        const [regionalRes, nationalRes, simulatorRes] = await Promise.all([
          isRegional
            ? supabase
                .from("landing_pages")
                .select("regional_content, seo_status, path")
                .eq("slug", regionalSlug)
                .single()
            : Promise.resolve({ data: null, error: null }),
          supabase
            .from("landing_pages")
            .select("regional_content, seo_status, path")
            .eq("slug", "solaire")
            .single(),
          supabase
            .from("solar_simulator_regions")
            .select("name, tarif_kwh, prime_0_3, prime_4_9, prime_10_36, tarif_rachat_0_3, tarif_rachat_4_9, tarif_rachat_10_36, variation_prix_installation")
            .ilike("name", `%${regionToSimulatorName[regionCode] || regionCode}%`)
            .maybeSingle(),
        ]);

        // Resolve content with fallback
        const regionalContent = (regionalRes.data?.regional_content as RegionalContent) || {};
        const nationalContent = (nationalRes.data?.regional_content as RegionalContent) || {};

        // Merge: regional overrides national
        const resolved: RegionalContent = {
          region_name: regionalContent.region_name || regionName,
          region_demonym: regionalContent.region_demonym || regionName.toLowerCase(),
          hero_title: regionalContent.hero_title || nationalContent.hero_title,
          hero_subtitle: regionalContent.hero_subtitle || nationalContent.hero_subtitle,
          hero_image: regionalContent.hero_image || nationalContent.hero_image,
          context: regionalContent.context || nationalContent.context,
          profitability: regionalContent.profitability || nationalContent.profitability,
          aids: regionalContent.aids || nationalContent.aids,
          testimonials: regionalContent.testimonials?.length ? regionalContent.testimonials : nationalContent.testimonials,
          faq: regionalContent.faq?.length ? regionalContent.faq : nationalContent.faq,
          images: { ...nationalContent.images, ...regionalContent.images },
          seo: regionalContent.seo || (isRegional ? generateDefaultSEO(regionName) : nationalContent.seo),
          dynamic_vars: { ...nationalContent.dynamic_vars, ...regionalContent.dynamic_vars },
        };

        setContent(resolved);
        setSimulatorData(simulatorRes.data as SimulatorRegionData | null);

        // SEO status
        if (isRegional && regionalRes.data) {
          setSeoStatus(regionalRes.data.seo_status as "seo" | "hidden" | "disabled");
          if (regionalRes.data.seo_status !== "disabled" && regionalRes.data.path) {
            setCanonicalUrl(`https://prime-energies.fr${regionalRes.data.path}`);
          }
        } else if (nationalRes.data) {
          setSeoStatus(nationalRes.data.seo_status as "seo" | "hidden" | "disabled");
          if (nationalRes.data.path) {
            setCanonicalUrl(`https://prime-energies.fr${nationalRes.data.path}`);
          }
        }
      } catch (err) {
        console.error("Error fetching regional content:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [regionCode, isRegional, regionName]);

  return {
    content,
    simulatorData,
    seoStatus,
    canonicalUrl,
    loading,
    isRegional,
    regionCode,
    filledSections: countFilledSections(content),
  };
};
