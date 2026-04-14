import { Helmet } from "react-helmet";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Link } from "react-router-dom";
import { Battery, CheckCircle, ArrowRight, Zap, Shield, Clock, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  { q: "Pourquoi installer une batterie de stockage solaire ?", a: "Une batterie permet de stocker l'électricité produite par vos panneaux solaires pendant la journée pour la consommer le soir et la nuit. Vous augmentez ainsi votre taux d'autoconsommation de 30 % à 70-80 %, réduisant davantage votre facture." },
  { q: "Quel est le prix d'une batterie domestique en 2026 ?", a: "Les prix varient de 4 000 € à 12 000 € selon la capacité (5 à 15 kWh). Les batteries lithium-fer-phosphate (LFP) offrent aujourd'hui le meilleur rapport qualité/durée de vie." },
  { q: "Quelle est la durée de vie d'une batterie solaire ?", a: "Les batteries LFP modernes sont garanties pour 6 000 à 10 000 cycles, soit environ 15 à 20 ans d'utilisation quotidienne. Les batteries NMC offrent 3 000 à 5 000 cycles." },
  { q: "La batterie domestique permet-elle d'être autonome en cas de coupure ?", a: "Certains systèmes offrent une fonction « backup » qui alimente les circuits essentiels lors d'une coupure réseau. Cette fonctionnalité nécessite un onduleur hybride compatible." },
  { q: "Y a-t-il des aides pour les batteries de stockage ?", a: "En France métropolitaine, il n'existe pas d'aide nationale spécifique aux batteries seules en 2026. Cependant, certaines collectivités locales et régions proposent des subventions. Les batteries installées avec des panneaux solaires bénéficient indirectement de la prime à l'autoconsommation." },
];

const ServiceStockageEnergie = () => {
  const breadcrumbItems = [
    { name: "Accueil", url: "/" },
    { name: "Services", url: "/" },
    { name: "Stockage d'énergie", url: "/services/stockage-energie" },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Stockage d'énergie et batteries domestiques",
    description: "Solutions de stockage d'énergie par batteries pour les installations solaires résidentielles. Maximisez votre autoconsommation et gagnez en autonomie.",
    provider: { "@type": "Organization", name: "Prime Énergies", url: "https://prime-energies.fr" },
    areaServed: { "@type": "Country", name: "France" },
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map(f => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Stockage d'Énergie et Batteries Solaires : Guide 2026 | Prime Énergies</title>
        <meta name="description" content="Batteries domestiques pour panneaux solaires : prix, technologies, autonomie et avantages du stockage d'énergie. Guide complet pour maximiser votre autoconsommation." />
        <link rel="canonical" href="https://prime-energies.fr/services/stockage-energie" />
        <meta property="og:title" content="Stockage d'Énergie et Batteries Solaires | Prime Énergies" />
        <meta property="og:description" content="Découvrez les solutions de batteries domestiques pour maximiser votre autoconsommation solaire." />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
        <script type="application/ld+json">{JSON.stringify(faqJsonLd)}</script>
      </Helmet>
      <Header />
      <main className="pt-20">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Breadcrumb items={breadcrumbItems} />

          <section className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-emerald-100 text-emerald-600"><Battery className="w-8 h-8" /></div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">Stockage d'énergie : maximisez votre autoconsommation</h1>
            </div>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Les batteries domestiques transforment l'utilisation de l'énergie solaire. En stockant le surplus de production pour le consommer plus tard, elles permettent d'atteindre des taux d'autoconsommation de 70 à 80 %. Le marché des batteries résidentielles connaît une croissance rapide en France, avec des prix en baisse constante.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-6">Les avantages du stockage d'énergie</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { icon: Zap, title: "Autoconsommation maximale", desc: "Passez d'un taux d'autoconsommation de 30 % à plus de 70 % en stockant le surplus de production solaire." },
                { icon: Shield, title: "Sécurité en cas de coupure", desc: "Les systèmes avec fonction backup alimentent vos appareils essentiels lors des coupures de courant." },
                { icon: Clock, title: "Consommation décalée", desc: "Stockez l'énergie produite le jour pour la consommer le soir, au moment où les tarifs sont les plus élevés." },
                { icon: CheckCircle, title: "Technologies fiables", desc: "Les batteries LFP (lithium-fer-phosphate) offrent sécurité, longévité et performances stables sur 15 à 20 ans." },
              ].map((item, i) => (
                <Card key={i} className="border-border/50">
                  <CardContent className="p-5 flex gap-4">
                    <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 h-fit"><item.icon className="w-5 h-5" /></div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Tableau comparatif */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-6">Comparatif des technologies de batteries</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-border rounded-lg overflow-hidden">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-3 font-semibold text-foreground">Technologie</th>
                    <th className="text-left p-3 font-semibold text-foreground">Durée de vie</th>
                    <th className="text-left p-3 font-semibold text-foreground">Prix / kWh</th>
                    <th className="text-left p-3 font-semibold text-foreground">Avantage clé</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["LFP (Lithium Fer Phosphate)", "6 000 – 10 000 cycles", "400 – 600 €", "Sécurité & longévité"],
                    ["NMC (Nickel Manganèse Cobalt)", "3 000 – 5 000 cycles", "350 – 500 €", "Densité énergétique"],
                    ["Sodium-ion", "3 000 – 5 000 cycles", "300 – 450 €", "Pas de cobalt ni lithium"],
                  ].map((row, i) => (
                    <tr key={i} className="border-t border-border">
                      {row.map((cell, j) => <td key={j} className="p-3 text-muted-foreground">{cell}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="mb-12 bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-bold text-foreground mb-3">Combinez solaire et stockage</h2>
            <p className="text-muted-foreground mb-6">Découvrez nos solutions solaires avec ou sans batterie pour votre habitation.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild size="lg" className="gap-2">
                <Link to="/landing/solaire">Voir l'offre solaire <ArrowRight className="w-4 h-4" /></Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/simulateurs/solaire">Simuler mes économies</Link>
              </Button>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
              <HelpCircle className="w-6 h-6 text-primary" /> Questions fréquentes
            </h2>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, i) => (
                <AccordionItem key={i} value={`faq-${i}`}>
                  <AccordionTrigger className="text-left text-foreground">{faq.q}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">{faq.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ServiceStockageEnergie;
