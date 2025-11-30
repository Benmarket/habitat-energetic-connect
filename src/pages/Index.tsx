import { Helmet } from "react-helmet";
import { OrganizationSchema } from "@/components/SEO/OrganizationSchema";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HeroSection from "@/components/HeroSection";
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

const Index = () => {
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
        <HeroSection />
        <NewsSection />
        <AidesSection />
        <GuidesSection />
        <EligibilityFormSection />
        <SimulatorsSection />
        <InstallerFinderSection />
        <PartnerOffersSection />
        <CTAPartner />
        <FAQSection />
        <ReviewsSection />
        <ContactSection />
        <AppDownloadSection />
        <Footer />
      </div>
    </>
  );
};

export default Index;
