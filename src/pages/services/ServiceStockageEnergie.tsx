import { Helmet } from "react-helmet";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Link } from "react-router-dom";
import { Battery, CheckCircle, ArrowRight, Zap, Shield, Clock, HelpCircle, Euro, Lightbulb, BarChart3, AlertTriangle, Wrench, Sun, Gauge } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import batterieImg from "@/assets/services/batterie-stockage.jpg";
import autoconsoImg from "@/assets/services/stockage-autoconsommation.jpg";

const faqs = [
  { q: "Pourquoi installer une batterie de stockage solaire ?", a: "Une batterie permet de stocker l'électricité produite par vos panneaux solaires pendant la journée pour la consommer le soir et la nuit. Vous augmentez ainsi votre taux d'autoconsommation de 30 % à 70-80 %, réduisant davantage votre facture." },
  { q: "Quel est le prix d'une batterie domestique en 2026 ?", a: "Les prix varient de 4 000 € à 12 000 € selon la capacité (5 à 15 kWh). Les batteries lithium-fer-phosphate (LFP) offrent aujourd'hui le meilleur rapport qualité/durée de vie. Les prix ont baissé de 30 % depuis 2023." },
  { q: "Quelle est la durée de vie d'une batterie solaire ?", a: "Les batteries LFP modernes sont garanties pour 6 000 à 10 000 cycles, soit environ 15 à 20 ans d'utilisation quotidienne. Les batteries NMC offrent 3 000 à 5 000 cycles (10-15 ans)." },
  { q: "La batterie domestique permet-elle d'être autonome en cas de coupure ?", a: "Certains systèmes offrent une fonction « backup » qui alimente les circuits essentiels lors d'une coupure réseau. Cette fonctionnalité nécessite un onduleur hybride compatible et une batterie d'au moins 10 kWh pour une autonomie de quelques heures." },
  { q: "Y a-t-il des aides pour les batteries de stockage ?", a: "En France métropolitaine, il n'existe pas d'aide nationale spécifique aux batteries seules en 2026. Cependant, certaines collectivités locales et régions (notamment les DOM-TOM) proposent des subventions. Les batteries installées avec des panneaux solaires bénéficient indirectement de la prime à l'autoconsommation." },
  { q: "Quelle capacité de batterie pour ma maison ?", a: "La capacité idéale dépend de votre consommation nocturne. Pour un foyer consommant 4 500 kWh/an, une batterie de 5 à 8 kWh couvre les besoins du soir. Pour un foyer de 8 000 kWh/an ou avec véhicule électrique, 10 à 15 kWh sont recommandés." },
  { q: "Où installer la batterie dans la maison ?", a: "La batterie se place dans un local ventilé, à l'abri de l'humidité et des températures extrêmes (idéalement 5-25°C). Le garage, un local technique ou une buanderie sont des emplacements courants. Les batteries LFP supportent mieux les variations de température que les NMC." },
  { q: "Batterie physique ou virtuelle : quelle différence ?", a: "La batterie physique stocke l'énergie chez vous. La batterie virtuelle est un service proposé par certains fournisseurs : votre surplus est injecté sur le réseau et vous récupérez des crédits d'énergie. La batterie physique offre l'autonomie, la virtuelle est moins coûteuse mais dépend du réseau." },
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
    description: "Solutions de stockage d'énergie par batteries pour les installations solaires résidentielles. Maximisez votre autoconsommation et gagnez en autonomie énergétique.",
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
        <title>Stockage d'Énergie et Batteries Solaires : Guide Complet 2026 | Prime Énergies</title>
        <meta name="description" content="Batteries domestiques pour panneaux solaires : prix 2026, technologies LFP vs NMC, capacité, autonomie, aides et comparatif complet pour maximiser votre autoconsommation." />
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

          {/* Hero */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-emerald-100 text-emerald-600"><Battery className="w-8 h-8" /></div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">Stockage d'énergie : maximisez votre autoconsommation</h1>
            </div>
            <p className="text-lg text-muted-foreground leading-relaxed mb-6">
              Les batteries domestiques transforment l'utilisation de l'énergie solaire. En stockant le surplus de production pour le consommer plus tard, elles permettent d'atteindre des taux d'autoconsommation de 70 à 80 %. Le marché des batteries résidentielles connaît une croissance de 40 % par an en France, avec des prix en baisse constante depuis 2020.
            </p>
            <div className="rounded-2xl overflow-hidden mb-6">
              <img src={batterieImg} alt="Système de batterie de stockage domestique installé dans un garage" width={1280} height={720} className="w-full h-auto object-cover" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { value: "70-80 %", label: "Taux d'autoconsommation" },
                { value: "15-20 ans", label: "Durée de vie LFP" },
                { value: "-30 %", label: "Baisse des prix depuis 2023" },
                { value: "5-15 kWh", label: "Capacité résidentielle" },
              ].map((stat, i) => (
                <div key={i} className="text-center p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                  <div className="text-2xl font-bold text-emerald-600">{stat.value}</div>
                  <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Avantages */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-6">Les avantages du stockage d'énergie</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { icon: Zap, title: "Autoconsommation maximale", desc: "Passez d'un taux d'autoconsommation de 30 % (sans batterie) à 70-80 % en stockant le surplus de production solaire pour le consommer le soir et la nuit." },
                { icon: Shield, title: "Sécurité en cas de coupure", desc: "Les systèmes avec fonction backup (EPS) alimentent vos appareils essentiels (éclairage, réfrigérateur, box internet) lors des coupures de courant, pendant plusieurs heures." },
                { icon: Clock, title: "Consommation décalée", desc: "Stockez l'énergie gratuite du soleil le jour pour la consommer le soir (18h-22h), moment où les tarifs sont les plus élevés et votre consommation la plus forte." },
                { icon: Euro, title: "Économies renforcées", desc: "Avec une batterie, chaque kWh solaire consommé (au lieu d'être revendu à ~0,13 €) vous fait économiser ~0,27 € (tarif achat réseau). Le gain net est de ~0,14 €/kWh stocké." },
                { icon: CheckCircle, title: "Technologies fiables", desc: "Les batteries LFP (lithium-fer-phosphate) offrent sécurité (pas de risque d'emballement thermique), longévité (6 000-10 000 cycles) et performances stables sur 15 à 20 ans." },
                { icon: Sun, title: "Synergie solaire optimale", desc: "Une batterie transforme votre installation solaire en une véritable centrale autonome. Couplée à un onduleur hybride, elle optimise automatiquement les flux d'énergie." },
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

          {/* Comparatif technologies */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-4">Comparatif détaillé des technologies de batteries</h2>
            <p className="text-muted-foreground mb-6">Le choix de la technologie est déterminant pour la durée de vie, la sécurité et le coût de votre système de stockage :</p>
            <div className="overflow-x-auto mb-6">
              <table className="w-full text-sm border border-border rounded-lg overflow-hidden">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-3 font-semibold text-foreground">Critère</th>
                    <th className="text-left p-3 font-semibold text-foreground">LFP (Lithium Fer Phosphate)</th>
                    <th className="text-left p-3 font-semibold text-foreground">NMC (Nickel Manganèse Cobalt)</th>
                    <th className="text-left p-3 font-semibold text-foreground">Sodium-ion</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Durée de vie", "6 000 – 10 000 cycles", "3 000 – 5 000 cycles", "3 000 – 5 000 cycles"],
                    ["Prix / kWh", "400 – 600 €", "350 – 500 €", "250 – 400 €"],
                    ["Densité énergétique", "Moyenne (160 Wh/kg)", "Élevée (250 Wh/kg)", "Faible (140 Wh/kg)"],
                    ["Sécurité", "⭐⭐⭐⭐⭐ Excellente", "⭐⭐⭐ Correcte", "⭐⭐⭐⭐ Très bonne"],
                    ["Plage de température", "-20°C à +60°C", "0°C à +45°C", "-30°C à +60°C"],
                    ["Matériaux critiques", "Pas de cobalt ni nickel", "Cobalt, nickel, lithium", "Pas de lithium ni cobalt"],
                    ["Recyclabilité", "Bonne", "Moyenne", "Excellente"],
                    ["Maturité marché", "⭐⭐⭐⭐⭐ Standard", "⭐⭐⭐⭐ Répandu", "⭐⭐ Émergent"],
                    ["Recommandation", "✅ Meilleur choix 2026", "⚠️ Bon si budget limité", "🔜 Prometteur, à surveiller"],
                  ].map((row, i) => (
                    <tr key={i} className="border-t border-border">
                      {row.map((cell, j) => (
                        <td key={j} className={`p-3 ${j === 0 ? "font-medium text-foreground" : "text-muted-foreground"}`}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex gap-3">
              <Lightbulb className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground"><strong className="text-foreground">Notre recommandation :</strong> En 2026, les batteries LFP sont le meilleur choix pour le résidentiel : sécurité maximale, longévité exceptionnelle et rapport qualité/prix imbattable. Les marques à considérer : BYD, Huawei Luna, Pylontech, Enphase.</p>
            </div>
          </section>

          {/* Dimensionnement */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-4">Comment dimensionner votre batterie ?</h2>
            <p className="text-muted-foreground mb-6">La capacité idéale dépend de votre profil de consommation et de votre installation solaire :</p>
            <div className="overflow-x-auto mb-6">
              <table className="w-full text-sm border border-border rounded-lg overflow-hidden">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-3 font-semibold text-foreground">Profil</th>
                    <th className="text-left p-3 font-semibold text-foreground">Conso annuelle</th>
                    <th className="text-left p-3 font-semibold text-foreground">Panneaux solaires</th>
                    <th className="text-left p-3 font-semibold text-foreground">Batterie conseillée</th>
                    <th className="text-left p-3 font-semibold text-foreground">Budget batterie</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Petit foyer (1-2 pers.)", "3 000 kWh", "3 kWc", "5 kWh", "3 500 – 5 000 €"],
                    ["Foyer moyen (3-4 pers.)", "5 000 kWh", "6 kWc", "8 – 10 kWh", "5 000 – 8 000 €"],
                    ["Grand foyer (5+ pers.)", "8 000 kWh", "9 kWc", "10 – 15 kWh", "7 000 – 12 000 €"],
                    ["Foyer + VE", "10 000+ kWh", "9-12 kWc", "15 – 20 kWh", "10 000 – 16 000 €"],
                  ].map((row, i) => (
                    <tr key={i} className="border-t border-border">
                      {row.map((cell, j) => (
                        <td key={j} className={`p-3 ${j === 0 ? "font-medium text-foreground" : "text-muted-foreground"}`}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Rentabilité */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-4">La batterie est-elle rentable ?</h2>
            <p className="text-muted-foreground mb-6">La rentabilité d'une batterie dépend de plusieurs facteurs. Voici une simulation pour un foyer moyen en 2026 :</p>
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-emerald-200 bg-emerald-50/30">
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold text-foreground mb-3">✅ Avec batterie 10 kWh</h3>
                  <ul className="space-y-3 text-sm">
                    {[
                      { label: "Autoconsommation", value: "75 %" },
                      { label: "Économie annuelle", value: "1 600 €" },
                      { label: "Coût batterie", value: "7 000 €" },
                      { label: "Amortissement batterie", value: "~10 ans" },
                      { label: "Gain net sur 20 ans", value: "+25 000 €" },
                    ].map((item, i) => (
                      <li key={i} className="flex justify-between">
                        <span className="text-muted-foreground">{item.label}</span>
                        <span className="font-semibold text-foreground">{item.value}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold text-foreground mb-3">⚡ Sans batterie</h3>
                  <ul className="space-y-3 text-sm">
                    {[
                      { label: "Autoconsommation", value: "30 %" },
                      { label: "Économie annuelle", value: "900 €" },
                      { label: "Coût batterie", value: "0 €" },
                      { label: "Surplus revendu", value: "~350 €/an" },
                      { label: "Gain net sur 20 ans", value: "+18 000 €" },
                    ].map((item, i) => (
                      <li key={i} className="flex justify-between">
                        <span className="text-muted-foreground">{item.label}</span>
                        <span className="font-semibold text-foreground">{item.value}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
            <p className="text-xs text-muted-foreground italic mt-4">Simulation pour un foyer de 5 000 kWh/an avec installation 6 kWc, tarif réseau 0,27 €/kWh, hausse annuelle de 4 %. Les résultats réels peuvent varier.</p>
            <div className="rounded-2xl overflow-hidden mt-6">
              <img src={autoconsoImg} alt="Famille profitant de l'autoconsommation solaire avec batterie domestique le soir" width={1280} height={720} loading="lazy" className="w-full h-auto object-cover" />
            </div>
          </section>

          {/* Batterie physique vs virtuelle */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-4">Batterie physique vs batterie virtuelle</h2>
            <div className="overflow-x-auto mb-4">
              <table className="w-full text-sm border border-border rounded-lg overflow-hidden">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-3 font-semibold text-foreground">Critère</th>
                    <th className="text-left p-3 font-semibold text-foreground">Batterie physique</th>
                    <th className="text-left p-3 font-semibold text-foreground">Batterie virtuelle</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Principe", "Stockage réel chez vous", "Crédit d'énergie sur le réseau"],
                    ["Investissement", "4 000 – 15 000 €", "0 € (abonnement ~10-20 €/mois)"],
                    ["Autonomie en coupure", "✅ Oui (backup)", "❌ Non"],
                    ["Perte d'énergie", "5-10 % (rendement 90-95 %)", "~0 % (pas de conversion)"],
                    ["Indépendance réseau", "✅ Forte", "❌ Dépendant du réseau"],
                    ["Durée d'engagement", "Aucune", "12-36 mois selon contrat"],
                    ["Idéal pour", "Autonomie, zones isolées", "Budget limité, zone urbaine"],
                  ].map((row, i) => (
                    <tr key={i} className="border-t border-border">
                      {row.map((cell, j) => (
                        <td key={j} className={`p-3 ${j === 0 ? "font-medium text-foreground" : "text-muted-foreground"}`}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* CTA */}
          <section className="mb-12 bg-gradient-to-br from-emerald-50 to-primary/5 border border-emerald-200 rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-bold text-foreground mb-3">Combinez solaire et stockage</h2>
            <p className="text-muted-foreground mb-6 max-w-xl mx-auto">Découvrez nos solutions solaires avec ou sans batterie et simulez vos économies en quelques clics.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild size="lg" className="gap-2">
                <Link to="/landing/solaire">Voir l'offre solaire <ArrowRight className="w-4 h-4" /></Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/simulateurs/solaire">Simuler mes économies</Link>
              </Button>
            </div>
          </section>

          {/* Articles liés */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-6">Pour aller plus loin</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { title: "Installation solaire", desc: "L'indispensable complément de votre batterie", link: "/services/installation-solaire", icon: "☀️" },
                { title: "Éolien domestique", desc: "Combinez éolien et stockage pour une autonomie maximale", link: "/services/eolien-domestique", icon: "🌬️" },
                { title: "Amélioration de l'habitat", desc: "Réduisez votre consommation pour optimiser le stockage", link: "/services/amelioration-habitat", icon: "🏠" },
              ].map((item, i) => (
                <Link key={i} to={item.link} className="block group">
                  <Card className="border-border/50 h-full transition-all group-hover:border-primary/30 group-hover:shadow-md">
                    <CardContent className="p-5">
                      <div className="text-3xl mb-3">{item.icon}</div>
                      <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                      <span className="text-xs text-primary mt-2 inline-flex items-center gap-1">En savoir plus <ArrowRight className="w-3 h-3" /></span>
                    </CardContent>
                  </Card>
                </Link>
              ))}
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

export default ServiceStockageEnergie;
