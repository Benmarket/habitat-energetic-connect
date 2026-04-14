import { Helmet } from "react-helmet";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Link } from "react-router-dom";
import { Sun, CheckCircle, ArrowRight, Zap, TrendingUp, Shield, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  { q: "Combien coûte une installation solaire en 2026 ?", a: "Le prix d'une installation solaire photovoltaïque varie entre 7 500 € et 18 000 € pour une puissance de 3 à 9 kWc, pose incluse. Les aides comme la prime à l'autoconsommation et l'obligation d'achat peuvent réduire significativement le coût net." },
  { q: "Quelle est la durée de vie des panneaux solaires ?", a: "Les panneaux solaires modernes ont une durée de vie de 30 à 40 ans. La plupart des fabricants garantissent au moins 80 % de rendement après 25 ans d'utilisation." },
  { q: "Puis-je revendre mon surplus d'électricité ?", a: "Oui. Grâce au mécanisme d'obligation d'achat (OA Solaire), vous pouvez revendre le surplus de votre production à EDF OA à un tarif fixé par l'État pendant 20 ans." },
  { q: "Faut-il un permis de construire pour installer des panneaux solaires ?", a: "En général, une simple déclaration préalable de travaux suffit. Un permis de construire n'est nécessaire que dans certains cas (bâtiment classé, zone protégée, installation au sol de plus de 1,80 m de hauteur)." },
  { q: "Comment savoir si ma toiture est adaptée au solaire ?", a: "Une toiture orientée sud, sud-est ou sud-ouest avec une inclinaison de 25° à 35° est idéale. Notre simulateur gratuit vous permet d'estimer le potentiel solaire de votre habitation en quelques clics." },
];

const ServiceInstallationSolaire = () => {
  const breadcrumbItems = [
    { label: "Accueil", path: "/" },
    { label: "Services", path: "/" },
    { label: "Installation solaire" },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Installation de panneaux solaires photovoltaïques",
    description: "Service d'installation de panneaux solaires pour les particuliers et professionnels. Devis gratuit, installateurs certifiés RGE, accompagnement complet.",
    provider: { "@type": "Organization", name: "Prime Énergies", url: "https://prime-energies.fr" },
    areaServed: { "@type": "Country", name: "France" },
    serviceType: "Installation solaire photovoltaïque",
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map(f => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Installation Solaire Photovoltaïque : Guide Complet 2026 | Prime Énergies</title>
        <meta name="description" content="Tout savoir sur l'installation de panneaux solaires : prix, aides, rentabilité, étapes d'installation et choix de l'installateur certifié RGE. Devis gratuit." />
        <link rel="canonical" href="https://prime-energies.fr/services/installation-solaire" />
        <meta property="og:title" content="Installation Solaire Photovoltaïque | Prime Énergies" />
        <meta property="og:description" content="Prix, aides, rentabilité : tout ce qu'il faut savoir avant d'installer des panneaux solaires chez vous." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://prime-energies.fr/services/installation-solaire" />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
        <script type="application/ld+json">{JSON.stringify(faqJsonLd)}</script>
      </Helmet>
      <Header />
      <main className="pt-20">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Breadcrumb items={breadcrumbItems} />

          {/* Hero */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-amber-100 text-amber-600">
                <Sun className="w-8 h-8" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">Installation de panneaux solaires photovoltaïques</h1>
            </div>
            <p className="text-lg text-muted-foreground leading-relaxed">
              L'énergie solaire est aujourd'hui la solution la plus accessible et rentable pour produire votre propre électricité. En France, le nombre d'installations photovoltaïques résidentielles a augmenté de plus de 30 % entre 2024 et 2025. Découvrez tout ce qu'il faut savoir pour réussir votre projet solaire.
            </p>
          </section>

          {/* Avantages */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-6">Pourquoi passer au solaire en 2026 ?</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { icon: TrendingUp, title: "Rentabilité prouvée", desc: "Amortissement en 6 à 10 ans selon la région, avec des économies pouvant atteindre 70 % sur votre facture d'électricité." },
                { icon: Shield, title: "Aides financières généreuses", desc: "Prime à l'autoconsommation, TVA réduite à 10 %, obligation d'achat : l'État soutient activement le solaire résidentiel." },
                { icon: Zap, title: "Autonomie énergétique", desc: "Produisez et consommez votre propre électricité. Réduisez votre dépendance au réseau et protégez-vous des hausses de tarifs." },
                { icon: CheckCircle, title: "Impact écologique positif", desc: "Un panneau solaire rembourse son empreinte carbone en 2 à 3 ans et produit de l'énergie propre pendant 30+ ans." },
              ].map((item, i) => (
                <Card key={i} className="border-border/50">
                  <CardContent className="p-5 flex gap-4">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary h-fit">
                      <item.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Étapes */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-6">Les étapes d'une installation solaire</h2>
            <ol className="space-y-4">
              {[
                { step: "Étude de faisabilité", desc: "Analyse de l'orientation, inclinaison et surface de votre toiture. Un bon ensoleillement est clé pour maximiser la production." },
                { step: "Dimensionnement et devis", desc: "Un installateur RGE propose une puissance adaptée à votre consommation (généralement 3 à 9 kWc pour un particulier)." },
                { step: "Démarches administratives", desc: "Déclaration préalable de travaux en mairie, demande de raccordement Enedis et contrat de vente du surplus." },
                { step: "Installation et mise en service", desc: "La pose dure en moyenne 1 à 2 jours. Le Consuel valide la conformité électrique avant le raccordement." },
                { step: "Suivi de production", desc: "Grâce aux applications de monitoring, vous suivez votre production en temps réel et optimisez votre autoconsommation." },
              ].map((item, i) => (
                <li key={i} className="flex gap-4 items-start">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">{i + 1}</span>
                  <div>
                    <h3 className="font-semibold text-foreground">{item.step}</h3>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {/* CTA */}
          <section className="mb-12 bg-primary/5 border border-primary/20 rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-bold text-foreground mb-3">Prêt à passer au solaire ?</h2>
            <p className="text-muted-foreground mb-6">Estimez vos économies et découvrez les aides disponibles dans votre région.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild size="lg" className="gap-2">
                <Link to="/landing/solaire">Découvrir notre offre solaire <ArrowRight className="w-4 h-4" /></Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/simulateurs/solaire">Simuler mes économies</Link>
              </Button>
            </div>
          </section>

          {/* FAQ */}
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

export default ServiceInstallationSolaire;
