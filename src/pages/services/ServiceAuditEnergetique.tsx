import { Helmet } from "react-helmet";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Link } from "react-router-dom";
import { ClipboardCheck, CheckCircle, ArrowRight, FileText, Home, TrendingDown, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  { q: "L'audit énergétique est-il obligatoire ?", a: "Depuis avril 2023, l'audit énergétique est obligatoire lors de la vente d'un logement classé F ou G au DPE. Depuis 2025, cette obligation s'étend aux logements classés E. Il est aussi requis pour bénéficier de MaPrimeRénov' Parcours accompagné." },
  { q: "Quelle différence entre DPE et audit énergétique ?", a: "Le DPE (Diagnostic de Performance Énergétique) donne une note de A à G. L'audit énergétique est bien plus détaillé : il analyse chaque poste de déperdition et propose des scénarios de travaux chiffrés avec les gains attendus." },
  { q: "Combien coûte un audit énergétique ?", a: "Un audit énergétique réglementaire coûte entre 800 € et 1 500 € pour une maison individuelle. Ce coût peut être partiellement pris en charge par MaPrimeRénov' (jusqu'à 500 € selon les revenus)." },
  { q: "Qui peut réaliser un audit énergétique ?", a: "L'audit doit être réalisé par un professionnel qualifié : bureau d'études thermiques certifié ou diagnostiqueur immobilier disposant de la certification audit énergétique." },
  { q: "Quelle est la durée de validité d'un audit énergétique ?", a: "L'audit énergétique réglementaire a une durée de validité de 5 ans. Il est recommandé de le refaire après la réalisation de travaux importants pour mesurer les gains obtenus." },
];

const ServiceAuditEnergetique = () => {
  const breadcrumbItems = [
    { name: "Accueil", url: "/" },
    { name: "Services", url: "/" },
    { name: "Audit énergétique", url: "/services/audit-energetique" },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Audit énergétique pour les logements",
    description: "Audit énergétique réglementaire et volontaire pour les particuliers. Identifiez les déperditions de votre logement et les travaux prioritaires à réaliser.",
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
        <title>Audit Énergétique : Obligations, Prix et Aides 2026 | Prime Énergies</title>
        <meta name="description" content="Audit énergétique réglementaire : obligations 2026, prix, aides MaPrimeRénov', différences avec le DPE. Identifiez les travaux prioritaires pour votre logement." />
        <link rel="canonical" href="https://prime-energies.fr/services/audit-energetique" />
        <meta property="og:title" content="Audit Énergétique : Guide Complet 2026 | Prime Énergies" />
        <meta property="og:description" content="Obligations, prix, aides : tout savoir sur l'audit énergétique de votre logement en 2026." />
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
              <div className="p-3 rounded-xl bg-orange-100 text-orange-600"><ClipboardCheck className="w-8 h-8" /></div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">Audit énergétique : le point de départ de votre rénovation</h1>
            </div>
            <p className="text-lg text-muted-foreground leading-relaxed">
              L'audit énergétique est une analyse approfondie de la performance thermique de votre logement. Contrairement au simple DPE, il identifie précisément les sources de déperdition et propose des scénarios de travaux chiffrés. En 2026, il est devenu un outil incontournable pour optimiser sa rénovation et accéder aux aides de l'État.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-6">Ce que l'audit énergétique vous apporte</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { icon: Home, title: "Diagnostic complet", desc: "Analyse des murs, toiture, fenêtres, ventilation et système de chauffage. Chaque poste de déperdition est quantifié." },
                { icon: FileText, title: "Scénarios de travaux", desc: "L'audit propose au moins 2 parcours de travaux avec les coûts estimés, les aides mobilisables et les gains énergétiques attendus." },
                { icon: TrendingDown, title: "Priorisation des travaux", desc: "Identifiez les travaux les plus rentables : isolation des combles, changement de chauffage, remplacement des fenêtres..." },
                { icon: CheckCircle, title: "Accès aux aides", desc: "L'audit est un prérequis pour MaPrimeRénov' Parcours accompagné et pour bénéficier des aides à la rénovation globale." },
              ].map((item, i) => (
                <Card key={i} className="border-border/50">
                  <CardContent className="p-5 flex gap-4">
                    <div className="p-2 rounded-lg bg-orange-50 text-orange-600 h-fit"><item.icon className="w-5 h-5" /></div>
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
            <h2 className="text-2xl font-bold text-foreground mb-6">Déroulement d'un audit énergétique</h2>
            <ol className="space-y-4">
              {[
                { step: "Prise de rendez-vous", desc: "Un auditeur certifié se déplace à votre domicile pour une visite technique de 2 à 3 heures." },
                { step: "Collecte de données", desc: "Relevé des surfaces, matériaux, épaisseurs d'isolation, type de chauffage, factures énergétiques des 3 dernières années." },
                { step: "Modélisation thermique", desc: "L'auditeur modélise votre logement dans un logiciel agréé pour calculer les déperditions poste par poste." },
                { step: "Remise du rapport", desc: "Vous recevez un rapport détaillé avec les scénarios de travaux, les gains attendus et les aides mobilisables." },
              ].map((item, i) => (
                <li key={i} className="flex gap-4 items-start">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold text-sm">{i + 1}</span>
                  <div>
                    <h3 className="font-semibold text-foreground">{item.step}</h3>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className="mb-12 bg-orange-50 border border-orange-200 rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-bold text-foreground mb-3">Lancez votre projet de rénovation</h2>
            <p className="text-muted-foreground mb-6">Découvrez les aides disponibles et les solutions adaptées à votre logement.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild size="lg" className="gap-2">
                <Link to="/landing/renovation-globale">Rénovation globale <ArrowRight className="w-4 h-4" /></Link>
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

export default ServiceAuditEnergetique;
