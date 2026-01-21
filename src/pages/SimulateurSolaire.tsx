import { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, ArrowLeft, User, MapPin, Sun, Check, Loader2 } from "lucide-react";

interface SolarRegion {
  id: string;
  name: string;
  postal_prefixes: string[] | null;
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

    // Find matching region
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

    // If no match found, use default (France Métropolitaine or first with empty prefixes)
    if (!matchedRegion) {
      const defaultRegion = regions.find(r => !r.postal_prefixes || r.postal_prefixes.length === 0);
      if (defaultRegion) {
        matchedRegion = defaultRegion.name;
      }
    }

    setFormData(prev => ({ ...prev, detectedRegion: matchedRegion }));
  }, [formData.postalCode, regions]);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const canProceedToNextStep = () => {
    if (currentStep === 1) {
      return formData.firstName.trim() !== "" && formData.lastName.trim() !== "";
    }
    if (currentStep === 2) {
      return (
        formData.address.trim() !== "" &&
        formData.postalCode.trim() !== "" &&
        formData.city.trim() !== ""
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
                {/* Full address helper */}
                <div className="space-y-2">
                  <Label htmlFor="fullAddress" className="text-sm font-semibold">
                    Adresse complète <span className="text-muted-foreground">(facultatif, pour auto-remplir)</span>
                  </Label>
                  <Input
                    id="fullAddress"
                    placeholder="Ex: 25 rue du bourget batiment B, 75015 Paris"
                    value={formData.fullAddress}
                    onChange={(e) => handleInputChange("fullAddress", e.target.value)}
                    className="h-12"
                  />
                  <p className="text-xs text-muted-foreground">
                    Remplissez ce champ pour pré-remplir automatiquement l'adresse, le code postal et la ville.
                  </p>
                </div>

                {/* Address */}
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

                {/* Postal Code & City */}
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

                {/* Latitude & Longitude */}
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="latitude" className="text-sm font-semibold">Latitude</Label>
                    <Input
                      id="latitude"
                      placeholder="Ex: 48.8566"
                      value={formData.latitude}
                      onChange={(e) => handleInputChange("latitude", e.target.value)}
                      className="h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="longitude" className="text-sm font-semibold">Longitude</Label>
                    <Input
                      id="longitude"
                      placeholder="Ex: 2.3522"
                      value={formData.longitude}
                      onChange={(e) => handleInputChange("longitude", e.target.value)}
                      className="h-12"
                    />
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <Button
                    variant="outline"
                    onClick={handlePrevious}
                    className="px-6 py-6"
                  >
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Retour
                  </Button>
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
