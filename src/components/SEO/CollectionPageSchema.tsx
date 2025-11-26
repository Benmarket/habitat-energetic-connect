import { Helmet } from "react-helmet";

interface CollectionItem {
  title: string;
  url: string;
  description?: string;
  imageUrl?: string;
}

interface CollectionPageSchemaProps {
  name: string;
  description: string;
  url: string;
  items: CollectionItem[];
}

export const CollectionPageSchema = ({
  name,
  description,
  url,
  items,
}: CollectionPageSchemaProps) => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: name,
    description: description,
    url: url,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: items.length,
      itemListElement: items.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "Article",
          name: item.title,
          url: item.url,
          description: item.description || "",
          ...(item.imageUrl && { image: item.imageUrl }),
        },
      })),
    },
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
};
