import { Helmet } from "react-helmet";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Link } from "react-router-dom";
import { Home, CheckCircle, ArrowRight, Paintbrush, DoorOpen, Droplets, Flame, HelpCircle, Euro, Shield, BarChart3, Lightbulb, AlertTriangle, Wrench, ThermometerSnowflake, Wind } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import renovationImg from "@/assets/services/renovation-isolation.jpg";

const faqs = [
  { q: "Quels travaux d'amélioration de l'habitat sont éligibles aux aides ?", a: "Les travaux éligibles incluent l'isolation thermique (murs, toiture, plancher), le remplacement du chauffage (PAC, chaudière biomasse, poêle à granulés), la ventilation (VMC double flux), le remplacement des fenêtres et portes, et l'installation de systèmes d'énergie renouvelable." },
  { q: "Qu'est-ce que MaPrimeRénov' Parcours accompagné ?", a: "C'est un dispositif qui finance une rénovation globale (au moins 2 gestes de travaux avec un gain de 2 classes DPE minimum) avec un accompagnateur agréé Mon Accompagnateur Rénov'. Les aides peuvent couvrir de 30 % à 90 % du coût des travaux selon les revenus et le gain énergétique." },
  { q: "Peut-on réaliser les travaux par étapes ?", a: "Oui, le « parcours par geste » de MaPrimeRénov' permet de financer un seul type de travaux (ex : isolation des combles). Cependant, la rénovation globale (Parcours accompagné) offre des aides plus importantes et de meilleurs résultats énergétiques." },
  { q: "Comment trouver un artisan certifié RGE ?", a: "Le label RGE (Reconnu Garant de l'Environnement) est obligatoire pour bénéficier des aides publiques. Vous pouvez vérifier la certification d'un artisan sur le site officiel france-renov.gouv.fr ou appeler le 0 808 800 700 (service gratuit)." },
  { q: "Quel est le retour sur investissement des travaux de rénovation ?", a: "Selon l'ADEME, une rénovation globale performante permet de réduire la consommation énergétique de 40 à 75 %. Le retour sur investissement est généralement de 8 à 15 ans, avec une plus-value immobilière immédiate de 5 à 25 % selon le gain de classe DPE." },
  { q: "Par quels travaux commencer ?", a: "L'ordre recommandé est : 1) Isolation (combles puis murs puis plancher), 2) Remplacement des fenêtres, 3) Ventilation (VMC), 4) Chauffage performant (PAC). Isoler en premier est essentiel car cela réduit les besoins de chauffage et permet de dimensionner correctement le nouveau système." },
  { q: "Qu'est-ce que Mon Accompagnateur Rénov' ?", a: "C'est un professionnel agréé par l'État qui vous guide tout au long de votre projet de rénovation globale. Il réalise l'audit, propose les scénarios de travaux, vous aide à mobiliser les aides et vérifie la qualité des travaux. Son intervention est obligatoire pour le Parcours accompagné et est financée à hauteur de 100 % pour les ménages très modestes." },
  { q: "Les copropriétés peuvent-elles bénéficier des aides ?", a: "Oui, MaPrimeRénov' Copropriétés finance les travaux de rénovation énergétique des parties communes. L'aide est versée au syndicat de copropriétaires et peut atteindre 25 % du montant des travaux (plafonné à 25 000 €/logement), avec des bonus pour les passoires énergétiques." },
];

const ServiceAmeliorationHabitat = () => {
  const breadcrumbItems = [
    { name: "Accueil", url: "/" },
    { name: "Services", url: "/" },
    { name: "Amélioration de l'habitat", url: "/services/amelioration-habitat" },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Amélioration de l'habitat et rénovation énergétique",
    description: "Solutions complètes d'amélioration de l'habitat : isolation, chauffage, ventilation, fenêtres. Aides financières MaPrimeRénov', CEE, éco-PTZ et accompagnement personnalisé.",
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
        <meta name="description" content="Améliorez votre habitat : isolation thermique, chauffage performant, ventilation, fenêtres. Guide complet des aides MaPrimeRénov' 2026, CEE et éco-PTZ pour financer vos travaux." />
        <link rel="canonical" href="https://prime-energies.fr/services/amelioration-habitat" />
        <meta property="og:title" content="Amélioration de l'Habitat | Prime Énergies" />
        <meta property="og:description" content="Travaux de rénovation, aides financières 2026 et conseils pour améliorer la performance énergétique de votre logement." />
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
              <div className="p-3 rounded-xl bg-violet-100 text-violet-600"><Home className="w-8 h-8" /></div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">Amélioration de l'habitat : rénovez pour mieux vivre</h1>
            </div>
            <p className="text-lg text-muted-foreground leading-relaxed mb-6">
              Améliorer la performance énergétique de votre logement, c'est réduire vos factures, gagner en confort thermique été comme hiver, et valoriser votre bien immobilier. En 2026, les aides de l'État atteignent des niveaux historiques : jusqu'à 90 % de prise en charge pour une rénovation globale performante. Isolation, chauffage, ventilation, fenêtres : découvrez les solutions adaptées à votre habitat.
            </p>
            <div className="rounded-2xl overflow-hidden mb-6">
              <img src={renovationImg} alt="Ouvriers réalisant l'isolation thermique par l'extérieur d'une maison" width={1280} height={720} className="w-full h-auto object-cover" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { value: "40-75 %", label: "Réduction de conso possible" },
                { value: "90 %", label: "Prise en charge max (aides)" },
                { value: "5-25 %", label: "Plus-value immobilière" },
                { value: "8-15 ans", label: "Retour sur investissement" },
              ].map((stat, i) => (
                <div key={i} className="text-center p-4 rounded-xl bg-violet-50 border border-violet-100">
                  <div className="text-2xl font-bold text-violet-600">{stat.value}</div>
                  <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Postes de travaux */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-6">Les principaux postes de travaux</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { icon: Paintbrush, title: "Isolation thermique", desc: "Combles perdus ou aménagés, murs par l'intérieur (ITI) ou l'extérieur (ITE), plancher bas. L'isolation est LE geste prioritaire : elle réduit les déperditions de 50 à 60 % à elle seule." },
                { icon: Flame, title: "Chauffage performant", desc: "Pompe à chaleur air-eau (COP 3-5), chaudière biomasse (bûches, granulés), poêle à granulés. Remplacez votre ancien système fioul ou gaz pour diviser votre facture par 2 à 3." },
                { icon: Wind, title: "Ventilation contrôlée", desc: "VMC simple flux hygroréglable ou double flux (récupère 70-90% de la chaleur de l'air vicié). Indispensable après isolation pour garantir la qualité de l'air et éviter l'humidité." },
                { icon: DoorOpen, title: "Menuiseries performantes", desc: "Fenêtres double vitrage (Uw ≤ 1,3) ou triple vitrage, portes isolantes. Réduction des déperditions par les ouvrants de 10 à 15 % et amélioration du confort acoustique." },
                { icon: Droplets, title: "Eau chaude sanitaire", desc: "Chauffe-eau thermodynamique (COP 2,5-3,5), chauffe-eau solaire individuel (CESI). Divisez par 2 à 3 le coût de votre production d'eau chaude." },
                { icon: Home, title: "Étanchéité à l'air", desc: "Traitement des ponts thermiques, joints, passages de gaines. Un logement étanche réduit les infiltrations d'air froid et améliore l'efficacité de l'isolation." },
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

          {/* Ordre des travaux */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-4">Dans quel ordre réaliser les travaux ?</h2>
            <p className="text-muted-foreground mb-6">L'ordre des travaux est crucial pour maximiser les performances et éviter les erreurs. Voici la séquence recommandée par l'ADEME et les professionnels :</p>
            <ol className="space-y-5">
              {[
                { step: "1. Isolation de la toiture / combles", desc: "La toiture représente 25 à 30 % des déperditions. C'est le geste le plus efficace et souvent le moins coûteux (isolation des combles perdus dès 20 €/m²). À réaliser en premier.", priority: "Priorité absolue" },
                { step: "2. Isolation des murs", desc: "Les murs représentent 20 à 25 % des pertes. L'ITE (Isolation Thermique par l'Extérieur) est plus performante mais plus coûteuse que l'ITI (par l'intérieur). L'ITE supprime les ponts thermiques.", priority: "Priorité haute" },
                { step: "3. Remplacement des fenêtres", desc: "Les fenêtres comptent pour 10 à 15 % des déperditions. Le double vitrage moderne (Uw ≤ 1,3) divise par 2 les pertes par les ouvrants. À faire après l'isolation des murs pour une bonne intégration.", priority: "Priorité moyenne" },
                { step: "4. Ventilation (VMC)", desc: "Après avoir rendu le logement étanche, la ventilation mécanique est indispensable. La VMC double flux récupère 70-90 % de la chaleur de l'air extrait.", priority: "Essentiel après isolation" },
                { step: "5. Remplacement du chauffage", desc: "En dernier, car l'isolation réduit les besoins de chauffage de 40 à 60 %. Le nouveau système (PAC, biomasse) sera dimensionné au juste besoin, évitant le surdimensionnement.", priority: "En dernier" },
                { step: "6. Production d'énergie renouvelable", desc: "Panneaux solaires, chauffe-eau solaire : une fois le logement performant, la production d'énergie renouvelable devient très rentable car les besoins sont réduits.", priority: "Optionnel" },
              ].map((item, i) => (
                <li key={i} className="flex gap-4 items-start">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-violet-500 text-white flex items-center justify-center font-bold text-sm">{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground">{item.step}</h3>
                      <span className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full">{item.priority}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {/* Aides financières détaillées */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-4">Les aides financières en 2026</h2>
            <p className="text-muted-foreground mb-6">Le système d'aides français est l'un des plus généreux d'Europe. Voici le détail des dispositifs accessibles :</p>
            <div className="overflow-x-auto mb-6">
              <table className="w-full text-sm border border-border rounded-lg overflow-hidden">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-3 font-semibold text-foreground">Aide</th>
                    <th className="text-left p-3 font-semibold text-foreground">Montant / taux</th>
                    <th className="text-left p-3 font-semibold text-foreground">Conditions principales</th>
                    <th className="text-left p-3 font-semibold text-foreground">Cumulable</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["MaPrimeRénov' (par geste)", "Jusqu'à 10 000 € par type de travaux", "Logement > 15 ans, artisan RGE", "✅ Avec CEE, éco-PTZ"],
                    ["MaPrimeRénov' Parcours accompagné", "30 à 90 % du coût total", "Gain ≥ 2 classes DPE, accompagnateur", "✅ Avec CEE, éco-PTZ"],
                    ["CEE (Certificats d'Économie d'Énergie)", "500 à 5 000 € selon travaux", "Travaux éligibles, tous revenus", "✅ Avec MaPrimeRénov'"],
                    ["Éco-PTZ (prêt à taux zéro)", "Jusqu'à 50 000 € sur 20 ans", "Sans conditions de revenus", "✅ Avec tout"],
                    ["TVA réduite à 5,5 %", "Automatique sur la facture", "Logement > 2 ans", "✅ Avec tout"],
                    ["Aides locales", "Variables selon collectivité", "Se renseigner en mairie/région", "✅ Souvent cumulables"],
                    ["Chèque énergie", "48 à 277 €/an", "Sous conditions de revenus", "✅ Avec tout"],
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
            <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 flex gap-3">
              <Lightbulb className="w-5 h-5 text-violet-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground"><strong className="text-foreground">Exemple concret :</strong> Un ménage aux revenus modestes réalisant une rénovation globale à 40 000 € (isolation + PAC + VMC) avec un gain de 3 classes DPE peut obtenir : MaPrimeRénov' Parcours accompagné (60 % = 24 000 €) + CEE (4 000 €) = reste à charge de 12 000 € financé par éco-PTZ à 0 %.</p>
            </div>
          </section>

          {/* Coûts moyens par type de travaux */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-4">Coûts moyens des travaux de rénovation</h2>
            <div className="overflow-x-auto mb-4">
              <table className="w-full text-sm border border-border rounded-lg overflow-hidden">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-3 font-semibold text-foreground">Type de travaux</th>
                    <th className="text-left p-3 font-semibold text-foreground">Prix moyen</th>
                    <th className="text-left p-3 font-semibold text-foreground">Gain énergétique</th>
                    <th className="text-left p-3 font-semibold text-foreground">Durée des travaux</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Isolation combles perdus", "20 – 50 €/m²", "25 – 30 % des déperditions", "1 – 2 jours"],
                    ["Isolation combles aménagés", "40 – 80 €/m²", "25 – 30 % des déperditions", "3 – 5 jours"],
                    ["ITE (isolation extérieure murs)", "100 – 200 €/m²", "20 – 25 % des déperditions", "2 – 4 semaines"],
                    ["ITI (isolation intérieure murs)", "40 – 80 €/m²", "20 – 25 % des déperditions", "1 – 2 semaines"],
                    ["Fenêtres double vitrage", "400 – 800 €/fenêtre", "10 – 15 % des déperditions", "1 jour / 5 fenêtres"],
                    ["VMC double flux", "3 000 – 6 000 €", "Qualité d'air + 15 % économies", "2 – 3 jours"],
                    ["PAC air-eau", "8 000 – 15 000 €", "60 – 70 % sur le chauffage", "2 – 4 jours"],
                    ["Chauffe-eau thermodynamique", "2 500 – 4 000 €", "50 – 70 % sur l'ECS", "1 jour"],
                    ["Poêle à granulés", "3 000 – 6 000 €", "Chauffage d'appoint performant", "1 – 2 jours"],
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
            <p className="text-xs text-muted-foreground italic">Prix TTC indicatifs, pose comprise, pour une maison individuelle de 100 m² en France métropolitaine. Les prix varient selon la région et la complexité du chantier.</p>
          </section>

          {/* Valorisation immobilière */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-4">Impact sur la valeur de votre bien</h2>
            <p className="text-muted-foreground mb-6">La rénovation énergétique a un impact direct sur la valeur immobilière de votre logement. Voici les données des Notaires de France :</p>
            <div className="overflow-x-auto mb-4">
              <table className="w-full text-sm border border-border rounded-lg overflow-hidden">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-3 font-semibold text-foreground">Transition DPE</th>
                    <th className="text-left p-3 font-semibold text-foreground">Plus-value estimée</th>
                    <th className="text-left p-3 font-semibold text-foreground">Exemple (bien à 250 000 €)</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["G → D", "+15 à 25 %", "+37 500 à 62 500 €"],
                    ["F → C", "+20 à 30 %", "+50 000 à 75 000 €"],
                    ["E → B", "+10 à 20 %", "+25 000 à 50 000 €"],
                    ["D → B", "+5 à 15 %", "+12 500 à 37 500 €"],
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
            <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 flex gap-3">
              <BarChart3 className="w-5 h-5 text-violet-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground"><strong className="text-foreground">Bon à savoir :</strong> À l'inverse, une « passoire thermique » (F ou G) subit une décote de 5 à 20 % sur le marché. Avec l'interdiction progressive de location, la rénovation n'est plus une option mais une nécessité pour les propriétaires bailleurs.</p>
            </div>
          </section>

          {/* CTA */}
          <section className="mb-12 bg-gradient-to-br from-violet-50 to-primary/5 border border-violet-200 rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-bold text-foreground mb-3">Lancez votre projet de rénovation</h2>
            <p className="text-muted-foreground mb-6 max-w-xl mx-auto">Découvrez les aides auxquelles vous avez droit et trouvez des professionnels certifiés RGE près de chez vous.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild size="lg" className="gap-2">
                <Link to="/landing/renovation-globale">Rénovation globale <ArrowRight className="w-4 h-4" /></Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/aides">Consulter toutes les aides</Link>
              </Button>
            </div>
          </section>

          {/* Articles liés */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-6">Pour aller plus loin</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { title: "Audit énergétique", desc: "Le diagnostic indispensable avant vos travaux", link: "/services/audit-energetique", icon: "📋" },
                { title: "Pompes à chaleur", desc: "Le chauffage le plus efficient après isolation", link: "/services/pompes-a-chaleur", icon: "🌡️" },
                { title: "Installation solaire", desc: "Produisez votre électricité après rénovation", link: "/services/installation-solaire", icon: "☀️" },
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

export default ServiceAmeliorationHabitat;
