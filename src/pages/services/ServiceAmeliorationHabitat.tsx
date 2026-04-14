import { Helmet } from "react-helmet";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Link } from "react-router-dom";
import { Home, CheckCircle, ArrowRight, Paintbrush, DoorOpen, Droplets, Flame, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  { q: "Quels travaux d'amélioration de l'habitat sont éligibles aux aides ?", a: "Les travaux éligibles incluent l'isolation thermique (murs, toiture, plancher), le remplacement du chauffage (PAC, chaudière biomasse), la ventilation (VMC double flux), le remplacement des fenêtres et portes, et l'installation de systèmes d'énergie renouvelable." },
  { q: "Qu'est-ce que MaPrimeRénov' Parcours accompagné ?", a: "C'est un dispositif qui finance une rénovation globale (au moins 2 gestes de travaux) avec un accompagnateur agréé. Les aides peuvent couvrir de 30 % à 90 % du coût des travaux selon les revenus du ménage et le gain énergétique obtenu." },
  { q: "Peut-on réaliser les travaux par étapes ?", a: "Oui, le « parcours par geste » de MaPrimeRénov' permet de financer un seul type de travaux (ex : isolation des combles). Cependant, la rénovation globale offre des aides plus importantes et de meilleurs résultats énergétiques." },
  { q: "Comment trouver un artisan certifié RGE ?", a: "Le label RGE (Reconnu Garant de l'Environnement) est obligatoire pour bénéficier des aides publiques. Vous pouvez vérifier la certification d'un artisan sur le site officiel france-renov.gouv.fr." },
  { q: "Quel est le retour sur investissement des travaux de rénovation ?", a: "Selon l'ADEME, une rénovation globale performante permet de réduire la consommation énergétique de 40 à 75 %. Le retour sur investissement est généralement de 8 à 15 ans, avec une plus-value immédiate sur la valeur du bien." },
];

const ServiceAmeliorationHabitat = () => {
  const breadcrumbItems = [
    { label: "Accueil", path: "/" },
    { label: "Services", path: "/" },
    { label: "Amélioration de l'habitat" },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Amélioration de l'habitat et rénovation énergétique",
    description: "Solutions complètes d'amélioration de l'habitat : isolation, chauffage, ventilation, fenêtres. Aides financières et accompagnement personnalisé.",
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
        <title>Amélioration de l'Habitat : Travaux, Aides et Conseils 2026 | Prime Énergies</title>
        <meta name="description" content="Améliorez votre habitat : isolation, chauffage, ventilation, fenêtres. Découvrez les aides MaPrimeRénov', CEE et éco-PTZ pour financer vos travaux en 2026." />
        <link rel="canonical" href="https://prime-energies.fr/services/amelioration-habitat" />
        <meta property="og:title" content="Amélioration de l'Habitat | Prime Énergies" />
        <meta property="og:description" content="Travaux de rénovation, aides financières et conseils pour améliorer la performance énergétique de votre logement." />
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
              <div className="p-3 rounded-xl bg-violet-100 text-violet-600"><Home className="w-8 h-8" /></div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">Amélioration de l'habitat : rénovez pour mieux vivre</h1>
            </div>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Améliorer la performance énergétique de votre logement, c'est réduire vos factures, gagner en confort et valoriser votre bien immobilier. En 2026, les aides de l'État couvrent une part significative des travaux pour les ménages qui souhaitent rénover. Isolation, chauffage, ventilation : découvrez les solutions adaptées à votre habitat.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-6">Les principaux postes de travaux</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { icon: Paintbrush, title: "Isolation thermique", desc: "Combles, murs, planchers : l'isolation est le geste le plus efficace. Elle peut réduire les déperditions thermiques de 25 à 30 % (toiture) et de 20 à 25 % (murs)." },
                { icon: Flame, title: "Chauffage performant", desc: "Pompe à chaleur, chaudière biomasse, poêle à granulés : remplacez votre ancien système par un équipement performant et écologique." },
                { icon: Droplets, title: "Ventilation", desc: "Une VMC double flux récupère la chaleur de l'air vicié pour préchauffer l'air neuf. Gain de confort et économies d'énergie assurés." },
                { icon: DoorOpen, title: "Menuiseries", desc: "Fenêtres double ou triple vitrage, portes isolantes : réduisez les courants d'air et améliorez l'isolation phonique de votre logement." },
              ].map((item, i) => (
                <Card key={i} className="border-border/50">
                  <CardContent className="p-5 flex gap-4">
                    <div className="p-2 rounded-lg bg-violet-50 text-violet-600 h-fit"><item.icon className="w-5 h-5" /></div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Aides */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-6">Les aides financières en 2026</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-border rounded-lg overflow-hidden">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-3 font-semibold text-foreground">Aide</th>
                    <th className="text-left p-3 font-semibold text-foreground">Montant indicatif</th>
                    <th className="text-left p-3 font-semibold text-foreground">Condition principale</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["MaPrimeRénov' (par geste)", "Jusqu'à 10 000 €", "Logement de + de 15 ans, artisan RGE"],
                    ["MaPrimeRénov' Parcours accompagné", "30 à 90 % du coût", "Rénovation globale avec accompagnateur"],
                    ["CEE (Certificats d'Économie d'Énergie)", "Variable", "Travaux éligibles, tous revenus"],
                    ["Éco-PTZ", "Jusqu'à 50 000 €", "Prêt à taux zéro, sans conditions de revenus"],
                    ["TVA réduite (5,5 %)", "Réduction automatique", "Logement de + de 2 ans"],
                  ].map((row, i) => (
                    <tr key={i} className="border-t border-border">
                      {row.map((cell, j) => <td key={j} className="p-3 text-muted-foreground">{cell}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="mb-12 bg-violet-50 border border-violet-200 rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-bold text-foreground mb-3">Lancez votre projet de rénovation</h2>
            <p className="text-muted-foreground mb-6">Découvrez les aides auxquelles vous avez droit et trouvez des professionnels certifiés.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild size="lg" className="gap-2">
                <Link to="/landing/renovation-globale">Rénovation globale <ArrowRight className="w-4 h-4" /></Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/aides">Consulter toutes les aides</Link>
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

export default ServiceAmeliorationHabitat;
