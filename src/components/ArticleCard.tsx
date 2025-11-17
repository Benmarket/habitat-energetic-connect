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
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300 h-full flex flex-col">
      <Link to={articleUrl} className="block">
        <div className="aspect-video overflow-hidden">
          <img
            src={featuredImage}
            alt={title}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        </div>
      </Link>
      <CardContent className="p-6 flex-1 flex flex-col">
        <div className="flex items-center gap-4 mb-4">
          <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">
            {category}
          </Badge>
          <div className="flex items-center text-sm text-muted-foreground">
            <Calendar className="w-4 h-4 mr-1" />
            {format(new Date(publishedAt), "d MMMM yyyy", { locale: fr })}
          </div>
        </div>
        <Link to={articleUrl} className="group flex-1 flex flex-col">
          <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors line-clamp-2">
            {title}
          </h3>
          <p className="text-muted-foreground line-clamp-3">{excerpt}</p>
        </Link>
      </CardContent>
    </Card>
  );
};

export default ArticleCard;
