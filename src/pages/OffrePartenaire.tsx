import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, ArrowLeft, MapPin, Mail, Globe, Tag, Building2, Clock, Award } from "lucide-react";
import { format, differenceInDays, isPast } from "date-fns";
import { fr } from "date-fns/locale";
import { getOfferUrl } from "@/utils/slugify";
import LeadOfferModal from "@/components/LeadOfferModal";
import { useAdTracking } from "@/hooks/useAdTracking";
import { useRegionContext } from "@/hooks/useRegionContext";

interface Advertisement {
  id: string;
  title: string;
  description: string;
  image: string | null;
  price: number;
  original_price: number | null;
  features: string[] | null;
  cta_text: string;
  cta_url: string;
  badge_text: string | null;
  badge_type: string | null;
  advertiser_id: string;
  expires_at: string | null;
  product_type: string | null;
  is_rge_certified: boolean;
  rge_certification_text: string | null;
  advertiser: {
    id: string;
    name: string;
    logo: string | null;
    description: string | null;
    city: string | null;
    department: string | null;
    region: string | null;
    contact_email: string | null;
    website: string | null;
    intervention_departments: string[] | null;
  };
}

const OffrePartenaire = () => {
  const { id, advertiserSlug } = useParams<{ id: string; advertiserSlug: string }>();
  const { activeRegion } = useRegionContext();
  const [offer, setOffer] = useState<Advertisement | null>(null);
  const [otherOffers, setOtherOffers] = useState<Advertisement[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const { trackView, trackClick, trackConversion } = useAdTracking();
  const hasTrackedView = useRef(false);

  useEffect(() => {
    if (id) {
      fetchOffer();
    }
  }, [id]);

  const fetchOffer = async () => {
    try {
      const { data, error } = await supabase
        .from("advertisements")
        .select(`
          *,
          advertiser:advertisers(id, name, logo, description, city, department, region, contact_email, website, intervention_departments)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      setOffer(data);
      
      // Track view for this offer
      if (data && !hasTrackedView.current) {
        trackView(data.id);
        hasTrackedView.current = true;
      }

      // Fetch other offers from the same advertiser
      if (data?.advertiser_id) {
        const { data: others, error: othersError } = await supabase
          .from("advertisements")
          .select(`
            *,
            advertiser:advertisers(id, name, logo, description, city, department, region, contact_email, website, intervention_departments)
          `)
          .eq("advertiser_id", data.advertiser_id)
          .eq("status", "active")
          .neq("id", id)
          .order("created_at", { ascending: false })
          .limit(6);

        if (!othersError && others) {
          setOtherOffers(others);
        }
      }
    } catch (error) {
      console.error("Error fetching offer:", error);
    } finally {
      setLoading(false);
    }
  };

  const getBadgeVariant = (type: string | null) => {
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
    return `Jusqu'au ${format(expirationDate, "d MMMM yyyy", { locale: fr })}`;
  };

  if (loading) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-gradient-to-b from-background to-muted/20 pt-24 pb-16">
          <div className="container mx-auto px-4">
            <Skeleton className="h-8 w-48 mb-8" />
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <Skeleton className="h-96 w-full rounded-xl" />
                <Skeleton className="h-12 w-3/4" />
                <Skeleton className="h-32 w-full" />
              </div>
              <div className="space-y-6">
                <Skeleton className="h-64 w-full rounded-xl" />
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!offer) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-gradient-to-b from-background to-muted/20 pt-24 pb-16">
          <div className="container mx-auto px-4 text-center py-20">
            <h1 className="text-2xl font-bold mb-4">Offre non trouvée</h1>
            <p className="text-muted-foreground mb-8">Cette offre n'existe pas ou n'est plus disponible.</p>
            <Button asChild>
              <Link to="/">Retour à l'accueil</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>{offer.title} - {offer.advertiser.name} | Prime Énergies</title>
        <meta name="description" content={offer.description.substring(0, 160)} />
      </Helmet>
      <Header />
      <main className="min-h-screen bg-gradient-to-b from-background to-muted/20 pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Back button */}
          <Button 
            asChild 
            variant="ghost" 
            className="mb-6 hover:bg-amber-100/50"
          >
            <Link to="/" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Retour à l'accueil
            </Link>
          </Button>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Offer Card */}
              <Card className="overflow-hidden border-2 border-amber-500/20">
                {offer.badge_text && (
                  <div className="px-6 pt-6">
                    <Badge 
                      variant={getBadgeVariant(offer.badge_type)}
                      className={`font-semibold ${
                        offer.badge_type === 'sponsored' 
                          ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white border-amber-400/30' 
                          : ''
                      }`}
                    >
                      {offer.badge_text}
                    </Badge>
                  </div>
                )}

                {offer.image && (
                  <div className="relative h-64 md:h-96 overflow-hidden">
                    <img 
                      src={offer.image} 
                      alt={offer.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent"></div>
                  </div>
                )}

                <CardContent className="p-6 md:p-8 space-y-6">
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold mb-2">{offer.title}</h1>
                    <p className="text-muted-foreground">Par {offer.advertiser.name}</p>
                  </div>

                  {/* Price */}
                  <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-xl border border-amber-200 flex-wrap">
                    <span className="text-4xl md:text-5xl font-bold text-amber-600">
                      {offer.price.toLocaleString('fr-FR')}€
                    </span>
                    {offer.original_price && !isOfferExpired(offer.expires_at) && (
                      <span className="text-xl text-muted-foreground line-through">
                        {offer.original_price.toLocaleString('fr-FR')}€
                      </span>
                    )}
                    {offer.original_price && !isOfferExpired(offer.expires_at) && (
                      <Badge className="bg-red-500 text-white">
                        -{Math.round((1 - offer.price / offer.original_price) * 100)}%
                      </Badge>
                    )}
                    {getExpirationInfo(offer.expires_at) && (
                      <Badge variant="outline" className="flex items-center gap-1.5 text-orange-600 border-orange-300 bg-orange-50 px-3 py-1">
                        <Clock className="w-4 h-4" />
                        {getExpirationInfo(offer.expires_at)}
                      </Badge>
                    )}
                  </div>

                  {/* Description */}
                  <div>
                    <h2 className="text-xl font-semibold mb-3">Description de l'offre</h2>
                    <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                      {offer.description}
                    </p>
                  </div>

                  {/* Features */}
                  {offer.features && offer.features.length > 0 && (
                    <div>
                      <h2 className="text-xl font-semibold mb-4">Avantages inclus</h2>
                      <ul className="grid md:grid-cols-2 gap-3">
                        {offer.features.map((feature, index) => (
                          <li key={index} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                            <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* CTA */}
                  <Button 
                    onClick={() => {
                      trackClick(offer.id);
                      setIsLeadModalOpen(true);
                    }}
                    size="lg"
                    className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-bold py-6 text-lg shadow-lg shadow-amber-500/30 hover:shadow-xl hover:shadow-amber-500/50 transition-all duration-300"
                  >
                    En savoir plus sur cette offre
                  </Button>

                </CardContent>
              </Card>
            </div>

            {/* Sidebar - Advertiser Info */}
            <div className="space-y-6">
              <Card className="border-2 border-primary/20 sticky top-24">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-4">
                    {offer.advertiser.logo ? (
                      <img 
                        src={offer.advertiser.logo} 
                        alt={offer.advertiser.name}
                        className="w-16 h-16 rounded-lg object-contain bg-white border"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Building2 className="w-8 h-8 text-primary" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold text-lg">{offer.advertiser.name}</h3>
                      <p className="text-sm text-muted-foreground">Partenaire certifié</p>
                    </div>
                  </div>

                  {/* RGE Certification Badge */}
                  {offer.is_rge_certified && (
                    <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
                      <Award className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-green-700 dark:text-green-400">Certifié RGE</p>
                        {offer.rge_certification_text && (
                          <p className="text-xs text-green-600 dark:text-green-500">{offer.rge_certification_text}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {offer.advertiser.description && (
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {offer.advertiser.description}
                    </p>
                  )}

                  <div className="space-y-3 pt-4 border-t">
                    {(offer.advertiser.city || offer.advertiser.department) && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span>
                          {[offer.advertiser.city, offer.advertiser.department, offer.advertiser.region]
                            .filter(Boolean)
                            .join(', ')}
                        </span>
                      </div>
                    )}
                    {offer.advertiser.contact_email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <a 
                          href={`mailto:${offer.advertiser.contact_email}`}
                          className="text-primary hover:underline"
                        >
                          {offer.advertiser.contact_email}
                        </a>
                      </div>
                    )}
                    {offer.cta_url && offer.cta_url.trim() !== '' && (
                      <div className="flex items-center gap-2 text-sm">
                        <Globe className="w-4 h-4 text-muted-foreground" />
                        <a 
                          href={offer.cta_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          Visiter la page de l'offre
                        </a>
                      </div>
                    )}
                  </div>

                  {offer.advertiser.intervention_departments && offer.advertiser.intervention_departments.length > 0 && (
                    <div className="pt-4 border-t">
                      <p className="text-sm font-medium mb-2">Zones d'intervention</p>
                      <div className="flex flex-wrap gap-1">
                        {offer.advertiser.intervention_departments.slice(0, 10).map((dept, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {dept}
                          </Badge>
                        ))}
                        {offer.advertiser.intervention_departments.length > 10 && (
                          <Badge variant="outline" className="text-xs">
                            +{offer.advertiser.intervention_departments.length - 10}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Other offers from same advertiser */}
          {otherOffers.length > 0 && (
            <div className="mt-16">
              <div className="flex items-center gap-3 mb-8">
                <Tag className="w-6 h-6 text-amber-600" />
                <h2 className="text-2xl font-bold">Autres offres de {offer.advertiser.name}</h2>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {otherOffers.map((otherOffer) => (
                  <Card 
                    key={otherOffer.id}
                    className="group overflow-hidden hover:shadow-lg transition-all duration-300 border-2 border-amber-500/20 hover:border-amber-500/50"
                  >
                    {otherOffer.image && (
                      <div className="relative h-48 overflow-hidden">
                        <img 
                          src={otherOffer.image} 
                          alt={otherOffer.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <CardContent className="p-4 space-y-3">
                      <h3 className="font-bold text-lg line-clamp-2 group-hover:text-amber-600 transition-colors">
                        {otherOffer.title}
                      </h3>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-amber-600">
                          {otherOffer.price.toLocaleString('fr-FR')}€
                        </span>
                        {otherOffer.original_price && !isOfferExpired(otherOffer.expires_at) && (
                          <span className="text-sm text-muted-foreground line-through">
                            {otherOffer.original_price.toLocaleString('fr-FR')}€
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {otherOffer.description}
                      </p>
                      <Button 
                        asChild
                        className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white"
                      >
                        <Link to={getOfferUrl(otherOffer.advertiser.name, otherOffer.id, activeRegion)}>
                          Voir l'offre
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />

      {/* Lead Modal */}
      {offer && (
        <LeadOfferModal
          isOpen={isLeadModalOpen}
          onClose={() => setIsLeadModalOpen(false)}
          offerData={{
            offerId: offer.id,
            offerTitle: offer.title,
            advertiserName: offer.advertiser.name,
            advertiserId: offer.advertiser.id,
            productType: offer.product_type || "Non spécifié",
            regionCode: activeRegion,
          }}
          onSuccess={() => trackConversion(offer.id)}
        />
      )}
    </>
  );
};

export default OffrePartenaire;
