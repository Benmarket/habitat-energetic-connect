import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ArrowRight } from "lucide-react";

interface ArticleCardProps {
  id: string;
  title: string;
  excerpt: string;
  featuredImage: string;
  category: string;
  categorySlug: string;
  publishedAt: string;
  contentType: "actualite" | "guide" | "aide" | "annonce";
  slug: string;
  hideImage?: boolean;
  variant?: "default" | "guide";
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
  hideImage = false,
  variant = "default",
}: ArticleCardProps) => {
  const basePath = contentType === "actualite" ? "actualites" : contentType === "guide" ? "guides" : "aides";
  const articleUrl = `/${basePath}/${categorySlug}/${slug}`;

  if (variant === "guide") {
    return (
      <Link to={articleUrl} className="group block h-full">
        <Card className="h-full transition-all duration-500 hover:shadow-2xl hover:shadow-orange-500/20 hover:scale-[1.01] hover:-translate-y-1 bg-card/80 backdrop-blur-sm border-2 border-orange-500/20 hover:border-orange-500 overflow-hidden rounded-2xl">
          <CardContent className="p-6 flex flex-col h-full">
            <h3 className="text-xl font-bold mb-3 group-hover:text-orange-600 transition-colors duration-300 line-clamp-2 leading-tight text-foreground">
              {title}
            </h3>
            <p className="text-muted-foreground text-base line-clamp-3 leading-relaxed flex-1">{excerpt}</p>
            <div className="mt-6 flex items-center gap-2 text-orange-600 font-bold group-hover:gap-4 transition-all duration-300">
              <span>Lire le guide</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  }

  return (
    <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 h-full flex flex-col group border-border/50">
      {!hideImage && (
        <Link to={articleUrl} className="block">
          <div className="aspect-video overflow-hidden bg-muted">
            <img
              src={featuredImage}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>
        </Link>
      )}
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
