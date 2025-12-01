import { Helmet } from "react-helmet";
import { FileText, Users, AlertTriangle, Scale, ShieldCheck, Ban, Home } from "lucide-react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const ConditionsUtilisation = () => {
  return (
    <>
      <Helmet>
        <title>Conditions d'utilisation | Prime Énergies</title>
        <meta name="description" content="Conditions générales d'utilisation de la plateforme Prime Énergies. Droits et obligations des utilisateurs." />
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
                <FileText className="w-12 h-12 text-primary" />
              </div>
            </div>
            <h1 className="text-4xl font-bold mb-4">Conditions d'utilisation</h1>
            <p className="text-muted-foreground">
              Dernière mise à jour : 27 novembre 2025
            </p>
          </div>

          {/* Introduction */}
          <div className="prose prose-slate max-w-none mb-8 bg-card p-6 rounded-lg border">
            <p className="text-foreground leading-relaxed">
              Les présentes Conditions Générales d'Utilisation (CGU) régissent l'utilisation de la plateforme 
              <strong> Prime Énergies</strong>, accessible à l'adresse <strong>prime-energies.fr</strong>. 
              En accédant et en utilisant ce site, vous acceptez sans réserve les présentes conditions.
            </p>
          </div>

          {/* Content sections */}
          <div className="space-y-8">
            {/* Section 1 */}
            <section className="bg-card p-6 rounded-lg border">
              <div className="flex items-start gap-3 mb-4">
                <FileText className="w-6 h-6 text-primary mt-1" />
                <div>
                  <h2 className="text-2xl font-bold mb-2">1. Objet de la plateforme</h2>
                </div>
              </div>
              <div className="space-y-3 text-foreground">
                <p>
                  Prime Énergies est une plateforme communautaire et un service de mise en relation entre :
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Les particuliers</strong> : recherchant des informations sur les énergies renouvelables, 
                  les subventions disponibles et souhaitant obtenir des devis</li>
                  <li><strong>Les professionnels partenaires</strong> : entreprises certifiées proposant des services 
                  d'installation et de conseil en énergies renouvelables</li>
                </ul>
                <p className="mt-4">
                  La plateforme propose également :
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Des actualités et guides sur les énergies renouvelables</li>
                  <li>Des simulateurs d'économies d'énergie</li>
                  <li>Un espace personnel pour gérer vos projets</li>
                  <li>Un système de chat pour l'assistance</li>
                </ul>
              </div>
            </section>

            {/* Section 2 */}
            <section className="bg-card p-6 rounded-lg border">
              <div className="flex items-start gap-3 mb-4">
                <Users className="w-6 h-6 text-primary mt-1" />
                <div>
                  <h2 className="text-2xl font-bold mb-2">2. Création et gestion du compte</h2>
                </div>
              </div>
              <div className="space-y-3 text-foreground">
                <p><strong>2.1 Inscription</strong></p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>L'inscription est gratuite et ouverte à toute personne majeure</li>
                  <li>Vous devez fournir des informations exactes et à jour</li>
                  <li>Vous êtes responsable de la confidentialité de vos identifiants</li>
                  <li>Toute utilisation frauduleuse de votre compte doit être signalée immédiatement</li>
                </ul>

                <p className="mt-4"><strong>2.2 Types de comptes</strong></p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Compte Particulier</strong> : pour les utilisateurs recherchant des informations 
                  et des devis</li>
                  <li><strong>Compte Professionnel</strong> : pour les entreprises partenaires (soumis à validation)</li>
                </ul>

                <p className="mt-4"><strong>2.3 Suppression du compte</strong></p>
                <p>
                  Vous pouvez supprimer votre compte à tout moment depuis votre espace personnel. 
                  La suppression entraîne l'effacement de vos données personnelles conformément à notre 
                  politique de confidentialité, sous réserve des obligations légales de conservation.
                </p>
              </div>
            </section>

            {/* Section 3 */}
            <section className="bg-card p-6 rounded-lg border">
              <div className="flex items-start gap-3 mb-4">
                <ShieldCheck className="w-6 h-6 text-primary mt-1" />
                <div>
                  <h2 className="text-2xl font-bold mb-2">3. Utilisation de la plateforme</h2>
                </div>
              </div>
              <div className="space-y-3 text-foreground">
                <p><strong>3.1 Utilisation autorisée</strong></p>
                <p>Vous vous engagez à utiliser la plateforme de manière légale et conformément aux présentes CGU :</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Respecter les droits des autres utilisateurs</li>
                  <li>Ne pas perturber le fonctionnement de la plateforme</li>
                  <li>Ne pas tenter d'accéder de manière non autorisée aux systèmes</li>
                  <li>Ne pas collecter des données d'autres utilisateurs sans autorisation</li>
                </ul>

                <p className="mt-4"><strong>3.2 Mise en relation avec les partenaires</strong></p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>En demandant un devis, vous acceptez d'être contacté par nos partenaires professionnels</li>
                  <li>La mise en relation ne constitue pas une obligation contractuelle de votre part</li>
                  <li>Les relations commerciales ultérieures se déroulent directement entre vous et le partenaire</li>
                  <li>Prime Énergies n'est pas partie aux contrats conclus entre utilisateurs et partenaires</li>
                </ul>

                <p className="mt-4"><strong>3.3 Simulateurs et outils</strong></p>
                <p>
                  Les simulateurs et outils proposés sont fournis à titre indicatif. Les résultats ne constituent 
                  pas un engagement contractuel et peuvent varier selon votre situation réelle.
                </p>
              </div>
            </section>

            {/* Section 4 */}
            <section className="bg-card p-6 rounded-lg border">
              <div className="flex items-start gap-3 mb-4">
                <Ban className="w-6 h-6 text-primary mt-1" />
                <div>
                  <h2 className="text-2xl font-bold mb-2">4. Comportements interdits</h2>
                </div>
              </div>
              <div className="space-y-3 text-foreground">
                <p>Sont strictement interdits :</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Publier des contenus illégaux, diffamatoires, injurieux ou discriminatoires</li>
                  <li>Usurper l'identité d'une autre personne ou entité</li>
                  <li>Transmettre des virus, malwares ou tout code malveillant</li>
                  <li>Tenter de contourner les mesures de sécurité de la plateforme</li>
                  <li>Utiliser des robots, scrapers ou autres outils automatisés non autorisés</li>
                  <li>Spammer ou harceler d'autres utilisateurs</li>
                  <li>Utiliser la plateforme à des fins commerciales non autorisées</li>
                  <li>Créer de faux comptes ou comptes multiples dans un but frauduleux</li>
                </ul>
              </div>
            </section>

            {/* Section 5 */}
            <section className="bg-card p-6 rounded-lg border">
              <div className="flex items-start gap-3 mb-4">
                <Scale className="w-6 h-6 text-primary mt-1" />
                <div>
                  <h2 className="text-2xl font-bold mb-2">5. Propriété intellectuelle</h2>
                </div>
              </div>
              <div className="space-y-3 text-foreground">
                <p>
                  Tous les contenus présents sur la plateforme (textes, images, logos, vidéos, design, code source) 
                  sont la propriété exclusive de Prime Énergies ou de ses partenaires et sont protégés par le droit 
                  d'auteur et les lois sur la propriété intellectuelle.
                </p>
                <p className="mt-4"><strong>Vous ne pouvez pas :</strong></p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Copier, reproduire ou redistribuer les contenus sans autorisation écrite</li>
                  <li>Utiliser les marques, logos ou éléments graphiques de Prime Énergies</li>
                  <li>Modifier, adapter ou créer des œuvres dérivées</li>
                  <li>Utiliser les contenus à des fins commerciales</li>
                </ul>
                <p className="mt-4">
                  <strong>Exception :</strong> Vous pouvez partager les liens vers nos articles et guides 
                  à des fins d'information personnelle.
                </p>
              </div>
            </section>

            {/* Section 6 */}
            <section className="bg-card p-6 rounded-lg border">
              <div className="flex items-start gap-3 mb-4">
                <AlertTriangle className="w-6 h-6 text-primary mt-1" />
                <div>
                  <h2 className="text-2xl font-bold mb-2">6. Responsabilités et garanties</h2>
                </div>
              </div>
              <div className="space-y-3 text-foreground">
                <p><strong>6.1 Responsabilité de Prime Énergies</strong></p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Nous nous efforçons d'assurer la disponibilité de la plateforme 24h/24, 7j/7, 
                  mais ne garantissons pas une disponibilité ininterrompue</li>
                  <li>Nous ne sommes pas responsables des dommages indirects résultant de l'utilisation 
                  ou de l'impossibilité d'utiliser la plateforme</li>
                  <li>Les informations fournies le sont à titre informatif et peuvent contenir des erreurs</li>
                  <li>Nous ne sommes pas responsables des services fournis par nos partenaires professionnels</li>
                </ul>

                <p className="mt-4"><strong>6.2 Responsabilité de l'utilisateur</strong></p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Vous êtes seul responsable de l'utilisation que vous faites de la plateforme</li>
                  <li>Vous garantissez l'exactitude des informations que vous fournissez</li>
                  <li>Vous êtes responsable de tout contenu que vous publiez</li>
                  <li>Vous vous engagez à indemniser Prime Énergies en cas de réclamation résultant 
                  de votre utilisation non conforme</li>
                </ul>
              </div>
            </section>

            {/* Section 7 */}
            <section className="bg-card p-6 rounded-lg border">
              <div className="flex items-start gap-3 mb-4">
                <ShieldCheck className="w-6 h-6 text-primary mt-1" />
                <div>
                  <h2 className="text-2xl font-bold mb-2">7. Modifications et suspension</h2>
                </div>
              </div>
              <div className="space-y-3 text-foreground">
                <p><strong>7.1 Modifications des CGU</strong></p>
                <p>
                  Nous nous réservons le droit de modifier les présentes CGU à tout moment. 
                  Les modifications prennent effet dès leur publication sur le site. 
                  Votre utilisation continue de la plateforme après modification vaut acceptation des nouvelles CGU.
                </p>

                <p className="mt-4"><strong>7.2 Suspension ou résiliation</strong></p>
                <p>
                  Nous nous réservons le droit de suspendre ou résilier votre compte en cas de :
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Non-respect des présentes CGU</li>
                  <li>Comportement frauduleux ou abusif</li>
                  <li>Inactivité prolongée (plus de 3 ans)</li>
                  <li>Demande des autorités compétentes</li>
                </ul>
              </div>
            </section>

            {/* Section 8 */}
            <section className="bg-card p-6 rounded-lg border">
              <div className="flex items-start gap-3 mb-4">
                <Scale className="w-6 h-6 text-primary mt-1" />
                <div>
                  <h2 className="text-2xl font-bold mb-2">8. Droit applicable et juridiction</h2>
                </div>
              </div>
              <div className="text-foreground space-y-3">
                <p>
                  Les présentes CGU sont régies par le droit français. En cas de litige, 
                  les tribunaux français seront seuls compétents.
                </p>
                <p className="mt-4">
                  Conformément aux dispositions du Code de la consommation concernant le règlement amiable 
                  des litiges, Prime Énergies adhère au Service du Médiateur [Nom du médiateur] 
                  dont les coordonnées sont les suivantes : [Adresse et site web du médiateur].
                </p>
              </div>
            </section>

            {/* Section 9 */}
            <section className="bg-card p-6 rounded-lg border">
              <div className="flex items-start gap-3 mb-4">
                <FileText className="w-6 h-6 text-primary mt-1" />
                <div>
                  <h2 className="text-2xl font-bold mb-2">9. Contact</h2>
                </div>
              </div>
              <div className="text-foreground space-y-3">
                <p>Pour toute question concernant les présentes CGU, vous pouvez nous contacter :</p>
                <p>
                  <strong>Prime Énergies</strong><br />
                  [Adresse complète]<br />
                  Email : <a href="mailto:contact@prime-energies.fr" className="text-primary underline">contact@prime-energies.fr</a><br />
                  Téléphone : 0 800 123 456
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

export default ConditionsUtilisation;
