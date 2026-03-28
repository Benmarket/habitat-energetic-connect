import { Helmet } from "react-helmet";

export const WebSiteSchema = () => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Prime Énergies",
    url: "https://prime-energies.fr",
    description:
      "Bénéficiez d'une étude énergétique gratuite et découvrez les travaux subventionnés adaptés à votre logement. Panneaux solaires, pompe à chaleur, isolation.",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: "https://prime-energies.fr/actualites?q={search_term_string}",
      },
      "query-input": "required name=search_term_string",
    },
    publisher: {
      "@type": "Organization",
      name: "Prime Énergies",
      url: "https://prime-energies.fr",
      logo: {
        "@type": "ImageObject",
        url: "https://prime-energies.fr/logo.png",
      },
    },
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
};
