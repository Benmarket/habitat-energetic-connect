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
import { ArrowRight, ArrowLeft, User, MapPin, Sun, Check, Loader2, Search, Zap, Flame, Droplets, Home, Car, Waves, Wind, Thermometer, UtensilsCrossed, Shirt, SkipForward, Wrench, Info, Compass, LayoutGrid, Maximize2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import compteurLinkyImg from "@/assets/simulators/compteur-linky.png";
import compteurElectroniqueImg from "@/assets/simulators/compteur-electronique.png";
import priseMonophaseImg from "@/assets/simulators/prise-monophase.png";
import priseTriphaseImg from "@/assets/simulators/prise-triphase.png";
import compteurElectromecaniqeImg from "@/assets/simulators/compteur-electromecanique.png";

interface SolarRegion {
  id: string;
  name: string;
  postal_prefixes: string[] | null;
  tarif_kwh: number;
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
  // Step 3: Consumption profile
  tarifKwh: string;
  factureAnnuelle: string;
  consommationAnnuelle: string;
  compteur: string;
  monoTri: string;
  typeChauffage: string;
  typeChauffageEau: string;
  surfaceHabitat: string;
  useDefaultFacture: boolean;
  // Step 3b: Equipment
  equipments: string[];
  // Step 4: Toiture
  orientationToiture: string;
  typeToiture: string;
  surfaceToiture: string;
}

const SimulateurSolaire = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [consumptionSubStep, setConsumptionSubStep] = useState<'energy' | 'raccordement' | 'chauffage' | 'equipments'>('energy');
  const [roofSubStep, setRoofSubStep] = useState<'orientation' | 'type' | 'surface'>('orientation');
  const [regions, setRegions] = useState<SolarRegion[]>([]);
  const [loading, setLoading] = useState(true);
  const [addressValidated, setAddressValidated] = useState(false);
  const [validating, setValidating] = useState(false);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const [lastEditedField, setLastEditedField] = useState<'facture' | 'consommation' | null>(null);
  
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
    // Step 3
    tarifKwh: "",
    factureAnnuelle: "",
    consommationAnnuelle: "",
    compteur: "",
    monoTri: "",
    typeChauffage: "",
    typeChauffageEau: "",
    surfaceHabitat: "",
    useDefaultFacture: false,
    // Step 3b: Equipment
    equipments: [],
    // Step 4: Toiture
    orientationToiture: "",
    typeToiture: "",
    surfaceToiture: "",
  });

  // Equipment options
  const equipmentOptions = [
    { id: 'vehicule-electrique', label: 'Véhicule électrique', icon: Car },
    { id: 'piscine-jacuzzi', label: 'Piscine ou Jacuzzi', icon: Waves },
    { id: 'climatisation', label: 'Climatisation', icon: Wind },
    { id: 'ballon-electrique', label: "Ballon d'eau chaude électrique", icon: Zap },
    { id: 'lave-vaisselle', label: 'Lave vaisselle', icon: UtensilsCrossed },
    { id: 'seche-linge', label: 'Sèche linge', icon: Shirt },
  ];

  const totalSteps = 7;

  const steps = [
    { id: 1, label: 'Client' },
    { id: 2, label: 'Adresse' },
    { id: 3, label: 'Consommation' },
    { id: 4, label: 'Toiture' },
    { id: 5, label: 'Modules' },
    { id: 6, label: 'Financement' },
    { id: 7, label: 'Résultats' },
  ];

  useEffect(() => {
    const loadRegions = async () => {
      try {
        const { data, error } = await supabase
          .from("solar_simulator_regions")
          .select("id, name, postal_prefixes, tarif_kwh")
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

  // Handle blur on address input - auto-select first suggestion
  const handleAddressBlur = () => {
    // Small delay to allow click on suggestion to be processed first
    setTimeout(() => {
      if (suggestions.length > 0 && showSuggestions) {
        // Auto-select first suggestion
        handleSelectSuggestion(suggestions[0]);
      }
      setShowSuggestions(false);
    }, 150);
  };

  // Handle click outside suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        // Don't auto-fill here, let blur handler do it
        // Just hide suggestions after a delay
        setTimeout(() => setShowSuggestions(false), 200);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [suggestions, showSuggestions]);

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
    
    // Track which energy field was last edited for auto-calculation
    if (field === 'factureAnnuelle') {
      setLastEditedField('facture');
    } else if (field === 'consommationAnnuelle') {
      setLastEditedField('consommation');
    }
  };

  // Auto-calculate facture/consommation based on the field that was NOT just edited
  useEffect(() => {
    const tarif = parseFloat(formData.tarifKwh);
    if (isNaN(tarif) || tarif <= 0) return;

    if (lastEditedField === 'consommation' && formData.consommationAnnuelle) {
      // User edited consommation → calculate facture
      const conso = parseFloat(formData.consommationAnnuelle);
      if (!isNaN(conso) && conso > 0) {
        const calculatedFacture = (conso * tarif).toFixed(2);
        setFormData(prev => ({ ...prev, factureAnnuelle: calculatedFacture }));
      }
    } else if (lastEditedField === 'facture' && formData.factureAnnuelle) {
      // User edited facture → calculate consommation
      const facture = parseFloat(formData.factureAnnuelle);
      if (!isNaN(facture) && facture > 0) {
        const calculatedConso = Math.round(facture / tarif).toString();
        setFormData(prev => ({ ...prev, consommationAnnuelle: calculatedConso }));
      }
    }
  }, [formData.consommationAnnuelle, formData.factureAnnuelle, formData.tarifKwh, lastEditedField]);

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
    if (currentStep === 3) {
      if (consumptionSubStep === 'energy') {
        return formData.tarifKwh.trim() !== "" && formData.consommationAnnuelle.trim() !== "";
      }
      if (consumptionSubStep === 'raccordement') {
        return formData.compteur.trim() !== "";
      }
      // chauffage & equipments are optional
      return true;
    }
    if (currentStep === 4) {
      if (roofSubStep === 'orientation') {
        return formData.orientationToiture.trim() !== "";
      }
      if (roofSubStep === 'type') {
        return formData.typeToiture.trim() !== "";
      }
      if (roofSubStep === 'surface') {
        return formData.surfaceToiture.trim() !== "";
      }
    }
    return true;
  };

  // Auto-fill tarif kWh when entering step 3
  useEffect(() => {
    if (currentStep === 3 && !formData.tarifKwh && formData.detectedRegion) {
      const matchedRegion = regions.find(r => r.name === formData.detectedRegion);
      if (matchedRegion) {
        setFormData(prev => ({ ...prev, tarifKwh: matchedRegion.tarif_kwh.toString() }));
      }
    }
  }, [currentStep, formData.detectedRegion, formData.tarifKwh, regions]);

  // Consumption analysis calculations
  const getConsumptionAnalysis = () => {
    const conso = parseFloat(formData.consommationAnnuelle) || 0;
    const tarif = parseFloat(formData.tarifKwh) || 0;
    const facture = parseFloat(formData.factureAnnuelle) || 0;
    
    return {
      consoMensuelle: Math.round(conso / 12),
      coutMensuel: (facture / 12).toFixed(0),
      consoJournaliere: Math.round(conso / 365),
      coutJournalier: (facture / 365).toFixed(1),
    };
  };

  const handleNext = () => {
    // Handle sub-steps within step 3
    if (currentStep === 3) {
      if (consumptionSubStep === 'energy' && canProceedToNextStep()) {
        setConsumptionSubStep('raccordement');
        return;
      }
      if (consumptionSubStep === 'raccordement') {
        setConsumptionSubStep('chauffage');
        return;
      }
      if (consumptionSubStep === 'chauffage') {
        setConsumptionSubStep('equipments');
        return;
      }
      // equipments -> next main step
      if (consumptionSubStep === 'equipments') {
        setCurrentStep(prev => prev + 1);
        setConsumptionSubStep('energy');
        return;
      }
    }
    
    if (currentStep < totalSteps && canProceedToNextStep()) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    // Handle sub-steps within step 3
    if (currentStep === 3) {
      if (consumptionSubStep === 'equipments') {
        setConsumptionSubStep('chauffage');
        return;
      }
      if (consumptionSubStep === 'chauffage') {
        setConsumptionSubStep('raccordement');
        return;
      }
      if (consumptionSubStep === 'raccordement') {
        setConsumptionSubStep('energy');
        return;
      }
    }
    
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const toggleEquipment = (equipmentId: string) => {
    setFormData(prev => ({
      ...prev,
      equipments: prev.equipments.includes(equipmentId)
        ? prev.equipments.filter(e => e !== equipmentId)
        : [...prev.equipments, equipmentId]
    }));
  };

  const skipEquipmentStep = () => {
    setFormData(prev => ({ ...prev, equipments: [] }));
    setCurrentStep(prev => prev + 1);
    setConsumptionSubStep('energy');
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
        {/* Step Breadcrumb Navigation - Always narrow */}
        <div className="container mx-auto px-4 max-w-2xl mb-8">
          <div className="bg-white/90 backdrop-blur-sm rounded-xl py-5 px-8 shadow-lg border border-white/50">
            {/* Progress lines row */}
            <div className="flex items-center mb-3 px-4">
              {steps.map((step, index) => {
                const stepNumber = index + 1;
                const isCompleted = currentStep > stepNumber;
                const isCurrent = currentStep === stepNumber;
                
                return (
                  <div key={`line-${step.id}`} className="flex-1 flex items-center">
                    {/* Line segment */}
                    <div 
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        isCompleted ? 'bg-blue-500' : isCurrent ? 'bg-blue-500' : 'bg-gray-200'
                      }`}
                    />
                    {/* Gap for circle alignment - except last */}
                    {index < steps.length - 1 && <div className="w-8" />}
                  </div>
                );
              })}
            </div>
            
            {/* Circles and labels row */}
            <div className="flex items-start justify-between">
              {steps.map((step, index) => {
                const stepNumber = index + 1;
                const isCompleted = currentStep > stepNumber;
                const isCurrent = currentStep === stepNumber;
                
                return (
                  <div key={step.id} className="flex flex-col items-center" style={{ width: '100px' }}>
                    {/* Step circle */}
                    <div 
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                        isCompleted 
                          ? 'bg-blue-500 text-white' 
                          : isCurrent 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-gray-100 text-gray-400 border-2 border-gray-200'
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        stepNumber
                      )}
                    </div>
                    {/* Step label */}
                    <span 
                      className={`mt-2 text-xs text-center whitespace-nowrap ${
                        isCurrent 
                          ? 'text-blue-600 font-bold' 
                          : isCompleted 
                            ? 'text-gray-600 font-medium' 
                            : 'text-gray-400'
                      }`}
                    >
                      {stepNumber}. {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Content area - wider for steps 2 and 3 */}
        <div className={`container mx-auto px-4 ${[2, 3].includes(currentStep) ? 'max-w-6xl' : 'max-w-2xl'}`}>

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

          {/* Step 2: Address - Two Column Layout */}
          {currentStep === 2 && (
            <div className="grid gap-6 lg:grid-cols-5">
              {/* Left Column - Form */}
              <Card className="shadow-xl border-0 lg:col-span-3">
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
                        onBlur={handleAddressBlur}
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

                  {/* Detected Region (read-only) with aids indicator */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Région détectée</Label>
                    <div className="flex items-center gap-2 min-h-12 px-4 py-3 rounded-md border border-input bg-muted">
                      {formData.detectedRegion ? (
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full">
                          <div className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-green-600 shrink-0" />
                            <span className="text-foreground font-medium">{formData.detectedRegion}</span>
                          </div>
                          {/* Aids/subsidies availability indicator */}
                          {regions.some(r => r.name === formData.detectedRegion) ? (
                            <div className="flex items-center gap-2 text-xs sm:ml-auto">
                              <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                              <span className="text-green-700">Aides disponibles — continuez pour en connaître le montant</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-xs sm:ml-auto">
                              <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                              <span className="text-red-600">Pas d'aides spécifiques pour cette région</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Entrez un code postal pour détecter la région</span>
                      )}
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

              {/* Right Column - Map & Coordinates Summary */}
              <div className="lg:col-span-2 space-y-4">
                {/* Summary Card Header */}
                <Card className="shadow-lg border-0 overflow-hidden">
                  <div className="bg-gradient-to-br from-orange-500 to-yellow-500 p-6 text-white text-center">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                      <MapPin className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold">Localisation</h3>
                    <p className="text-sm text-white/80 mt-1">
                      {addressValidated ? 'Adresse validée' : 'En attente de validation'}
                    </p>
                  </div>
                  
                  <CardContent className="p-4 space-y-4">
                    {/* Map Display */}
                    {addressValidated && formData.latitude && formData.longitude ? (
                      <>
                        <div className="rounded-lg overflow-hidden border shadow-sm">
                          <iframe
                            title="Localisation"
                            width="100%"
                            height="200"
                            style={{ border: 0 }}
                            loading="lazy"
                            src={`https://www.openstreetmap.org/export/embed.html?bbox=${Number(formData.longitude) - 0.0015}%2C${Number(formData.latitude) - 0.001}%2C${Number(formData.longitude) + 0.0015}%2C${Number(formData.latitude) + 0.001}&layer=mapnik&marker=${formData.latitude}%2C${formData.longitude}`}
                          />
                        </div>

                        {/* Coordinates */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-muted/50 rounded-lg p-3 text-center">
                            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Latitude</p>
                            <p className="font-semibold text-sm">{formData.latitude}</p>
                          </div>
                          <div className="bg-muted/50 rounded-lg p-3 text-center">
                            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Longitude</p>
                            <p className="font-semibold text-sm">{formData.longitude}</p>
                          </div>
                        </div>

                        {/* Address summary */}
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                          <div className="flex items-start gap-2">
                            <Check className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                            <div className="text-sm">
                              <p className="font-medium text-green-800">{formData.address}</p>
                              <p className="text-green-700">{formData.postalCode} {formData.city}</p>
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <MapPin className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p className="text-sm">La carte apparaîtra après validation de l'adresse</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Step 3: Consumption Profile - Two Column Layout */}
          {currentStep === 3 && (
            <div className="grid gap-6 lg:grid-cols-5">
              {/* Left Column - Form */}
              {consumptionSubStep === 'energy' ? (
                <Card className="shadow-xl border-0 lg:col-span-3">
                  <CardHeader className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-t-lg">
                    <div className="flex items-center gap-3">
                      <Zap className="w-6 h-6" />
                      <div>
                        <CardTitle className="text-xl">Profil de consommation</CardTitle>
                        <CardDescription className="text-white/80">
                          Informations sur votre consommation électrique
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-5">
                    {/* Tarif kWh - auto-filled from region */}
                    <div className="space-y-2">
                      <Label htmlFor="tarifKwh" className="text-sm font-semibold">
                        Tarif actuel (€/kWh) <span className="text-destructive">*</span>
                      </Label>
                      <div className="relative">
                        <Input
                          id="tarifKwh"
                          type="number"
                          step="0.001"
                          placeholder="0.174"
                          value={formData.tarifKwh}
                          onChange={(e) => handleInputChange("tarifKwh", e.target.value)}
                          className="h-12 bg-green-50 border-green-200"
                        />
                        {formData.tarifKwh && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <Check className="w-4 h-4 text-green-600" />
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Tarif pré-rempli selon votre région ({formData.detectedRegion})
                      </p>
                    </div>

                    {/* Facture annuelle & Consommation annuelle */}
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="factureAnnuelle" className="text-sm font-semibold">
                          Facture annuelle (€) <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="factureAnnuelle"
                          type="number"
                          placeholder="1400"
                          value={formData.factureAnnuelle}
                          onChange={(e) => handleInputChange("factureAnnuelle", e.target.value)}
                          className="h-12"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="consommationAnnuelle" className="text-sm font-semibold">
                          Consommation annuelle (kWh) <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="consommationAnnuelle"
                          type="number"
                          placeholder="8000"
                          value={formData.consommationAnnuelle}
                          onChange={(e) => handleInputChange("consommationAnnuelle", e.target.value)}
                          className="h-12"
                        />
                      </div>
                    </div>

                    {/* Info box for auto-calculation */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
                      <Zap className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                      <p className="text-xs text-blue-700">
                        <strong>Calcul automatique :</strong> Facture annuelle = Consommation × Tarif kWh
                      </p>
                    </div>

                    <div className="flex justify-between pt-4">
                      <Button variant="outline" onClick={handlePrevious} className="px-6 py-6">
                        <ArrowLeft className="w-5 h-5 mr-2" />
                        Précédent
                      </Button>
                      <Button
                        onClick={handleNext}
                        disabled={!canProceedToNextStep()}
                        className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white px-8 py-6 text-base"
                      >
                        Suivant
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : consumptionSubStep === 'raccordement' ? (
                <Card className="shadow-xl border-0 lg:col-span-3">
                  <CardHeader className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-t-lg">
                    <div className="flex items-center gap-3">
                      <Wrench className="w-6 h-6" />
                      <div>
                        <CardTitle className="text-xl">Raccordement électrique</CardTitle>
                        <CardDescription className="text-white/80">
                          Informations sur votre compteur et raccordement
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-5">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold">
                          Compteur <span className="text-destructive">*</span>
                        </Label>
                        <Select 
                          value={formData.compteur} 
                          onValueChange={(value) => handleInputChange("compteur", value)}
                        >
                          <SelectTrigger className="h-12">
                            <SelectValue placeholder="Sélectionnez le compteur" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="linky">Linky</SelectItem>
                            <SelectItem value="electronique">Électronique</SelectItem>
                            <SelectItem value="electromecanique">Électromécanique</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold">
                          Mono/Tri <span className="text-destructive">*</span>
                        </Label>
                        <Select 
                          value={formData.monoTri} 
                          onValueChange={(value) => handleInputChange("monoTri", value)}
                        >
                          <SelectTrigger className="h-12">
                            <SelectValue placeholder="Sélectionnez le type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="monophase">Monophasé</SelectItem>
                            <SelectItem value="triphase">Triphasé</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex justify-between pt-4">
                      <Button variant="outline" onClick={handlePrevious} className="px-6 py-6">
                        <ArrowLeft className="w-5 h-5 mr-2" />
                        Précédent
                      </Button>
                      <Button
                        onClick={handleNext}
                        disabled={!canProceedToNextStep()}
                        className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white px-8 py-6 text-base"
                      >
                        Suivant
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : consumptionSubStep === 'chauffage' ? (
                <Card className="shadow-xl border-0 lg:col-span-3">
                  <CardHeader className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-t-lg">
                    <div className="flex items-center gap-3">
                      <Flame className="w-6 h-6" />
                      <div>
                        <CardTitle className="text-xl">Chauffage & habitat</CardTitle>
                        <CardDescription className="text-white/80">
                          Informations sur votre chauffage et logement
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-5">
                    {/* Type de chauffage */}
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">
                        Type de chauffage <span className="text-muted-foreground text-xs">(facultatif)</span>
                      </Label>
                      <Select 
                        value={formData.typeChauffage} 
                        onValueChange={(value) => handleInputChange("typeChauffage", value)}
                      >
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Sélectionnez un type de chauffage" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="electrique">Électrique</SelectItem>
                          <SelectItem value="gaz">Gaz</SelectItem>
                          <SelectItem value="fioul">Fioul</SelectItem>
                          <SelectItem value="bois">Bois / Granulés</SelectItem>
                          <SelectItem value="pompe-chaleur">Pompe à chaleur</SelectItem>
                          <SelectItem value="autre">Autre</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Type de chauffage eau */}
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">
                        Type de chauffage de l'eau <span className="text-muted-foreground text-xs">(facultatif)</span>
                      </Label>
                      <Select 
                        value={formData.typeChauffageEau} 
                        onValueChange={(value) => handleInputChange("typeChauffageEau", value)}
                      >
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Sélectionnez un type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="electrique">Ballon électrique</SelectItem>
                          <SelectItem value="gaz">Chauffe-eau gaz</SelectItem>
                          <SelectItem value="thermodynamique">Thermodynamique</SelectItem>
                          <SelectItem value="solaire">Chauffe-eau solaire</SelectItem>
                          <SelectItem value="autre">Autre</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Surface habitat */}
                    <div className="space-y-2">
                      <Label htmlFor="surfaceHabitat" className="text-sm font-semibold">
                        Surface habitat (m²) <span className="text-muted-foreground text-xs">(facultatif)</span>
                      </Label>
                      <Input
                        id="surfaceHabitat"
                        type="number"
                        placeholder="120"
                        value={formData.surfaceHabitat}
                        onChange={(e) => handleInputChange("surfaceHabitat", e.target.value)}
                        className="h-12"
                      />
                      <p className="text-xs text-muted-foreground">
                        Surface habitable de votre logement en mètres carrés
                      </p>
                    </div>

                    <div className="flex justify-between pt-4">
                      <Button variant="outline" onClick={handlePrevious} className="px-6 py-6">
                        <ArrowLeft className="w-5 h-5 mr-2" />
                        Précédent
                      </Button>
                      <div className="flex gap-3">
                        <Button
                          variant="secondary"
                          onClick={handleNext}
                          className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-6"
                        >
                          <SkipForward className="w-4 h-4 mr-2" />
                          Ne souhaite pas renseigner
                        </Button>
                        <Button
                          onClick={handleNext}
                          className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white px-8 py-6 text-base"
                        >
                          Suivant
                          <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                /* Equipment Selection Sub-Step */
                <div className="lg:col-span-3 space-y-6">
                  <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold text-gray-800">
                      Quels équipements possédez-vous dans la liste suivante ?
                    </h2>
                    <p className="text-muted-foreground">
                      Cette étape est facultative et nous aide à mieux estimer vos besoins énergétiques.
                    </p>
                  </div>

                  {/* Skip Button */}
                  <div className="flex justify-center">
                    <Button
                      variant="secondary"
                      onClick={skipEquipmentStep}
                      className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-3"
                    >
                      <SkipForward className="w-4 h-4 mr-2" />
                      Ne souhaite pas renseigner
                    </Button>
                  </div>

                  {/* Equipment Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    {equipmentOptions.map((equipment) => {
                      const isSelected = formData.equipments.includes(equipment.id);
                      const IconComponent = equipment.icon;
                      
                      return (
                        <button
                          key={equipment.id}
                          onClick={() => toggleEquipment(equipment.id)}
                          className={`relative p-6 rounded-xl border-2 transition-all duration-200 text-center hover:shadow-md ${
                            isSelected 
                              ? 'border-orange-500 bg-orange-50' 
                              : 'border-gray-200 bg-white hover:border-gray-300'
                          }`}
                        >
                          <div className={`w-14 h-14 mx-auto mb-3 rounded-full flex items-center justify-center ${
                            isSelected ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-500'
                          }`}>
                            <IconComponent className="w-7 h-7" />
                          </div>
                          <span className={`font-medium ${isSelected ? 'text-gray-900' : 'text-gray-600'}`}>
                            {equipment.label}
                          </span>
                          {isSelected && (
                            <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
                              <div className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center">
                                <Check className="w-3 h-3 text-white" />
                              </div>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Info Box */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-blue-800 text-sm">Information</p>
                      <p className="text-sm text-blue-700">
                        Sélectionnez les équipements que vous possédez. Plusieurs choix possibles.
                      </p>
                    </div>
                  </div>

                  {/* Navigation Buttons */}
                  <div className="flex justify-between pt-2">
                    <Button
                      variant="outline"
                      onClick={handlePrevious}
                      className="px-6 py-6"
                    >
                      <ArrowLeft className="w-5 h-5 mr-2" />
                      Précédent
                    </Button>
                    <Button
                      onClick={handleNext}
                      className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white px-8 py-6 text-base"
                    >
                      Suivant
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Right Column - Summary Panel */}
              <div className="lg:col-span-2 space-y-4">
                {consumptionSubStep !== 'equipments' ? (
                  <>
                    {/* Header Card - Profile */}
                    <Card className="overflow-hidden border-0 shadow-lg">
                      <div className="bg-gradient-to-br from-orange-500 to-yellow-500 p-6 text-white text-center">
                        <div className="w-12 h-12 mx-auto mb-3 bg-white/20 rounded-full flex items-center justify-center">
                          <Zap className="w-6 h-6" />
                        </div>
                        <h3 className="font-bold text-lg">Profil de consommation</h3>
                        <p className="text-sm text-white/80 mt-1">
                          {canProceedToNextStep() ? (
                            <span className="flex items-center justify-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-green-400" />
                              Profil complet
                            </span>
                          ) : (
                            <span className="flex items-center justify-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-yellow-300" />
                              En cours de saisie
                            </span>
                          )}
                        </p>
                      </div>
                    </Card>

                    {/* Raccordement électrique */}
                    <Card className="border shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-sm">Raccordement électrique</h4>
                          {formData.compteur && formData.monoTri ? (
                            <span className="text-xs text-green-600 flex items-center gap-1">
                              <Check className="w-3 h-3" /> Renseigné
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">À compléter</span>
                          )}
                        </div>
                        <div className="flex gap-3">
                          {/* Compteur visual card */}
                          <div className={`flex-1 min-w-0 flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                            formData.compteur ? 'bg-yellow-50 border-yellow-200' : 'bg-muted/30 border-transparent'
                          }`}>
                            <div className="w-12 h-14 bg-yellow-100 rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
                              {formData.compteur === 'linky' ? (
                                <img src={compteurLinkyImg} alt="Linky" className="w-10 h-12 object-contain" />
                              ) : formData.compteur === 'electronique' ? (
                                <img src={compteurElectroniqueImg} alt="Électronique" className="w-10 h-12 object-contain" />
                              ) : formData.compteur === 'electromecanique' ? (
                                <img src={compteurElectromecaniqeImg} alt="Électromécanique" className="w-10 h-12 object-contain" />
                              ) : (
                                <Wrench className="w-5 h-5 text-gray-400" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs text-orange-600 uppercase font-bold">Compteur</p>
                              <p className="font-semibold text-sm truncate">
                                {formData.compteur === 'linky' ? 'Linky' : 
                                 formData.compteur === 'electronique' ? 'Électronique' :
                                 formData.compteur === 'electromecanique' ? 'Électromécanique' : 
                                 '—'}
                              </p>
                            </div>
                            {formData.compteur && (
                              <div className="w-5 h-5 bg-orange-400 rounded-full flex items-center justify-center shrink-0">
                                <Check className="w-3 h-3 text-white" />
                              </div>
                            )}
                          </div>

                          {/* Mono/Tri visual card */}
                          <div className={`flex-1 flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                            formData.monoTri ? 'bg-blue-50 border-blue-200' : 'bg-muted/30 border-transparent'
                          }`}>
                            <div className="w-12 h-14 bg-blue-100 rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
                              {formData.monoTri === 'monophase' ? (
                                <img src={priseMonophaseImg} alt="Monophasé" className="w-10 h-10 object-contain" />
                              ) : formData.monoTri === 'triphase' ? (
                                <img src={priseTriphaseImg} alt="Triphasé" className="w-10 h-10 object-contain" />
                              ) : (
                                <Zap className="w-5 h-5 text-gray-400" />
                              )}
                            </div>
                            <div>
                              <p className="text-xs text-blue-600 uppercase font-bold">Mono / Tri</p>
                              <p className="font-semibold text-sm">
                                {formData.monoTri === 'monophase' ? 'Monophasé' : 
                                 formData.monoTri === 'triphase' ? 'Triphasé' : 
                                 '—'}
                              </p>
                            </div>
                            {formData.monoTri && (
                              <div className="ml-auto w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center shrink-0">
                                <Check className="w-3 h-3 text-white" />
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Data Summary Cards */}
                    <div className="space-y-2">
                      {/* Tarif */}
                      <div className={`p-3 rounded-lg border flex items-center gap-3 ${formData.tarifKwh ? 'bg-orange-50 border-orange-200' : 'bg-muted/30'}`}>
                        <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center shrink-0">
                          <span className="text-white text-xs font-bold">€</span>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase flex items-center gap-1">
                            Tarif actuel {formData.tarifKwh && <Check className="w-3 h-3 text-green-600" />}
                          </p>
                          <p className="font-bold">{formData.tarifKwh ? `${formData.tarifKwh} €/kWh` : 'Non renseigné'}</p>
                        </div>
                      </div>

                      {/* Facture annuelle */}
                      <div className={`p-3 rounded-lg border flex items-center gap-3 ${formData.factureAnnuelle ? 'bg-blue-50 border-blue-200' : 'bg-muted/30'}`}>
                        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center shrink-0">
                          <Home className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase flex items-center gap-1">
                            Facture annuelle {formData.factureAnnuelle && <Check className="w-3 h-3 text-green-600" />}
                          </p>
                          <p className="font-bold">{formData.factureAnnuelle ? `${formData.factureAnnuelle} €` : 'Non renseigné'}</p>
                        </div>
                      </div>

                      {/* Consommation annuelle */}
                      <div className={`p-3 rounded-lg border flex items-center gap-3 ${formData.consommationAnnuelle ? 'bg-green-50 border-green-200' : 'bg-muted/30'}`}>
                        <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center shrink-0">
                          <Zap className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase flex items-center gap-1">
                            Consommation annuelle {formData.consommationAnnuelle && <Check className="w-3 h-3 text-green-600" />}
                          </p>
                          <p className="font-bold">{formData.consommationAnnuelle ? `${formData.consommationAnnuelle} kWh` : 'Non renseigné'}</p>
                        </div>
                      </div>

                      {/* Type de chauffage */}
                      {formData.typeChauffage && (
                        <div className="p-3 rounded-lg border bg-amber-50 border-amber-200 flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center shrink-0">
                            <Flame className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground uppercase flex items-center gap-1">
                              Type de chauffage <Check className="w-3 h-3 text-green-600" />
                            </p>
                            <p className="font-bold capitalize">{formData.typeChauffage}</p>
                          </div>
                        </div>
                      )}

                      {/* Chauffage eau */}
                      {formData.typeChauffageEau && (
                        <div className="p-3 rounded-lg border bg-cyan-50 border-cyan-200 flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-cyan-500 flex items-center justify-center shrink-0">
                            <Droplets className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground uppercase flex items-center gap-1">
                              Chauffage de l'eau <Check className="w-3 h-3 text-green-600" />
                            </p>
                            <p className="font-bold capitalize">
                              {formData.typeChauffageEau === 'solaire' ? 'Solaire' : formData.typeChauffageEau}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Consumption Analysis */}
                    {formData.consommationAnnuelle && formData.factureAnnuelle && (
                      <Card className="border shadow-sm">
                        <CardContent className="p-4">
                          <h4 className="font-semibold text-sm text-center mb-3">Analyse de consommation</h4>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="text-center">
                              <p className="text-lg font-bold text-blue-600">≈ {getConsumptionAnalysis().consoMensuelle} kWh</p>
                              <p className="text-xs text-muted-foreground">/ mois</p>
                            </div>
                            <div className="text-center">
                              <p className="text-lg font-bold text-orange-600">≈ {getConsumptionAnalysis().coutMensuel} €</p>
                              <p className="text-xs text-muted-foreground">/ mois</p>
                            </div>
                            <div className="text-center">
                              <p className="text-lg font-bold text-blue-600">≈ {getConsumptionAnalysis().consoJournaliere} kWh</p>
                              <p className="text-xs text-muted-foreground">/ jour</p>
                            </div>
                            <div className="text-center">
                              <p className="text-lg font-bold text-orange-600">≈ {getConsumptionAnalysis().coutJournalier} €</p>
                              <p className="text-xs text-muted-foreground">/ jour</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </>
                ) : (
                  <>
                    {/* Header Card - Equipment */}
                    <Card className="overflow-hidden border-0 shadow-lg">
                      <div className="bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500 p-6 text-white text-center relative">
                        <div className="absolute top-4 right-4 w-12 h-12 rounded-full border-4 border-white/30 flex items-center justify-center">
                          <span className="text-xs font-bold">100%</span>
                        </div>
                        <div className="w-12 h-12 mx-auto mb-3 bg-white/20 rounded-full flex items-center justify-center">
                          <Wrench className="w-6 h-6" />
                        </div>
                        <h3 className="font-bold text-lg">Équipements sélectionnés</h3>
                        <p className="text-sm text-white/80 mt-1 flex items-center justify-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-green-400" />
                          {formData.equipments.length} équipement(s)
                        </p>
                      </div>
                    </Card>

                    {/* Selected Equipment List */}
                    {formData.equipments.length === 0 ? (
                      <Card className="border shadow-sm">
                        <CardContent className="p-6 text-center">
                          <Wrench className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
                          <p className="font-medium text-gray-600">Aucun équipement sélectionné</p>
                          <p className="text-sm text-muted-foreground">Cette étape est facultative</p>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="space-y-2">
                        {formData.equipments.map((equipId) => {
                          const equipment = equipmentOptions.find(e => e.id === equipId);
                          if (!equipment) return null;
                          const IconComponent = equipment.icon;
                          
                          return (
                            <div key={equipId} className="p-3 rounded-lg border bg-white shadow-sm flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                                  <IconComponent className="w-5 h-5 text-orange-600" />
                                </div>
                                <div>
                                  <p className="font-semibold text-sm">{equipment.label}</p>
                                  <p className="text-xs text-orange-600 uppercase">Équipement détecté</p>
                                </div>
                              </div>
                              <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                                <Check className="w-4 h-4 text-white" />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Consumption Analysis */}
                    {formData.consommationAnnuelle && formData.factureAnnuelle && (
                      <Card className="border shadow-sm">
                        <CardContent className="p-4">
                          <h4 className="font-semibold text-sm text-center mb-3">Analyse de consommation</h4>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="text-center">
                              <p className="text-lg font-bold text-blue-600">≈ {getConsumptionAnalysis().consoMensuelle} kWh</p>
                              <p className="text-xs text-muted-foreground">/ mois</p>
                            </div>
                            <div className="text-center">
                              <p className="text-lg font-bold text-orange-600">≈ {getConsumptionAnalysis().coutMensuel} €</p>
                              <p className="text-xs text-muted-foreground">/ mois</p>
                            </div>
                            <div className="text-center">
                              <p className="text-lg font-bold text-blue-600">≈ {getConsumptionAnalysis().consoJournaliere} kWh</p>
                              <p className="text-xs text-muted-foreground">/ jour</p>
                            </div>
                            <div className="text-center">
                              <p className="text-lg font-bold text-orange-600">≈ {getConsumptionAnalysis().coutJournalier} €</p>
                              <p className="text-xs text-muted-foreground">/ jour</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

        </div>
      </main>

      <Footer />
    </>
  );
};

export default SimulateurSolaire;
