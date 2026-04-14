import { Helmet } from "react-helmet";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Link } from "react-router-dom";
import { ClipboardCheck, CheckCircle, ArrowRight, FileText, Home, TrendingDown, HelpCircle, Euro, AlertTriangle, Lightbulb, BarChart3, Shield, Clock, Wrench, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import auditImg from "@/assets/services/audit-thermique.jpg";

const faqs = [
  { q: "L'audit énergétique est-il obligatoire ?", a: "Depuis avril 2023, l'audit énergétique est obligatoire lors de la vente d'un logement classé F ou G au DPE. Depuis 2025, cette obligation s'étend aux logements classés E. Il est aussi requis pour bénéficier de MaPrimeRénov' Parcours accompagné." },
  { q: "Quelle différence entre DPE et audit énergétique ?", a: "Le DPE (Diagnostic de Performance Énergétique) donne une note de A à G et coûte 100-250 €. L'audit énergétique est bien plus détaillé (800-1500 €) : il analyse chaque poste de déperdition, quantifie les pertes et propose des scénarios de travaux chiffrés avec les gains attendus et les aides mobilisables." },
  { q: "Combien coûte un audit énergétique ?", a: "Un audit énergétique réglementaire coûte entre 800 € et 1 500 € pour une maison individuelle (jusqu'à 2 000 € pour les grandes surfaces). Ce coût peut être partiellement pris en charge par MaPrimeRénov' (jusqu'à 500 € selon les revenus)." },
  { q: "Qui peut réaliser un audit énergétique ?", a: "L'audit doit être réalisé par un professionnel qualifié : bureau d'études thermiques certifié (qualification OPQIBI 1905 ou 1911) ou diagnostiqueur immobilier disposant de la certification audit énergétique." },
  { q: "Quelle est la durée de validité d'un audit énergétique ?", a: "L'audit énergétique réglementaire a une durée de validité de 5 ans. Il est recommandé de le refaire après la réalisation de travaux importants pour mesurer les gains obtenus et recalibrer les scénarios restants." },
  { q: "L'audit est-il nécessaire pour MaPrimeRénov' ?", a: "Pour le Parcours accompagné de MaPrimeRénov' (rénovation globale avec gain de 2 classes DPE minimum), un audit énergétique est obligatoire. Pour le Parcours par geste (travaux isolés), il n'est pas requis mais fortement recommandé pour optimiser votre projet." },
  { q: "Combien de temps dure un audit énergétique ?", a: "La visite technique dure 2 à 3 heures sur place. Le rapport complet est généralement remis sous 2 à 3 semaines après la visite. Il inclut les scénarios de travaux, les estimations de coûts et les projections de performance." },
  { q: "Peut-on réaliser un audit à distance ?", a: "Non, un audit réglementaire nécessite obligatoirement une visite sur site. L'auditeur doit relever les dimensions, les matériaux, l'état de l'isolation, le système de chauffage et ventilation. Les simulateurs en ligne ne remplacent pas un audit certifié." },
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
        <meta name="description" content="Audit énergétique réglementaire : obligations 2026, prix, aides MaPrimeRénov', différences avec le DPE, déroulement, contenu du rapport. Guide complet pour votre logement." />
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

          {/* Hero */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-orange-100 text-orange-600"><ClipboardCheck className="w-8 h-8" /></div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">Audit énergétique : le point de départ de votre rénovation</h1>
            </div>
            <p className="text-lg text-muted-foreground leading-relaxed mb-6">
              L'audit énergétique est une analyse approfondie de la performance thermique de votre logement. Contrairement au simple DPE, il identifie précisément les sources de déperdition et propose des scénarios de travaux chiffrés. En 2026, il est devenu un outil incontournable pour optimiser sa rénovation, accéder aux aides de l'État et valoriser son bien immobilier.
            </p>
            <div className="rounded-2xl overflow-hidden mb-6">
              <img src={auditImg} alt="Auditeur énergétique utilisant une caméra thermique sur une maison" width={1280} height={720} className="w-full h-auto object-cover" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { value: "800-1500 €", label: "Coût d'un audit" },
                { value: "500 €", label: "Aide MaPrimeRénov' max" },
                { value: "5 ans", label: "Durée de validité" },
                { value: "2-3h", label: "Durée de la visite" },
              ].map((stat, i) => (
                <div key={i} className="text-center p-4 rounded-xl bg-orange-50 border border-orange-100">
                  <div className="text-2xl font-bold text-orange-600">{stat.value}</div>
                  <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Ce que l'audit apporte */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-6">Ce que l'audit énergétique vous apporte</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { icon: Home, title: "Diagnostic complet", desc: "Analyse des murs, toiture, fenêtres, plancher, ventilation et système de chauffage. Chaque poste de déperdition est quantifié en kWh et en pourcentage des pertes totales." },
                { icon: FileText, title: "Scénarios de travaux chiffrés", desc: "L'audit propose au moins 2 parcours de travaux avec les coûts estimés, les aides mobilisables, les gains énergétiques attendus et le saut de classe DPE prévu." },
                { icon: TrendingDown, title: "Priorisation des travaux", desc: "Identifiez les travaux les plus rentables : l'isolation des combles réduit 25-30 % des déperditions, les murs 20-25 %, les fenêtres 10-15 %." },
                { icon: CheckCircle, title: "Accès aux aides", desc: "L'audit est un prérequis pour MaPrimeRénov' Parcours accompagné. Il débloque les aides les plus importantes pour la rénovation globale (30 à 90 % de prise en charge)." },
                { icon: BarChart3, title: "Estimation des économies", desc: "Chaque scénario inclut une projection des économies d'énergie (en kWh et en €), du temps de retour sur investissement et de l'impact sur votre classement DPE." },
                { icon: Euro, title: "Valorisation immobilière", desc: "Un logement qui passe de F à C gagne en moyenne 15 à 25 % de valeur. L'audit vous donne la feuille de route pour atteindre cet objectif." },
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

          {/* DPE vs Audit */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-4">DPE vs Audit énergétique : les différences</h2>
            <div className="overflow-x-auto mb-6">
              <table className="w-full text-sm border border-border rounded-lg overflow-hidden">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-3 font-semibold text-foreground">Critère</th>
                    <th className="text-left p-3 font-semibold text-foreground">DPE</th>
                    <th className="text-left p-3 font-semibold text-foreground">Audit énergétique</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Objectif", "Étiquette énergie (A à G)", "Analyse détaillée + scénarios de travaux"],
                    ["Prix", "100 – 250 €", "800 – 1 500 €"],
                    ["Durée de visite", "30 min – 1h", "2 – 3 heures"],
                    ["Contenu du rapport", "Note globale, estimation conso", "Déperditions par poste, scénarios chiffrés"],
                    ["Travaux recommandés", "Suggestions génériques", "Scénarios détaillés avec coûts et aides"],
                    ["Obligatoire pour vente", "Toujours (depuis 2006)", "Si DPE F/G (depuis 2023), E (depuis 2025)"],
                    ["Obligatoire pour aides", "Non", "Oui (MaPrimeRénov' Parcours accompagné)"],
                    ["Validité", "10 ans", "5 ans"],
                    ["Réalisé par", "Diagnostiqueur certifié", "Bureau d'études ou diagnostiqueur certifié audit"],
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

          {/* Déroulement */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-6">Déroulement d'un audit énergétique</h2>
            <ol className="space-y-5">
              {[
                { step: "Prise de rendez-vous et préparation", desc: "L'auditeur vous demande les documents disponibles : plans, factures d'énergie des 3 dernières années, DPE existant, travaux déjà réalisés. Préparez-les pour optimiser la visite." },
                { step: "Visite technique sur site (2-3h)", desc: "L'auditeur relève les surfaces, mesure les épaisseurs de murs, identifie les matériaux d'isolation, inspecte la toiture, les fenêtres, le système de chauffage, la ventilation et les ponts thermiques. Il peut utiliser une caméra thermique." },
                { step: "Collecte des données de consommation", desc: "Analyse des factures énergétiques (gaz, électricité, fioul), du profil d'occupation (nombre de personnes, habitudes), et du confort thermique ressenti (zones froides, humidité)." },
                { step: "Modélisation thermique", desc: "L'auditeur modélise votre logement dans un logiciel agréé (méthode 3CL-DPE 2021 ou Th-BCE) pour calculer les déperditions poste par poste et la consommation théorique." },
                { step: "Élaboration des scénarios de travaux", desc: "Au moins 2 scénarios sont proposés : un parcours en 1 étape (rénovation globale) et un parcours en plusieurs étapes. Chaque scénario inclut les travaux, coûts, aides et gains." },
                { step: "Remise du rapport détaillé", desc: "Vous recevez un rapport complet (30 à 50 pages) avec l'état des lieux thermique, les scénarios de travaux, les aides mobilisables, les projections d'économies et le nouveau classement DPE visé." },
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

          {/* Obligations réglementaires */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-4">Obligations réglementaires en 2026</h2>
            <p className="text-muted-foreground mb-6">L'audit énergétique est devenu obligatoire dans plusieurs situations. Voici le calendrier des obligations :</p>
            <div className="overflow-x-auto mb-6">
              <table className="w-full text-sm border border-border rounded-lg overflow-hidden">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-3 font-semibold text-foreground">Date</th>
                    <th className="text-left p-3 font-semibold text-foreground">Obligation</th>
                    <th className="text-left p-3 font-semibold text-foreground">Logements concernés</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Avril 2023", "Audit obligatoire à la vente", "Monopropriétés classées F ou G"],
                    ["Janvier 2025", "Extension aux logements E", "Monopropriétés classées E, F ou G"],
                    ["Janvier 2028 (prévu)", "Extension aux logements D", "Monopropriétés classées D, E, F ou G"],
                    ["Janvier 2025", "Interdiction de location", "Logements classés G (gel des loyers depuis 2022)"],
                    ["Janvier 2028 (prévu)", "Interdiction de location", "Logements classés F"],
                    ["Janvier 2034 (prévu)", "Interdiction de location", "Logements classés E"],
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
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground"><strong className="text-foreground">Important :</strong> Si vous êtes propriétaire bailleur d'un logement classé G au DPE, la location est interdite depuis janvier 2025. L'audit énergétique est la première étape pour planifier les travaux de remise aux normes.</p>
            </div>
          </section>

          {/* Aides */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-4">Aides financières pour l'audit énergétique</h2>
            <div className="overflow-x-auto mb-4">
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
                    ["MaPrimeRénov' (audit)", "500 €", "400 €", "300 €", "Non éligible"],
                    ["Reste à charge (audit 1000€)", "500 €", "600 €", "700 €", "1 000 €"],
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

          {/* Contenu du rapport */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-4">Que contient le rapport d'audit ?</h2>
            <p className="text-muted-foreground mb-6">Un rapport d'audit réglementaire complet comprend les éléments suivants :</p>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { title: "État des lieux thermique", desc: "Description détaillée de l'enveloppe du bâtiment (murs, toiture, plancher, fenêtres), des systèmes de chauffage, d'eau chaude et de ventilation." },
                { title: "Bilan des déperditions", desc: "Quantification des pertes thermiques par poste : toiture (25-30%), murs (20-25%), fenêtres (10-15%), plancher (7-10%), ventilation (20%), ponts thermiques (5-10%)." },
                { title: "Consommation énergétique", desc: "Comparaison entre la consommation théorique (modélisation) et la consommation réelle (factures). Identification des écarts et de leurs causes." },
                { title: "Scénario 1 : Rénovation globale", desc: "Parcours en une étape visant un gain d'au moins 2 classes DPE. Coûts, aides, économies annuelles et temps de retour sur investissement." },
                { title: "Scénario 2 : Rénovation par étapes", desc: "Parcours séquencé avec priorisation des travaux les plus efficaces. Chaque étape est chiffrée avec ses gains attendus." },
                { title: "Synthèse financière", desc: "Récapitulatif des coûts, des aides mobilisables (MaPrimeRénov', CEE, éco-PTZ, TVA réduite), du reste à charge et de la rentabilité sur 15-20 ans." },
              ].map((item, i) => (
                <Card key={i} className="border-border/50">
                  <CardContent className="p-5">
                    <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* CTA */}
          <section className="mb-12 bg-gradient-to-br from-orange-50 to-primary/5 border border-orange-200 rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-bold text-foreground mb-3">Lancez votre projet de rénovation</h2>
            <p className="text-muted-foreground mb-6 max-w-xl mx-auto">Découvrez les aides disponibles et les solutions adaptées à votre logement pour réduire vos factures et améliorer votre confort.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild size="lg" className="gap-2">
                <Link to="/landing/renovation-globale">Rénovation globale <ArrowRight className="w-4 h-4" /></Link>
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
                { title: "Amélioration de l'habitat", desc: "Tous les travaux de rénovation après votre audit", link: "/services/amelioration-habitat", icon: "🏠" },
                { title: "Pompes à chaleur", desc: "Le chauffage recommandé après isolation", link: "/services/pompes-a-chaleur", icon: "🌡️" },
                { title: "Installation solaire", desc: "Complétez votre rénovation avec le solaire", link: "/services/installation-solaire", icon: "☀️" },
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

export default ServiceAuditEnergetique;
