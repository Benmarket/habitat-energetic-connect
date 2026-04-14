import { Helmet } from "react-helmet";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Link } from "react-router-dom";
import { Wind, CheckCircle, ArrowRight, AlertTriangle, Gauge, MapPin, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  { q: "L'éolien domestique est-il rentable en France ?", a: "La rentabilité dépend fortement de l'exposition au vent de votre terrain. En zone bien ventée (littoral, campagne ouverte), un petit éolien peut être rentable en 10 à 15 ans. En zone urbaine ou semi-urbaine, l'éolien domestique est rarement compétitif face au solaire." },
  { q: "Quelle puissance pour une éolienne domestique ?", a: "Les éoliennes domestiques ont généralement une puissance de 1 à 36 kW. Pour un foyer moyen, une éolienne de 3 à 5 kW couplée à des panneaux solaires offre un bon équilibre production/investissement." },
  { q: "Faut-il un permis de construire pour installer une éolienne ?", a: "Pour une éolienne de moins de 12 m de hauteur, une déclaration préalable suffit. Au-delà de 12 m, un permis de construire est obligatoire. Dans tous les cas, la réglementation locale (PLU) peut imposer des restrictions supplémentaires." },
  { q: "Peut-on combiner éolien et solaire ?", a: "Oui, c'est même recommandé. L'éolien produit souvent davantage en hiver et la nuit, quand le solaire est moins performant. Cette complémentarité permet de maximiser l'autoconsommation sur l'année." },
  { q: "Quel entretien nécessite une éolienne domestique ?", a: "Un contrôle annuel (vérification des pales, du mât, des connexions électriques) est recommandé. Les coûts d'entretien restent modérés, entre 100 € et 300 € par an selon le modèle." },
];

const ServiceEolienDomestique = () => {
  const breadcrumbItems = [
    { name: "Accueil", url: "/" },
    { name: "Services", url: "/" },
    { name: "Éolien domestique", url: "/services/eolien-domestique" },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Installation d'éolienne domestique",
    description: "Informations complètes sur l'éolien domestique : fonctionnement, prix, réglementation et conditions d'installation pour les particuliers en France.",
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
        <title>Éolien Domestique : Guide, Prix et Réglementation 2026 | Prime Énergies</title>
        <meta name="description" content="Tout savoir sur l'éolien domestique : fonctionnement, prix d'une éolienne pour particulier, réglementation, avantages et limites. Guide complet 2026." />
        <link rel="canonical" href="https://prime-energies.fr/services/eolien-domestique" />
        <meta property="og:title" content="Éolien Domestique : Guide Complet | Prime Énergies" />
        <meta property="og:description" content="Fonctionnement, prix, réglementation : tout savoir sur le petit éolien résidentiel en France." />
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
              <div className="p-3 rounded-xl bg-sky-100 text-sky-600"><Wind className="w-8 h-8" /></div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">Éolien domestique : produire de l'électricité grâce au vent</h1>
            </div>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Le petit éolien permet aux particuliers de produire leur propre électricité grâce à la force du vent. Si cette technologie séduit par son côté écologique, elle nécessite des conditions précises pour être rentable. Voici un guide objectif pour évaluer si l'éolien domestique est adapté à votre situation.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-6">Ce qu'il faut savoir avant de se lancer</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { icon: Gauge, title: "Vitesse de vent requise", desc: "Un vent moyen annuel d'au moins 4 m/s est nécessaire pour qu'une éolienne domestique soit viable. Vérifiez les données météo locales." },
                { icon: MapPin, title: "Emplacement stratégique", desc: "L'éolienne doit être installée en zone dégagée, loin des bâtiments et obstacles. La hauteur du mât influence directement le rendement." },
                { icon: AlertTriangle, title: "Réglementation stricte", desc: "Distance aux habitations voisines, nuisances sonores, esthétique paysagère : la réglementation encadre fortement le petit éolien." },
                { icon: CheckCircle, title: "Complémentarité solaire", desc: "L'éolien est un excellent complément au photovoltaïque : il produit la nuit et en hiver quand le solaire est moins performant." },
              ].map((item, i) => (
                <Card key={i} className="border-border/50">
                  <CardContent className="p-5 flex gap-4">
                    <div className="p-2 rounded-lg bg-sky-50 text-sky-600 h-fit"><item.icon className="w-5 h-5" /></div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Tableau prix */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-6">Prix indicatifs d'une éolienne domestique</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-border rounded-lg overflow-hidden">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-3 font-semibold text-foreground">Puissance</th>
                    <th className="text-left p-3 font-semibold text-foreground">Prix (pose comprise)</th>
                    <th className="text-left p-3 font-semibold text-foreground">Production annuelle estimée</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["1 kW", "5 000 – 10 000 €", "1 000 – 2 000 kWh"],
                    ["3 kW", "10 000 – 20 000 €", "3 000 – 6 000 kWh"],
                    ["5 kW", "15 000 – 30 000 €", "5 000 – 10 000 kWh"],
                    ["10+ kW", "25 000 – 60 000 €", "10 000 – 20 000 kWh"],
                  ].map((row, i) => (
                    <tr key={i} className="border-t border-border">
                      {row.map((cell, j) => <td key={j} className="p-3 text-muted-foreground">{cell}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="mb-12 bg-sky-50 border border-sky-200 rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-bold text-foreground mb-3">Envie d'en savoir plus sur les énergies renouvelables ?</h2>
            <p className="text-muted-foreground mb-6">Découvrez toutes nos solutions pour réduire votre facture énergétique.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild size="lg" className="gap-2">
                <Link to="/landing/solaire">Explorer le solaire <ArrowRight className="w-4 h-4" /></Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/guides">Consulter nos guides</Link>
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

export default ServiceEolienDomestique;
