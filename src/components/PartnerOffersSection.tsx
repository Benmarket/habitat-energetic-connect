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
    <section className="py-20 bg-gradient-to-b from-background via-amber-50/30 to-background relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-amber-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-yellow-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16 animate-fade-in">
          <div className="inline-flex items-center gap-3 mb-4 bg-gradient-to-r from-amber-500/10 to-yellow-500/10 px-8 py-4 rounded-full backdrop-blur-sm border-2 border-amber-500/30 shadow-lg shadow-amber-500/20 hover:shadow-xl hover:shadow-amber-500/30 transition-all duration-300 hover:scale-105">
            <div className="p-2 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-lg shadow-lg">
              <Tag className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-4xl font-extrabold bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 bg-clip-text text-transparent">
              Offres Partenaires Sélectionnées
            </h2>
          </div>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Découvrez les meilleures offres de nos partenaires certifiés pour vos projets d'énergies renouvelables
          </p>
          <div className="flex items-center justify-center gap-2 mt-4">
            <div className="h-1 w-12 bg-gradient-to-r from-transparent via-amber-500 to-transparent rounded-full"></div>
          </div>
        </div>

        {/* Offers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          {offers.map((offer) => (
            <Card 
              key={offer.id} 
              className="group relative overflow-hidden hover:shadow-2xl hover:shadow-amber-500/20 transition-all duration-500 border-2 border-amber-500/20 hover:border-amber-500/50 hover:-translate-y-2 bg-card/80 backdrop-blur-sm"
            >
              {/* Badge */}
              {offer.badge_text && (
                <Badge 
                  variant={getBadgeVariant(offer.badge_type)}
                  className={`absolute top-4 left-4 z-10 font-semibold shadow-lg ${
                    offer.badge_type === 'sponsored' 
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white border-amber-400/30 hover:from-amber-600 hover:to-yellow-600' 
                      : ''
                  }`}
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
                  <h3 className="text-2xl font-bold mb-2 group-hover:text-amber-600 transition-colors">
                    {offer.title}
                  </h3>
                  <p className="text-sm text-muted-foreground font-medium">
                    {offer.advertiser.name}
                  </p>
                </div>

                {/* Price */}
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl font-bold text-amber-600">
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
                          <Check className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* CTA Button */}
                <Button 
                  asChild
                  className="w-full mt-6 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-bold py-6 text-lg shadow-lg shadow-amber-500/30 hover:shadow-xl hover:shadow-amber-500/50 transition-all duration-300 hover:scale-105 border border-amber-400/30"
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
        <div className="text-center animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <Button 
            asChild
            size="lg"
            className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white border border-amber-400/30 font-bold px-10 py-6 text-lg shadow-lg shadow-amber-500/30 hover:shadow-xl hover:shadow-amber-500/50 transition-all duration-300 hover:scale-105"
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
