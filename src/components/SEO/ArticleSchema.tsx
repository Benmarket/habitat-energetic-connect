import { Helmet } from "react-helmet";

interface ArticleSchemaProps {
  title: string;
  description: string;
  imageUrl?: string;
  publishedDate?: string;
  modifiedDate?: string;
  authorName?: string;
  categories?: string[];
  url: string;
}

export const ArticleSchema = ({
  title,
  description,
  imageUrl,
  publishedDate,
  modifiedDate,
  authorName = "Prime Énergies",
  categories = [],
  url,
}: ArticleSchemaProps) => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description: description,
    image: imageUrl ? [imageUrl] : [],
    datePublished: publishedDate,
    dateModified: modifiedDate || publishedDate,
    author: {
      "@type": "Organization",
      name: authorName,
      url: "https://prime-energies.fr",
    },
    publisher: {
      "@type": "Organization",
      name: "Prime Énergies",
      logo: {
        "@type": "ImageObject",
        url: "https://prime-energies.fr/logo.png",
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
    articleSection: categories.length > 0 ? categories[0] : "Énergies renouvelables",
    keywords: categories.join(", "),
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
};
