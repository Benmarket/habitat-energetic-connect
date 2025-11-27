import { Helmet } from "react-helmet";
import { Shield, Lock, Eye, UserCheck, Globe, Database, FileText } from "lucide-react";

const PolitiqueConfidentialite = () => {
  return (
    <>
      <Helmet>
        <title>Politique de confidentialité | Prime Énergies</title>
        <meta name="description" content="Politique de confidentialité et protection des données personnelles de Prime Énergies. Conforme au RGPD et aux réglementations européennes." />
        <meta name="robots" content="index, follow" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-primary/10 rounded-full">
                <Shield className="w-12 h-12 text-primary" />
              </div>
            </div>
            <h1 className="text-4xl font-bold mb-4">Politique de confidentialité</h1>
            <p className="text-muted-foreground">
              Dernière mise à jour : 27 novembre 2025
            </p>
          </div>

          {/* Introduction */}
          <div className="prose prose-slate max-w-none mb-8 bg-card p-6 rounded-lg border">
            <p className="text-foreground leading-relaxed">
              Prime Énergies s'engage à protéger la vie privée et les données personnelles de ses utilisateurs. 
              Cette politique de confidentialité explique comment nous collectons, utilisons, stockons et protégeons 
              vos informations personnelles conformément au <strong>Règlement Général sur la Protection des Données (RGPD)</strong> 
              de l'Union Européenne et aux réglementations en vigueur.
            </p>
          </div>

          {/* Content sections */}
          <div className="space-y-8">
            {/* Section 1 */}
            <section className="bg-card p-6 rounded-lg border">
              <div className="flex items-start gap-3 mb-4">
                <Database className="w-6 h-6 text-primary mt-1" />
                <div>
                  <h2 className="text-2xl font-bold mb-2">1. Données collectées</h2>
                </div>
              </div>
              <div className="space-y-4 text-foreground">
                <p><strong>1.1 Données d'identification</strong></p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Nom et prénom (pour les particuliers)</li>
                  <li>Nom du contact et raison sociale (pour les professionnels)</li>
                  <li>Adresse email</li>
                  <li>Numéro de téléphone (optionnel)</li>
                  <li>Type de compte (particulier/professionnel)</li>
                </ul>

                <p><strong>1.2 Données de navigation</strong></p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Adresse IP</li>
                  <li>Type de navigateur et système d'exploitation</li>
                  <li>Pages visitées et durée de visite</li>
                  <li>Cookies et traceurs (avec votre consentement via Consent Mode Google)</li>
                </ul>

                <p><strong>1.3 Données de prospection</strong></p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Informations sur votre projet énergétique</li>
                  <li>Type de bien immobilier</li>
                  <li>Besoins en énergies renouvelables</li>
                  <li>Simulations réalisées</li>
                </ul>
              </div>
            </section>

            {/* Section 2 */}
            <section className="bg-card p-6 rounded-lg border">
              <div className="flex items-start gap-3 mb-4">
                <Eye className="w-6 h-6 text-primary mt-1" />
                <div>
                  <h2 className="text-2xl font-bold mb-2">2. Finalités du traitement</h2>
                </div>
              </div>
              <div className="space-y-3 text-foreground">
                <p>Vos données personnelles sont utilisées pour :</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Gestion de votre compte utilisateur</strong> : création, authentification, gestion de profil</li>
                  <li><strong>Mise en relation avec nos partenaires</strong> : transmission de vos coordonnées aux entreprises professionnelles certifiées partenaires de Prime Énergies pour obtenir des devis et propositions commerciales</li>
                  <li><strong>Information et conseil</strong> : vous renseigner sur les subventions disponibles, les économies d'énergie potentielles et les solutions énergétiques adaptées</li>
                  <li><strong>Newsletter</strong> : envoi d'actualités, guides et offres (avec votre consentement)</li>
                  <li><strong>Support client</strong> : répondre à vos questions via notre système de chat et assistance</li>
                  <li><strong>Amélioration du service</strong> : analyses statistiques anonymisées pour optimiser votre expérience</li>
                  <li><strong>Obligations légales</strong> : conformité réglementaire et réponse aux demandes des autorités</li>
                </ul>
              </div>
            </section>

            {/* Section 3 */}
            <section className="bg-card p-6 rounded-lg border">
              <div className="flex items-start gap-3 mb-4">
                <UserCheck className="w-6 h-6 text-primary mt-1" />
                <div>
                  <h2 className="text-2xl font-bold mb-2">3. Base légale du traitement</h2>
                </div>
              </div>
              <div className="space-y-3 text-foreground">
                <p>Conformément au RGPD, nous traitons vos données sur les bases légales suivantes :</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Consentement</strong> : pour l'envoi de newsletters, l'utilisation de cookies marketing</li>
                  <li><strong>Exécution du contrat</strong> : pour la création de votre compte et la mise en relation avec nos partenaires</li>
                  <li><strong>Intérêt légitime</strong> : pour l'amélioration de nos services et la sécurité de la plateforme</li>
                  <li><strong>Obligation légale</strong> : pour la conservation de données requise par la loi</li>
                </ul>
              </div>
            </section>

            {/* Section 4 */}
            <section className="bg-card p-6 rounded-lg border">
              <div className="flex items-start gap-3 mb-4">
                <Globe className="w-6 h-6 text-primary mt-1" />
                <div>
                  <h2 className="text-2xl font-bold mb-2">4. Partage des données</h2>
                </div>
              </div>
              <div className="space-y-3 text-foreground">
                <p><strong>Vos données peuvent être partagées avec :</strong></p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Entreprises partenaires certifiées</strong> : lorsque vous demandez à être mis en contact pour obtenir un devis ou une proposition commerciale</li>
                  <li><strong>Prestataires techniques</strong> : hébergement (conformes RGPD), outils d'emailing, services d'analyse</li>
                  <li><strong>Autorités compétentes</strong> : si requis par la loi</li>
                </ul>
                <p className="mt-4">
                  <strong>Important :</strong> Nous ne vendons jamais vos données personnelles à des tiers. 
                  Tout partage de données avec nos partenaires professionnels se fait uniquement dans le cadre 
                  d'une demande explicite de votre part pour être contacté.
                </p>
              </div>
            </section>

            {/* Section 5 */}
            <section className="bg-card p-6 rounded-lg border">
              <div className="flex items-start gap-3 mb-4">
                <Lock className="w-6 h-6 text-primary mt-1" />
                <div>
                  <h2 className="text-2xl font-bold mb-2">5. Sécurité et conservation des données</h2>
                </div>
              </div>
              <div className="space-y-3 text-foreground">
                <p><strong>5.1 Mesures de sécurité</strong></p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Chiffrement des données sensibles (SSL/TLS)</li>
                  <li>Authentification sécurisée</li>
                  <li>Sauvegardes régulières</li>
                  <li>Accès restreint aux données personnelles</li>
                  <li>Surveillance et détection des intrusions</li>
                </ul>

                <p className="mt-4"><strong>5.2 Durée de conservation</strong></p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Compte actif</strong> : pendant toute la durée d'utilisation du service</li>
                  <li><strong>Compte inactif</strong> : 3 ans après la dernière connexion</li>
                  <li><strong>Données de prospection</strong> : 3 ans après la dernière demande</li>
                  <li><strong>Données comptables</strong> : 10 ans (obligation légale)</li>
                </ul>
              </div>
            </section>

            {/* Section 6 */}
            <section className="bg-card p-6 rounded-lg border">
              <div className="flex items-start gap-3 mb-4">
                <FileText className="w-6 h-6 text-primary mt-1" />
                <div>
                  <h2 className="text-2xl font-bold mb-2">6. Cookies et Consent Mode Google</h2>
                </div>
              </div>
              <div className="space-y-3 text-foreground">
                <p>
                  Notre site utilise des cookies conformément au <strong>Consent Mode de Google</strong> 
                  et aux directives européennes sur la vie privée (ePrivacy).
                </p>

                <p><strong>Types de cookies utilisés :</strong></p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Cookies strictement nécessaires</strong> : authentification, sécurité (pas de consentement requis)</li>
                  <li><strong>Cookies analytiques</strong> : mesure d'audience anonymisée (Google Analytics en mode respectueux de la vie privée)</li>
                  <li><strong>Cookies marketing</strong> : publicité ciblée (avec votre consentement explicite)</li>
                </ul>

                <p className="mt-4">
                  Vous pouvez gérer vos préférences cookies à tout moment via notre bandeau de consentement 
                  ou dans les paramètres de votre navigateur.
                </p>
              </div>
            </section>

            {/* Section 7 */}
            <section className="bg-card p-6 rounded-lg border">
              <div className="flex items-start gap-3 mb-4">
                <Shield className="w-6 h-6 text-primary mt-1" />
                <div>
                  <h2 className="text-2xl font-bold mb-2">7. Vos droits RGPD</h2>
                </div>
              </div>
              <div className="space-y-3 text-foreground">
                <p>Conformément au RGPD, vous disposez des droits suivants :</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Droit d'accès</strong> : obtenir une copie de vos données personnelles</li>
                  <li><strong>Droit de rectification</strong> : corriger vos données inexactes</li>
                  <li><strong>Droit à l'effacement</strong> : demander la suppression de vos données</li>
                  <li><strong>Droit à la limitation</strong> : restreindre le traitement de vos données</li>
                  <li><strong>Droit à la portabilité</strong> : recevoir vos données dans un format structuré</li>
                  <li><strong>Droit d'opposition</strong> : refuser certains traitements (prospection commerciale)</li>
                  <li><strong>Droit de retirer votre consentement</strong> : à tout moment pour les traitements basés sur le consentement</li>
                </ul>

                <div className="bg-primary/10 p-4 rounded-lg mt-4">
                  <p className="font-semibold mb-2">Pour exercer vos droits :</p>
                  <p>Contactez-nous à <a href="mailto:dpo@prime-energies.fr" className="text-primary underline">dpo@prime-energies.fr</a></p>
                  <p className="text-sm mt-2">Nous vous répondrons dans un délai maximum d'un mois.</p>
                </div>

                <p className="mt-4">
                  <strong>Droit de réclamation :</strong> Vous pouvez introduire une réclamation auprès de la 
                  CNIL (Commission Nationale de l'Informatique et des Libertés) si vous estimez que vos droits 
                  ne sont pas respectés : <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-primary underline">www.cnil.fr</a>
                </p>
              </div>
            </section>

            {/* Section 8 */}
            <section className="bg-card p-6 rounded-lg border">
              <div className="flex items-start gap-3 mb-4">
                <FileText className="w-6 h-6 text-primary mt-1" />
                <div>
                  <h2 className="text-2xl font-bold mb-2">8. Modifications de la politique</h2>
                </div>
              </div>
              <div className="text-foreground">
                <p>
                  Nous nous réservons le droit de modifier cette politique de confidentialité à tout moment. 
                  En cas de modification substantielle, nous vous en informerons par email ou via une notification 
                  sur le site. Nous vous encourageons à consulter régulièrement cette page pour rester informé 
                  de nos pratiques en matière de protection des données.
                </p>
              </div>
            </section>

            {/* Section 9 */}
            <section className="bg-card p-6 rounded-lg border">
              <div className="flex items-start gap-3 mb-4">
                <UserCheck className="w-6 h-6 text-primary mt-1" />
                <div>
                  <h2 className="text-2xl font-bold mb-2">9. Contact</h2>
                </div>
              </div>
              <div className="text-foreground space-y-3">
                <p><strong>Responsable du traitement :</strong></p>
                <p>Prime Énergies<br />
                [Adresse complète]<br />
                Email : <a href="mailto:contact@prime-energies.fr" className="text-primary underline">contact@prime-energies.fr</a><br />
                Téléphone : 0 800 123 456</p>

                <p className="mt-4"><strong>Délégué à la Protection des Données (DPO) :</strong></p>
                <p>Email : <a href="mailto:dpo@prime-energies.fr" className="text-primary underline">dpo@prime-energies.fr</a></p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </>
  );
};

export default PolitiqueConfidentialite;
