import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";

const FAQSection = () => {
  const faqs = [
    {
      question: "Quelles sont les principales aides disponibles pour installer des panneaux solaires ?",
      answer: "Plusieurs aides sont disponibles pour financer votre installation solaire : la prime à l'autoconsommation, l'obligation d'achat (tarif de rachat de l'électricité), les CEE (Certificats d'Économies d'Énergie), et certaines aides locales selon votre région. Le montant total peut atteindre plusieurs milliers d'euros selon votre projet."
    },
    {
      question: "Combien de temps faut-il pour rentabiliser une installation photovoltaïque ?",
      answer: "En moyenne, une installation photovoltaïque se rentabilise entre 8 et 12 ans selon votre région, votre consommation et les aides obtenues. Avec les économies d'électricité réalisées et la revente du surplus, vous pouvez économiser jusqu'à 80% sur vos factures énergétiques."
    },
    {
      question: "Quels sont les critères pour bénéficier des aides à la rénovation énergétique ?",
      answer: "Pour bénéficier des aides, votre logement doit avoir plus de 2 ans, les travaux doivent être réalisés par un professionnel RGE (Reconnu Garant de l'Environnement), et les équipements doivent respecter des critères de performance énergétique spécifiques. Certaines aides sont également soumises à des conditions de ressources."
    },
    {
      question: "Comment choisir le bon professionnel pour mon projet d'énergies renouvelables ?",
      answer: "Privilégiez un installateur certifié RGE, vérifiez ses références et avis clients, demandez plusieurs devis détaillés, et assurez-vous qu'il vous accompagne dans les démarches administratives et les demandes d'aides. Notre plateforme vous met en relation avec des professionnels qualifiés de votre région."
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-3 mb-4 bg-primary/10 px-6 py-3 rounded-full">
              <HelpCircle className="w-6 h-6 text-primary" />
              <h2 className="text-4xl font-bold">Questions fréquentes</h2>
            </div>
            <p className="text-xl text-muted-foreground mt-4">
              Trouvez rapidement les réponses à vos questions sur les énergies renouvelables
            </p>
          </div>

          {/* FAQ Accordion */}
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="bg-card border-2 border-border rounded-lg px-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <AccordionTrigger className="text-left hover:no-underline py-6">
                  <span className="font-semibold text-lg pr-4">
                    {faq.question}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed pb-6 pt-2">
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
