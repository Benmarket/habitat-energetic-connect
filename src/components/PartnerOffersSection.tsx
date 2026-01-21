import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, Tag, Clock, Award } from "lucide-react";
import { Link } from "react-router-dom";
import { format, differenceInDays, isPast } from "date-fns";
import { fr } from "date-fns/locale";
import { getOfferUrl } from "@/utils/slugify";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { useAdTracking } from "@/hooks/useAdTracking";
import { useRegionContext } from "@/hooks/useRegionContext";

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
  expires_at: string | null;
  is_rge_certified: boolean;
  rge_certification_text: string | null;
  advertiser: {
    name: string;
    logo: string | null;
  };
}

const PartnerOffersSection = () => {
  const [offers, setOffers] = useState<Advertisement[]>([]);
  const [loading, setLoading] = useState(true);
  const { trackView, trackClick } = useAdTracking();
  const { activeRegion } = useRegionContext();
  const trackedViews = useRef<Set<string>>(new Set());

  useEffect(() => {
    fetchFeaturedOffers();
  }, [activeRegion]);

  const fetchFeaturedOffers = async () => {
    try {
      // First, get featured ads for this region from ad_region_featured
      const { data: featuredData, error: featuredError } = await supabase
        .from("ad_region_featured")
        .select("advertisement_id, display_order")
        .eq("region_code", activeRegion)
        .order("display_order");

      if (featuredError) throw featuredError;

      const featuredIds = (featuredData || []).map(f => f.advertisement_id);

      // Fetch active advertisements with active advertisers only
      const { data: adsData, error: adsError } = await supabase
        .from("advertisements")
        .select(`
          *,
          advertiser:advertisers!inner(name, logo, is_active)
        `)
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (adsError) throw adsError;

      // Filter ads:
      // 1. Only from active advertisers
      // 2. Ads without target_regions are shown everywhere (national ads)
      // 3. Ads with target_regions must include current region
      const regionAds = (adsData || []).filter(ad => {
        // Check if advertiser is active
        if (!ad.advertiser?.is_active) return false;
        
        // Ads without target_regions = national, show everywhere
        if (!ad.target_regions || ad.target_regions.length === 0) return true;
        
        // Ads with target_regions must include current region
        return ad.target_regions.includes(activeRegion);
      });

      // Sort: featured first (in display_order), then others
      const sortedAds = regionAds.sort((a, b) => {
        const aFeaturedIndex = featuredIds.indexOf(a.id);
        const bFeaturedIndex = featuredIds.indexOf(b.id);
        
        // Both featured: sort by display_order
        if (aFeaturedIndex !== -1 && bFeaturedIndex !== -1) {
          return aFeaturedIndex - bFeaturedIndex;
        }
        // Only a is featured
        if (aFeaturedIndex !== -1) return -1;
        // Only b is featured
        if (bFeaturedIndex !== -1) return 1;
        // Neither featured: sort by date
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      setOffers(sortedAds);
      
      // Track views for first 3 offers (visible ones)
      sortedAds.slice(0, 3).forEach(offer => {
        if (!trackedViews.current.has(offer.id)) {
          trackView(offer.id);
          trackedViews.current.add(offer.id);
        }
      });
    } catch (error) {
      console.error("Error fetching offers:", error);
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

  const isOfferExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return isPast(new Date(expiresAt));
  };

  const getExpirationInfo = (expiresAt: string | null) => {
    if (!expiresAt) return null;
    const expirationDate = new Date(expiresAt);
    if (isPast(expirationDate)) return null; // Don't show if expired
    
    const daysLeft = differenceInDays(expirationDate, new Date());
    if (daysLeft === 1) return "Expire demain";
    if (daysLeft <= 7) return `Expire dans ${daysLeft} jours`;
    return `Jusqu'au ${format(expirationDate, "d MMMM", { locale: fr })}`;
  };

  return (
    <section id="offres" className="py-12 md:py-16 pb-8 md:pb-12 bg-gradient-to-b from-background via-amber-50/30 to-background relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-amber-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-yellow-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-10 md:mb-12 animate-fade-in">
          <div className="inline-flex items-center gap-2 md:gap-3 mb-4 bg-gradient-to-r from-amber-500/10 to-yellow-500/10 px-4 md:px-8 py-2 md:py-4 rounded-full backdrop-blur-sm border-2 border-amber-500/30 shadow-lg shadow-amber-500/20 hover:shadow-xl hover:shadow-amber-500/30 transition-all duration-300 hover:scale-105">
            <div className="p-1.5 md:p-2 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-lg shadow-lg">
              <Tag className="w-4 h-4 md:w-6 md:h-6 text-white" />
            </div>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-extrabold bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 bg-clip-text text-transparent whitespace-nowrap">
              Offres Partenaires
            </h2>
          </div>
          <p className="text-sm md:text-base lg:text-lg text-muted-foreground max-w-3xl mx-auto leading-snug px-4">
            Découvrez les meilleures offres de nos partenaires certifiés pour vos projets d'énergies renouvelables
          </p>
          <div className="flex items-center justify-center gap-2 mt-3">
            <div className="h-1 w-12 bg-gradient-to-r from-transparent via-amber-500 to-transparent rounded-full"></div>
          </div>
        </div>

        {/* Offers Carousel */}
        <div className="relative px-12 md:px-16">
          <Carousel
            opts={{
              align: "start",
              loop: true,
              slidesToScroll: 1,
            }}
            plugins={[
              Autoplay({
                delay: 5000,
              }),
            ]}
            className="w-full mt-6 mb-8 md:mb-12"
          >
            <CarouselContent className="-ml-4">
              {offers.map((offer) => (
                <CarouselItem key={offer.id} className="pl-4 basis-full md:basis-1/2 lg:basis-1/3">
                  <Card 
                    className="group relative overflow-hidden hover:shadow-2xl hover:shadow-amber-500/20 transition-all duration-500 border-2 border-amber-500/20 hover:border-amber-500/50 hover:-translate-y-2 bg-card/80 backdrop-blur-sm h-full"
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
                    <div className="relative h-48 md:h-64 overflow-hidden">
                      <img 
                        src={offer.image} 
                        alt={offer.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent"></div>
                    </div>
                  )}

                  <CardContent className="p-4 md:p-6 space-y-3 md:space-y-4">
                    {/* Title & Advertiser */}
                    <div>
                      <h3 className="text-xl md:text-2xl font-bold mb-2 group-hover:text-amber-600 transition-colors">
                        {offer.title}
                      </h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-xs md:text-sm text-muted-foreground font-medium">
                          {offer.advertiser.name}
                        </p>
                        {offer.is_rge_certified && (
                          <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-300 dark:bg-green-950/50 dark:text-green-400 dark:border-green-700">
                            <Award className="w-3 h-3 mr-1" />
                            RGE {offer.rge_certification_text ? `• ${offer.rge_certification_text}` : ''}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Price */}
                    <div className="flex items-baseline gap-2 md:gap-3 flex-wrap">
                      <span className="text-3xl md:text-4xl font-bold text-amber-600">
                        {offer.price.toLocaleString('fr-FR')}€
                      </span>
                      {offer.original_price && !isOfferExpired(offer.expires_at) && (
                        <span className="text-lg md:text-xl text-muted-foreground line-through">
                          {offer.original_price.toLocaleString('fr-FR')}€
                        </span>
                      )}
                      {getExpirationInfo(offer.expires_at) && (
                        <Badge variant="outline" className="text-xs flex items-center gap-1 text-orange-600 border-orange-300 bg-orange-50">
                          <Clock className="w-3 h-3" />
                          {getExpirationInfo(offer.expires_at)}
                        </Badge>
                      )}
                    </div>

                    {/* Description */}
                    <p className="text-sm md:text-base text-muted-foreground leading-relaxed line-clamp-3">
                      {offer.description}
                    </p>

                    {/* Features */}
                    {offer.features && offer.features.length > 0 && (
                      <div className="space-y-2 pt-3 md:pt-4 border-t">
                        <p className="font-semibold text-xs md:text-sm">Avantages inclus :</p>
                        <ul className="space-y-1.5 md:space-y-2">
                          {offer.features.slice(0, 4).map((feature, index) => (
                            <li key={index} className="flex items-start gap-2 text-xs md:text-sm">
                              <Check className="w-3 h-3 md:w-4 md:h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* CTA Button */}
                    <Button 
                      asChild
                      className="w-full mt-4 md:mt-6 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-bold py-5 md:py-6 text-base md:text-lg shadow-lg shadow-amber-500/30 hover:shadow-xl hover:shadow-amber-500/50 transition-all duration-300 hover:scale-105 border border-amber-400/30"
                      onClick={() => trackClick(offer.id)}
                    >
                      <Link to={getOfferUrl(offer.advertiser.name, offer.id, activeRegion)}>
                        Voir l'offre
                      </Link>
                    </Button>
                  </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="flex -left-12 border-2 border-amber-500/30 hover:border-amber-600 hover:bg-amber-600 hover:text-white bg-background/80 backdrop-blur-sm shadow-lg hover:shadow-amber-500/30 transition-all duration-300" />
            <CarouselNext className="flex -right-12 border-2 border-amber-500/30 hover:border-amber-600 hover:bg-amber-600 hover:text-white bg-background/80 backdrop-blur-sm shadow-lg hover:shadow-amber-500/30 transition-all duration-300" />
          </Carousel>
        </div>

      </div>
    </section>
  );
};

export default PartnerOffersSection;
