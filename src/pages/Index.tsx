import { useState, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { Helmet } from "react-helmet";
import { OrganizationSchema } from "@/components/SEO/OrganizationSchema";
import { WebSiteSchema } from "@/components/SEO/WebSiteSchema";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HeroSection from "@/components/HeroSection";
import InstitutionalContextSection from "@/components/InstitutionalContextSection";
import SolarBanner from "@/components/SolarBanner";
import WhySolarSection from "@/components/WhySolarSection";
import RenovationProgramSection from "@/components/RenovationProgramSection";
import EligibilityFormSection from "@/components/EligibilityFormSection";
import NewsSection from "@/components/NewsSection";
import AidesSection from "@/components/AidesSection";
import GuidesSection from "@/components/GuidesSection";
import SimulatorsSection from "@/components/SimulatorsSection";
import InstallerFinderSection from "@/components/InstallerFinderSection";
import PartnerOffersSection from "@/components/PartnerOffersSection";
import CTAPartner from "@/components/CTAPartner";
import FAQSection from "@/components/FAQSection";
import ReviewsSection from "@/components/ReviewsSection";
import ContactSection from "@/components/ContactSection";
import AppDownloadSection from "@/components/AppDownloadSection";
import { supabase } from "@/integrations/supabase/client";
import { useRegionContext, RegionCode } from "@/hooks/useRegionContext";

interface HomepageSection {
  id: string;
  name: string;
  anchor: string;
  visible: boolean;
  order: number;
  regionVisibility?: RegionCode[]; // Liste des régions où la section est visible (vide = toutes)
}

const DEFAULT_SECTIONS: HomepageSection[] = [
  { id: 'hero', name: 'Hero Principal', anchor: '#hero', visible: true, order: 0, regionVisibility: [] },
  { id: 'institutional-context', name: 'Parcours Institutionnel', anchor: '#parcours', visible: true, order: 1, regionVisibility: [] },
  { id: 'solar-banner', name: 'Bannière Solaire', anchor: '#solaire', visible: true, order: 2, regionVisibility: [] },
  { id: 'why-solar', name: 'Pourquoi le Solaire', anchor: '#pourquoi-solaire', visible: true, order: 3, regionVisibility: [] },
  { id: 'renovation', name: 'Programme Rénovation', anchor: '#renovation', visible: true, order: 4, regionVisibility: [] },
  { id: 'news', name: 'Actualités', anchor: '#actualites', visible: true, order: 5, regionVisibility: [] },
  { id: 'aides', name: 'Aides disponibles', anchor: '#aides', visible: true, order: 6, regionVisibility: [] },
  { id: 'guides', name: 'Guides par projet', anchor: '#guides', visible: true, order: 7, regionVisibility: [] },
  { id: 'eligibility', name: 'Étude gratuite (formulaire)', anchor: '#etude', visible: true, order: 8, regionVisibility: [] },
  { id: 'simulators', name: 'Simulateurs', anchor: '#simulateurs', visible: true, order: 9, regionVisibility: [] },
  { id: 'installers', name: 'Trouver un installateur', anchor: '#installateurs', visible: true, order: 10, regionVisibility: [] },
  { id: 'partner-offers', name: 'Offres partenaires', anchor: '#offres', visible: true, order: 11, regionVisibility: [] },
  { id: 'cta-partner', name: 'Devenir partenaire', anchor: '#devenir-partenaire', visible: true, order: 12, regionVisibility: [] },
  { id: 'faq', name: 'FAQ', anchor: '#faq', visible: true, order: 13, regionVisibility: [] },
  { id: 'reviews', name: 'Avis clients', anchor: '#avis', visible: true, order: 14, regionVisibility: [] },
  { id: 'contact', name: 'Contact', anchor: '#contact', visible: true, order: 15, regionVisibility: [] },
  { id: 'app-download', name: 'Télécharger l\'app', anchor: '#app', visible: true, order: 16, regionVisibility: [] },
];

const SECTION_COMPONENTS: Record<string, React.FC> = {
  'hero': HeroSection,
  'institutional-context': InstitutionalContextSection,
  'solar-banner': SolarBanner,
  'why-solar': WhySolarSection,
  'renovation': RenovationProgramSection,
  'news': NewsSection,
  'aides': AidesSection,
  'guides': GuidesSection,
  'eligibility': EligibilityFormSection,
  'simulators': SimulatorsSection,
  'installers': InstallerFinderSection,
  'partner-offers': PartnerOffersSection,
  'cta-partner': CTAPartner,
  'faq': FAQSection,
  'reviews': ReviewsSection,
  'contact': ContactSection,
  'app-download': AppDownloadSection,
};

const Index = () => {
  const [sections, setSections] = useState<HomepageSection[]>(DEFAULT_SECTIONS);
  const { activeRegion } = useRegionContext();
  const location = useLocation();

  // Permet de (re)scroller après hydratation des bandes (ex: réordonnancement chargé depuis la BDD)
  const [sectionsHydrated, setSectionsHydrated] = useState(false);

  useEffect(() => {
    const loadSections = async () => {
      try {
        const { data, error } = await supabase
          .from("site_settings")
          .select("value")
          .eq("key", "homepage_sections")
          .maybeSingle();

        if (error) {
          return;
        }

        if (data?.value && Array.isArray(data.value)) {
          const savedSections = data.value as unknown as HomepageSection[];
          // Use saved sections with their visibility and order
          // Add any new default sections that don't exist yet
          const savedIds = savedSections.map(s => s.id);
          const newDefaultSections = DEFAULT_SECTIONS.filter(d => !savedIds.includes(d.id));
          
          // Merge and sort by saved order
          const mergedSections = [...savedSections, ...newDefaultSections]
            .map(section => ({
              ...section,
              // Ensure visible is properly cast to boolean
              visible: Boolean(section.visible),
              order: typeof section.order === 'number' ? section.order : 0,
              // Ensure regionVisibility is an array
              regionVisibility: Array.isArray(section.regionVisibility) ? section.regionVisibility : [],
            }))
            .sort((a, b) => a.order - b.order);
          
          setSections(mergedSections);
        }
      } catch (error) {
        // Silent fail - use default sections
      } finally {
        setSectionsHydrated(true);
      }
    };

    loadSections();
  }, []);

  // Filter sections based on visibility and region
  const visibleSections = useMemo(() => sections.filter(section => {
    // First check global visibility
    if (!section.visible) return false;
    
    // Then check region visibility
    const regionVisibility = section.regionVisibility || [];
    
    // If no regions specified, visible everywhere
    if (regionVisibility.length === 0) return true;
    
    // Otherwise, check if current region is in the list
    return regionVisibility.includes(activeRegion);
  }), [sections, activeRegion]);

  const visibleSectionsSignature = useMemo(
    () => visibleSections.map((s) => `${s.id}:${s.order}:${s.visible}`).join("|"),
    [visibleSections]
  );

  // Scroll hash -> bande correspondante (fiable même après réordonnancement/hydratation)
  useEffect(() => {
    if (!location.hash) return;
    if (!sectionsHydrated) return;

    const id = decodeURIComponent(location.hash.replace(/^#/, ""));
    let cancelled = false;

    const scrollToElement = (attempt = 0) => {
      if (cancelled) return;

      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }

      // Si la bande n'est pas encore présente (ou vient d'être réordonnée), on retente
      if (attempt < 40) {
        setTimeout(() => scrollToElement(attempt + 1), 100);
      }
    };

    requestAnimationFrame(() => {
      setTimeout(() => scrollToElement(0), 50);
    });

    return () => {
      cancelled = true;
    };
  }, [location.hash, sectionsHydrated, visibleSectionsSignature]);

  return (
    <>
      <Helmet>
        <title>Prime Énergies | Réduisez vos factures énergétiques jusqu'à 80%</title>
        <meta 
          name="description" 
          content="Bénéficiez d'une étude énergétique gratuite et découvrez les travaux subventionnés adaptés à votre logement. Panneaux solaires, pompe à chaleur, isolation." 
        />
        <link rel="canonical" href="https://prime-energies.fr/" />
        <meta property="og:url" content="https://prime-energies.fr/" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Prime Énergies | Réduisez vos factures énergétiques jusqu'à 80%" />
        <meta property="og:description" content="Bénéficiez d'une étude énergétique gratuite et découvrez les travaux subventionnés adaptés à votre logement. Panneaux solaires, pompe à chaleur, isolation." />
        <meta property="og:locale" content="fr_FR" />
        <meta property="og:site_name" content="Prime Énergies" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Prime Énergies | Réduisez vos factures énergétiques jusqu'à 80%" />
        <meta name="twitter:description" content="Bénéficiez d'une étude énergétique gratuite et découvrez les travaux subventionnés adaptés à votre logement. Panneaux solaires, pompe à chaleur, isolation." />
      </Helmet>
      <OrganizationSchema />

      <div className="min-h-screen bg-background">
        <Header />
        {visibleSections.map(section => {
          const Component = SECTION_COMPONENTS[section.id];
          // Extraire l'ID d'ancre (sans le #) de la configuration
          const anchorId = section.anchor.replace('#', '');
          return Component ? (
            <div key={section.id} id={anchorId} className="scroll-mt-24">
              <Component />
            </div>
          ) : null;
        })}
        <Footer />
      </div>
    </>
  );
};

export default Index;
