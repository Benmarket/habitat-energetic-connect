import { Helmet } from "react-helmet";

interface HowToStep {
  name: string;
  text: string;
}

interface HowToSchemaProps {
  name: string;
  description: string;
  imageUrl?: string;
  steps: HowToStep[];
  url: string;
}

export const HowToSchema = ({
  name,
  description,
  imageUrl,
  steps,
  url,
}: HowToSchemaProps) => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: name,
    description: description,
    image: imageUrl ? [imageUrl] : [],
    step: steps.map((step, index) => ({
      "@type": "HowToStep",
      position: index + 1,
      name: step.name,
      text: step.text,
    })),
    url: url,
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
};
