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
    { question: "Combien coûte une installation de panneaux solaires ?", answer: "Le coût moyen d'une installation solaire en autoconsommation varie entre 7 000 € et 20 000 € selon la puissance (3 à 9 kWc). Après déduction des aides (prime autoconsommation, TVA réduite, Eco-PTZ), le reste à charge peut descendre à 4 000 – 12 000 €. Le retour sur investissement est généralement atteint en 7 à 10 ans." },
    { question: "Quelles sont les aides disponibles en 2025 ?", answer: "En 2025, vous pouvez cumuler : la prime à l'autoconsommation (260 à 350 €/kWc), la TVA réduite à 10% pour les installations ≤ 3 kWc, l'Eco-PTZ (prêt à taux zéro jusqu'à 15 000 €), MaPrimeRénov', et les CEE (Certificats d'Économies d'Énergie). Ces aides sont cumulables et peuvent couvrir jusqu'à 50% du coût total." },
    { question: "Combien de temps dure l'installation ?", answer: "L'installation en elle-même prend généralement 1 à 2 jours pour une maison individuelle. Le processus complet (étude, démarches administratives, installation, raccordement Enedis) s'étale sur 2 à 3 mois. Nous gérons toutes les démarches pour vous." },
    { question: "Quelle est la durée de vie des panneaux solaires ?", answer: "Les panneaux solaires ont une durée de vie de 30 à 40 ans. Ils sont garantis 25 ans en production (à minimum 80% de rendement). L'onduleur a une durée de vie de 10 à 15 ans et peut être remplacé facilement. L'entretien est minimal : un nettoyage 1 à 2 fois par an suffit." },
    { question: "Est-ce rentable quand il y a peu de soleil ?", answer: "Oui ! Les panneaux fonctionnent avec la luminosité, pas uniquement avec le soleil direct. Même dans le nord de la France, une installation solaire produit suffisamment pour être rentable. La différence de production entre le nord et le sud est d'environ 25-30%, ce qui est compensé par un dimensionnement adapté." },
    { question: "Que se passe-t-il avec le surplus d'électricité ?", answer: "Le surplus d'électricité non consommé est automatiquement injecté dans le réseau et racheté par EDF OA (Obligation d'Achat) à un tarif garanti pendant 20 ans (environ 0,13 €/kWh). Vous pouvez aussi opter pour une batterie de stockage pour maximiser votre autoconsommation." },
    { question: "Les panneaux résistent-ils aux intempéries ?", answer: "Oui, les panneaux solaires sont conçus pour résister aux conditions météorologiques extrêmes : grêle (testés avec des grêlons de 25mm à 80 km/h), vents jusqu'à 180 km/h, neige (charge jusqu'à 5 400 Pa). Ils sont certifiés selon les normes IEC 61215 et IEC 61730." },
    { question: "Faut-il un permis de construire ?", answer: "Pour une installation en toiture de moins de 3 kWc, une simple déclaration préalable de travaux en mairie suffit. Au-delà de 3 kWc, un permis de construire peut être nécessaire selon votre commune. Nous nous occupons de toutes ces démarches administratives pour vous." },
  ],
  martinique: [
    { question: "Le solaire est-il adapté au climat tropical de la Martinique ?", answer: "Absolument ! La Martinique bénéficie d'un ensoleillement exceptionnel (1 600 à 1 800 heures/an). Les panneaux modernes sont conçus pour résister aux températures élevées et à l'humidité tropicale. La production est supérieure de 20-30% par rapport à la métropole." },
    { question: "Les panneaux résistent-ils aux cyclones ?", answer: "Oui, nos installations utilisent des systèmes de fixation renforcés conformes aux normes cycloniques (Eurocode 1 - vent extrême). Les panneaux résistent à des vents jusqu'à 250 km/h. En cas d'alerte cyclonique majeure, certains systèmes sont conçus pour être démontables rapidement." },
    { question: "Quelles aides spécifiques pour la Martinique ?", answer: "En plus des aides nationales (prime autoconsommation majorée DOM, Eco-PTZ), la Martinique offre une TVA réduite à 8,5% et des aides de la CTM (Collectivité Territoriale de la Martinique). Les CEE sont également majorés pour les DOM. Le cumul peut couvrir jusqu'à 60% du coût." },
    { question: "Combien puis-je économiser sur ma facture EDF ?", answer: "En Martinique, avec un tarif électrique plus élevé qu'en métropole, une installation de 6 kWc peut vous faire économiser 150 à 200€/mois. Le retour sur investissement est souvent plus rapide qu'en métropole : 5 à 7 ans." },
    { question: "L'humidité tropicale abîme-t-elle les panneaux ?", answer: "Les panneaux certifiés pour zones tropicales sont traités anti-corrosion et anti-moisissures. L'humidité n'affecte pas la production. Un nettoyage trimestriel est recommandé pour maintenir un rendement optimal en milieu tropical." },
    { question: "Le raccordement EDF est-il possible en Martinique ?", answer: "Oui, EDF SEI (Systèmes Énergétiques Insulaires) gère le réseau en Martinique. Le raccordement et le contrat de rachat du surplus fonctionnent de la même manière qu'en métropole. Nous gérons l'intégralité des démarches." },
  ],
  guadeloupe: [
    { question: "Le solaire est-il rentable en Guadeloupe ?", answer: "Très rentable ! L'ensoleillement guadeloupéen (1 700+ heures/an) et les tarifs EDF élevés font du solaire un investissement excellent. Retour sur investissement en 5 à 7 ans, avec des économies de 140 à 190€/mois pour une installation 6 kWc." },
    { question: "Les installations résistent-elles aux cyclones ?", answer: "Oui, toutes nos installations en Guadeloupe utilisent des fixations cycloniques renforcées (norme NF EN 1991-1-4). Les panneaux résistent à des vents de 250+ km/h. Nos équipes locales connaissent parfaitement les exigences du territoire." },
    { question: "Quelles aides en Guadeloupe ?", answer: "Prime autoconsommation majorée DOM, TVA à 8,5%, Eco-PTZ outre-mer, aides du Conseil Régional, et CEE majorés. Le cumul des aides peut atteindre 60% du coût de l'installation." },
    { question: "Quelle puissance choisir pour ma maison ?", answer: "En Guadeloupe, pour une maison de 100-150m² climatisée, nous recommandons 6 à 9 kWc. Cela couvre 70-90% de votre consommation. Notre étude personnalisée gratuite détermine la puissance optimale selon votre consommation réelle." },
    { question: "L'entretien est-il plus fréquent en zone tropicale ?", answer: "Un nettoyage trimestriel est recommandé en raison de la poussière saharienne et de la végétation tropicale. L'inspection technique annuelle est incluse dans notre offre. Les panneaux tropicaux sont résistants à la salinité marine." },
    { question: "Puis-je installer des panneaux sur une toiture en tôle ?", answer: "Oui, c'est la configuration la plus courante en Guadeloupe. Les systèmes de fixation sur tôle bac acier sont éprouvés et garantis. L'installation est même plus rapide que sur tuiles." },
  ],
  guyane: [
    { question: "Le solaire fonctionne-t-il bien en Guyane malgré l'humidité ?", answer: "Oui ! La Guyane bénéficie d'un excellent ensoleillement. Les panneaux modernes sont traités anti-humidité et anti-moisissures. La production est légèrement réduite pendant la saison des pluies mais reste très performante sur l'année." },
    { question: "Quelles aides spécifiques en Guyane ?", answer: "Prime autoconsommation DOM majorée, TVA à 8,5%, Eco-PTZ outre-mer, aides CTG, et CEE majorés. La Guyane étant en zone non-interconnectée (ZNI), des dispositifs supplémentaires existent pour accélérer la transition énergétique." },
    { question: "Le raccordement est-il disponible partout ?", answer: "EDF Guyane couvre les zones urbaines et péri-urbaines. Pour les zones isolées, des solutions en site isolé (avec batterie) sont possibles. Contactez-nous pour une étude adaptée à votre localisation." },
    { question: "Combien coûte l'installation en Guyane ?", answer: "Les coûts sont similaires à la métropole (7 000 – 20 000 € pour 3 à 9 kWc) mais les aides DOM majorées réduisent significativement le reste à charge. Le ROI est atteint en 5-7 ans grâce aux tarifs EDF élevés." },
    { question: "L'entretien est-il compliqué en milieu équatorial ?", answer: "Un nettoyage bimestriel est recommandé en raison de l'humidité et de la végétation. Nos contrats de maintenance incluent ces prestations. Les panneaux sont garantis pour résister aux conditions équatoriales." },
  ],
  corse: [
    { question: "Le solaire est-il rentable en Corse ?", answer: "Très rentable ! La Corse bénéficie de 2 700 heures d'ensoleillement/an, soit 30% de plus que la moyenne nationale. Une installation de 6 kWc produit environ 8 500 kWh/an, couvrant 80% des besoins d'un foyer moyen." },
    { question: "Y a-t-il des contraintes architecturales en Corse ?", answer: "Certaines zones sont classées (ABF). Nos équipes maîtrisent parfaitement les réglementations corses et proposent des solutions d'intégration au bâti respectueuses de l'architecture locale (tuiles canal, lauze). Nous gérons les démarches auprès des ABF." },
    { question: "Quelles aides spécifiques en Corse ?", answer: "En plus des aides nationales (prime autoconsommation, TVA 10%, Eco-PTZ), la Collectivité de Corse propose des aides complémentaires via son Plan Énergétique. L'ADEME Corse accompagne aussi certains projets." },
    { question: "L'installation résiste-t-elle au vent en Corse ?", answer: "Oui, nos systèmes de fixation sont dimensionnés pour résister au Libecciu et au vent d'est. Les panneaux sont testés pour des vents de 180+ km/h. L'orientation est optimisée en tenant compte des vents dominants." },
    { question: "Puis-je revendre mon surplus en Corse ?", answer: "Oui, le contrat EDF OA est disponible en Corse via EDF SEI. Le tarif de rachat est identique à celui de la métropole (0,13 €/kWh). Avec l'ensoleillement corse, votre surplus peut générer un revenu complémentaire significatif." },
    { question: "Quelle est la durée d'amortissement en Corse ?", answer: "Grâce à l'ensoleillement exceptionnel de l'île, le retour sur investissement est de 6 à 8 ans en moyenne, contre 8 à 10 ans en métropole. L'installation produit ensuite de l'électricité gratuite pendant 20+ années." },
  ],
  reunion: [
    { question: "Le solaire est-il adapté au climat réunionnais ?", answer: "Parfaitement ! L'île bénéficie de 1 500 à 2 000 heures d'ensoleillement/an selon les communes. Les panneaux modernes fonctionnent même par temps couvert. La côte ouest (Saint-Leu, Saint-Paul) est particulièrement favorable." },
    { question: "Les panneaux résistent-ils aux cyclones à La Réunion ?", answer: "Oui, toutes nos installations réunionnaises sont aux normes cycloniques. Les fixations renforcées résistent aux vents de 250+ km/h. Nos équipes locales ont l'expertise des conditions extrêmes de l'océan Indien." },
    { question: "Quelles aides à La Réunion ?", answer: "Prime autoconsommation DOM majorée, TVA à 8,5%, Eco-PTZ outre-mer, aides du Conseil Régional, CEE majorés. En tant que zone ZNI, des dispositifs supplémentaires existent. Le cumul peut atteindre 55-60% du coût." },
    { question: "La micro-coupure affecte-t-elle l'installation ?", answer: "Non, les onduleurs modernes gèrent automatiquement les micro-coupures du réseau EDF Réunion. En option, vous pouvez ajouter une batterie de secours pour une continuité électrique totale." },
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
