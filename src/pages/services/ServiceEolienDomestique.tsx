import { Helmet } from "react-helmet";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Link } from "react-router-dom";
import { Wind, CheckCircle, ArrowRight, AlertTriangle, Gauge, MapPin, HelpCircle, Euro, Wrench, Shield, BarChart3, Lightbulb, Volume2, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import eolienImg from "@/assets/services/eolien-domestique.jpg";

const faqs = [
  { q: "L'éolien domestique est-il rentable en France ?", a: "La rentabilité dépend fortement de l'exposition au vent de votre terrain. En zone bien ventée (littoral, campagne ouverte avec un vent moyen >5 m/s), un petit éolien peut être rentable en 10 à 15 ans. En zone urbaine ou semi-urbaine, l'éolien domestique est rarement compétitif face au solaire." },
  { q: "Quelle puissance pour une éolienne domestique ?", a: "Les éoliennes domestiques ont généralement une puissance de 1 à 36 kW. Pour un foyer moyen, une éolienne de 3 à 5 kW couplée à des panneaux solaires offre un bon équilibre production/investissement." },
  { q: "Faut-il un permis de construire pour installer une éolienne ?", a: "Pour une éolienne de moins de 12 m de hauteur, une déclaration préalable suffit. Au-delà de 12 m, un permis de construire est obligatoire. Dans tous les cas, la réglementation locale (PLU) peut imposer des restrictions supplémentaires." },
  { q: "Peut-on combiner éolien et solaire ?", a: "Oui, c'est même recommandé. L'éolien produit souvent davantage en hiver et la nuit, quand le solaire est moins performant. Cette complémentarité permet de maximiser l'autoconsommation sur l'année et d'atteindre un taux d'autonomie de 60 à 80 %." },
  { q: "Quel entretien nécessite une éolienne domestique ?", a: "Un contrôle annuel (vérification des pales, du mât, des roulements, des connexions électriques et du système de freinage) est recommandé. Les coûts d'entretien sont de 200 à 500 € par an selon le modèle et l'accès au mât." },
  { q: "L'éolien domestique est-il bruyant ?", a: "Le niveau sonore dépend du modèle et de la vitesse du vent. Les éoliennes modernes à axe horizontal émettent 35 à 45 dB(A) à 50 mètres. Les modèles à axe vertical sont généralement plus silencieux. La réglementation impose le respect des seuils d'émergence acoustique." },
  { q: "Existe-t-il des aides pour l'éolien domestique ?", a: "En 2026, il n'existe plus d'aide nationale spécifique pour le petit éolien domestique. Certaines collectivités locales proposent des subventions. Le tarif de rachat en obligation d'achat reste accessible pour les installations de moins de 36 kW." },
  { q: "Éolienne à axe horizontal ou vertical ?", a: "L'éolienne à axe horizontal (HAWT) offre un meilleur rendement en zone dégagée. L'éolienne à axe vertical (VAWT) est plus adaptée aux zones turbulentes (ville, relief) et fonctionne quel que soit la direction du vent, mais avec un rendement inférieur." },
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
    description: "Informations complètes sur l'éolien domestique : fonctionnement, prix, réglementation, types d'éoliennes et conditions d'installation pour les particuliers en France.",
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
        <title>Éolien Domestique : Guide Complet, Prix et Réglementation 2026 | Prime Énergies</title>
        <meta name="description" content="Tout savoir sur l'éolien domestique : fonctionnement, prix, types d'éoliennes, réglementation, zones ventées, avantages et limites. Guide objectif 2026." />
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

          {/* Hero */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-sky-100 text-sky-600"><Wind className="w-8 h-8" /></div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">Éolien domestique : produire de l'électricité grâce au vent</h1>
            </div>
            <p className="text-lg text-muted-foreground leading-relaxed mb-6">
              Le petit éolien permet aux particuliers de produire leur propre électricité grâce à la force du vent. Si cette technologie séduit par son côté écologique et sa complémentarité avec le solaire, elle nécessite des conditions précises pour être rentable. Voici un guide objectif et complet pour évaluer si l'éolien domestique est adapté à votre situation.
            </p>
            <div className="rounded-2xl overflow-hidden mb-6">
              <img src={eolienImg} alt="Éolienne domestique installée dans un jardin en campagne française" width={1280} height={720} className="w-full h-auto object-cover" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { value: "4+ m/s", label: "Vent moyen minimum requis" },
                { value: "20 ans", label: "Durée de vie moyenne" },
                { value: "10-15 ans", label: "Amortissement estimé" },
                { value: "1-36 kW", label: "Puissance disponible" },
              ].map((stat, i) => (
                <div key={i} className="text-center p-4 rounded-xl bg-sky-50 border border-sky-100">
                  <div className="text-2xl font-bold text-sky-600">{stat.value}</div>
                  <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Prérequis */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-6">Ce qu'il faut savoir avant de se lancer</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { icon: Gauge, title: "Vitesse de vent requise", desc: "Un vent moyen annuel d'au moins 4 m/s est nécessaire pour qu'une éolienne domestique soit viable. En zone littorale, la moyenne atteint 6-8 m/s. Consultez les données Météo-France ou l'atlas éolien de l'ADEME pour votre commune." },
                { icon: MapPin, title: "Emplacement stratégique", desc: "L'éolienne doit être installée en zone dégagée, loin des bâtiments (au moins 2 fois la hauteur des obstacles environnants). La hauteur du mât influence directement le rendement : +10 m = +25 % de production." },
                { icon: AlertTriangle, title: "Réglementation stricte", desc: "Distance aux habitations voisines (ICPE pour >12m), nuisances sonores (émergence max +5 dB jour, +3 dB nuit), esthétique paysagère, zones naturelles protégées. Consultez votre PLU avant tout projet." },
                { icon: CheckCircle, title: "Complémentarité solaire", desc: "L'éolien est un excellent complément au photovoltaïque : il produit la nuit, en hiver et par temps couvert. Un système hybride solaire + éolien permet un taux d'autoconsommation de 60 à 80 %." },
                { icon: Volume2, title: "Impact sonore maîtrisé", desc: "Les éoliennes modernes émettent 35-45 dB(A) à 50 m, soit l'équivalent d'une conversation à voix basse. Les modèles à axe vertical sont plus silencieux mais moins performants." },
                { icon: Leaf, title: "Bilan environnemental", desc: "Une éolienne domestique rembourse son empreinte carbone en 6 à 12 mois et produit de l'énergie propre pendant 20 ans. Aucune émission, aucun déchet en fonctionnement." },
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

          {/* Types d'éoliennes */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-4">Types d'éoliennes domestiques</h2>
            <p className="text-muted-foreground mb-6">Deux grandes familles d'éoliennes se partagent le marché résidentiel, chacune avec ses spécificités :</p>
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <Card className="border-sky-200 bg-sky-50/30">
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold text-foreground mb-3">🌀 Axe horizontal (HAWT)</h3>
                  <p className="text-sm text-muted-foreground mb-4">L'éolienne classique à hélice, semblable aux grands modèles industriels. Elle doit s'orienter face au vent grâce à une girouette.</p>
                  <ul className="space-y-2">
                    {["Rendement supérieur (35-45 % du vent capté)", "Idéale en zone dégagée et ouverte", "Production optimale avec vents réguliers", "Nécessite une girouette d'orientation", "Mât de 10 à 35 m recommandé"].map((item, i) => (
                      <li key={i} className="flex gap-2 text-sm"><CheckCircle className="w-4 h-4 text-sky-600 flex-shrink-0 mt-0.5" /><span className="text-muted-foreground">{item}</span></li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold text-foreground mb-3">🔄 Axe vertical (VAWT)</h3>
                  <p className="text-sm text-muted-foreground mb-4">Éolienne avec des pales verticales qui tourne quel que soit la direction du vent. Modèles Darrieus ou Savonius.</p>
                  <ul className="space-y-2">
                    {["Fonctionne dans toutes les directions de vent", "Plus silencieuse (30-40 dB(A))", "Adaptée aux zones turbulentes (ville)", "Rendement inférieur (15-25 %)", "Hauteur de mât plus faible (5-15 m)"].map((item, i) => (
                      <li key={i} className="flex gap-2 text-sm"><CheckCircle className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" /><span className="text-muted-foreground">{item}</span></li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Tableau prix */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-4">Prix d'une éolienne domestique en 2026</h2>
            <p className="text-muted-foreground mb-6">Les prix varient considérablement selon la puissance, le type et la hauteur de mât. Voici les fourchettes indicatives :</p>
            <div className="overflow-x-auto mb-6">
              <table className="w-full text-sm border border-border rounded-lg overflow-hidden">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-3 font-semibold text-foreground">Puissance</th>
                    <th className="text-left p-3 font-semibold text-foreground">Prix (pose comprise)</th>
                    <th className="text-left p-3 font-semibold text-foreground">Production annuelle*</th>
                    <th className="text-left p-3 font-semibold text-foreground">Foyer adapté</th>
                    <th className="text-left p-3 font-semibold text-foreground">Amortissement**</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["1 kW", "5 000 – 10 000 €", "1 000 – 2 000 kWh", "Appoint / éclairage", "15 – 20 ans"],
                    ["3 kW", "10 000 – 20 000 €", "3 000 – 6 000 kWh", "Petit foyer (2 pers.)", "12 – 18 ans"],
                    ["5 kW", "15 000 – 30 000 €", "5 000 – 10 000 kWh", "Foyer moyen (4 pers.)", "10 – 15 ans"],
                    ["10 kW", "25 000 – 45 000 €", "10 000 – 20 000 kWh", "Grand foyer / semi-pro", "10 – 14 ans"],
                    ["20-36 kW", "40 000 – 80 000 €", "20 000 – 60 000 kWh", "Usage professionnel", "8 – 12 ans"],
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
            <p className="text-xs text-muted-foreground italic">* Production estimée pour un site avec vent moyen de 5 m/s. ** En zone correctement ventée, hors aides éventuelles.</p>
          </section>

          {/* Zones favorables */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-4">Zones favorables au petit éolien en France</h2>
            <p className="text-muted-foreground mb-6">La viabilité d'un projet éolien dépend avant tout du gisement de vent local. Voici les zones les plus propices :</p>
            <div className="overflow-x-auto mb-4">
              <table className="w-full text-sm border border-border rounded-lg overflow-hidden">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-3 font-semibold text-foreground">Zone</th>
                    <th className="text-left p-3 font-semibold text-foreground">Vent moyen</th>
                    <th className="text-left p-3 font-semibold text-foreground">Potentiel éolien</th>
                    <th className="text-left p-3 font-semibold text-foreground">Recommandation</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Littoral atlantique (Bretagne, Normandie)", "6 – 8 m/s", "⭐⭐⭐⭐⭐", "Excellent – très favorable"],
                    ["Littoral méditerranéen (Mistral, Tramontane)", "5 – 7 m/s", "⭐⭐⭐⭐", "Très bon – vent régulier"],
                    ["Vallée du Rhône, Languedoc", "5 – 7 m/s", "⭐⭐⭐⭐", "Très bon – couloir venté"],
                    ["Campagne ouverte (Beauce, Picardie)", "4 – 6 m/s", "⭐⭐⭐", "Bon – si terrain dégagé"],
                    ["DOM-TOM (Antilles, alizés)", "5 – 8 m/s", "⭐⭐⭐⭐", "Très bon – alizés réguliers"],
                    ["Zone urbaine / semi-urbaine", "2 – 4 m/s", "⭐", "Déconseillé – privilégiez le solaire"],
                    ["Montagne / relief accidenté", "Variable", "⭐⭐", "Variable – turbulences fréquentes"],
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

          {/* Réglementation */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-4">Réglementation du petit éolien en France</h2>
            <p className="text-muted-foreground mb-6">L'installation d'une éolienne domestique est encadrée par plusieurs textes. Voici un résumé des principales obligations :</p>
            <div className="space-y-4">
              {[
                { title: "Éolienne < 12 m de hauteur", desc: "Déclaration préalable de travaux en mairie. Délai d'instruction : 1 mois. Pas de permis de construire requis." },
                { title: "Éolienne ≥ 12 m de hauteur", desc: "Permis de construire obligatoire. Étude d'impact environnemental possible. Délai d'instruction : 2 à 3 mois." },
                { title: "Nuisances sonores", desc: "L'émergence sonore ne doit pas dépasser +5 dB(A) le jour et +3 dB(A) la nuit par rapport au bruit ambiant (Code de la santé publique, art. R1336-7)." },
                { title: "Zones protégées", desc: "Installation interdite ou soumise à autorisation spéciale dans les sites classés, zones Natura 2000, et périmètres de monuments historiques (500 m)." },
                { title: "PLU (Plan Local d'Urbanisme)", desc: "Certaines communes interdisent ou limitent les éoliennes via leur PLU. Renseignez-vous auprès du service urbanisme de votre mairie avant tout projet." },
                { title: "Raccordement réseau", desc: "Pour la revente de surplus, un contrat d'obligation d'achat est possible (tarif réglementé). Demande de raccordement auprès d'Enedis obligatoire." },
              ].map((item, i) => (
                <div key={i} className="flex gap-4 p-4 rounded-xl bg-muted/30 border border-border/30">
                  <Shield className="w-5 h-5 text-sky-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Éolien vs Solaire */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-4">Éolien vs solaire : quel choix pour vous ?</h2>
            <div className="overflow-x-auto mb-4">
              <table className="w-full text-sm border border-border rounded-lg overflow-hidden">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-3 font-semibold text-foreground">Critère</th>
                    <th className="text-left p-3 font-semibold text-foreground">Éolien domestique</th>
                    <th className="text-left p-3 font-semibold text-foreground">Solaire photovoltaïque</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Prix pour 3 kW", "10 000 – 20 000 €", "7 500 – 9 500 €"],
                    ["Amortissement", "10 – 18 ans", "6 – 10 ans"],
                    ["Production nocturne", "✅ Oui", "❌ Non"],
                    ["Production hivernale", "✅ Souvent meilleure", "⚠️ Réduite"],
                    ["Entretien", "200 – 500 €/an", "50 – 100 €/an"],
                    ["Nuisances", "Bruit possible", "Aucune"],
                    ["Contraintes terrain", "Zone dégagée, vent >4 m/s", "Toiture orientée sud"],
                    ["Aides 2026", "Limitées", "Prime autoconsommation + OA"],
                    ["Durée de vie", "20 ans", "30-40 ans"],
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
            <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 flex gap-3">
              <Lightbulb className="w-5 h-5 text-sky-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground"><strong className="text-foreground">Notre avis :</strong> Pour la majorité des particuliers, le solaire photovoltaïque reste la solution la plus rentable et la plus simple. L'éolien domestique est pertinent en complément, uniquement si votre terrain dispose d'un gisement éolien suffisant (vent moyen ≥ 5 m/s).</p>
            </div>
          </section>

          {/* CTA */}
          <section className="mb-12 bg-gradient-to-br from-sky-50 to-primary/5 border border-sky-200 rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-bold text-foreground mb-3">Envie d'en savoir plus sur les énergies renouvelables ?</h2>
            <p className="text-muted-foreground mb-6 max-w-xl mx-auto">Découvrez toutes nos solutions pour réduire votre facture énergétique et gagner en autonomie.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild size="lg" className="gap-2">
                <Link to="/landing/solaire">Explorer le solaire <ArrowRight className="w-4 h-4" /></Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/guides">Consulter nos guides</Link>
              </Button>
            </div>
          </section>

          {/* Articles liés */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-6">Pour aller plus loin</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { title: "Installation solaire", desc: "La solution la plus rentable pour produire votre électricité", link: "/services/installation-solaire", icon: "☀️" },
                { title: "Stockage d'énergie", desc: "Batteries pour maximiser votre autoconsommation éolien+solaire", link: "/services/stockage-energie", icon: "🔋" },
                { title: "Audit énergétique", desc: "Évaluez votre consommation avant de dimensionner votre installation", link: "/services/audit-energetique", icon: "📋" },
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

export default ServiceEolienDomestique;
