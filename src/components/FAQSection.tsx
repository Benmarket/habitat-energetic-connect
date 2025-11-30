import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";
import { FAQSchema } from "@/components/SEO/FAQSchema";

const FAQSection = () => {
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

  return (
    <section className="py-12 bg-gradient-to-b from-background to-muted/30">
      <FAQSchema faqs={faqs} />
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 md:gap-3 mb-3 bg-primary/10 px-4 md:px-5 py-2 rounded-full">
              <HelpCircle className="w-4 h-4 md:w-5 md:h-5 text-primary" />
              <h2 className="text-xl md:text-2xl font-bold whitespace-nowrap">Questions fréquentes</h2>
            </div>
            <p className="text-lg text-muted-foreground mt-2">
              Trouvez rapidement les réponses à vos questions sur les énergies renouvelables
            </p>
          </div>

          {/* FAQ Accordion */}
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="bg-card border-2 border-border rounded-lg px-5 shadow-sm hover:shadow-md transition-shadow"
              >
                <AccordionTrigger className="text-left hover:no-underline py-4">
                  <span className="font-semibold text-sm md:text-base pr-4 leading-snug">
                    {faq.question}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed pb-4 pt-1 text-sm">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
