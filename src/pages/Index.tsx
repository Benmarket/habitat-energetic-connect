import { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { OrganizationSchema } from "@/components/SEO/OrganizationSchema";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HeroSection from "@/components/HeroSection";
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

interface HomepageSection {
  id: string;
  name: string;
  anchor: string;
  visible: boolean;
  order: number;
}

const DEFAULT_SECTIONS: HomepageSection[] = [
  { id: 'hero', name: 'Hero Principal', anchor: '#hero', visible: true, order: 0 },
  { id: 'solar-banner', name: 'Bannière Solaire', anchor: '#solaire', visible: true, order: 1 },
  { id: 'why-solar', name: 'Pourquoi le Solaire', anchor: '#pourquoi-solaire', visible: true, order: 2 },
  { id: 'renovation', name: 'Programme Rénovation', anchor: '#renovation', visible: true, order: 3 },
  { id: 'news', name: 'Actualités', anchor: '#actualites', visible: true, order: 4 },
  { id: 'aides', name: 'Aides disponibles', anchor: '#aides', visible: true, order: 5 },
  { id: 'guides', name: 'Guides par projet', anchor: '#guides', visible: true, order: 6 },
  { id: 'eligibility', name: 'Étude gratuite (formulaire)', anchor: '#etude', visible: true, order: 7 },
  { id: 'simulators', name: 'Simulateurs', anchor: '#simulateurs', visible: true, order: 8 },
  { id: 'installers', name: 'Trouver un installateur', anchor: '#installateurs', visible: true, order: 9 },
  { id: 'partner-offers', name: 'Offres partenaires', anchor: '#offres', visible: true, order: 10 },
  { id: 'cta-partner', name: 'Devenir partenaire', anchor: '#devenir-partenaire', visible: true, order: 11 },
  { id: 'faq', name: 'FAQ', anchor: '#faq', visible: true, order: 12 },
  { id: 'reviews', name: 'Avis clients', anchor: '#avis', visible: true, order: 13 },
  { id: 'contact', name: 'Contact', anchor: '#contact', visible: true, order: 14 },
  { id: 'app-download', name: 'Télécharger l\'app', anchor: '#app', visible: true, order: 15 },
];

const SECTION_COMPONENTS: Record<string, React.FC> = {
  'hero': HeroSection,
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

  useEffect(() => {
    const loadSections = async () => {
      try {
        const { data, error } = await supabase
          .from("site_settings")
          .select("value")
          .eq("key", "homepage_sections")
          .maybeSingle();

        if (error) {
          console.error("Error fetching homepage sections:", error);
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
              order: typeof section.order === 'number' ? section.order : 0
            }))
            .sort((a, b) => a.order - b.order);
          
          setSections(mergedSections);
        }
      } catch (error) {
        console.error("Error loading homepage sections:", error);
      }
    };

    loadSections();
  }, []);

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
        {sections
          .filter(section => section.visible)
          .map(section => {
            const Component = SECTION_COMPONENTS[section.id];
            return Component ? <Component key={section.id} /> : null;
          })}
        <Footer />
      </div>
    </>
  );
};

export default Index;
