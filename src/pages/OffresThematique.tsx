import { useState, useEffect } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, Tag, Clock, Award, ArrowRight } from "lucide-react";
import { format, differenceInDays, isPast } from "date-fns";
import { fr } from "date-fns/locale";
import { getOfferUrl } from "@/utils/slugify";
import Breadcrumb from "@/components/Breadcrumb";

// Mapping slug URL → product_type en base + meta SEO
const THEMATIQUES: Record<string, { productTypes: string[]; label: string; description: string }> = {
  "panneaux-solaires": {
    productTypes: ["Solaire", "Panneaux solaires"],
    label: "Panneaux Solaires",
    description: "Comparez les meilleures offres de panneaux solaires photovoltaïques de nos partenaires certifiés RGE.",
  },
  "batterie": {
    productTypes: ["Batterie", "Batterie de stockage"],
    label: "Batteries de Stockage",
    description: "Découvrez les offres de batteries de stockage pour optimiser votre autoconsommation solaire.",
  },
  "borne-recharge": {
    productTypes: ["Borne de recharge", "Borne"],
    label: "Bornes de Recharge",
    description: "Trouvez les meilleures offres d'installation de bornes de recharge pour véhicule électrique.",
  },
  "pac-air-eau": {
    productTypes: ["Pompe à chaleur", "PAC air/eau", "Pompe à chaleur air/eau"],
    label: "Pompes à Chaleur Air/Eau",
    description: "Comparez les offres de pompes à chaleur air/eau pour un chauffage performant et économique.",
  },
  "pac-air-air": {
    productTypes: ["PAC air/air", "Pompe à chaleur air/air"],
    label: "Pompes à Chaleur Air/Air",
    description: "Découvrez les offres de pompes à chaleur air/air (climatisation réversible) de nos partenaires.",
  },
  "poele-granules": {
    productTypes: ["Poêle à granulés", "Poêle"],
    label: "Poêles à Granulés",
    description: "Comparez les offres de poêles à granulés pour un chauffage écologique et économique.",
  },
  "isolation-combles": {
    productTypes: ["Isolation combles", "Isolation des combles"],
    label: "Isolation des Combles",
    description: "Trouvez les meilleures offres d'isolation des combles pour réduire vos déperditions thermiques.",
  },
  "isolation-exterieure": {
    productTypes: ["Isolation extérieure", "ITE"],
    label: "Isolation Extérieure",
    description: "Comparez les offres d'isolation thermique par l'extérieur (ITE) de nos partenaires certifiés.",
  },
  "isolation-interieure": {
    productTypes: ["Isolation intérieure", "ITI"],
    label: "Isolation Intérieure",
    description: "Découvrez les offres d'isolation thermique par l'intérieur (ITI) adaptées à votre habitat.",
  },
};

interface OfferWithAdvertiser {
  id: string;
  title: string;
  description: string;
  image: string | null;
  price: number | null;
  original_price: number | null;
  features: string[] | null;
  cta_text: string;
  badge_text: string | null;
  badge_type: string | null;
  expires_at: string | null;
  is_rge_certified: boolean;
  rge_certification_text: string | null;
  product_type: string | null;
  advertiser: {
    name: string;
    logo: string | null;
  };
}

const OffresThematique = () => {
  const { thematique } = useParams<{ thematique: string }>();
  const [offers, setOffers] = useState<OfferWithAdvertiser[]>([]);
  const [loading, setLoading] = useState(true);

  const config = thematique ? THEMATIQUES[thematique] : undefined;

  useEffect(() => {
    if (config) {
      fetchOffers();
    }
  }, [thematique]);

  const fetchOffers = async () => {
    if (!config) return;
    setLoading(true);
    try {
      // Fetch all active offers, then filter client-side by product_type match
      const { data, error } = await supabase
        .from("advertisements")
        .select(`
          id, title, description, image, price, original_price, features,
          cta_text, badge_text, badge_type, expires_at, is_rge_certified,
          rge_certification_text, product_type,
          advertiser:advertisers!advertisements_advertiser_id_fkey(name, logo)
        `)
        .eq("status", "active")
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Filter by matching product_type (case-insensitive partial match)
      const filtered = (data || []).filter((offer: any) => {
        if (!offer.product_type) return false;
        const pt = offer.product_type.toLowerCase();
        return config.productTypes.some(t => pt.includes(t.toLowerCase()) || t.toLowerCase().includes(pt));
      });

      setOffers(filtered as OfferWithAdvertiser[]);
    } catch (err) {
      console.error("Error fetching offers:", err);
    } finally {
      setLoading(false);
    }
  };

  // Invalid thematique → 404
  if (!config) {
    return <Navigate to="/404" replace />;
  }

  const breadcrumbItems = [
    { label: "Accueil", href: "/" },
    { label: "Offres Partenaires", href: "/#offres" },
    { label: config.label },
  ];

  const getExpiryBadge = (expiresAt: string | null) => {
    if (!expiresAt) return null;
    const expiryDate = new Date(expiresAt);
    if (isPast(expiryDate)) return null;
    const daysLeft = differenceInDays(expiryDate, new Date());
    if (daysLeft <= 7) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Plus que {daysLeft}j
        </Badge>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Helmet>
        <title>{`Offres ${config.label} | Prime Énergies`}</title>
        <meta name="description" content={config.description} />
        <link rel="canonical" href={`https://prime-energies.fr/offres/${thematique}`} />
      </Helmet>

      <Header />

      <main className="flex-1">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <Breadcrumb items={breadcrumbItems} />

          <div className="mt-6 mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              Offres {config.label}
            </h1>
            <p className="text-muted-foreground text-lg max-w-3xl">
              {config.description}
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-40 w-full mb-4" />
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-full mb-4" />
                    <Skeleton className="h-10 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : offers.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Tag className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  Aucune offre disponible
                </h2>
                <p className="text-muted-foreground mb-6">
                  Aucune offre partenaire n'est actuellement disponible dans la catégorie "{config.label}".
                  Revenez bientôt ou consultez nos autres offres.
                </p>
                <Link to="/#offres">
                  <Button>Voir toutes les offres</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {offers.map((offer) => {
                const advertiserName = (offer.advertiser as any)?.name || "Partenaire";
                const advertiserLogo = (offer.advertiser as any)?.logo;

                return (
                  <Card key={offer.id} className="overflow-hidden hover:shadow-lg transition-shadow group">
                    {offer.image && (
                      <div className="relative h-48 overflow-hidden">
                        <img
                          src={offer.image}
                          alt={offer.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                        <div className="absolute top-3 left-3 flex gap-2">
                          {offer.badge_text && (
                            <Badge className="bg-primary text-primary-foreground">
                              {offer.badge_text}
                            </Badge>
                          )}
                          {getExpiryBadge(offer.expires_at)}
                        </div>
                        {offer.is_rge_certified && (
                          <div className="absolute top-3 right-3">
                            <Badge className="bg-green-600 text-white flex items-center gap-1">
                              <Award className="w-3 h-3" />
                              RGE
                            </Badge>
                          </div>
                        )}
                      </div>
                    )}
                    <CardContent className="p-5">
                      <div className="flex items-center gap-3 mb-3">
                        {advertiserLogo && (
                          <img
                            src={advertiserLogo}
                            alt={advertiserName}
                            className="w-8 h-8 object-contain rounded"
                          />
                        )}
                        <span className="text-sm text-muted-foreground">{advertiserName}</span>
                      </div>

                      <h2 className="text-lg font-semibold text-foreground mb-2 line-clamp-2">
                        {offer.title}
                      </h2>

                      <p className="text-sm text-muted-foreground mb-3 line-clamp-3">
                        {offer.description}
                      </p>

                      {offer.features && offer.features.length > 0 && (
                        <ul className="space-y-1 mb-4">
                          {offer.features.slice(0, 3).map((feature, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-foreground">
                              <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      )}

                      <div className="flex items-end justify-between mt-auto pt-3 border-t border-border">
                        <div>
                          {offer.price != null && (
                            <div className="flex items-baseline gap-2">
                              <span className="text-xl font-bold text-primary">
                                {offer.price.toLocaleString("fr-FR")} €
                              </span>
                              {offer.original_price != null && offer.original_price > offer.price && (
                                <span className="text-sm text-muted-foreground line-through">
                                  {offer.original_price.toLocaleString("fr-FR")} €
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <Link to={getOfferUrl(advertiserName, offer.id)}>
                          <Button size="sm" className="gap-1">
                            Voir l'offre
                            <ArrowRight className="w-4 h-4" />
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default OffresThematique;
