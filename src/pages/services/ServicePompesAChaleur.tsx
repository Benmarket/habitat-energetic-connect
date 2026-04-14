import { Helmet } from "react-helmet";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Link } from "react-router-dom";
import { Thermometer, CheckCircle, ArrowRight, Droplets, Leaf, Euro, HelpCircle, Shield, Wrench, AlertTriangle, Lightbulb, BarChart3, Snowflake, Flame, Clock, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import pacExtImg from "@/assets/services/pac-exterieur.jpg";
import pacIntImg from "@/assets/services/pac-interieur-confort.jpg";
import pacTechImg from "@/assets/services/pac-installation-technicien.jpg";

const faqs = [
  { q: "Quelle pompe à chaleur choisir : air-air, air-eau ou géothermique ?", a: "La PAC air-eau est la plus polyvalente : elle assure chauffage et eau chaude sanitaire. La PAC air-air est idéale pour le rafraîchissement. La géothermie offre les meilleures performances mais nécessite un investissement plus élevé et un terrain adapté." },
  { q: "Quel est le prix d'une pompe à chaleur en 2026 ?", a: "Comptez entre 8 000 € et 15 000 € pour une PAC air-eau (pose comprise). Une PAC géothermique coûte entre 15 000 € et 25 000 €. Les aides (MaPrimeRénov', CEE) peuvent couvrir jusqu'à 50 % du montant." },
  { q: "La pompe à chaleur fonctionne-t-elle par grand froid ?", a: "Les PAC modernes fonctionnent jusqu'à -15°C voire -25°C pour les modèles haute performance. Leur COP diminue avec le froid, mais elles restent efficaces dans la grande majorité des régions françaises." },
  { q: "Quelles aides pour installer une pompe à chaleur ?", a: "MaPrimeRénov' (jusqu'à 5 000 €), les Certificats d'Économie d'Énergie (CEE), la TVA à 5,5 % et l'éco-prêt à taux zéro sont les principales aides disponibles. Leur montant dépend de vos revenus et de la nature du projet." },
  { q: "Quelle est la durée de vie d'une pompe à chaleur ?", a: "Une pompe à chaleur bien entretenue a une durée de vie de 15 à 20 ans. Un entretien annuel obligatoire par un professionnel certifié est nécessaire pour les PAC contenant plus de 2 kg de fluide frigorigène." },
  { q: "La PAC air-air est-elle éligible aux aides ?", a: "Non, la PAC air-air (climatisation réversible) n'est pas éligible à MaPrimeRénov'. Seules les PAC air-eau et géothermiques bénéficient de cette aide. Les CEE peuvent toutefois s'appliquer dans certains cas." },
  { q: "Une PAC est-elle bruyante ?", a: "Le niveau sonore de l'unité extérieure varie de 45 à 65 dB(A) selon les modèles. Les PAC récentes intègrent des technologies de réduction du bruit (mode silencieux nocturne à 40 dB). La réglementation impose des distances minimales avec le voisinage." },
  { q: "Peut-on coupler une PAC avec des panneaux solaires ?", a: "Oui, c'est une combinaison très avantageuse. Les panneaux solaires produisent l'électricité qui alimente la PAC, réduisant encore davantage votre facture énergétique. Le COP de 3 à 5 de la PAC multiplie chaque kWh solaire produit." },
];

const ServicePompesAChaleur = () => {
  const breadcrumbItems = [
    { name: "Accueil", url: "/" },
    { name: "Services", url: "/" },
    { name: "Pompes à chaleur", url: "/services/pompes-a-chaleur" },
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
        <title>Pompe à Chaleur : Guide Complet, Prix et Aides 2026 | Prime Énergies</title>
        <meta name="description" content="Installation de pompe à chaleur air-eau, air-air ou géothermique. Prix 2026, aides MaPrimeRénov', comparatif détaillé, COP, entretien et conseils pour bien choisir votre PAC." />
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

          {/* Hero */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-blue-100 text-blue-600"><Thermometer className="w-8 h-8" /></div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">Pompes à chaleur : chauffez efficacement votre logement</h1>
            </div>
            <p className="text-lg text-muted-foreground leading-relaxed mb-6">
              La pompe à chaleur (PAC) capte les calories présentes dans l'air, l'eau ou le sol pour chauffer votre habitation. Avec un coefficient de performance (COP) de 3 à 5, elle produit 3 à 5 kWh de chaleur pour seulement 1 kWh d'électricité consommé. En 2026, c'est la solution de chauffage la plus efficiente et la plus plébiscitée par les Français.
            </p>
            <div className="rounded-2xl overflow-hidden mb-6">
              <img src={pacExtImg} alt="Pompe à chaleur air-eau installée en extérieur d'une maison" width={1280} height={720} className="w-full h-auto object-cover" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { value: "COP 3-5", label: "Coefficient de performance" },
                { value: "70 %", label: "Économies de chauffage" },
                { value: "15-20 ans", label: "Durée de vie moyenne" },
                { value: "5 000 €", label: "Aide MaPrimeRénov' max" },
              ].map((stat, i) => (
                <div key={i} className="text-center p-4 rounded-xl bg-blue-50 border border-blue-100">
                  <div className="text-2xl font-bold text-blue-600">{stat.value}</div>
                  <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Avantages */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-6">Les avantages d'une pompe à chaleur</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { icon: Euro, title: "Jusqu'à 70 % d'économies", desc: "En remplaçant une chaudière fioul ou gaz par une PAC air-eau, les économies sur la facture de chauffage sont immédiates. Un foyer chauffé au fioul peut économiser 1 500 à 2 500 €/an." },
                { icon: Leaf, title: "Énergie renouvelable", desc: "La PAC utilise une source d'énergie gratuite et inépuisable (air, eau, sol). Pour 1 kWh d'électricité consommé, elle restitue 3 à 5 kWh de chaleur." },
                { icon: Droplets, title: "Chauffage + eau chaude", desc: "Les PAC air-eau assurent à la fois le chauffage central (radiateurs, plancher chauffant) et la production d'eau chaude sanitaire (ECS), avec un seul équipement." },
                { icon: Snowflake, title: "Rafraîchissement en été", desc: "Les PAC réversibles (air-air) et certaines PAC air-eau permettent de rafraîchir votre logement en été, offrant un confort 4 saisons." },
                { icon: CheckCircle, title: "Aides financières importantes", desc: "MaPrimeRénov' (jusqu'à 5 000 €), CEE (jusqu'à 4 000 €), TVA 5,5 %, éco-PTZ : le cumul des aides peut couvrir 50 à 70 % du coût d'installation." },
                { icon: BarChart3, title: "Valorisation immobilière", desc: "Un logement équipé d'une PAC performante améliore son DPE de 1 à 3 classes, augmentant sa valeur sur le marché immobilier de 5 à 15 %." },
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

          {/* Comment ça marche */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-4">Comment fonctionne une pompe à chaleur ?</h2>
            <p className="text-muted-foreground mb-6">
              Le principe est simple : la PAC transfère la chaleur d'une source froide (air extérieur, sol, nappe phréatique) vers votre intérieur grâce à un cycle thermodynamique. Voici les étapes du processus :
            </p>
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-4">
                {[
                  { title: "Captation", desc: "L'évaporateur capte les calories présentes dans l'air extérieur (même par températures négatives) ou dans le sol." },
                  { title: "Compression", desc: "Le compresseur augmente la pression et la température du fluide frigorigène, qui passe de l'état gazeux basse pression à haute pression." },
                  { title: "Condensation", desc: "Le condenseur transfère la chaleur du fluide frigorigène chaud vers le circuit de chauffage de votre logement (eau des radiateurs ou plancher chauffant)." },
                  { title: "Détente", desc: "Le détendeur fait chuter la pression du fluide, qui se refroidit et reprend le cycle depuis le début." },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 p-4 rounded-xl bg-muted/30 border border-border/30">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-sm">{i + 1}</span>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="rounded-2xl overflow-hidden h-fit sticky top-24">
                <img src={pacIntImg} alt="Intérieur confortable chauffé par pompe à chaleur avec plancher chauffant" width={1280} height={720} loading="lazy" className="w-full h-auto object-cover" />
              </div>
            </div>
          </section>

          {/* Comparatif détaillé */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-4">Comparatif détaillé des types de PAC</h2>
            <p className="text-muted-foreground mb-6">
              Chaque type de pompe à chaleur a ses spécificités. Le choix dépend de votre logement, votre budget et vos besoins :
            </p>
            <div className="overflow-x-auto mb-6">
              <table className="w-full text-sm border border-border rounded-lg overflow-hidden">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-3 font-semibold text-foreground">Critère</th>
                    <th className="text-left p-3 font-semibold text-foreground">PAC Air-Air</th>
                    <th className="text-left p-3 font-semibold text-foreground">PAC Air-Eau</th>
                    <th className="text-left p-3 font-semibold text-foreground">PAC Géothermique</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Prix (pose incluse)", "5 000 – 10 000 €", "8 000 – 15 000 €", "15 000 – 25 000 €"],
                    ["COP moyen", "3 – 4", "3 – 4,5", "4 – 5"],
                    ["Chauffage", "✅ Soufflage air", "✅ Radiateurs / plancher", "✅ Radiateurs / plancher"],
                    ["Eau chaude (ECS)", "❌", "✅", "✅"],
                    ["Rafraîchissement", "✅ Climatisation", "✅ (certains modèles)", "✅ Geocooling"],
                    ["Éligible MaPrimeRénov'", "❌", "✅ Jusqu'à 5 000 €", "✅ Jusqu'à 11 000 €"],
                    ["Niveau sonore extérieur", "45 – 55 dB(A)", "45 – 65 dB(A)", "Silencieux (unité enterrée)"],
                    ["Terrain nécessaire", "Non", "Non", "Oui (forage ou capteur)"],
                    ["Durée de vie", "15 – 20 ans", "15 – 20 ans", "20 – 25 ans"],
                    ["Performance par grand froid", "Correcte (-15°C)", "Bonne (-20°C)", "Excellente (stable)"],
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

          {/* Aides financières */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-4">Aides financières pour une pompe à chaleur en 2026</h2>
            <p className="text-muted-foreground mb-6">
              L'installation d'une PAC air-eau ou géothermique bénéficie de nombreuses aides cumulables. Voici le détail par profil de revenus :
            </p>
            <div className="overflow-x-auto mb-6">
              <table className="w-full text-sm border border-border rounded-lg overflow-hidden">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-3 font-semibold text-foreground">Aide</th>
                    <th className="text-left p-3 font-semibold text-foreground">Revenus très modestes</th>
                    <th className="text-left p-3 font-semibold text-foreground">Revenus modestes</th>
                    <th className="text-left p-3 font-semibold text-foreground">Revenus intermédiaires</th>
                    <th className="text-left p-3 font-semibold text-foreground">Revenus supérieurs</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["MaPrimeRénov' (PAC air-eau)", "5 000 €", "4 000 €", "3 000 €", "Non éligible"],
                    ["MaPrimeRénov' (géothermie)", "11 000 €", "9 000 €", "6 000 €", "Non éligible"],
                    ["CEE (Coup de pouce)", "Jusqu'à 4 000 €", "Jusqu'à 4 000 €", "Jusqu'à 2 500 €", "Jusqu'à 2 500 €"],
                    ["TVA réduite", "5,5 %", "5,5 %", "5,5 %", "5,5 %"],
                    ["Éco-PTZ", "Jusqu'à 50 000 €", "Jusqu'à 50 000 €", "Jusqu'à 50 000 €", "Jusqu'à 50 000 €"],
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
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
              <Lightbulb className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground"><strong className="text-foreground">Exemple concret :</strong> Pour un ménage aux revenus modestes installant une PAC air-eau à 12 000 €, le reste à charge peut descendre à 4 000 € après cumul de MaPrimeRénov' (4 000 €) et des CEE (4 000 €), soit une prise en charge de 67 %.</p>
            </div>
          </section>

          {/* Étapes d'installation */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-6">Les étapes d'installation d'une PAC</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <ol className="space-y-5">
                {[
                  { step: "Visite technique", desc: "Un technicien évalue votre logement : surface, isolation, système de chauffage existant, emplacement de l'unité extérieure. Il réalise un bilan thermique pour dimensionner la PAC." },
                  { step: "Choix et devis", desc: "Sur la base du bilan thermique, l'installateur propose le modèle adapté. Un devis détaillé est fourni avec le montant des aides déductibles. Comparez au moins 3 devis." },
                  { step: "Démarches administratives", desc: "Demande d'aides MaPrimeRénov' (avant signature du devis idéalement), déclaration en mairie si nécessaire, demande de CEE auprès d'un obligé." },
                  { step: "Installation", desc: "La pose dure 2 à 4 jours : installation de l'unité extérieure, raccordement au circuit hydraulique, mise en place du ballon ECS, câblage électrique et mise en service." },
                  { step: "Mise en service et réglages", desc: "Le technicien vérifie le bon fonctionnement, règle les paramètres de température et de programmation, et vous explique le fonctionnement de la régulation." },
                  { step: "Entretien annuel", desc: "Un contrat d'entretien annuel (150-250 €/an) est obligatoire pour les PAC de plus de 2 kg de fluide frigorigène. Il inclut le contrôle d'étanchéité et l'optimisation des réglages." },
                ].map((item, i) => (
                  <li key={i} className="flex gap-4 items-start">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-sm">{i + 1}</span>
                    <div>
                      <h3 className="font-semibold text-foreground">{item.step}</h3>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <div className="rounded-2xl overflow-hidden h-fit sticky top-24">
                <img src={pacTechImg} alt="Technicien installant une unité intérieure de pompe à chaleur" width={1280} height={720} loading="lazy" className="w-full h-auto object-cover" />
                <div className="bg-muted/80 p-4">
                  <p className="text-sm text-foreground font-medium">🔧 Certification RGE obligatoire</p>
                  <p className="text-xs text-muted-foreground mt-1">Seul un installateur certifié RGE (qualification QualiPAC) peut réaliser l'installation pour que vous puissiez bénéficier des aides de l'État.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Nuisances sonores */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-4">Pompe à chaleur et bruit : ce qu'il faut savoir</h2>
            <p className="text-muted-foreground mb-6">
              Le bruit de l'unité extérieure est une préoccupation fréquente. Voici les niveaux sonores typiques et la réglementation en vigueur :
            </p>
            <div className="overflow-x-auto mb-4">
              <table className="w-full text-sm border border-border rounded-lg overflow-hidden">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-3 font-semibold text-foreground">Situation</th>
                    <th className="text-left p-3 font-semibold text-foreground">Niveau sonore</th>
                    <th className="text-left p-3 font-semibold text-foreground">Comparaison</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["PAC mode normal", "45 – 55 dB(A) à 1m", "Équivalent d'une conversation"],
                    ["PAC mode silence", "35 – 40 dB(A) à 1m", "Murmure / bibliothèque"],
                    ["PAC à 5 mètres", "30 – 40 dB(A)", "Bruit de fond d'une pièce calme"],
                    ["Limite réglementaire (jour)", "Émergence max +5 dB(A)", "Code de la santé publique"],
                    ["Limite réglementaire (nuit)", "Émergence max +3 dB(A)", "Code de la santé publique"],
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
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
              <Volume2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground"><strong className="text-foreground">Conseil :</strong> Installez l'unité extérieure à distance des fenêtres de chambres et des limites de propriété. Un socle anti-vibrations et un écran acoustique peuvent réduire le bruit perçu de 5 à 10 dB.</p>
            </div>
          </section>

          {/* PAC et ancien chauffage */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-4">Remplacer votre ancien chauffage par une PAC</h2>
            <p className="text-muted-foreground mb-6">
              L'impact sur votre facture dépend du système que vous remplacez. Voici les économies moyennes constatées :
            </p>
            <div className="overflow-x-auto mb-4">
              <table className="w-full text-sm border border-border rounded-lg overflow-hidden">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-3 font-semibold text-foreground">Ancien système</th>
                    <th className="text-left p-3 font-semibold text-foreground">Coût annuel moyen*</th>
                    <th className="text-left p-3 font-semibold text-foreground">Coût avec PAC air-eau</th>
                    <th className="text-left p-3 font-semibold text-foreground">Économie annuelle</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Chaudière fioul", "2 800 – 3 500 €", "800 – 1 200 €", "1 800 – 2 500 €"],
                    ["Chaudière gaz ancienne", "1 800 – 2 400 €", "800 – 1 200 €", "800 – 1 400 €"],
                    ["Radiateurs électriques", "2 200 – 3 000 €", "800 – 1 200 €", "1 200 – 2 000 €"],
                    ["Chaudière gaz condensation", "1 200 – 1 600 €", "800 – 1 200 €", "300 – 600 €"],
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
            <p className="text-xs text-muted-foreground italic">* Pour un logement de 100 m² moyennement isolé en zone climatique H2.</p>
          </section>

          {/* CTA */}
          <section className="mb-12 bg-gradient-to-br from-blue-50 to-primary/5 border border-blue-200 rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-bold text-foreground mb-3">Trouvez votre pompe à chaleur idéale</h2>
            <p className="text-muted-foreground mb-6 max-w-xl mx-auto">Comparez les offres d'installateurs certifiés RGE près de chez vous et bénéficiez des meilleures aides disponibles.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild size="lg" className="gap-2">
                <Link to="/landing/pompe-a-chaleur">Voir notre offre PAC <ArrowRight className="w-4 h-4" /></Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/aides">Consulter les aides</Link>
              </Button>
            </div>
          </section>

          {/* Articles liés */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-6">Pour aller plus loin</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { title: "Installation solaire", desc: "Combinez PAC et solaire pour une maison éco-responsable", link: "/services/installation-solaire", icon: "☀️" },
                { title: "Amélioration de l'habitat", desc: "Isolez d'abord pour maximiser les performances de votre PAC", link: "/services/amelioration-habitat", icon: "🏠" },
                { title: "Audit énergétique", desc: "Évaluez les besoins thermiques avant de choisir votre PAC", link: "/services/audit-energetique", icon: "📋" },
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

export default ServicePompesAChaleur;
