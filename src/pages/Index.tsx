import { Helmet } from "react-helmet";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HeroSection from "@/components/HeroSection";
import NewsSection from "@/components/NewsSection";
import AidesSection from "@/components/AidesSection";
import GuidesSection from "@/components/GuidesSection";
import PartnerOffersSection from "@/components/PartnerOffersSection";
import ReviewsSection from "@/components/ReviewsSection";
import ContactSection from "@/components/ContactSection";

const Index = () => {
  return (
    <>
      <Helmet>
        <title>Prime Énergies | Réduisez vos factures énergétiques jusqu'à 80%</title>
        <meta 
          name="description" 
          content="Bénéficiez d'une étude énergétique gratuite et découvrez les travaux subventionnés adaptés à votre logement. Panneaux solaires, pompe à chaleur, isolation." 
        />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        <HeroSection />
        <NewsSection />
        <AidesSection />
        <GuidesSection />
        <PartnerOffersSection />
        <ReviewsSection />
        <ContactSection />
        <Footer />
      </div>
    </>
  );
};

export default Index;
