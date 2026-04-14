import { Helmet } from "react-helmet";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Link } from "react-router-dom";
import { Thermometer, CheckCircle, ArrowRight, Droplets, Leaf, Euro, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  { q: "Quelle pompe à chaleur choisir : air-air, air-eau ou géothermique ?", a: "La PAC air-eau est la plus polyvalente : elle assure chauffage et eau chaude sanitaire. La PAC air-air est idéale pour le rafraîchissement. La géothermie offre les meilleures performances mais nécessite un investissement plus élevé et un terrain adapté." },
  { q: "Quel est le prix d'une pompe à chaleur en 2026 ?", a: "Comptez entre 8 000 € et 15 000 € pour une PAC air-eau (pose comprise). Une PAC géothermique coûte entre 15 000 € et 25 000 €. Les aides (MaPrimeRénov', CEE) peuvent couvrir jusqu'à 50 % du montant." },
  { q: "La pompe à chaleur fonctionne-t-elle par grand froid ?", a: "Les PAC modernes fonctionnent jusqu'à -15°C voire -25°C pour les modèles haute performance. Leur COP diminue avec le froid, mais elles restent efficaces dans la grande majorité des régions françaises." },
  { q: "Quelles aides pour installer une pompe à chaleur ?", a: "MaPrimeRénov' (jusqu'à 5 000 €), les Certificats d'Économie d'Énergie (CEE), la TVA à 5,5 % et l'éco-prêt à taux zéro sont les principales aides disponibles. Leur montant dépend de vos revenus et de la nature du projet." },
  { q: "Quelle est la durée de vie d'une pompe à chaleur ?", a: "Une pompe à chaleur bien entretenue a une durée de vie de 15 à 20 ans. Un entretien annuel obligatoire par un professionnel certifié est nécessaire pour les PAC contenant plus de 2 kg de fluide frigorigène." },
];

const ServicePompesAChaleur = () => {
  const breadcrumbItems = [
    { label: "Accueil", path: "/" },
    { label: "Services", path: "/" },
    { label: "Pompes à chaleur" },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Installation de pompes à chaleur",
    description: "Installation de pompes à chaleur air-eau, air-air et géothermiques par des professionnels certifiés RGE. Accompagnement complet et aides financières.",
    provider: { "@type": "Organization", name: "Prime Énergies", url: "https://prime-energies.fr" },
    areaServed: { "@type": "Country", name: "France" },
    serviceType: "Installation pompe à chaleur",
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map(f => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Pompe à Chaleur : Guide, Prix et Aides 2026 | Prime Énergies</title>
        <meta name="description" content="Installation de pompe à chaleur air-eau, air-air ou géothermique. Prix, aides MaPrimeRénov', comparatif et conseils pour bien choisir votre PAC." />
        <link rel="canonical" href="https://prime-energies.fr/services/pompes-a-chaleur" />
        <meta property="og:title" content="Pompe à Chaleur : Guide Complet | Prime Énergies" />
        <meta property="og:description" content="Prix, aides, types de PAC : tout savoir pour installer une pompe à chaleur performante et économique." />
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
              <div className="p-3 rounded-xl bg-blue-100 text-blue-600"><Thermometer className="w-8 h-8" /></div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">Pompes à chaleur : chauffez efficacement votre logement</h1>
            </div>
            <p className="text-lg text-muted-foreground leading-relaxed">
              La pompe à chaleur (PAC) capte les calories présentes dans l'air, l'eau ou le sol pour chauffer votre habitation. Avec un coefficient de performance (COP) de 3 à 5, elle produit 3 à 5 kWh de chaleur pour seulement 1 kWh d'électricité consommé. C'est l'une des solutions les plus efficientes du marché en 2026.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-6">Les avantages d'une pompe à chaleur</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { icon: Euro, title: "Jusqu'à 70 % d'économies", desc: "En remplaçant une chaudière fioul ou gaz ancienne par une PAC, les économies sur la facture de chauffage sont considérables." },
                { icon: Leaf, title: "Énergie renouvelable", desc: "La PAC utilise une source d'énergie gratuite et inépuisable (air, eau, sol) pour produire de la chaleur." },
                { icon: Droplets, title: "Chauffage + eau chaude", desc: "Les PAC air-eau assurent à la fois le chauffage central et la production d'eau chaude sanitaire (ECS)." },
                { icon: CheckCircle, title: "Aides importantes", desc: "MaPrimeRénov', CEE, TVA réduite : le reste à charge peut être considérablement réduit pour les ménages éligibles." },
              ].map((item, i) => (
                <Card key={i} className="border-border/50">
                  <CardContent className="p-5 flex gap-4">
                    <div className="p-2 rounded-lg bg-blue-50 text-blue-600 h-fit"><item.icon className="w-5 h-5" /></div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Comparatif */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-6">Comparatif des types de PAC</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-border rounded-lg overflow-hidden">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-3 font-semibold text-foreground">Type</th>
                    <th className="text-left p-3 font-semibold text-foreground">Prix indicatif</th>
                    <th className="text-left p-3 font-semibold text-foreground">COP moyen</th>
                    <th className="text-left p-3 font-semibold text-foreground">Usage</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Air-air", "5 000 – 10 000 €", "3 – 4", "Chauffage + climatisation"],
                    ["Air-eau", "8 000 – 15 000 €", "3 – 4,5", "Chauffage + ECS"],
                    ["Géothermique", "15 000 – 25 000 €", "4 – 5", "Chauffage + ECS (haute performance)"],
                  ].map((row, i) => (
                    <tr key={i} className="border-t border-border">
                      {row.map((cell, j) => <td key={j} className="p-3 text-muted-foreground">{cell}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="mb-12 bg-blue-50 border border-blue-200 rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-bold text-foreground mb-3">Trouvez votre pompe à chaleur idéale</h2>
            <p className="text-muted-foreground mb-6">Comparez les offres d'installateurs certifiés RGE près de chez vous.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild size="lg" className="gap-2">
                <Link to="/landing/pompe-a-chaleur">Voir notre offre PAC <ArrowRight className="w-4 h-4" /></Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/aides">Consulter les aides</Link>
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

export default ServicePompesAChaleur;
