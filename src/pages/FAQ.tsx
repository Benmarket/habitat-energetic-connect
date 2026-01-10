import { Helmet } from "react-helmet";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { FAQSchema } from "@/components/SEO/FAQSchema";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";

const faqs = [
  {
    question: "Combien puis-je économiser avec une installation solaire photovoltaïque ?",
    answer: "Une installation photovoltaïque vous permet de réduire votre facture d'électricité jusqu'à 80%. En autoconsommation, vous produisez et consommez votre propre électricité, ce qui diminue considérablement vos achats auprès du fournisseur. Le surplus peut être revendu à EDF OA, générant un revenu complémentaire. Avec les aides disponibles (prime à l'autoconsommation, tarif de rachat garanti), votre installation se rentabilise généralement entre 8 et 12 ans, pour une durée de vie des panneaux de 25 à 30 ans."
  },
  {
    question: "Quels sont les avantages d'une bonne isolation thermique ?",
    answer: "L'isolation thermique est le premier poste d'économies d'énergie dans un logement. Elle permet de réduire vos dépenses de chauffage jusqu'à 30%, d'améliorer significativement votre confort en éliminant les sensations de froid et les courants d'air, et de valoriser votre bien immobilier. Une bonne isolation limite également les ponts thermiques et l'humidité. Avec MaPrimeRénov' et les CEE, vous pouvez financer jusqu'à 90% des travaux d'isolation des combles, murs et planchers."
  },
  {
    question: "Pourquoi choisir une pompe à chaleur pour mon chauffage ?",
    answer: "La pompe à chaleur est la solution de chauffage la plus économique et écologique du marché. Elle consomme 3 à 4 fois moins d'énergie qu'un chauffage traditionnel, permettant de diviser vos factures de chauffage par 3. Les modèles réversibles assurent aussi la climatisation en été. Éligible aux aides MaPrimeRénov', CEE et TVA réduite, son installation est accessible financièrement. C'est un investissement durable qui valorise votre logement et vous protège de l'augmentation des prix de l'énergie."
  },
  {
    question: "Vos partenaires installateurs sont-ils certifiés et fiables ?",
    answer: "Oui, absolument. Tous nos partenaires installateurs sont rigoureusement sélectionnés selon un cahier des charges strict. Ils disposent obligatoirement de la certification RGE (Reconnu Garant de l'Environnement), indispensable pour bénéficier des aides publiques. Nous vérifions leurs qualifications, assurances professionnelles, références clients et respect des normes en vigueur. Chaque partenaire s'engage à fournir un devis détaillé, respecter les délais, réaliser un chantier propre et assurer un suivi après-vente de qualité."
  }
];

const FAQ = () => {
  return (
    <>
      <Helmet>
        <title>FAQ - Questions fréquentes | Prime Énergies</title>
        <meta 
          name="description" 
          content="Trouvez les réponses à vos questions sur les énergies renouvelables, les aides financières, l'installation solaire, l'isolation et les pompes à chaleur." 
        />
      </Helmet>
      <FAQSchema faqs={faqs} />
      
      <Header />
      
      <main className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-muted/50 to-background py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 mb-4 bg-primary/10 px-4 py-2 rounded-full">
                <HelpCircle className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium text-primary">Centre d'aide</span>
              </div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
                Questions fréquentes
              </h1>
              <p className="text-lg text-muted-foreground">
                Retrouvez toutes les réponses à vos questions sur les énergies renouvelables et les aides disponibles.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ Content */}
        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <Accordion type="single" collapsible className="space-y-4">
                {faqs.map((faq, index) => (
                  <AccordionItem 
                    key={index} 
                    value={`item-${index}`}
                    className="bg-card border border-border rounded-xl px-6 shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    <AccordionTrigger className="text-left hover:no-underline py-5">
                      <span className="font-semibold text-base md:text-lg pr-4 leading-snug text-foreground">
                        {faq.question}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed pb-5 pt-1 text-base">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </>
  );
};

export default FAQ;
