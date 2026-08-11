/**
 * Anciennes URLs de listing du blog Wix : /blog et /blog/categories/<catégorie>.
 * On renvoie vers l'équivalent actuel (/actualites, éventuellement filtré par catégorie).
 */

import { useParams, Navigate } from "react-router-dom";

const CATEGORY_MAP: Record<string, string> = {
  "panneaux-photovoltaiques": "photovoltaique",
  photovoltaique: "photovoltaique",
  solaire: "solaire",
  "energie-solaire": "solaire",
  aides: "subventions",
  subventions: "subventions",
  electricite: "electricite",
  environnement: "environnement",
  temoignages: "temoignages",
};

export default function LegacyBlog() {
  const { categorySlug } = useParams();

  if (!categorySlug) return <Navigate to="/actualites" replace />;

  const mapped = CATEGORY_MAP[decodeURIComponent(categorySlug).toLowerCase()];
  return <Navigate to={mapped ? `/actualites?categorie=${mapped}` : "/actualites"} replace />;
}
