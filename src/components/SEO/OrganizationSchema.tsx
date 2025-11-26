import { Helmet } from "react-helmet";

export const OrganizationSchema = () => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Prime Énergies",
    url: "https://prime-energies.fr",
    logo: "https://prime-energies.fr/logo.png",
    description:
      "Bénéficiez d'une étude énergétique gratuite et découvrez les travaux subventionnés adaptés à votre logement. Panneaux solaires, pompe à chaleur, isolation.",
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "Service client",
      availableLanguage: ["French"],
    },
    sameAs: [
      // Ajoutez vos réseaux sociaux ici
    ],
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
};
