import { Helmet } from "react-helmet";
import type { RegionalFAQ } from "@/hooks/useRegionalContent";

interface LandingServiceSchemaProps {
  serviceName: string;
  regionName: string;
  description: string;
  url: string;
  faq?: RegionalFAQ[];
}

export const LandingServiceSchema = ({
  serviceName,
  regionName,
  description,
  url,
  faq,
}: LandingServiceSchemaProps) => {
  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: serviceName,
    description,
    areaServed: {
      "@type": "Place",
      name: regionName,
    },
    provider: {
      "@type": "Organization",
      name: "Prime Énergies",
      url: "https://prime-energies.fr",
      logo: {
        "@type": "ImageObject",
        url: "https://prime-energies.fr/logo.png",
      },
    },
    url,
  };

  const faqSchema = faq?.length
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faq.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer,
          },
        })),
      }
    : null;

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(serviceSchema)}</script>
      {faqSchema && (
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      )}
    </Helmet>
  );
};
