import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import solarConsultantImg from "@/assets/landing/solar-consultant-meeting.jpg";
import { useScrollReveal, revealClass } from "@/hooks/useScrollReveal";

interface FAQItem {
  question: string;
  answer: string;
}

const allFaqs: Record<string, FAQItem[]> = {
  france: [
    { question: "Combien coûte une installation de panneaux solaires ?", answer: "Le prix dépend de la puissance, des équipements, de la toiture et du territoire. Les prix présentés sont indicatifs avant aide éventuelle ; seul le devis du partenaire précise le coût et les conditions applicables. La rentabilité doit être estimée selon votre consommation réelle." },
    { question: "Quelles aides pourraient s’appliquer à mon projet ?", answer: "Les dispositifs éventuels dépendent du territoire, de la puissance et de la date de demande. En métropole, la prime à l'autoconsommation est supprimée pour les nouvelles demandes concernées depuis le 5 juin 2026. En Corse et dans les DOM, vérifiez le barème territorial et les aides locales avant de vous engager. MaPrimeRénov' ne finance pas le photovoltaïque seul ; les CEE et l'éco-PTZ ne doivent pas être présentés comme un financement automatique de ce projet. La TVA dépend du territoire et des conditions applicables." },
    { question: "Combien de temps dure l'installation ?", answer: "La pose est généralement réalisée en 1 à 2 jours, selon le chantier. Le parcours complet dépend des démarches et du raccordement. Nos partenaires agréés vous accompagnent dans les démarches liées à leur prestation." },
    { question: "Quelle est la durée de vie des panneaux solaires ?", answer: "La durée de vie et les garanties varient selon le matériel. Distinguez la garantie produit, la garantie de performance des panneaux et les garanties de pose. Le partenaire doit préciser les conditions du fabricant et les remplacements éventuels, notamment de l'onduleur." },
    { question: "Est-ce rentable quand il y a peu de soleil ?", answer: "Oui ! Les panneaux fonctionnent avec la luminosité, pas uniquement avec le soleil direct. Même dans le nord de la France, une installation solaire produit suffisamment pour être rentable. La différence de production entre le nord et le sud est d'environ 25-30%, ce qui est compensé par un dimensionnement adapté." },
    { question: "Que se passe-t-il avec le surplus d'électricité ?", answer: "Le surplus pourrait être vendu dans le cadre d'un contrat d'achat, selon les conditions de raccordement et d'éligibilité. Le tarif dépend du territoire, de la puissance et de la date de demande ; la Corse et les DOM ne partagent pas automatiquement le barème métropolitain. Une batterie pourrait réduire le surplus vendu en augmentant l'autoconsommation." },
    { question: "Les panneaux résistent-ils aux intempéries ?", answer: "La résistance doit être étudiée pour votre toiture, votre exposition au vent et les fixations retenues. Les partenaires agréés prévoient des équipements et une pose adaptés aux exigences locales ; aucune résistance universelle à un cyclone ou à une vitesse de vent ne peut être garantie sans étude technique." },
    { question: "Faut-il un permis de construire ?", answer: "Pour une installation en toiture de moins de 3 kWc, une simple déclaration préalable de travaux en mairie suffit. Au-delà de 3 kWc, un permis de construire peut être nécessaire selon votre commune. Nos partenaires agréés s'occupent de ces démarches administratives pour vous." },
  ],
  martinique: [
    { question: "Le solaire est-il adapté au climat tropical de la Martinique ?", answer: "Absolument ! La Martinique bénéficie d'un ensoleillement exceptionnel (1 600 à 1 800 heures/an). Les panneaux modernes sont conçus pour résister aux températures élevées et à l'humidité tropicale. La production est supérieure de 20-30% par rapport à la métropole." },
    { question: "Les panneaux résistent-ils aux cyclones ?", answer: "La résistance doit être étudiée pour votre toiture, votre exposition au vent et les fixations retenues. Les partenaires agréés prévoient des équipements et une pose adaptés aux exigences locales ; aucune résistance universelle à un cyclone ou à une vitesse de vent ne peut être garantie sans étude technique." },
    { question: "Quelles aides spécifiques pour la Martinique ?", answer: "Les dispositifs éventuels dépendent du territoire, de la puissance et de la date de demande. En métropole, la prime à l'autoconsommation est supprimée pour les nouvelles demandes concernées depuis le 5 juin 2026. En Corse et dans les DOM, vérifiez le barème territorial et les aides locales avant de vous engager. MaPrimeRénov' ne finance pas le photovoltaïque seul ; les CEE et l'éco-PTZ ne doivent pas être présentés comme un financement automatique de ce projet. La TVA dépend du territoire et des conditions applicables." },
    { question: "Combien puis-je économiser sur ma facture EDF ?", answer: "En Martinique, avec un tarif électrique plus élevé qu'en métropole, une installation de 6 kWc peut vous faire économiser 150 à 200€/mois. Le retour sur investissement est souvent plus rapide qu'en métropole : 5 à 7 ans." },
    { question: "L'humidité tropicale abîme-t-elle les panneaux ?", answer: "L'entretien dépend du matériel, de l'environnement et des recommandations du fabricant. Demandez au partenaire les prestations de maintenance éventuellement proposées et leurs conditions ; elles ne sont pas automatiquement incluses." },
    { question: "Le raccordement EDF est-il possible en Martinique ?", answer: "Oui, EDF SEI (Systèmes Énergétiques Insulaires) gère le réseau en Martinique. Le raccordement et le contrat de rachat du surplus fonctionnent de la même manière qu'en métropole. Nos partenaires agréés prennent en charge les démarches." },
  ],
  guadeloupe: [
    { question: "Le solaire est-il rentable en Guadeloupe ?", answer: "Très rentable ! L'ensoleillement guadeloupéen (1 700+ heures/an) et les tarifs EDF élevés font du solaire un investissement excellent. Retour sur investissement en 5 à 7 ans, avec des économies de 140 à 190€/mois pour une installation 6 kWc." },
    { question: "Les installations résistent-elles aux cyclones ?", answer: "La résistance doit être étudiée pour votre toiture, votre exposition au vent et les fixations retenues. Les partenaires agréés prévoient des équipements et une pose adaptés aux exigences locales ; aucune résistance universelle à un cyclone ou à une vitesse de vent ne peut être garantie sans étude technique." },
    { question: "Quelles aides en Guadeloupe ?", answer: "Les dispositifs éventuels dépendent du territoire, de la puissance et de la date de demande. En métropole, la prime à l'autoconsommation est supprimée pour les nouvelles demandes concernées depuis le 5 juin 2026. En Corse et dans les DOM, vérifiez le barème territorial et les aides locales avant de vous engager. MaPrimeRénov' ne finance pas le photovoltaïque seul ; les CEE et l'éco-PTZ ne doivent pas être présentés comme un financement automatique de ce projet. La TVA dépend du territoire et des conditions applicables." },
    { question: "Quelle puissance choisir pour ma maison ?", answer: "En Guadeloupe, pour une maison de 100-150m² climatisée, nous recommandons 6 à 9 kWc. Cela couvre 70-90% de votre consommation. Notre étude personnalisée gratuite détermine la puissance optimale selon votre consommation réelle." },
    { question: "L'entretien est-il plus fréquent en zone tropicale ?", answer: "L'entretien dépend du matériel, de l'environnement et des recommandations du fabricant. Demandez au partenaire les prestations de maintenance éventuellement proposées et leurs conditions ; elles ne sont pas automatiquement incluses." },
    { question: "Puis-je installer des panneaux sur une toiture en tôle ?", answer: "Oui, c'est la configuration la plus courante en Guadeloupe. Les systèmes de fixation sur tôle bac acier sont éprouvés et garantis. L'installation est même plus rapide que sur tuiles." },
  ],
  guyane: [
    { question: "Le solaire fonctionne-t-il bien en Guyane malgré l'humidité ?", answer: "Oui ! La Guyane bénéficie d'un excellent ensoleillement. Les panneaux modernes sont traités anti-humidité et anti-moisissures. La production est légèrement réduite pendant la saison des pluies mais reste très performante sur l'année." },
    { question: "Quelles aides spécifiques en Guyane ?", answer: "Les dispositifs éventuels dépendent du territoire, de la puissance et de la date de demande. En métropole, la prime à l'autoconsommation est supprimée pour les nouvelles demandes concernées depuis le 5 juin 2026. En Corse et dans les DOM, vérifiez le barème territorial et les aides locales avant de vous engager. MaPrimeRénov' ne finance pas le photovoltaïque seul ; les CEE et l'éco-PTZ ne doivent pas être présentés comme un financement automatique de ce projet. La TVA dépend du territoire et des conditions applicables. En Guyane, la TVA ne s'applique pas (article 294 du CGI)." },
    { question: "Le raccordement est-il disponible partout ?", answer: "EDF Guyane couvre les zones urbaines et péri-urbaines. Pour les zones isolées, des solutions en site isolé (avec batterie) sont possibles. Contactez-nous pour une étude adaptée à votre localisation." },
    { question: "Combien coûte l'installation en Guyane ?", answer: "Le prix dépend de la puissance, des équipements, de la toiture et du territoire. Les prix présentés sont indicatifs avant aide éventuelle ; seul le devis du partenaire précise le coût et les conditions applicables. La rentabilité doit être estimée selon votre consommation réelle." },
    { question: "L'entretien est-il compliqué en milieu équatorial ?", answer: "L'entretien dépend du matériel, de l'environnement et des recommandations du fabricant. Demandez au partenaire les prestations de maintenance éventuellement proposées et leurs conditions ; elles ne sont pas automatiquement incluses." },
  ],
  corse: [
    { question: "Le solaire est-il rentable en Corse ?", answer: "Très rentable ! La Corse bénéficie de 2 700 heures d'ensoleillement/an, soit 30% de plus que la moyenne nationale. Une installation de 6 kWc produit environ 8 500 kWh/an, couvrant 80% des besoins d'un foyer moyen." },
    { question: "Y a-t-il des contraintes architecturales en Corse ?", answer: "Certaines zones sont classées (ABF). Nos partenaires agréés maîtrisent les réglementations corses et proposent des solutions d'intégration au bâti respectueuses de l'architecture locale (tuiles canal, lauze). Ils gèrent les démarches auprès des ABF." },
    { question: "Quelles aides spécifiques en Corse ?", answer: "Les dispositifs éventuels dépendent du territoire, de la puissance et de la date de demande. En métropole, la prime à l'autoconsommation est supprimée pour les nouvelles demandes concernées depuis le 5 juin 2026. En Corse et dans les DOM, vérifiez le barème territorial et les aides locales avant de vous engager. MaPrimeRénov' ne finance pas le photovoltaïque seul ; les CEE et l'éco-PTZ ne doivent pas être présentés comme un financement automatique de ce projet. La TVA dépend du territoire et des conditions applicables." },
    { question: "L'installation résiste-t-elle au vent en Corse ?", answer: "La résistance doit être étudiée pour votre toiture, votre exposition au vent et les fixations retenues. Les partenaires agréés prévoient des équipements et une pose adaptés aux exigences locales ; aucune résistance universelle à un cyclone ou à une vitesse de vent ne peut être garantie sans étude technique." },
    { question: "Puis-je revendre mon surplus en Corse ?", answer: "Le surplus pourrait être vendu dans le cadre d'un contrat d'achat, selon les conditions de raccordement et d'éligibilité. Le tarif dépend du territoire, de la puissance et de la date de demande ; la Corse et les DOM ne partagent pas automatiquement le barème métropolitain. Une batterie pourrait réduire le surplus vendu en augmentant l'autoconsommation." },
    { question: "Quelle est la durée d'amortissement en Corse ?", answer: "Grâce à l'ensoleillement exceptionnel de l'île, le retour sur investissement est de 6 à 8 ans en moyenne, contre 8 à 10 ans en métropole. L'installation produit ensuite de l'électricité gratuite pendant 20+ années." },
  ],
  reunion: [
    { question: "Le solaire est-il adapté au climat réunionnais ?", answer: "Parfaitement ! L'île bénéficie de 1 500 à 2 000 heures d'ensoleillement/an selon les communes. Les panneaux modernes fonctionnent même par temps couvert. La côte ouest (Saint-Leu, Saint-Paul) est particulièrement favorable." },
    { question: "Les panneaux résistent-ils aux cyclones à La Réunion ?", answer: "La résistance doit être étudiée pour votre toiture, votre exposition au vent et les fixations retenues. Les partenaires agréés prévoient des équipements et une pose adaptés aux exigences locales ; aucune résistance universelle à un cyclone ou à une vitesse de vent ne peut être garantie sans étude technique." },
    { question: "Quelles aides à La Réunion ?", answer: "Les dispositifs éventuels dépendent du territoire, de la puissance et de la date de demande. En métropole, la prime à l'autoconsommation est supprimée pour les nouvelles demandes concernées depuis le 5 juin 2026. En Corse et dans les DOM, vérifiez le barème territorial et les aides locales avant de vous engager. MaPrimeRénov' ne finance pas le photovoltaïque seul ; les CEE et l'éco-PTZ ne doivent pas être présentés comme un financement automatique de ce projet. La TVA dépend du territoire et des conditions applicables." },
    { question: "La micro-coupure affecte-t-elle l'installation ?", answer: "Une installation raccordée au réseau peut s'arrêter lors d'une coupure. Le secours nécessite une batterie et un système compatibles, dans la limite des circuits alimentés, de la puissance et de l'énergie disponible ; une batterie seule ne garantit pas une continuité électrique totale." },
    { question: "Quelle puissance pour une maison réunionnaise ?", answer: "Pour un foyer réunionnais moyen (climatisation, chauffe-eau), nous recommandons 6 à 9 kWc. L'étude personnalisée gratuite prend en compte vos habitudes de consommation et l'orientation de votre toiture." },
    { question: "L'altitude affecte-t-elle la production ?", answer: "Les Hauts de l'île reçoivent légèrement moins d'ensoleillement direct, mais les températures plus fraîches améliorent le rendement des panneaux. Le dimensionnement est adapté à votre altitude et exposition." },
  ],
};

interface SolarFAQProps {
  region?: string;
}

const SolarFAQ = ({ region = "france" }: SolarFAQProps) => {
  const faqs = allFaqs[region] || allFaqs.france;

  // JSON-LD FAQ schema
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };

  const { ref, isVisible } = useScrollReveal();

  return (
    <section className="py-12 lg:py-20 bg-card">
      <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      <div ref={ref} className="container mx-auto px-4 max-w-4xl">
        <div className={`text-center mb-10 lg:mb-14 ${revealClass(isVisible).className}`}>
          <span className="inline-block px-4 py-1.5 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold mb-4">
            ❓ Questions fréquentes
          </span>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-extrabold">
            Vos questions sur le <span className="text-primary">solaire</span>
          </h2>
        </div>

        {/* Image + FAQ in 2 cols on desktop */}
        <div className="grid lg:grid-cols-[280px_1fr] gap-8 items-start">
          <div className="hidden lg:block rounded-2xl overflow-hidden shadow-lg sticky top-24">
            <img src={solarConsultantImg} alt="Conseiller solaire avec des clients" className="w-full h-80 object-cover" loading="lazy" width={280} height={320} />
            <div className="bg-primary p-4 text-center">
              <p className="text-primary-foreground text-sm font-bold">Un doute ? Nos conseillers vous répondent</p>
            </div>
          </div>

          <Accordion type="single" collapsible className="space-y-3">
          {faqs.map((faq, i) => (
            <AccordionItem
              key={i}
              value={`faq-${i}`}
              className="border border-border rounded-xl px-6 bg-background hover:border-primary/30 transition-colors data-[state=open]:border-primary/50 data-[state=open]:shadow-md"
            >
              <AccordionTrigger className="text-left font-semibold text-foreground hover:no-underline py-5">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed pb-5">
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

export default SolarFAQ;
