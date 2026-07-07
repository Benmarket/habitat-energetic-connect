import { Helmet } from "react-helmet";
import { Building2, Mail, Phone, Globe, Server, UserCheck, Home, Shield, Award, BookOpen, Cookie } from "lucide-react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const MentionsLegales = () => {
  return (
    <>
      <Helmet>
        <title>Mentions légales | Prime Énergies</title>
        <meta name="description" content="Mentions légales de Prime Énergies. Informations sur l'éditeur, l'hébergement, la protection des données et les conditions d'utilisation." />
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
                <Building2 className="w-12 h-12 text-primary" />
              </div>
            </div>
            <h1 className="text-4xl font-bold mb-4">Mentions légales</h1>
            <p className="text-muted-foreground">
              Informations légales, éditoriales et relatives à la protection des données
            </p>
          </div>

          {/* Content sections */}
          <div className="space-y-8">

            {/* Section 1 - Éditeur */}
            <section className="bg-card p-6 rounded-lg border">
              <div className="flex items-start gap-3 mb-4">
                <Building2 className="w-6 h-6 text-primary mt-1" />
                <div>
                  <h2 className="text-2xl font-bold mb-2">1. Éditeur du site</h2>
                </div>
              </div>
              <div className="space-y-3 text-foreground">
                <p>
                  Le site <strong>prime-energies.fr</strong> est édité par <strong>FRANCE RENOV HABITAT ENVIRONNEMENT</strong> (« <strong>FRH</strong> »), SASU au capital de <strong>30&nbsp;000&nbsp;€</strong>.
                </p>
                <p>
                  <strong>Siège social :</strong><br />
                  196 avenue Jean Lolive<br />
                  93500 Pantin<br />
                  France
                </p>
                <p><strong>RCS :</strong> Bobigny 890 493 737</p>
                <p><strong>SIRET :</strong> 890 493 737 00013</p>
                <p>
                  <strong>Directeur de la publication :</strong> le représentant légal de la société éditrice, identifiable auprès du registre du commerce et des sociétés mentionné ci-dessus.
                </p>
              </div>
            </section>

            {/* Section 2 - Contact */}
            <section className="bg-card p-6 rounded-lg border">
              <div className="flex items-start gap-3 mb-4">
                <Mail className="w-6 h-6 text-primary mt-1" />
                <div>
                  <h2 className="text-2xl font-bold mb-2">2. Contact</h2>
                </div>
              </div>
              <div className="space-y-3 text-foreground">
                <div className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-primary" />
                  <p>
                    <strong>Email :</strong>{" "}
                    <a href="mailto:contact@prime-energies.fr" className="text-primary underline">
                      contact@prime-energies.fr
                    </a>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-primary" />
                  <p>
                    <strong>Site web :</strong>{" "}
                    <a href="https://prime-energies.fr" className="text-primary underline">
                      https://prime-energies.fr
                    </a>
                  </p>
                </div>
              </div>
            </section>

            {/* Section 3 - Hébergement */}
            <section className="bg-card p-6 rounded-lg border">
              <div className="flex items-start gap-3 mb-4">
                <Server className="w-6 h-6 text-primary mt-1" />
                <div>
                  <h2 className="text-2xl font-bold mb-2">3. Hébergement</h2>
                </div>
              </div>
              <div className="space-y-3 text-foreground">
                <p>
                  <strong>Hébergeur frontal :</strong> Lovable (plateforme de développement et déploiement) — infrastructure Vercel.
                </p>
                <p>
                  <strong>Backend et base de données :</strong> Supabase Inc., 970 Toa Payoh North, #07-04, Singapore 318992 —{" "}
                  <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                    https://supabase.com
                  </a>
                </p>
                <p className="text-sm text-muted-foreground">
                  Les données sont hébergées dans des régions conformes au RGPD, avec des garanties appropriées pour les transferts éventuels hors Union européenne.
                </p>
              </div>
            </section>

            {/* Section 4 - Notre métier */}
            <section className="bg-card p-6 rounded-lg border">
              <div className="flex items-start gap-3 mb-4">
                <BookOpen className="w-6 h-6 text-primary mt-1" />
                <div>
                  <h2 className="text-2xl font-bold mb-2">4. Notre métier</h2>
                </div>
              </div>
              <div className="space-y-3 text-foreground">
                <p>
                  Chez FRH, nous accompagnons les particuliers dans leurs projets de rénovation énergétique, de l'étude jusqu'à la réalisation des travaux. Notre rôle : vous conseiller, vous orienter et réaliser un chantier de qualité.
                </p>
                <p>
                  Pour que tout soit clair entre nous : FRH est une entreprise privée, indépendante des administrations. Ce sont les organismes publics qui décident et versent les aides — nous, nous sommes là pour vous aider à monter votre projet et à y voir clair dans les dispositifs existants.
                </p>
              </div>
            </section>

            {/* Section 5 - Les aides */}
            <section className="bg-card p-6 rounded-lg border">
              <div className="flex items-start gap-3 mb-4">
                <Award className="w-6 h-6 text-primary mt-1" />
                <div>
                  <h2 className="text-2xl font-bold mb-2">5. Les aides à la rénovation : ce qu'il faut savoir</h2>
                </div>
              </div>
              <div className="space-y-3 text-foreground">
                <p>
                  Sur ce site, nous évoquons les principales aides — MaPrimeRénov' (ANAH), les primes CEE (certificats d'économies d'énergie), la TVA à taux réduit (5,5&nbsp;% / 10&nbsp;%) et l'éco-prêt à taux zéro. Ces informations sont données à titre indicatif : les montants et les conditions sont fixés par les pouvoirs publics et évoluent régulièrement.
                </p>
                <p>
                  Le montant auquel vous avez droit dépend de votre situation (revenus, logement, travaux…) et reste, au final, à l'appréciation des organismes compétents — d'où l'importance de bien vérifier votre éligibilité avant de vous engager.
                </p>
                <p>
                  Pour une information officielle, gratuite et toujours à jour, le service public France Rénov' est votre meilleur réflexe :
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    France Rénov' (portail public gratuit) —{" "}
                    <a href="https://france-renov.gouv.fr" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                      https://france-renov.gouv.fr
                    </a>
                  </li>
                  <li>
                    MaPrimeRénov' / ANAH —{" "}
                    <a href="https://www.anah.gouv.fr" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                      https://www.anah.gouv.fr
                    </a>
                  </li>
                  <li>
                    Primes CEE —{" "}
                    <a href="https://france-renov.gouv.fr/aides/cee" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                      https://france-renov.gouv.fr/aides/cee
                    </a>
                  </li>
                  <li>
                    ADEME —{" "}
                    <a href="https://agirpourlatransition.ademe.fr" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                      https://agirpourlatransition.ademe.fr
                    </a>
                  </li>
                </ul>
                <p className="text-sm text-muted-foreground">
                  Un conseil gratuit et neutre, sans engagement : 0 808 800 700 (service gratuit + prix d'un appel).
                </p>
              </div>
            </section>

            {/* Section 6 - Certifications */}
            <section className="bg-card p-6 rounded-lg border">
              <div className="flex items-start gap-3 mb-4">
                <Shield className="w-6 h-6 text-primary mt-1" />
                <div>
                  <h2 className="text-2xl font-bold mb-2">6. Nos certifications</h2>
                </div>
              </div>
              <div className="space-y-3 text-foreground">
                <p>
                  Nos travaux sont réalisés par FRH, certifiée <strong>RGE QualiPV</strong> — un gage de sérieux que vous pouvez vérifier à tout moment sur l'annuaire officiel des professionnels qualifiés :{" "}
                  <a href="https://france-renov.gouv.fr" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                    france-renov.gouv.fr
                  </a>.
                </p>
                <p>
                  Les logos QualiPV/RGE présents sur le site correspondent à cette certification. Lorsque nous citons « MaPrimeRénov' », « ANAH », « France Rénov' » ou « ADEME », c'est uniquement pour vous informer des dispositifs disponibles : ces noms appartiennent à leurs organismes respectifs, et nous les mentionnons sans lien de partenariat particulier avec eux.
                </p>
              </div>
            </section>

            {/* Section 7 - Propriété intellectuelle */}
            <section className="bg-card p-6 rounded-lg border">
              <div className="flex items-start gap-3 mb-4">
                <Globe className="w-6 h-6 text-primary mt-1" />
                <div>
                  <h2 className="text-2xl font-bold mb-2">7. Propriété intellectuelle</h2>
                </div>
              </div>
              <div className="space-y-3 text-foreground">
                <p>
                  L'ensemble du contenu du site <strong>prime-energies.fr</strong> (structure, textes, logos propres, images, vidéos, éléments graphiques, code source) est la propriété exclusive de FRANCE RENOV HABITAT ENVIRONNEMENT ou de ses partenaires et est protégé par les lois françaises et internationales relatives à la propriété intellectuelle.
                </p>
                <p>
                  Toute reproduction, distribution, modification, adaptation, retransmission ou publication, même partielle, de ces différents éléments est strictement interdite sans l'accord expris par écrit de FRH. Les marques « Prime Énergies » ainsi que les logos associés sont des marques déposées.
                </p>
              </div>
            </section>

            {/* Section 8 - Protection des données */}
            <section className="bg-card p-6 rounded-lg border">
              <div className="flex items-start gap-3 mb-4">
                <UserCheck className="w-6 h-6 text-primary mt-1" />
                <div>
                  <h2 className="text-2xl font-bold mb-2">8. Protection de vos données personnelles</h2>
                  <p className="text-sm text-muted-foreground">Dernière mise à jour : 10/06/2026</p>
                </div>
              </div>
              <div className="space-y-4 text-foreground">
                <p>
                  Cette rubrique est consacrée à la protection de votre vie privée. Elle vous explique quelles informations nous recueillons lorsque vous utilisez notre site, pourquoi, et quels sont vos droits. Pour nous, c'est important : nous voulons que vous puissiez utiliser nos services en toute confiance.
                </p>

                <div className="space-y-2">
                  <h3 className="font-bold">1. Responsable de traitement</h3>
                  <p>
                    FRANCE RENOV HABITAT ENVIRONNEMENT (FRH), 196 avenue Jean Lolive, 93500 Pantin —{" "}
                    <a href="mailto:contact@prime-energies.fr" className="text-primary underline">
                      contact@prime-energies.fr
                    </a>.
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="font-bold">2. Données que nous recueillons</h3>
                  <p>
                    Lorsque vous remplissez un formulaire : nom, prénom, e-mail, code postal / adresse, et informations sur votre projet (type de logement, travaux envisagés, statut d'occupation). Si vous le renseignez, votre numéro de téléphone. Automatiquement, lors de votre navigation : adresse IP et données d'usage (voir la rubrique Cookies).
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="font-bold">3. Pourquoi nous les utilisons (et sur quelle base légale)</h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Répondre à votre demande et étudier votre projet de rénovation — mesures précontractuelles / votre consentement ;</li>
                    <li>Établir un devis et réaliser les travaux — exécution du contrat ;</li>
                    <li>Améliorer le site et mesurer son audience — intérêt légitime / consentement (cookies) ;</li>
                    <li>Respecter nos obligations comptables et fiscales — obligation légale.</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h3 className="font-bold">4. Qui reçoit vos données</h3>
                  <p>
                    Elles sont traitées par les équipes de FRH et par ses prestataires techniques agissant pour son compte (hébergeur, outils de mesure d'audience). Vos données ne sont jamais vendues, ni transmises à d'autres installateurs ou à des tiers à des fins commerciales.
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="font-bold">5. Vous gardez la main</h3>
                  <p>
                    Nous ne vous recontactons que si vous en avez fait la demande via nos formulaires, et vous pouvez retirer cet accord à tout moment.
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="font-bold">6. Combien de temps nous les conservons</h3>
                  <p>
                    Prospects : 3 ans à compter du dernier contact. Clients : durée de la relation contractuelle, puis durées légales de conservation (jusqu'à 10 ans pour les pièces comptables).
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="font-bold">7. Traitements hors Union européenne</h3>
                  <p>
                    Certains prestataires peuvent traiter des données en dehors de l'UE. Dans ce cas, des garanties appropriées (clauses contractuelles types de la Commission européenne) encadrent ces transferts.
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="font-bold">8. Vos droits</h3>
                  <p>
                    Vous disposez d'un droit d'accès, de rectification, d'effacement, de limitation, d'opposition, de portabilité et de retrait de votre consentement. Pour les exercer, écrivez-nous à{" "}
                    <a href="mailto:contact@prime-energies.fr" className="text-primary underline">
                      contact@prime-energies.fr
                    </a>{" "}
                    (une preuve d'identité peut vous être demandée).
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="font-bold">9. Réclamation</h3>
                  <p>
                    Si vous estimez que vos droits ne sont pas respectés, vous pouvez saisir la CNIL : 3 place de Fontenoy, TSA 80715, 75334 Paris Cedex 07 —{" "}
                    <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                      https://www.cnil.fr
                    </a>.
                  </p>
                </div>

                <p className="text-sm text-muted-foreground">
                  Pour plus de détails, vous pouvez également consulter notre{" "}
                  <a href="/politique-confidentialite" className="text-primary underline font-semibold">
                    Politique de confidentialité
                  </a>.
                </p>
              </div>
            </section>

            {/* Section 9 - Cookies */}
            <section className="bg-card p-6 rounded-lg border">
              <div className="flex items-start gap-3 mb-4">
                <Cookie className="w-6 h-6 text-primary mt-1" />
                <div>
                  <h2 className="text-2xl font-bold mb-2">9. Politique relative aux cookies</h2>
                  <p className="text-sm text-muted-foreground">Dernière mise à jour : 10/06/2026</p>
                </div>
              </div>
              <div className="space-y-4 text-foreground">
                <p>
                  <strong>Qu'est-ce qu'un cookie ?</strong> Un cookie est un petit fichier texte déposé sur votre appareil (ordinateur, mobile, tablette) lorsque vous consultez un site. Il permet, pendant sa durée de validité, de reconnaître votre appareil et de mémoriser certaines informations sur votre navigation.
                </p>

                <div className="space-y-2">
                  <h3 className="font-bold">Les cookies que nous utilisons</h3>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>
                      <strong>Cookies techniques</strong> — indispensables au bon fonctionnement du site (navigation, formulaires, sécurité). Ils ne peuvent pas être désactivés.
                    </li>
                    <li>
                      <strong>Cookies de mesure d'audience</strong> — ils nous aident à comprendre comment le site est utilisé pour l'améliorer (par ex. Google Analytics).
                    </li>
                    <li>
                      <strong>Cookies publicitaires</strong> — le cas échéant, pour vous proposer des contenus adaptés et mesurer nos campagnes.
                    </li>
                    <li>
                      <strong>Cookies de réseaux sociaux</strong> — si vous utilisez des boutons de partage, le réseau social concerné peut déposer ses propres cookies (consultez sa politique de confidentialité).
                    </li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h3 className="font-bold">Votre choix</h3>
                  <p>
                    À votre arrivée sur le site, un bandeau vous permet d'accepter ou de refuser les cookies non essentiels. Les cookies non techniques ne sont déposés qu'avec votre consentement. Vous pouvez modifier ou retirer votre choix à tout moment via le lien « Gérer les cookies » en bas de page, ou en paramétrant votre navigateur (chaque navigateur propose, dans son menu d'aide, des réglages pour accepter, refuser ou supprimer les cookies).
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="font-bold">Durée de conservation</h3>
                  <p>
                    Les cookies sont conservés 13 mois maximum. Le refus des cookies non essentiels n'empêche pas la consultation du site.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 10 - Responsabilité */}
            <section className="bg-card p-6 rounded-lg border">
              <div className="flex items-start gap-3 mb-4">
                <Building2 className="w-6 h-6 text-primary mt-1" />
                <div>
                  <h2 className="text-2xl font-bold mb-2">10. Responsabilité et garanties</h2>
                </div>
              </div>
              <div className="space-y-3 text-foreground">
                <p>
                  FRH s'efforce d'assurer l'exactitude et la mise à jour des informations diffusées sur le site. Toutefois, FRH ne peut garantir l'exactitude, la précision ou l'exhaustivité des informations mises à disposition.
                </p>
                <p>
                  En conséquence, FRH décline toute responsabilité pour :
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Les inexactitudes, erreurs ou omissions présentes dans les informations disponibles</li>
                  <li>Les dommages directs ou indirects résultant de l'utilisation du site</li>
                  <li>L'indisponibilité temporaire du site pour maintenance ou cas de force majeure</li>
                  <li>Les services et prestations fournis par des entreprises tierces référencées</li>
                </ul>
                <p>
                  <strong>Important :</strong> les informations relatives aux aides publiques sont données à titre indicatif. Seuls les organismes publics compétents sont habilités à valider définitivement votre éligibilité et le montant de vos aides.
                </p>
              </div>
            </section>

            {/* Section 11 - Liens hypertextes */}
            <section className="bg-card p-6 rounded-lg border">
              <div className="flex items-start gap-3 mb-4">
                <Globe className="w-6 h-6 text-primary mt-1" />
                <div>
                  <h2 className="text-2xl font-bold mb-2">11. Liens hypertextes</h2>
                </div>
              </div>
              <div className="space-y-3 text-foreground">
                <p><strong>11.1 Liens sortants</strong></p>
                <p>
                  Le site peut contenir des liens vers des sites tiers. FRH ne contrôle pas ces sites et décline toute responsabilité quant à leur contenu, leurs pratiques de confidentialité ou leur disponibilité.
                </p>
                <p><strong>11.2 Liens entrants</strong></p>
                <p>
                  La création de liens hypertextes vers le site prime-energies.fr est autorisée, sous réserve qu'ils pointent uniquement vers la page d'accueil ou des pages internes spécifiques, et qu'ils ne suggèrent pas une affiliation ou une approbation non existante.
                </p>
              </div>
            </section>

            {/* Section 12 - Médiation */}
            <section className="bg-card p-6 rounded-lg border">
              <div className="flex items-start gap-3 mb-4">
                <UserCheck className="w-6 h-6 text-primary mt-1" />
                <div>
                  <h2 className="text-2xl font-bold mb-2">12. Médiation et litiges</h2>
                </div>
              </div>
              <div className="space-y-3 text-foreground">
                <p>
                  Conformément aux articles L.616-1 et R.616-1 du Code de la consommation, nous proposons un dispositif de médiation de la consommation.
                </p>
                <p>
                  <strong>Médiateur :</strong> [Nom du médiateur]<br />
                  <strong>Adresse :</strong> [Adresse complète]<br />
                  <strong>Site web :</strong>{" "}
                  <a href="#" className="text-primary underline">
                    [URL du médiateur]
                  </a>
                </p>
                <p>
                  Après démarche préalable écrite auprès de FRH, tout litige pourra être soumis au médiateur dans un délai d'un an suivant la réclamation écrite.
                </p>
              </div>
            </section>

            {/* Section 13 - Droit applicable */}
            <section className="bg-card p-6 rounded-lg border">
              <div className="flex items-start gap-3 mb-4">
                <Building2 className="w-6 h-6 text-primary mt-1" />
                <div>
                  <h2 className="text-2xl font-bold mb-2">13. Droit applicable</h2>
                </div>
              </div>
              <div className="text-foreground">
                <p>
                  Les présentes mentions légales sont régies par le droit français. En cas de litige et à défaut d'accord amiable, le litige sera porté devant les tribunaux français conformément aux règles de compétence en vigueur.
                </p>
              </div>
            </section>

            {/* Section 14 - Crédits */}
            <section className="bg-card p-6 rounded-lg border">
              <div className="flex items-start gap-3 mb-4">
                <Globe className="w-6 h-6 text-primary mt-1" />
                <div>
                  <h2 className="text-2xl font-bold mb-2">14. Crédits</h2>
                </div>
              </div>
              <div className="text-foreground space-y-3">
                <p><strong>Conception et développement :</strong> FRANCE RENOV HABITAT ENVIRONNEMENT</p>
                <p><strong>Crédits photos :</strong> [Sources des images utilisées]</p>
                <p><strong>Technologies utilisées :</strong></p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>React & TypeScript</li>
                  <li>Tailwind CSS</li>
                  <li>Supabase (Backend & Database)</li>
                </ul>
              </div>
            </section>

          </div>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default MentionsLegales;
