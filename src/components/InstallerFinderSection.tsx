import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Search, MapPin, Phone, Globe, CheckCircle, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

interface SearchResult {
  id: string;
  advertiser_id: string;
  title: string;
  description: string;
  image: string | null;
  price: number | null;
  features: string[] | null;
  cta_text: string;
  cta_url: string;
  badge_text: string | null;
  advertiser: {
    id: string;
    name: string;
    logo: string | null;
    city: string | null;
    department: string | null;
    region: string | null;
    postal_code: string | null;
    website: string | null;
    contact_email: string | null;
  };
}

const InstallerFinderSection = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) return;
    
    setIsLoading(true);
    setHasSearched(true);

    try {
      const query = searchQuery.trim().toLowerCase();
      
      // Determine if it's a postal code (5 digits) or department (2 digits)
      const isPostalCode = /^\d{5}$/.test(query);
      const isDepartment = /^\d{1,2}$/.test(query);
      const departmentCode = isPostalCode ? query.substring(0, 2) : (isDepartment ? query.padStart(2, '0') : null);

      // Build the query
      let supabaseQuery = supabase
        .from('advertisements')
        .select(`
          id,
          advertiser_id,
          title,
          description,
          image,
          price,
          features,
          cta_text,
          cta_url,
          badge_text,
          advertiser:advertisers!inner(
            id,
            name,
            logo,
            city,
            department,
            region,
            postal_code,
            website,
            contact_email,
            is_active,
            intervention_departments
          )
        `)
        .eq('status', 'active');

      const { data, error } = await supabaseQuery;

      if (error) {
        console.error('Search error:', error);
        setResults([]);
        return;
      }

      // Filter results based on search criteria
      const filteredResults = (data || []).filter((item: any) => {
        const advertiser = item.advertiser;
        
        // Skip inactive advertisers
        if (!advertiser.is_active) return false;

        // Search by postal code
        if (isPostalCode) {
          if (advertiser.postal_code === query) return true;
          if (departmentCode && advertiser.intervention_departments?.includes(departmentCode)) return true;
          return false;
        }

        // Search by department
        if (isDepartment && departmentCode) {
          if (advertiser.department === departmentCode) return true;
          if (advertiser.intervention_departments?.includes(departmentCode)) return true;
          return false;
        }

        // Search by city, region or company name (text search)
        const cityMatch = advertiser.city?.toLowerCase().includes(query);
        const regionMatch = advertiser.region?.toLowerCase().includes(query);
        const nameMatch = advertiser.name?.toLowerCase().includes(query);
        
        return cityMatch || regionMatch || nameMatch;
      });

      setResults(filteredResults as SearchResult[]);
    } catch (err) {
      console.error('Search error:', err);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const closeResults = () => {
    setHasSearched(false);
    setResults([]);
    setSearchQuery("");
  };

  return (
    <section className="relative py-16 md:py-20 lg:py-24 pb-12 md:pb-16 overflow-hidden">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1509391366360-2e959784a276?w=1920&h=1080&fit=crop')",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/80 via-blue-800/70 to-green-900/60"></div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-5xl mx-auto text-center mb-12">
          <h2 className="text-xl md:text-3xl lg:text-4xl font-bold text-white mb-4 leading-tight">
            Votre portail de confiance pour les énergies renouvelables
          </h2>
          <p className="text-sm md:text-lg lg:text-xl text-white/95 font-light">
            Découvrez les meilleures offres et installez vos équipements avec les meilleurs professionnels locaux
          </p>
        </div>

        {/* Search Card */}
        <Card className="max-w-3xl mx-auto mb-8 shadow-2xl border-none">
          <CardContent className="p-8">
            <h3 className="text-2xl font-bold text-center mb-6">
              Trouvez un installateur près de chez vous
            </h3>
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Nom d'entreprise, code postal, ville..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 h-14 text-lg pl-12 pr-6"
                />
              </div>
              <Button 
                type="submit"
                size="lg"
                disabled={isLoading}
                className="h-14 px-8 bg-green-600 hover:bg-green-700 text-white font-semibold text-lg shadow-lg hover:shadow-xl transition-all"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                ) : (
                  <Search className="h-5 w-5 mr-2" />
                )}
                Je découvre les offres
              </Button>
            </form>

            {/* Search Results */}
            {hasSearched && (
              <div className="mt-8">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold">
                    {results.length > 0 
                      ? `${results.length} offre${results.length > 1 ? 's' : ''} trouvée${results.length > 1 ? 's' : ''}`
                      : 'Aucune offre trouvée'
                    }
                  </h4>
                  <Button variant="ghost" size="sm" onClick={closeResults}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {results.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Aucun installateur ne couvre cette zone pour le moment.</p>
                    <p className="text-sm mt-2">Essayez avec une autre ville ou un autre code postal.</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                    {results.map((result) => (
                      <Card key={result.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                        <CardContent className="p-0">
                          <div className="flex flex-col md:flex-row">
                            {/* Image */}
                            {result.image && (
                              <div className="md:w-48 h-32 md:h-auto flex-shrink-0">
                                <img 
                                  src={result.image} 
                                  alt={result.title}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                            
                            {/* Content */}
                            <div className="flex-1 p-4">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    {result.badge_text && (
                                      <Badge variant="secondary" className="text-xs">
                                        {result.badge_text}
                                      </Badge>
                                    )}
                                    <span className="text-sm text-muted-foreground">
                                      {result.advertiser.name}
                                    </span>
                                  </div>
                                  <h5 className="font-semibold text-lg mb-1">{result.title}</h5>
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                                    <MapPin className="h-4 w-4" />
                                    <span>
                                      {result.advertiser.city}
                                      {result.advertiser.department && ` (${result.advertiser.department})`}
                                      {result.advertiser.region && ` - ${result.advertiser.region}`}
                                    </span>
                                  </div>
                                  
                                  {/* Features / Types de travaux */}
                                  {result.features && result.features.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-2">
                                      {result.features.slice(0, 4).map((feature, idx) => (
                                        <div key={idx} className="flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-1 rounded">
                                          <CheckCircle className="h-3 w-3" />
                                          <span>{feature}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>

                                {/* Price & CTA */}
                                <div className="text-right flex-shrink-0">
                                  {result.price && (
                                    <p className="text-xl font-bold text-primary mb-2">
                                      {result.price.toLocaleString('fr-FR')} €
                                    </p>
                                  )}
                                  <Button 
                                    size="sm" 
                                    className="bg-green-600 hover:bg-green-700"
                                    asChild
                                  >
                                    <a href={result.cta_url} target="_blank" rel="noopener noreferrer">
                                      {result.cta_text}
                                    </a>
                                  </Button>
                                </div>
                              </div>

                              {/* Contact info */}
                              <div className="flex items-center gap-4 mt-3 pt-3 border-t text-sm">
                                {result.advertiser.website && (
                                  <a 
                                    href={result.advertiser.website} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors"
                                  >
                                    <Globe className="h-4 w-4" />
                                    Site web
                                  </a>
                                )}
                                {result.advertiser.contact_email && (
                                  <a 
                                    href={`mailto:${result.advertiser.contact_email}`}
                                    className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors"
                                  >
                                    <Phone className="h-4 w-4" />
                                    Contact
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </section>
  );
};

export default InstallerFinderSection;
