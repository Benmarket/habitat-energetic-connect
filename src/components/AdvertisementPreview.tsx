import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

interface AdvertisementPreviewProps {
  title: string;
  description: string;
  image: string | null;
  price: number;
  original_price: number | null;
  features: string[];
  cta_text: string;
  cta_url: string;
  badge_text: string | null;
  badge_type: string;
  advertiser_name?: string;
}

const AdvertisementPreview = ({
  title,
  description,
  image,
  price,
  original_price,
  features,
  cta_text,
  cta_url,
  badge_text,
  badge_type,
  advertiser_name = "Nom de l'annonceur",
}: AdvertisementPreviewProps) => {
  const getBadgeVariant = (type: string) => {
    switch (type) {
      case 'sponsored':
        return 'default';
      case 'new':
        return 'secondary';
      case 'featured':
        return 'destructive';
      default:
        return 'default';
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <p className="text-sm text-muted-foreground text-center mb-4">
        Aperçu de l'annonce telle qu'elle apparaîtra sur l'accueil
      </p>
      <Card 
        className="group relative overflow-hidden hover:shadow-2xl transition-all duration-500 border-2 hover:border-primary/50"
      >
        {/* Badge */}
        {badge_text && (
          <Badge 
            variant={getBadgeVariant(badge_type)}
            className="absolute top-4 left-4 z-10 font-semibold shadow-lg"
          >
            {badge_text}
          </Badge>
        )}

        {/* Image */}
        {image ? (
          <div className="relative h-64 overflow-hidden">
            <img 
              src={image} 
              alt={title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent"></div>
          </div>
        ) : (
          <div className="h-64 bg-muted flex items-center justify-center">
            <p className="text-muted-foreground">Aucune image</p>
          </div>
        )}

        <CardContent className="p-6 space-y-4">
          {/* Title & Advertiser */}
          <div>
            <h3 className="text-2xl font-bold mb-2 group-hover:text-primary transition-colors">
              {title || "Titre de l'offre"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {advertiser_name}
            </p>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-3">
            <span className="text-4xl font-bold text-green-600">
              {price ? price.toLocaleString('fr-FR') : '0'}€
            </span>
            {original_price && (
              <span className="text-xl text-muted-foreground line-through">
                {original_price.toLocaleString('fr-FR')}€
              </span>
            )}
          </div>

          {/* Description */}
          <p className="text-muted-foreground leading-relaxed">
            {description || "Description de l'offre"}
          </p>

          {/* Features */}
          {features && features.length > 0 && (
            <div className="space-y-2 pt-4 border-t">
              <p className="font-semibold text-sm">Avantages inclus :</p>
              <ul className="space-y-2">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* CTA Button */}
          <Button 
            disabled
            className="w-full mt-6 bg-green-600 hover:bg-green-700 text-white font-semibold py-6 text-lg shadow-lg"
          >
            {cta_text || "Voir l'offre"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdvertisementPreview;
