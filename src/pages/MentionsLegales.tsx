import { Helmet } from "react-helmet";
import { Building2, Mail, Phone, Globe, Server, UserCheck } from "lucide-react";

const MentionsLegales = () => {
  return (
    <>
      <Helmet>
        <title>Mentions légales | Prime Énergies</title>
        <meta name="description" content="Mentions légales de la plateforme Prime Énergies. Informations légales et réglementaires." />
        <meta name="robots" content="index, follow" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-primary/10 rounded-full">
                <Building2 className="w-12 h-12 text-primary" />
              </div>
            </div>
            <h1 className="text-4xl font-bold mb-4">Mentions légales</h1>
            <p className="text-muted-foreground">
              Informations légales et réglementaires
            </p>
          </div>

          {/* Content sections */}
          <div className="space-y-8">
            {/* Section 1 */}
            <section className="bg-card p-6 rounded-lg border">
              <div className="flex items-start gap-3 mb-4">
                <Building2 className="w-6 h-6 text-primary mt-1" />
                <div>
                  <h2 className="text-2xl font-bold mb-2">1. Éditeur du site</h2>
                </div>
              </div>
              <div className="space-y-3 text-foreground">
                <p><strong>Raison sociale :</strong> Prime Énergies</p>
                <p><strong>Forme juridique :</strong> [SAS/SARL/etc.]</p>
                <p><strong>Capital social :</strong> [Montant] €</p>
                <p><strong>Siège social :</strong><br />
                [Adresse complète]<br />
                [Code postal] [Ville]<br />
                France</p>
                <p><strong>SIRET :</strong> [Numéro SIRET]</p>
                <p><strong>RCS :</strong> [RCS Ville]</p>
                <p><strong>TVA intracommunautaire :</strong> [Numéro TVA]</p>
                <p><strong>Directeur de la publication :</strong> [Nom et Prénom]</p>
              </div>
            </section>

            {/* Section 2 */}
            <section className="bg-card p-6 rounded-lg border">
              <div className="flex items-start gap-3 mb-4">
                <Mail className="w-6 h-6 text-primary mt-1" />
                <div>
                  <h2 className="text-2xl font-bold mb-2">2. Contact</h2>
                </div>
              </div>
              <div className="space-y-3 text-foreground">
                <div className="flex items-center gap-2">
                  <Phone className="w-5 h-5 text-primary" />
                  <p><strong>Téléphone :</strong> 0 800 123 456 (appel gratuit)</p>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-primary" />
                  <p><strong>Email :</strong> <a href="mailto:contact@prime-energies.fr" className="text-primary underline">contact@prime-energies.fr</a></p>
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-primary" />
                  <p><strong>Site web :</strong> <a href="https://prime-energies.fr" className="text-primary underline">https://prime-energies.fr</a></p>
                </div>
              </div>
            </section>

            {/* Section 3 */}
            <section className="bg-card p-6 rounded-lg border">
              <div className="flex items-start gap-3 mb-4">
                <Server className="w-6 h-6 text-primary mt-1" />
                <div>
                  <h2 className="text-2xl font-bold mb-2">3. Hébergement</h2>
                </div>
              </div>
              <div className="space-y-3 text-foreground">
                <p><strong>Hébergeur :</strong> Supabase Inc.</p>
                <p><strong>Siège social :</strong><br />
                970 Toa Payoh North, #07-04<br />
                Singapore 318992</p>
                <p><strong>Site web :</strong> <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">https://supabase.com</a></p>
                <p className="text-sm text-muted-foreground">
                  Les serveurs sont hébergés en Europe (conformité RGPD)
                </p>
              </div>
            </section>

            {/* Section 4 */}
            <section className="bg-card p-6 rounded-lg border">
              <div className="flex items-start gap-3 mb-4">
                <UserCheck className="w-6 h-6 text-primary mt-1" />
                <div>
                  <h2 className="text-2xl font-bold mb-2">4. Délégué à la Protection des Données (DPO)</h2>
                </div>
              </div>
              <div className="space-y-3 text-foreground">
                <p>
                  Conformément au Règlement Général sur la Protection des Données (RGPD), 
                  un Délégué à la Protection des Données a été désigné :
                </p>
                <p><strong>Nom :</strong> [Nom du DPO]</p>
                <p><strong>Email :</strong> <a href="mailto:dpo@prime-energies.fr" className="text-primary underline">dpo@prime-energies.fr</a></p>
                <p className="mt-4">
                  Pour toute question relative à la protection de vos données personnelles, 
                  vous pouvez contacter notre DPO qui répondra dans un délai maximum d'un mois.
                </p>
              </div>
            </section>

            {/* Section 5 */}
            <section className="bg-card p-6 rounded-lg border">
              <div className="flex items-start gap-3 mb-4">
                <Globe className="w-6 h-6 text-primary mt-1" />
                <div>
                  <h2 className="text-2xl font-bold mb-2">5. Propriété intellectuelle</h2>
                </div>
              </div>
              <div className="space-y-3 text-foreground">
                <p>
                  L'ensemble du contenu du site <strong>prime-energies.fr</strong> (structure, textes, logos, 
                  images, vidéos, éléments graphiques, code source) est la propriété exclusive de Prime Énergies 
                  ou de ses partenaires et est protégé par les lois françaises et internationales relatives à la 
                  propriété intellectuelle.
                </p>
                <p className="mt-4">
                  Toute reproduction, distribution, modification, adaptation, retransmission ou publication, 
                  même partielle, de ces différents éléments est strictement interdite sans l'accord exprès 
                  par écrit de Prime Énergies.
                </p>
                <p className="mt-4">
                  <strong>Marques déposées :</strong><br />
                  Les marques « Prime Énergies » ainsi que les logos associés sont des marques déposées. 
                  Toute utilisation non autorisée constitue une contrefaçon et est passible de poursuites.
                </p>
              </div>
            </section>

            {/* Section 6 */}
            <section className="bg-card p-6 rounded-lg border">
              <div className="flex items-start gap-3 mb-4">
                <Server className="w-6 h-6 text-primary mt-1" />
                <div>
                  <h2 className="text-2xl font-bold mb-2">6. Données personnelles et cookies</h2>
                </div>
              </div>
              <div className="space-y-3 text-foreground">
                <p>
                  Le site collecte et traite des données personnelles conformément au RGPD. 
                  Pour plus d'informations sur la gestion de vos données personnelles et vos droits, 
                  consultez notre <a href="/politique-confidentialite" className="text-primary underline font-semibold">Politique de confidentialité</a>.
                </p>
                <p className="mt-4">
                  Le site utilise des cookies pour améliorer l'expérience utilisateur et réaliser des statistiques. 
                  Vous pouvez gérer vos préférences via notre bandeau de consentement conforme au 
                  <strong> Consent Mode de Google</strong> et à la directive ePrivacy.
                </p>
              </div>
            </section>

            {/* Section 7 */}
            <section className="bg-card p-6 rounded-lg border">
              <div className="flex items-start gap-3 mb-4">
                <Building2 className="w-6 h-6 text-primary mt-1" />
                <div>
                  <h2 className="text-2xl font-bold mb-2">7. Responsabilité et garanties</h2>
                </div>
              </div>
              <div className="space-y-3 text-foreground">
                <p>
                  Prime Énergies s'efforce d'assurer l'exactitude et la mise à jour des informations diffusées 
                  sur le site. Toutefois, Prime Énergies ne peut garantir l'exactitude, la précision ou 
                  l'exhaustivité des informations mises à disposition.
                </p>
                <p className="mt-4">
                  En conséquence, Prime Énergies décline toute responsabilité pour :
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Les inexactitudes, erreurs ou omissions présentes dans les informations disponibles</li>
                  <li>Les dommages directs ou indirects résultant de l'utilisation du site</li>
                  <li>L'indisponibilité temporaire du site pour maintenance ou cas de force majeure</li>
                  <li>Les services et prestations fournis par les entreprises partenaires référencées</li>
                </ul>
                <p className="mt-4">
                  <strong>Important :</strong> Prime Énergies est une plateforme de mise en relation. 
                  Les contrats commerciaux sont conclus directement entre les utilisateurs et les entreprises 
                  partenaires. Prime Énergies n'est pas partie à ces contrats et n'engage pas sa responsabilité 
                  sur les prestations réalisées.
                </p>
              </div>
            </section>

            {/* Section 8 */}
            <section className="bg-card p-6 rounded-lg border">
              <div className="flex items-start gap-3 mb-4">
                <Globe className="w-6 h-6 text-primary mt-1" />
                <div>
                  <h2 className="text-2xl font-bold mb-2">8. Liens hypertextes</h2>
                </div>
              </div>
              <div className="space-y-3 text-foreground">
                <p><strong>8.1 Liens sortants</strong></p>
                <p>
                  Le site peut contenir des liens vers des sites tiers. Prime Énergies ne contrôle pas 
                  ces sites et décline toute responsabilité quant à leur contenu, leurs pratiques de 
                  confidentialité ou leur disponibilité.
                </p>
                <p className="mt-4"><strong>8.2 Liens entrants</strong></p>
                <p>
                  La création de liens hypertextes vers le site prime-energies.fr est autorisée, 
                  sous réserve qu'ils pointent uniquement vers la page d'accueil ou des pages internes 
                  spécifiques, et qu'ils ne suggèrent pas une affiliation ou une approbation non existante.
                </p>
              </div>
            </section>

            {/* Section 9 */}
            <section className="bg-card p-6 rounded-lg border">
              <div className="flex items-start gap-3 mb-4">
                <UserCheck className="w-6 h-6 text-primary mt-1" />
                <div>
                  <h2 className="text-2xl font-bold mb-2">9. Médiation et litiges</h2>
                </div>
              </div>
              <div className="space-y-3 text-foreground">
                <p>
                  Conformément aux articles L.616-1 et R.616-1 du Code de la consommation, 
                  nous proposons un dispositif de médiation de la consommation.
                </p>
                <p className="mt-4">
                  <strong>Médiateur :</strong> [Nom du médiateur]<br />
                  <strong>Adresse :</strong> [Adresse complète]<br />
                  <strong>Site web :</strong> <a href="#" className="text-primary underline">[URL du médiateur]</a>
                </p>
                <p className="mt-4">
                  Après démarche préalable écrite auprès de Prime Énergies, tout litige pourra être 
                  soumis au médiateur dans un délai d'un an suivant la réclamation écrite.
                </p>
              </div>
            </section>

            {/* Section 10 */}
            <section className="bg-card p-6 rounded-lg border">
              <div className="flex items-start gap-3 mb-4">
                <Building2 className="w-6 h-6 text-primary mt-1" />
                <div>
                  <h2 className="text-2xl font-bold mb-2">10. Droit applicable</h2>
                </div>
              </div>
              <div className="text-foreground">
                <p>
                  Les présentes mentions légales sont régies par le droit français. 
                  En cas de litige et à défaut d'accord amiable, le litige sera porté devant les 
                  tribunaux français conformément aux règles de compétence en vigueur.
                </p>
              </div>
            </section>

            {/* Section 11 */}
            <section className="bg-card p-6 rounded-lg border">
              <div className="flex items-start gap-3 mb-4">
                <Globe className="w-6 h-6 text-primary mt-1" />
                <div>
                  <h2 className="text-2xl font-bold mb-2">11. Crédits</h2>
                </div>
              </div>
              <div className="text-foreground space-y-3">
                <p><strong>Conception et développement :</strong> Prime Énergies</p>
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
    </>
  );
};

export default MentionsLegales;
