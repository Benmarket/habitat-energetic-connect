import { Helmet } from "react-helmet";
import { Shield, Lock, Eye, UserCheck, Globe, Database, FileText, Home, Cookie } from "lucide-react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const PolitiqueConfidentialite = () => {
  return (
    <>
      <Helmet>
        <title>Politique de confidentialité | Prime Énergies</title>
        <meta name="description" content="Politique de confidentialité et protection des données personnelles de Prime Énergies. Conforme au RGPD et aux réglementations en vigueur." />
        <meta name="robots" content="index, follow" />
      </Helmet>

      <Header />

      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          {/* Back to home link */}
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors mb-8 font-medium"
          >
            <Home className="w-4 h-4" />
            Retour à l'accueil
          </Link>

          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-primary/10 rounded-full">
                <Shield className="w-12 h-12 text-primary" />
              </div>
            </div>
            <h1 className="text-4xl font-bold mb-4">Politique de confidentialité</h1>
            <p className="text-muted-foreground">
              Dernière mise à jour : 7 juillet 2026
            </p>
          </div>

          {/* Introduction */}
          <div className="prose prose-slate max-w-none mb-8 bg-card p-6 rounded-lg border">
            <p className="text-foreground leading-relaxed">
              FRANCE RENOV HABITAT ENVIRONNEMENT (« FRH »), exploitant le site <strong>Prime Énergies</strong>,
              s'engage à protéger la vie privée et les données personnelles de ses utilisateurs.
              Cette politique de confidentialité explique comment nous collectons, utilisons, stockons et protégeons
              vos informations personnelles conformément au <strong>Règlement Général sur la Protection des Données (RGPD)</strong>{" "}
              et aux réglementations françaises en vigueur.
            </p>
          </div>

          {/* Content sections */}
          <div className="space-y-8">
            {/* Section 1 - Responsable */}
            <section className="bg-card p-6 rounded-lg border">
              <div className="flex items-start gap-3 mb-4">
                <UserCheck className="w-6 h-6 text-primary mt-1" />
                <div>
                  <h2 className="text-2xl font-bold mb-2">1. Responsable du traitement</h2>
                </div>
              </div>
              <div className="space-y-3 text-foreground">
                <p>
                  <strong>FRANCE RENOV HABITAT ENVIRONNEMENT (FRH)</strong>
                </p>
                <p>
                  SASU au capital de 30&nbsp;000&nbsp;€<br />
                  Siège social : 196 avenue Jean Lolive, 93500 Pantin<br />
                  RCS Bobigny 890 493 737 — SIRET 890 493 737 00013
                </p>
                <p>
                  <strong>Email de contact :</strong>{" "}
                  <a href="mailto:contact@prime-energies.fr" className="text-primary underline">
                    contact@prime-energies.fr
                  </a>
                </p>
                <p className="text-sm text-muted-foreground">
                  Pour toute question relative à la protection de vos données, vous pouvez nous contacter à cette adresse.
                </p>
              </div>
            </section>

            {/* Section 2 - Données collectées */}
            <section className="bg-card p-6 rounded-lg border">
              <div className="flex items-start gap-3 mb-4">
                <Database className="w-6 h-6 text-primary mt-1" />
                <div>
                  <h2 className="text-2xl font-bold mb-2">2. Données collectées</h2>
                </div>
              </div>
              <div className="space-y-4 text-foreground">
                <p><strong>2.1 Données que vous nous fournissez</strong></p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Nom et prénom</li>
                  <li>Adresse email</li>
                  <li>Numéro de téléphone (si vous choisissez de le renseigner)</li>
                  <li>Adresse postale ou code postal</li>
                  <li>Informations sur votre projet (type de logement, travaux envisagés, statut d'occupation, etc.)</li>
                </ul>

                <p><strong>2.2 Données collectées automatiquement</strong></p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Adresse IP</li>
                  <li>Type de navigateur et système d'exploitation</li>
                  <li>Pages visitées et durée de visite</li>
                  <li>Cookies et traceurs (avec votre consentement lorsqu'ils ne sont pas strictement nécessaires)</li>
                </ul>

                <p><strong>2.3 Données de compte</strong></p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Identifiants de connexion</li>
                  <li>Historique des demandes et simulations réalisées</li>
                  <li>Préférences de communication</li>
                </ul>
              </div>
            </section>

            {/* Section 3 - Finalités */}
            <section className="bg-card p-6 rounded-lg border">
              <div className="flex items-start gap-3 mb-4">
                <Eye className="w-6 h-6 text-primary mt-1" />
                <div>
                  <h2 className="text-2xl font-bold mb-2">3. Finalités du traitement</h2>
                </div>
              </div>
              <div className="space-y-3 text-foreground">
                <p>Vos données personnelles sont utilisées pour :</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Étudier votre projet</strong> : répondre à votre demande, établir un devis et vous accompagner dans vos travaux de rénovation énergétique</li>
                  <li><strong>Gérer votre compte utilisateur</strong> : création, authentification et gestion de votre profil</li>
                  <li><strong>Vous informer</strong> : actualités, guides et offres liées aux énergies renouvelables (avec votre consentement lorsque la loi l'exige)</li>
                  <li><strong>Assurer le support client</strong> : répondre à vos questions et traiter vos demandes</li>
                  <li><strong>Améliorer le site</strong> : analyses statistiques anonymisées pour optimiser votre expérience</li>
                  <li><strong>Respecter nos obligations légales</strong> : comptabilité, fiscalité et réponse aux demandes des autorités</li>
                </ul>
              </div>
            </section>

            {/* Section 4 - Bases légales */}
            <section className="bg-card p-6 rounded-lg border">
              <div className="flex items-start gap-3 mb-4">
                <FileText className="w-6 h-6 text-primary mt-1" />
                <div>
                  <h2 className="text-2xl font-bold mb-2">4. Base légale du traitement</h2>
                </div>
              </div>
              <div className="space-y-3 text-foreground">
                <p>Conformément au RGPD, nous traitons vos données sur les bases légales suivantes :</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Consentement</strong> : pour l'envoi de communications commerciales et l'utilisation de cookies non essentiels</li>
                  <li><strong>Exécution du contrat</strong> : pour la création de votre compte, l'étude de votre projet et la réalisation des travaux</li>
                  <li><strong>Mesures précontractuelles</strong> : pour répondre à vos demandes de devis ou d'information</li>
                  <li><strong>Intérêt légitime</strong> : pour l'amélioration de nos services, la sécurité de la plateforme et la mesure d'audience anonymisée</li>
                  <li><strong>Obligation légale</strong> : pour la conservation des données requises par la loi</li>
                </ul>
              </div>
            </section>

            {/* Section 5 - Partage */}
            <section className="bg-card p-6 rounded-lg border">
              <div className="flex items-start gap-3 mb-4">
                <Globe className="w-6 h-6 text-primary mt-1" />
                <div>
                  <h2 className="text-2xl font-bold mb-2">5. Partage des données</h2>
                </div>
              </div>
              <div className="space-y-3 text-foreground">
                <p><strong>Vos données sont traitées par :</strong></p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Les équipes de FRH</strong> : pour l'étude et le suivi de votre projet</li>
                  <li><strong>Prestataires techniques</strong> : hébergement, maintenance, outils de mesure d'audience et services d'emailing, agissant pour le compte de FRH et sous sa responsabilité</li>
                </ul>
                <p className="mt-4">
                  <strong>Important :</strong> Vos données ne sont jamais vendues à des tiers. Elles ne sont pas transmises à d'autres installateurs ou à des tiers à des fins commerciales sans votre consentement explicite.
                </p>
              </div>
            </section>

            {/* Section 6 - Conservation */}
            <section className="bg-card p-6 rounded-lg border">
              <div className="flex items-start gap-3 mb-4">
                <Lock className="w-6 h-6 text-primary mt-1" />
                <div>
                  <h2 className="text-2xl font-bold mb-2">6. Sécurité et conservation des données</h2>
                </div>
              </div>
              <div className="space-y-3 text-foreground">
                <p><strong>6.1 Mesures de sécurité</strong></p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Chiffrement des données en transit (SSL/TLS)</li>
                  <li>Authentification sécurisée</li>
                  <li>Sauvegardes régulières</li>
                  <li>Accès restreint aux données personnelles</li>
                  <li>Surveillance et détection des intrusions</li>
                </ul>

                <p className="mt-4"><strong>6.2 Durées de conservation</strong></p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Prospects</strong> : 3 ans à compter du dernier contact</li>
                  <li><strong>Clients</strong> : durée de la relation contractuelle, puis durées légales de conservation</li>
                  <li><strong>Données comptables</strong> : jusqu'à 10 ans (obligation légale)</li>
                  <li><strong>Compte inactif</strong> : suppression ou anonymisation après 3 ans d'inactivité</li>
                </ul>
              </div>
            </section>

            {/* Section 7 - Transferts */}
            <section className="bg-card p-6 rounded-lg border">
              <div className="flex items-start gap-3 mb-4">
                <Globe className="w-6 h-6 text-primary mt-1" />
                <div>
                  <h2 className="text-2xl font-bold mb-2">7. Transferts de données hors Union européenne</h2>
                </div>
              </div>
              <div className="text-foreground space-y-3">
                <p>
                  Certains prestataires techniques peuvent traiter des données en dehors de l'Union européenne. Lorsque cela est le cas, nous mettons en place des garanties appropriées, notamment les clauses contractuelles types de la Commission européenne, pour assurer un niveau de protection conforme au RGPD.
                </p>
              </div>
            </section>

            {/* Section 8 - Cookies */}
            <section className="bg-card p-6 rounded-lg border">
              <div className="flex items-start gap-3 mb-4">
                <Cookie className="w-6 h-6 text-primary mt-1" />
                <div>
                  <h2 className="text-2xl font-bold mb-2">8. Cookies et traceurs</h2>
                </div>
              </div>
              <div className="space-y-3 text-foreground">
                <p>
                  Un cookie est un petit fichier texte déposé sur votre appareil lors de votre visite. Nous utilisons les cookies suivants :
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Cookies techniques</strong> : indispensables au fonctionnement du site (navigation, formulaires, sécurité). Ils ne nécessitent pas de consentement.</li>
                  <li><strong>Cookies de mesure d'audience</strong> : pour comprendre comment le site est utilisé et l'améliorer (déposés avec votre consentement)</li>
                  <li><strong>Cookies marketing</strong> : pour vous proposer des contenus adaptés et mesurer nos campagnes (déposés avec votre consentement explicite)</li>
                  <li><strong>Cookies de réseaux sociaux</strong> : si vous utilisez des boutons de partage, le réseau social concerné peut déposer ses propres cookies</li>
                </ul>
                <p className="mt-4">
                  À votre arrivée sur le site, un bandeau vous permet d'accepter ou de refuser les cookies non essentiels. Vous pouvez modifier votre choix à tout moment via le lien « Gérer les cookies » en bas de page, ou en paramétrant votre navigateur. Les cookies sont conservés 13 mois maximum.
                </p>
              </div>
            </section>

            {/* Section 9 - Droits */}
            <section className="bg-card p-6 rounded-lg border">
              <div className="flex items-start gap-3 mb-4">
                <Shield className="w-6 h-6 text-primary mt-1" />
                <div>
                  <h2 className="text-2xl font-bold mb-2">9. Vos droits RGPD</h2>
                </div>
              </div>
              <div className="space-y-3 text-foreground">
                <p>Conformément au RGPD, vous disposez des droits suivants :</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Droit d'accès</strong> : obtenir une copie de vos données personnelles</li>
                  <li><strong>Droit de rectification</strong> : corriger vos données inexactes ou incomplètes</li>
                  <li><strong>Droit à l'effacement</strong> : demander la suppression de vos données dans certains cas</li>
                  <li><strong>Droit à la limitation</strong> : restreindre temporairement le traitement de vos données</li>
                  <li><strong>Droit à la portabilité</strong> : recevoir vos données dans un format structuré et les transférer</li>
                  <li><strong>Droit d'opposition</strong> : refuser certains traitements, notamment la prospection commerciale</li>
                  <li><strong>Droit de retirer votre consentement</strong> : à tout moment pour les traitements fondés sur le consentement</li>
                </ul>

                <div className="bg-primary/10 p-4 rounded-lg mt-4">
                  <p className="font-semibold mb-2">Pour exercer vos droits :</p>
                  <p>
                    Écrivez-nous à{" "}
                    <a href="mailto:contact@prime-energies.fr" className="text-primary underline">
                      contact@prime-energies.fr
                    </a>
                  </p>
                  <p className="text-sm mt-2">Nous vous répondrons dans un délai maximum d'un mois. Une preuve d'identité peut vous être demandée.</p>
                </div>

                <p className="mt-4">
                  <strong>Droit de réclamation :</strong> Vous pouvez introduire une réclamation auprès de la CNIL (Commission Nationale de l'Informatique et des Libertés) si vous estimez que vos droits ne sont pas respectés :{" "}
                  <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                    www.cnil.fr
                  </a>
                </p>
              </div>
            </section>

            {/* Section 10 - Modifications */}
            <section className="bg-card p-6 rounded-lg border">
              <div className="flex items-start gap-3 mb-4">
                <FileText className="w-6 h-6 text-primary mt-1" />
                <div>
                  <h2 className="text-2xl font-bold mb-2">10. Modifications de la politique</h2>
                </div>
              </div>
              <div className="text-foreground">
                <p>
                  Nous nous réservons le droit de modifier cette politique de confidentialité à tout moment pour la mettre en conformité avec les évolutions légales ou nos pratiques. En cas de modification substantielle, nous vous en informerons par email ou via une notification sur le site. Nous vous encourageons à consulter régulièrement cette page.
                </p>
              </div>
            </section>

            {/* Section 11 - Contact */}
            <section className="bg-card p-6 rounded-lg border">
              <div className="flex items-start gap-3 mb-4">
                <UserCheck className="w-6 h-6 text-primary mt-1" />
                <div>
                  <h2 className="text-2xl font-bold mb-2">11. Contact</h2>
                </div>
              </div>
              <div className="text-foreground space-y-3">
                <p><strong>Responsable du traitement :</strong></p>
                <p>
                  FRANCE RENOV HABITAT ENVIRONNEMENT<br />
                  196 avenue Jean Lolive, 93500 Pantin<br />
                  Email :{" "}
                  <a href="mailto:contact@prime-energies.fr" className="text-primary underline">
                    contact@prime-energies.fr
                  </a>
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default PolitiqueConfidentialite;
