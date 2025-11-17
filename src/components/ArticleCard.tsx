import { Link } from "react-router-dom";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface ArticleCardProps {
  id: string;
  title: string;
  excerpt: string;
  featuredImage: string;
  category: string;
  categorySlug: string;
  publishedAt: string;
  contentType: "actualite" | "guide" | "aide";
  slug: string;
}

const ArticleCard = ({
  title,
  excerpt,
  featuredImage,
  category,
  categorySlug,
  publishedAt,
  contentType,
  slug,
}: ArticleCardProps) => {
  const basePath = contentType === "actualite" ? "actualites" : contentType === "guide" ? "guides" : "aides";
  const articleUrl = `/${basePath}/${categorySlug}/${slug}`;

  return (
    <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 h-full flex flex-col group border-border/50">
      <Link to={articleUrl} className="block">
        <div className="aspect-video overflow-hidden bg-muted">
          <img
            src={featuredImage}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
      </Link>
      <CardContent className="p-6 flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 rounded-full px-4 py-1">
            {category}
          </Badge>
          <div className="flex items-center text-sm text-muted-foreground">
            {format(new Date(publishedAt), "d MMM yyyy", { locale: fr })}
          </div>
        </div>
        <Link to={articleUrl} className="group/link flex-1 flex flex-col">
          <h3 className="text-xl font-bold mb-3 group-hover/link:text-primary transition-colors line-clamp-2 leading-tight">
            {title}
          </h3>
          <p className="text-muted-foreground text-sm line-clamp-3 leading-relaxed">{excerpt}</p>
        </Link>
      </CardContent>
    </Card>
  );
};

export default ArticleCard;
