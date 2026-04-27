import { Helmet } from "react-helmet";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Link } from "react-router-dom";
import { Sun, CheckCircle, ArrowRight, Zap, TrendingUp, Shield, HelpCircle, BarChart3, Clock, MapPin, Wrench, FileText, AlertTriangle, ThumbsUp, Lightbulb, Euro } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import solarRoofImg from "@/assets/services/solar-roof-aerial.jpg";
import solarWorkerImg from "@/assets/services/solar-installation-worker.jpg";
import solarMonitoringImg from "@/assets/services/solar-monitoring.jpg";
import solarOnduleurImg from "@/assets/services/solar-onduleur.jpg";

const faqs = [
  { q: "Combien coûte une installation solaire en 2026 ?", a: "Le prix d'une installation solaire photovoltaïque varie entre 7 500 € et 18 000 € pour une puissance de 3 à 9 kWc, pose incluse. Les aides comme la prime à l'autoconsommation et l'obligation d'achat peuvent réduire significativement le coût net." },
  { q: "Quelle est la durée de vie des panneaux solaires ?", a: "Les panneaux solaires modernes ont une durée de vie de 30 à 40 ans. La plupart des fabricants garantissent au moins 80 % de rendement après 25 ans d'utilisation." },
  { q: "Puis-je revendre mon surplus d'électricité ?", a: "Oui. Grâce au mécanisme d'obligation d'achat (OA Solaire), vous pouvez revendre le surplus de votre production à EDF OA à un tarif fixé par l'État pendant 20 ans." },
  { q: "Faut-il un permis de construire pour installer des panneaux solaires ?", a: "En général, une simple déclaration préalable de travaux suffit. Un permis de construire n'est nécessaire que dans certains cas (bâtiment classé, zone protégée, installation au sol de plus de 1,80 m de hauteur)." },
  { q: "Comment savoir si ma toiture est adaptée au solaire ?", a: "Une toiture orientée sud, sud-est ou sud-ouest avec une inclinaison de 25° à 35° est idéale. Notre simulateur gratuit vous permet d'estimer le potentiel solaire de votre habitation en quelques clics." },
  { q: "Quelle est la différence entre autoconsommation et revente totale ?", a: "En autoconsommation, vous consommez directement l'électricité produite et revendez le surplus. En revente totale, toute la production est injectée sur le réseau. L'autoconsommation avec revente du surplus est le modèle le plus répandu et souvent le plus avantageux pour les particuliers." },
  { q: "Les panneaux solaires fonctionnent-ils par temps nuageux ?", a: "Oui, les panneaux photovoltaïques produisent de l'électricité même par temps couvert, mais à un rendement réduit (10 à 25 % de la capacité nominale). La lumière diffuse est suffisante pour assurer une production, même si elle est moindre qu'en plein soleil." },
  { q: "Quel entretien nécessitent les panneaux solaires ?", a: "Les panneaux solaires nécessitent très peu d'entretien : un nettoyage à l'eau claire 1 à 2 fois par an suffit. L'onduleur peut nécessiter un remplacement après 10 à 15 ans (coût : 1 000 à 2 000 €). Un contrôle visuel annuel est recommandé." },
];

const ServiceInstallationSolaire = () => {
  const breadcrumbItems = [
    { name: "Accueil", url: "/" },
    { name: "Services", url: "/" },
    { name: "Installation solaire", url: "/services/installation-solaire" },
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

  const howToJsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "Comment installer des panneaux solaires chez soi",
    description: "Guide étape par étape pour réussir votre projet d'installation solaire photovoltaïque.",
    step: [
      { "@type": "HowToStep", name: "Étude de faisabilité", text: "Analyse de l'orientation, inclinaison et surface de votre toiture." },
      { "@type": "HowToStep", name: "Dimensionnement et devis", text: "Un installateur RGE propose une puissance adaptée à votre consommation." },
      { "@type": "HowToStep", name: "Démarches administratives", text: "Déclaration préalable, demande de raccordement Enedis et contrat EDF OA." },
      { "@type": "HowToStep", name: "Installation et mise en service", text: "Pose des panneaux, raccordement électrique et validation Consuel." },
      { "@type": "HowToStep", name: "Suivi et optimisation", text: "Monitoring de production et optimisation de l'autoconsommation." },
    ],
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Installation Solaire Photovoltaïque : Guide Complet 2026 | Prime Énergies</title>
        <meta name="description" content="Tout savoir sur l'installation de panneaux solaires : prix 2026, aides financières, rentabilité, étapes d'installation, choix de l'installateur RGE. Guide complet avec simulateur gratuit." />
        <link rel="canonical" href="https://prime-energies.fr/services/installation-solaire" />
        <meta property="og:title" content="Installation Solaire Photovoltaïque | Prime Énergies" />
        <meta property="og:description" content="Prix, aides, rentabilité : tout ce qu'il faut savoir avant d'installer des panneaux solaires chez vous en 2026." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://prime-energies.fr/services/installation-solaire" />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
        <script type="application/ld+json">{JSON.stringify(faqJsonLd)}</script>
        <script type="application/ld+json">{JSON.stringify(howToJsonLd)}</script>
      </Helmet>
      <Header />
      <main className="pt-20">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Breadcrumb items={breadcrumbItems} />

          {/* Hero Section */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-amber-100 text-amber-600">
                <Sun className="w-8 h-8" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">Installation de panneaux solaires photovoltaïques</h1>
            </div>
            <p className="text-lg text-muted-foreground leading-relaxed mb-6">
              L'énergie solaire est aujourd'hui la solution la plus accessible et rentable pour produire votre propre électricité. En France, le nombre d'installations photovoltaïques résidentielles a augmenté de plus de 30 % entre 2024 et 2025. Avec un amortissement moyen de 6 à 10 ans et une durée de vie de 30 ans, le solaire représente un investissement sûr et durable.
            </p>
            <div className="rounded-2xl overflow-hidden mb-6">
              <img 
                src={solarRoofImg} 
                alt="Maison française avec panneaux solaires photovoltaïques installés sur le toit" 
                width={1280} 
                height={720} 
                className="w-full h-auto object-cover"
              />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { value: "30 ans", label: "Durée de vie moyenne" },
                { value: "6-10 ans", label: "Retour sur investissement" },
                { value: "70 %", label: "Économies sur la facture" },
                { value: "20 ans", label: "Contrat de rachat garanti" },
              ].map((stat, i) => (
                <div key={i} className="text-center p-4 rounded-xl bg-amber-50 border border-amber-100">
                  <div className="text-2xl font-bold text-amber-600">{stat.value}</div>
                  <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Pourquoi le solaire */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-6">Pourquoi passer au solaire en 2026 ?</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { icon: TrendingUp, title: "Rentabilité prouvée", desc: "Amortissement en 6 à 10 ans selon la région, avec des économies pouvant atteindre 70 % sur votre facture d'électricité. Le prix de l'électricité ayant augmenté de plus de 50 % depuis 2021, le solaire est devenu encore plus compétitif." },
                { icon: Shield, title: "Aides financières généreuses", desc: "Prime à l'autoconsommation (jusqu'à 370 €/kWc), TVA réduite à 10 %, obligation d'achat à tarif garanti pendant 20 ans : l'État soutient activement le solaire résidentiel." },
                { icon: Zap, title: "Autonomie énergétique", desc: "Produisez et consommez votre propre électricité. Avec une batterie de stockage, votre taux d'autoconsommation peut passer de 30 % à plus de 70 %." },
                { icon: CheckCircle, title: "Impact écologique positif", desc: "Un panneau solaire rembourse son empreinte carbone en 2 à 3 ans et produit de l'énergie propre pendant 30+ ans. C'est l'une des énergies les plus vertes disponibles." },
                { icon: Euro, title: "Valorisation immobilière", desc: "Un logement équipé de panneaux solaires gagne en moyenne 3 à 5 % de valeur sur le marché immobilier. Le DPE (Diagnostic de Performance Énergétique) s'améliore significativement." },
                { icon: BarChart3, title: "Prix en baisse constante", desc: "Le coût des panneaux solaires a chuté de 90 % en 15 ans. En 2026, une installation de 3 kWc coûte environ 7 500 € avant aides, contre plus de 25 000 € en 2010." },
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

          {/* Comment ça marche - explication technique */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-4">Comment fonctionne une installation solaire ?</h2>
            <p className="text-muted-foreground mb-6">
              Une installation solaire photovoltaïque convertit la lumière du soleil en électricité grâce à l'effet photovoltaïque. Voici les composants essentiels d'une installation résidentielle :
            </p>
            <div className="space-y-4 mb-6">
              {[
                { title: "Les panneaux photovoltaïques", desc: "Composés de cellules en silicium (monocristallin ou polycristallin), ils captent les photons de la lumière solaire et les convertissent en courant continu. Les panneaux monocristallins, plus performants (rendement de 20 à 22 %), sont les plus utilisés en 2026." },
                { title: "L'onduleur (ou micro-onduleurs)", desc: "Il transforme le courant continu produit par les panneaux en courant alternatif 230V compatible avec votre réseau domestique. Un onduleur central dure 10 à 15 ans ; les micro-onduleurs (un par panneau) offrent plus de flexibilité et une durée de vie de 20 à 25 ans." },
                { title: "Le compteur de production", desc: "Il mesure la quantité d'électricité que vous produisez. C'est sur cette base que sont calculés vos revenus de revente du surplus à EDF OA." },
                { title: "Le coffret de protection", desc: "Il inclut les dispositifs de sécurité électrique (disjoncteurs, parafoudre) pour protéger votre installation et votre logement." },
                { title: "Le système de monitoring", desc: "Une application connectée vous permet de suivre en temps réel votre production, votre consommation et vos économies. Certains systèmes optimisent automatiquement l'autoconsommation." },
              ].map((item, i) => (
                <div key={i} className="flex gap-4 p-4 rounded-xl bg-muted/30 border border-border/30">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-sm">{i + 1}</span>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="rounded-2xl overflow-hidden">
              <img 
                src={solarMonitoringImg} 
                alt="Application de monitoring de production solaire sur tablette" 
                width={1280} 
                height={720} 
                loading="lazy"
                className="w-full h-auto object-cover"
              />
            </div>
          </section>

          {/* Tableau des prix */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-4">Prix d'une installation solaire en 2026</h2>
            <p className="text-muted-foreground mb-6">
              Les prix varient selon la puissance installée, le type de panneaux, la complexité de la toiture et votre région. Voici les fourchettes indicatives pour une installation sur toiture avec panneaux monocristallins et onduleur de qualité :
            </p>
            <div className="overflow-x-auto mb-6">
              <table className="w-full text-sm border border-border rounded-lg overflow-hidden">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-3 font-semibold text-foreground">Puissance</th>
                    <th className="text-left p-3 font-semibold text-foreground">Nb de panneaux</th>
                    <th className="text-left p-3 font-semibold text-foreground">Surface toiture</th>
                    <th className="text-left p-3 font-semibold text-foreground">Prix TTC (pose incluse)</th>
                    <th className="text-left p-3 font-semibold text-foreground">Production annuelle*</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["3 kWc", "6 à 8", "~16 m²", "7 500 – 9 500 €", "3 000 – 4 200 kWh"],
                    ["6 kWc", "12 à 16", "~30 m²", "12 000 – 15 000 €", "6 000 – 8 400 kWh"],
                    ["9 kWc", "18 à 24", "~45 m²", "16 000 – 20 000 €", "9 000 – 12 600 kWh"],
                    ["12 kWc", "24 à 32", "~60 m²", "20 000 – 26 000 €", "12 000 – 16 800 kWh"],
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
            <p className="text-xs text-muted-foreground italic">* Production annuelle estimée pour une orientation sud, inclinaison 30°, en zone d'ensoleillement moyen (centre de la France). La production peut varier de +20 % (sud de la France, DOM-TOM) à -15 % (nord).</p>
          </section>

          {/* Les aides financières */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-4">Les aides financières pour le solaire en 2026</h2>
            <p className="text-muted-foreground mb-6">
              Le photovoltaïque bénéficie de plusieurs mécanismes de soutien qui réduisent significativement le coût de votre installation. Attention : contrairement à d'autres travaux de rénovation, les panneaux solaires photovoltaïques ne sont pas éligibles à MaPrimeRénov'.
            </p>
            <div className="overflow-x-auto mb-6">
              <table className="w-full text-sm border border-border rounded-lg overflow-hidden">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-3 font-semibold text-foreground">Aide</th>
                    <th className="text-left p-3 font-semibold text-foreground">Montant indicatif</th>
                    <th className="text-left p-3 font-semibold text-foreground">Conditions</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Prime à l'autoconsommation", "Jusqu'à 370 €/kWc (≤3 kWc)", "Installation ≤ 100 kWc, autoconsommation avec revente surplus"],
                    ["Obligation d'achat (OA)", "Tarif fixé 20 ans (~0,13 €/kWh)", "Contrat avec EDF OA, installation raccordée"],
                    ["TVA réduite à 10 %", "Réduction automatique", "Installation ≤ 3 kWc, raccordée au réseau"],
                    ["Exonération d'impôts", "Revenus < 3 kWc non imposables", "Installation ≤ 3 kWc, résidence principale"],
                    ["Aides régionales", "Variable selon la région", "Se renseigner auprès de sa collectivité"],
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
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-foreground text-sm">Bon à savoir</p>
                <p className="text-sm text-muted-foreground">Les panneaux solaires photovoltaïques ne sont <strong>pas éligibles à MaPrimeRénov'</strong>. Cette aide concerne uniquement les systèmes solaires thermiques (chauffe-eau solaire, système solaire combiné). Méfiez-vous des offres qui prétendent le contraire.</p>
              </div>
            </div>
          </section>

          {/* Étapes d'installation */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-6">Les étapes d'une installation solaire réussie</h2>
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <ol className="space-y-5">
                  {[
                    { step: "Étude de faisabilité", desc: "Analyse de l'orientation (idéalement sud), inclinaison (25°-35°), surface disponible, ombrage et état de votre toiture. Un bon ensoleillement est clé pour maximiser la production.", icon: MapPin },
                    { step: "Dimensionnement et devis", desc: "Un installateur RGE dimensionne l'installation selon votre consommation annuelle. Pour un foyer moyen (4 500 kWh/an), une installation de 3 à 6 kWc est recommandée. Demandez au moins 3 devis.", icon: FileText },
                    { step: "Démarches administratives", desc: "Déclaration préalable de travaux en mairie (délai : 1 mois), demande de raccordement Enedis (CACSI), contrat de vente du surplus EDF OA. Votre installateur vous accompagne généralement dans ces démarches.", icon: FileText },
                    { step: "Installation et mise en service", desc: "La pose dure en moyenne 1 à 2 jours. Étapes : fixation des rails sur la toiture, pose des panneaux, câblage, installation de l'onduleur, raccordement au tableau électrique.", icon: Wrench },
                    { step: "Validation Consuel", desc: "Le Consuel (Comité National pour la Sécurité des Usagers de l'Électricité) valide la conformité de votre installation. Cette étape est obligatoire avant la mise en service.", icon: CheckCircle },
                    { step: "Suivi et optimisation", desc: "Grâce aux applications de monitoring, suivez votre production en temps réel. Optimisez votre autoconsommation en programmant vos appareils (lave-linge, chauffe-eau) aux heures de forte production.", icon: BarChart3 },
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
              </div>
              <div className="flex flex-col justify-center">
                <div className="rounded-2xl overflow-hidden sticky top-24">
                  <img 
                    src={solarWorkerImg} 
                    alt="Technicien installateur de panneaux solaires sur un toit" 
                    width={1280} 
                    height={720} 
                    loading="lazy"
                    className="w-full h-auto object-cover"
                  />
                  <div className="bg-muted/80 p-4">
                    <p className="text-sm text-foreground font-medium">👷 Faites appel à un installateur certifié RGE</p>
                    <p className="text-xs text-muted-foreground mt-1">La certification RGE (Reconnu Garant de l'Environnement) est obligatoire pour bénéficier des aides publiques. Vérifiez la qualification sur france-renov.gouv.fr.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Types de panneaux */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-4">Quel type de panneau solaire choisir ?</h2>
            <p className="text-muted-foreground mb-6">
              Le choix du type de panneau influence le rendement, l'esthétique et le prix de votre installation. Voici un comparatif détaillé des technologies disponibles en 2026 :
            </p>
            <div className="overflow-x-auto mb-6">
              <table className="w-full text-sm border border-border rounded-lg overflow-hidden">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-3 font-semibold text-foreground">Technologie</th>
                    <th className="text-left p-3 font-semibold text-foreground">Rendement</th>
                    <th className="text-left p-3 font-semibold text-foreground">Avantages</th>
                    <th className="text-left p-3 font-semibold text-foreground">Inconvénients</th>
                    <th className="text-left p-3 font-semibold text-foreground">Prix indicatif</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Monocristallin", "20 – 22 %", "Meilleur rendement, compact", "Prix légèrement supérieur", "250 – 400 €/panneau"],
                    ["Polycristallin", "15 – 18 %", "Prix attractif", "Rendement inférieur, plus encombrant", "200 – 300 €/panneau"],
                    ["Back-contact (IBC)", "22 – 24 %", "Rendement maximal, esthétique", "Prix élevé", "400 – 600 €/panneau"],
                    ["Bi-facial", "20 – 25 %", "Capte lumière recto/verso", "Nécessite surface réfléchissante", "300 – 500 €/panneau"],
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
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex gap-3">
              <Lightbulb className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground"><strong className="text-foreground">Notre conseil :</strong> En 2026, les panneaux monocristallins offrent le meilleur rapport qualité/prix pour la majorité des installations résidentielles. Privilégiez les marques offrant une garantie produit de 25 ans minimum et une garantie de performance linéaire.</p>
            </div>
            <div className="rounded-2xl overflow-hidden mt-6">
              <img src={solarOnduleurImg} alt="Onduleur photovoltaïque mural moderne installé dans un garage avec affichage de la production en kWh" width={1280} height={720} loading="lazy" className="w-full h-auto object-cover" />
            </div>
          </section>

          {/* Autoconsommation vs revente */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-4">Autoconsommation ou revente totale ?</h2>
            <p className="text-muted-foreground mb-6">
              Le choix du mode de valorisation de votre production solaire a un impact direct sur la rentabilité de votre installation. Voici un comparatif des deux options :
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-amber-200 bg-amber-50/30">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <ThumbsUp className="w-5 h-5 text-amber-600" />
                    <h3 className="text-lg font-bold text-foreground">Autoconsommation + surplus</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">Vous consommez directement l'électricité produite et revendez le surplus à EDF OA.</p>
                  <ul className="space-y-2">
                    {[
                      "Prime à l'autoconsommation (jusqu'à 370 €/kWc)",
                      "Économies immédiates sur la facture",
                      "Revente du surplus à ~0,13 €/kWh garanti 20 ans",
                      "Possibilité d'ajouter une batterie de stockage",
                      "Le modèle le plus rentable pour les particuliers",
                    ].map((item, i) => (
                      <li key={i} className="flex gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Zap className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-bold text-foreground">Revente totale</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">Toute l'électricité produite est injectée sur le réseau et vendue à EDF OA.</p>
                  <ul className="space-y-2">
                    {[
                      "Tarif de rachat garanti pendant 20 ans",
                      "Revenus réguliers et prévisibles",
                      "Adapté si faible consommation diurne",
                      "Pas de prime à l'autoconsommation",
                      "Moins rentable avec la hausse du prix de l'électricité",
                    ].map((item, i) => (
                      <li key={i} className="flex gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Rentabilité par région */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-4">Rentabilité par zone géographique</h2>
            <p className="text-muted-foreground mb-6">
              L'ensoleillement varie fortement selon les régions françaises, ce qui impacte directement la production et la rentabilité de votre installation. Voici les données moyennes pour une installation de 6 kWc orientée plein sud :
            </p>
            <div className="overflow-x-auto mb-4">
              <table className="w-full text-sm border border-border rounded-lg overflow-hidden">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-3 font-semibold text-foreground">Zone</th>
                    <th className="text-left p-3 font-semibold text-foreground">Ensoleillement</th>
                    <th className="text-left p-3 font-semibold text-foreground">Production 6 kWc</th>
                    <th className="text-left p-3 font-semibold text-foreground">Économie annuelle*</th>
                    <th className="text-left p-3 font-semibold text-foreground">Amortissement</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Sud (PACA, Occitanie)", "2 600 – 2 900 h/an", "8 000 – 9 000 kWh", "1 800 – 2 200 €", "6 – 7 ans"],
                    ["Sud-Ouest / Sud-Est", "2 200 – 2 600 h/an", "7 000 – 8 000 kWh", "1 500 – 1 800 €", "7 – 8 ans"],
                    ["Centre / Ouest", "1 800 – 2 200 h/an", "6 000 – 7 000 kWh", "1 200 – 1 500 €", "8 – 10 ans"],
                    ["Nord / Nord-Est", "1 500 – 1 800 h/an", "5 000 – 6 000 kWh", "1 000 – 1 200 €", "9 – 12 ans"],
                    ["DOM-TOM (Réunion, Antilles)", "2 800 – 3 200 h/an", "8 500 – 10 000 kWh", "2 000 – 2 800 €", "5 – 7 ans"],
                    ["Corse", "2 700 – 2 900 h/an", "8 000 – 9 000 kWh", "1 800 – 2 200 €", "6 – 7 ans"],
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
            <p className="text-xs text-muted-foreground italic">* Économie calculée sur la base d'un taux d'autoconsommation de 40 % et du tarif réglementé de vente au T1 2026.</p>
          </section>

          {/* Choisir son installateur */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-4">Comment bien choisir son installateur ?</h2>
            <p className="text-muted-foreground mb-6">
              Le choix de l'installateur est déterminant pour la qualité et la durabilité de votre installation. Voici les critères essentiels à vérifier :
            </p>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { icon: Shield, title: "Certification RGE", desc: "Obligatoire pour les aides. Vérifiez la qualification QualiPV (module Élec) sur france-renov.gouv.fr. Demandez le numéro de certification." },
                { icon: Clock, title: "Expérience & références", desc: "Privilégiez un installateur avec au moins 3 ans d'expérience et des références vérifiables. Demandez des photos de chantiers réalisés." },
                { icon: FileText, title: "Garanties solides", desc: "Vérifiez les garanties : décennale (obligatoire), garantie matériel (25 ans panneaux, 10-25 ans onduleur), garantie de performance." },
                { icon: Euro, title: "Devis détaillé", desc: "Un bon devis inclut : marque/modèle des panneaux, type d'onduleur, plan de calepinage, estimation de production, et détail des aides déduites." },
                { icon: Wrench, title: "SAV réactif", desc: "Renseignez-vous sur le service après-vente : délai d'intervention, monitoring à distance, entretien proposé. Un bon SAV est gage de tranquillité." },
                { icon: AlertTriangle, title: "Méfiez-vous des arnaques", desc: "Refusez les offres « panneaux solaires à 1 € », les démarchages agressifs et les entreprises qui ne laissent pas le temps de la réflexion." },
              ].map((item, i) => (
                <Card key={i} className="border-border/50">
                  <CardContent className="p-4">
                    <div className="p-2 rounded-lg bg-amber-50 text-amber-600 w-fit mb-3"><item.icon className="w-5 h-5" /></div>
                    <h3 className="font-semibold text-foreground mb-1 text-sm">{item.title}</h3>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Entretien */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-4">Entretien et maintenance de votre installation</h2>
            <p className="text-muted-foreground mb-6">
              Les panneaux solaires nécessitent peu d'entretien, mais quelques gestes simples permettent de maintenir un rendement optimal sur la durée :
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { title: "Nettoyage des panneaux", desc: "Un nettoyage à l'eau claire (sans produit chimique) 1 à 2 fois par an suffit. La pluie assure un nettoyage naturel dans la plupart des régions. Évitez l'eau calcaire et les jets haute pression.", freq: "1-2 fois/an" },
                { title: "Contrôle visuel", desc: "Vérifiez l'absence de débris (feuilles, nids d'oiseaux), de micro-fissures ou de décoloration des cellules. Contrôlez le bon état des câbles et connecteurs.", freq: "2 fois/an" },
                { title: "Suivi de production", desc: "Consultez régulièrement votre application de monitoring pour détecter toute baisse anormale de production, signe potentiel d'un dysfonctionnement.", freq: "Mensuel" },
                { title: "Remplacement de l'onduleur", desc: "L'onduleur central a une durée de vie de 10 à 15 ans. Prévoyez un budget de 1 000 à 2 000 € pour son remplacement. Les micro-onduleurs durent 20 à 25 ans.", freq: "Tous les 10-15 ans" },
              ].map((item, i) => (
                <Card key={i} className="border-border/50">
                  <CardContent className="p-5">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-foreground">{item.title}</h3>
                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full whitespace-nowrap">{item.freq}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* CTA Principal */}
          <section className="mb-12 bg-gradient-to-br from-amber-50 to-primary/5 border border-amber-200 rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-bold text-foreground mb-3">Prêt à passer au solaire ?</h2>
            <p className="text-muted-foreground mb-6 max-w-xl mx-auto">Estimez vos économies et découvrez les aides disponibles dans votre région. Notre simulateur gratuit vous donne une estimation personnalisée en moins de 2 minutes.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild size="lg" className="gap-2">
                <Link to="/landing/solaire">Découvrir notre offre solaire <ArrowRight className="w-4 h-4" /></Link>
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
                { title: "Stockage d'énergie", desc: "Maximisez votre autoconsommation avec une batterie domestique", link: "/services/stockage-energie", icon: "🔋" },
                { title: "Audit énergétique", desc: "Évaluez la performance de votre logement avant vos travaux", link: "/services/audit-energetique", icon: "📋" },
                { title: "Pompes à chaleur", desc: "Combinez solaire et PAC pour une maison 100 % éco-responsable", link: "/services/pompes-a-chaleur", icon: "🌡️" },
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

export default ServiceInstallationSolaire;
