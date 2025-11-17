import { Helmet } from "react-helmet";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";

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
        
        {/* Additional sections can be added here */}
      </div>
    </>
  );
};

export default Index;
