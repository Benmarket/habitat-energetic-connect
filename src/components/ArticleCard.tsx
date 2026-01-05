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
      <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 h-full flex flex-col group border-border/50 rounded-2xl">
        <CardContent className="p-6 flex-1 flex flex-col">
          <Link to={articleUrl} className="group/link flex-1 flex flex-col">
            <h3 className="text-xl font-bold mb-3 group-hover/link:text-primary transition-colors line-clamp-2 leading-tight text-foreground">
              {title}
            </h3>
            <p className="text-muted-foreground text-sm line-clamp-3 leading-relaxed flex-1">{excerpt}</p>
          </Link>
          <Link 
            to={articleUrl} 
            className="inline-flex items-center gap-2 text-primary font-semibold mt-4 hover:gap-3 transition-all duration-200"
          >
            Lire le guide
            <ArrowRight className="w-4 h-4" />
          </Link>
        </CardContent>
      </Card>
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
