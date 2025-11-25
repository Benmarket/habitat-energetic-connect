import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, Tag } from "lucide-react";
import { Link } from "react-router-dom";

interface Advertisement {
  id: string;
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
  advertiser: {
    name: string;
    logo: string | null;
  };
}

const PartnerOffersSection = () => {
  const [offers, setOffers] = useState<Advertisement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedOffers();
  }, []);

  const fetchFeaturedOffers = async () => {
    try {
      const { data, error } = await supabase
        .from("advertisements")
        .select(`
          *,
          advertiser:advertisers(name, logo)
        `)
        .eq("status", "active")
        .eq("is_featured", true)
        .order("created_at", { ascending: false })
        .limit(3);

      if (error) throw error;
      setOffers(data || []);
    } catch (error) {
      console.error("Error fetching featured offers:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="py-20 bg-gradient-to-b from-background via-primary/5 to-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="h-12 bg-muted animate-pulse rounded-full w-96 mx-auto mb-4"></div>
            <div className="h-6 bg-muted animate-pulse rounded w-2/3 mx-auto"></div>
          </div>
        </div>
      </section>
    );
  }

  if (offers.length === 0) return null;

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
    <section className="py-20 bg-gradient-to-b from-background via-primary/5 to-background relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Offres Partenaires Sélectionnées</h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Découvrez les meilleures offres de nos partenaires certifiés pour vos projets d'énergies renouvelables
          </p>
        </div>

        {/* Offers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {offers.map((offer) => (
            <Card 
              key={offer.id} 
              className="group relative overflow-hidden hover:shadow-2xl transition-all duration-500 border-2 hover:border-primary/50 hover:-translate-y-2"
            >
              {/* Badge */}
              {offer.badge_text && (
                <Badge 
                  variant={getBadgeVariant(offer.badge_type)}
                  className="absolute top-4 left-4 z-10 font-semibold shadow-lg"
                >
                  {offer.badge_text}
                </Badge>
              )}

              {/* Image */}
              {offer.image && (
                <div className="relative h-64 overflow-hidden">
                  <img 
                    src={offer.image} 
                    alt={offer.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent"></div>
                </div>
              )}

              <CardContent className="p-6 space-y-4">
                {/* Title & Advertiser */}
                <div>
                  <h3 className="text-2xl font-bold mb-2 group-hover:text-primary transition-colors">
                    {offer.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {offer.advertiser.name}
                  </p>
                </div>

                {/* Price */}
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl font-bold text-green-600">
                    {offer.price.toLocaleString('fr-FR')}€
                  </span>
                  {offer.original_price && (
                    <span className="text-xl text-muted-foreground line-through">
                      {offer.original_price.toLocaleString('fr-FR')}€
                    </span>
                  )}
                </div>

                {/* Description */}
                <p className="text-muted-foreground leading-relaxed">
                  {offer.description}
                </p>

                {/* Features */}
                {offer.features && offer.features.length > 0 && (
                  <div className="space-y-2 pt-4 border-t">
                    <p className="font-semibold text-sm">Avantages inclus :</p>
                    <ul className="space-y-2">
                      {offer.features.map((feature, index) => (
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
                  asChild
                  className="w-full mt-6 bg-green-600 hover:bg-green-700 text-white font-semibold py-6 text-lg shadow-lg hover:shadow-xl transition-all"
                >
                  <a href={offer.cta_url} target="_blank" rel="noopener noreferrer">
                    {offer.cta_text}
                  </a>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* View All Button */}
        <div className="text-center">
          <Button 
            asChild
            size="lg"
            className="bg-primary/10 hover:bg-primary/20 text-primary border-2 border-primary/30 hover:border-primary/50 font-semibold px-8 py-6 text-lg shadow-lg hover:shadow-xl transition-all"
          >
            <Link to="/offres-partenaires">
              Voir toutes les offres partenaires
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default PartnerOffersSection;
