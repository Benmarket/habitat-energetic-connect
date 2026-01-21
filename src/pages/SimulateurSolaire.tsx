import { useState, useEffect, useRef } from "react";
import { Helmet } from "react-helmet";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, ArrowLeft, User, MapPin, Sun, Check, Loader2, Search } from "lucide-react";

interface SolarRegion {
  id: string;
  name: string;
  postal_prefixes: string[] | null;
}

interface AddressSuggestion {
  label: string;
  name: string;
  postcode: string;
  city: string;
  context: string;
  x: number; // longitude
  y: number; // latitude
}

interface FormData {
  firstName: string;
  lastName: string;
  fullAddress: string;
  address: string;
  postalCode: string;
  city: string;
  detectedRegion: string;
  latitude: string;
  longitude: string;
}

const SimulateurSolaire = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [regions, setRegions] = useState<SolarRegion[]>([]);
  const [loading, setLoading] = useState(true);
  const [addressValidated, setAddressValidated] = useState(false);
  const [validating, setValidating] = useState(false);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    fullAddress: "",
    address: "",
    postalCode: "",
    city: "",
    detectedRegion: "",
    latitude: "",
    longitude: "",
  });

  const totalSteps = 2;

  useEffect(() => {
    const loadRegions = async () => {
      try {
        const { data, error } = await supabase
          .from("solar_simulator_regions")
          .select("id, name, postal_prefixes")
          .order("display_order", { ascending: true });

        if (error) throw error;
        if (data) {
          setRegions(data);
        }
      } catch (err) {
        console.error("Error loading regions:", err);
      } finally {
        setLoading(false);
      }
    };

    loadRegions();
  }, []);

  // Auto-detect region based on postal code
  useEffect(() => {
    if (!formData.postalCode || formData.postalCode.length < 2) {
      setFormData(prev => ({ ...prev, detectedRegion: "" }));
      return;
    }

    let matchedRegion = "";
    
    for (const region of regions) {
      if (region.postal_prefixes && region.postal_prefixes.length > 0) {
        const hasMatch = region.postal_prefixes.some(prefix => 
          formData.postalCode.startsWith(prefix)
        );
        if (hasMatch) {
          matchedRegion = region.name;
          break;
        }
      }
    }

    if (!matchedRegion) {
      const defaultRegion = regions.find(r => !r.postal_prefixes || r.postal_prefixes.length === 0);
      if (defaultRegion) {
        matchedRegion = defaultRegion.name;
      }
    }

    setFormData(prev => ({ ...prev, detectedRegion: matchedRegion }));
  }, [formData.postalCode, regions]);

  // Fetch address suggestions from API adresse.data.gouv.fr
  const fetchAddressSuggestions = async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    try {
      const response = await fetch(
        `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&limit=5`
      );
      const data = await response.json();
      
      const mappedSuggestions: AddressSuggestion[] = data.features.map((feature: any) => ({
        label: feature.properties.label,
        name: feature.properties.name,
        postcode: feature.properties.postcode,
        city: feature.properties.city,
        context: feature.properties.context,
        x: feature.geometry.coordinates[0],
        y: feature.geometry.coordinates[1],
      }));
      
      setSuggestions(mappedSuggestions);
      setShowSuggestions(true);
    } catch (err) {
      console.error("Error fetching address suggestions:", err);
      setSuggestions([]);
    }
  };

  // Handle click outside suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectSuggestion = (suggestion: AddressSuggestion) => {
    setFormData(prev => ({
      ...prev,
      fullAddress: suggestion.label,
      address: suggestion.name,
      postalCode: suggestion.postcode,
      city: suggestion.city,
      latitude: suggestion.y.toFixed(6),
      longitude: suggestion.x.toFixed(6),
    }));
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Reset validation when address fields change
    if (['address', 'postalCode', 'city'].includes(field)) {
      setAddressValidated(false);
    }
    
    // Fetch suggestions for full address
    if (field === 'fullAddress') {
      fetchAddressSuggestions(value);
    }
  };

  const handleValidateAddress = async () => {
    if (!formData.address || !formData.postalCode || !formData.city) return;
    
    setValidating(true);
    
    try {
      const query = `${formData.address} ${formData.postalCode} ${formData.city}`;
      const response = await fetch(
        `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&limit=1`
      );
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const feature = data.features[0];
        setFormData(prev => ({
          ...prev,
          latitude: feature.geometry.coordinates[1].toFixed(6),
          longitude: feature.geometry.coordinates[0].toFixed(6),
        }));
        setAddressValidated(true);
      }
    } catch (err) {
      console.error("Error validating address:", err);
    } finally {
      setValidating(false);
    }
  };

  const canProceedToNextStep = () => {
    if (currentStep === 1) {
      return formData.firstName.trim() !== "" && formData.lastName.trim() !== "";
    }
    if (currentStep === 2) {
      return (
        formData.address.trim() !== "" &&
        formData.postalCode.trim() !== "" &&
        formData.city.trim() !== "" &&
        addressValidated
      );
    }
    return true;
  };

  const handleNext = () => {
    if (currentStep < totalSteps && canProceedToNextStep()) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const progressValue = (currentStep / totalSteps) * 100;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Simulateur Solaire Photovoltaïque | Prime Énergies</title>
        <meta 
          name="description" 
          content="Estimez vos économies potentielles avec une installation de panneaux solaires photovoltaïques. Simulation gratuite et personnalisée."
        />
      </Helmet>

      <Header />

      <main className="min-h-screen bg-gradient-to-br from-orange-50 via-background to-yellow-50 py-12">
        <div className="container mx-auto px-4 max-w-2xl">
          {/* Progress Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-yellow-500 flex items-center justify-center">
                  <Sun className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Simulateur Solaire</h1>
                  <p className="text-sm text-muted-foreground">Étape {currentStep} sur {totalSteps}</p>
                </div>
              </div>
            </div>
            <Progress value={progressValue} className="h-2" />
          </div>

          {/* Step 1: Name */}
          {currentStep === 1 && (
            <Card className="shadow-xl border-0">
              <CardHeader className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-t-lg">
                <div className="flex items-center gap-3">
                  <User className="w-6 h-6" />
                  <div>
                    <CardTitle className="text-xl">Vos informations</CardTitle>
                    <CardDescription className="text-white/80">
                      Commençons par faire connaissance
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-sm font-semibold">
                      Nom <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="lastName"
                      placeholder="Ex: Dupont"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange("lastName", e.target.value)}
                      className="h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-sm font-semibold">
                      Prénom <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="firstName"
                      placeholder="Ex: Jean"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange("firstName", e.target.value)}
                      className="h-12"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button
                    onClick={handleNext}
                    disabled={!canProceedToNextStep()}
                    className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white px-8 py-6 text-base"
                  >
                    Continuer
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Address */}
          {currentStep === 2 && (
            <Card className="shadow-xl border-0">
              <CardHeader className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-t-lg">
                <div className="flex items-center gap-3">
                  <MapPin className="w-6 h-6" />
                  <div>
                    <CardTitle className="text-xl">Votre adresse</CardTitle>
                    <CardDescription className="text-white/80">
                      Localisation de votre projet solaire
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* Full address search with autocomplete */}
                <div className="space-y-2 relative" ref={suggestionsRef}>
                  <Label htmlFor="fullAddress" className="text-sm font-semibold">
                    Rechercher une adresse <span className="text-muted-foreground">(auto-remplissage)</span>
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="fullAddress"
                      placeholder="Tapez une adresse pour la rechercher..."
                      value={formData.fullAddress}
                      onChange={(e) => handleInputChange("fullAddress", e.target.value)}
                      className="h-12 pl-10"
                    />
                  </div>
                  
                  {/* Suggestions dropdown */}
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-background border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {suggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => handleSelectSuggestion(suggestion)}
                          className="w-full px-4 py-3 text-left hover:bg-muted transition-colors border-b last:border-b-0"
                        >
                          <div className="font-medium text-sm">{suggestion.label}</div>
                          <div className="text-xs text-muted-foreground">{suggestion.context}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Address fields */}
                <div className="space-y-2">
                  <Label htmlFor="address" className="text-sm font-semibold">
                    Adresse <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="address"
                    placeholder="Ex: 25 rue du Bourget"
                    value={formData.address}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                    className="h-12"
                  />
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="postalCode" className="text-sm font-semibold">
                      Code Postal <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="postalCode"
                      placeholder="Ex: 75015"
                      value={formData.postalCode}
                      onChange={(e) => handleInputChange("postalCode", e.target.value)}
                      className="h-12"
                      maxLength={5}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city" className="text-sm font-semibold">
                      Ville <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="city"
                      placeholder="Ex: Paris"
                      value={formData.city}
                      onChange={(e) => handleInputChange("city", e.target.value)}
                      className="h-12"
                    />
                  </div>
                </div>

                {/* Detected Region (read-only) */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Région détectée</Label>
                  <div className="flex items-center gap-2 h-12 px-4 rounded-md border border-input bg-muted">
                    {formData.detectedRegion ? (
                      <>
                        <Check className="w-4 h-4 text-green-600" />
                        <span className="text-foreground font-medium">{formData.detectedRegion}</span>
                      </>
                    ) : (
                      <span className="text-muted-foreground">Entrez un code postal pour détecter la région</span>
                    )}
                  </div>
                </div>

                {/* Coordinates & Map (shown after validation) */}
                {addressValidated && formData.latitude && formData.longitude && (
                  <div className="space-y-4">
                    {/* Coordinates read-only */}
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-muted-foreground">Latitude</Label>
                        <div className="h-12 px-4 rounded-md border border-input bg-muted/50 flex items-center text-muted-foreground">
                          {formData.latitude}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-muted-foreground">Longitude</Label>
                        <div className="h-12 px-4 rounded-md border border-input bg-muted/50 flex items-center text-muted-foreground">
                          {formData.longitude}
                        </div>
                      </div>
                    </div>

                    {/* Mini Map - zoom level 18-19 for street/house view */}
                    <div className="rounded-lg overflow-hidden border shadow-sm">
                      <iframe
                        title="Localisation"
                        width="100%"
                        height="250"
                        style={{ border: 0 }}
                        loading="lazy"
                        src={`https://www.openstreetmap.org/export/embed.html?bbox=${Number(formData.longitude) - 0.0015}%2C${Number(formData.latitude) - 0.001}%2C${Number(formData.longitude) + 0.0015}%2C${Number(formData.latitude) + 0.001}&layer=mapnik&marker=${formData.latitude}%2C${formData.longitude}`}
                      />
                    </div>
                  </div>
                )}

                <div className="flex justify-between pt-4">
                  <Button
                    variant="outline"
                    onClick={handlePrevious}
                    className="px-6 py-6"
                  >
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Retour
                  </Button>
                  
                  {!addressValidated ? (
                    <Button
                      onClick={handleValidateAddress}
                      disabled={!formData.address || !formData.postalCode || !formData.city || validating}
                      className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white px-8 py-6 text-base"
                    >
                      {validating ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Validation...
                        </>
                      ) : (
                        <>
                          <Check className="w-5 h-5 mr-2" />
                          Valider l'adresse
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button
                      onClick={handleNext}
                      className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white px-8 py-6 text-base animate-subtle-bounce"
                    >
                      Continuer
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Steps indicator */}
          <div className="flex justify-center gap-3 mt-8">
            {[1, 2].map((step) => (
              <div
                key={step}
                className={`w-3 h-3 rounded-full transition-all ${
                  step === currentStep
                    ? "bg-gradient-to-r from-orange-500 to-yellow-500 scale-125"
                    : step < currentStep
                    ? "bg-green-500"
                    : "bg-muted"
                }`}
              />
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
};

export default SimulateurSolaire;
