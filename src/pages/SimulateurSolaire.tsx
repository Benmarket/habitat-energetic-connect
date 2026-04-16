import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, ArrowLeft, User, MapPin, Sun, Check, Loader2, Search, Zap, Flame, Droplets, Home, Car, Waves, Wind, Thermometer, UtensilsCrossed, Shirt, SkipForward, Wrench, Info, Compass, LayoutGrid, Maximize2, Mail, Phone, BarChart3, Battery } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
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
  // Step 5: Modules
  puissanceChoisie: string;
  surplusChoice: string;
  contactEmail: string;
  contactPhone: string;
  acceptCgu: boolean;
}

// Redirect results component with countdown
const RedirectResults = ({ formData, redirectCountdown, setRedirectCountdown, navigate }: {
  formData: any;
  redirectCountdown: number;
  setRedirectCountdown: (v: number | ((p: number) => number)) => void;
  navigate: (path: string) => void;
}) => {
  useEffect(() => {
    if (redirectCountdown <= 0) {
      const params = new URLSearchParams({
        name: `${formData.firstName || ''} ${formData.lastName || ''}`.trim(),
        workType: 'energie-solaire',
        email: formData.contactEmail || '',
        surplus: formData.surplusChoice || '',
      });
      navigate(`/merci?${params.toString()}`);
      return;
    }
    const timer = setTimeout(() => setRedirectCountdown((c: number) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [redirectCountdown, formData, navigate, setRedirectCountdown]);

  const oFactor: Record<string, number> = { 'sud': 1, 'sud-est': 0.94, 'sud-ouest': 0.94, 'est': 0.82, 'ouest': 0.82, 'nord': 0.45 };
  const prod = Math.round(parseFloat(formData.puissanceChoisie || '0') * 1100 * (oFactor[formData.orientationToiture] || 0.85));

  return (
    <div className="max-w-3xl mx-auto">
      <Card className="shadow-xl border-0">
        <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-t-lg text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center">
            <Check className="w-8 h-8" />
          </div>
          <CardTitle className="text-2xl text-white">Simulation terminée !</CardTitle>
          <CardDescription className="text-white/90 text-base mt-2">
            Merci {formData.firstName}, vos résultats ont été enregistrés.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-xl">
              <p className="text-2xl font-bold text-blue-600">{formData.puissanceChoisie} kWc</p>
              <p className="text-sm text-muted-foreground">Puissance choisie</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-xl">
              <p className="text-2xl font-bold text-orange-600">{parseFloat(formData.consommationAnnuelle || '0').toLocaleString()} kWh</p>
              <p className="text-sm text-muted-foreground">Consommation/an</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-xl">
              <p className="text-2xl font-bold text-green-600">{prod.toLocaleString()} kWh</p>
              <p className="text-sm text-muted-foreground">Production estimée/an</p>
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <p className="text-sm text-blue-700">
              📧 Vos résultats détaillés et nos recommandations seront envoyés à <strong>{formData.contactEmail}</strong>.
              Un conseiller pourra vous contacter au <strong>{formData.contactPhone}</strong>.
            </p>
          </div>
          <div className="text-center text-sm text-muted-foreground animate-pulse">
            Redirection dans {redirectCountdown} seconde{redirectCountdown > 1 ? 's' : ''}…
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const SimulateurSolaire = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [consumptionSubStep, setConsumptionSubStep] = useState<'energy' | 'raccordement' | 'chauffage' | 'equipments'>('energy');
  const [roofSubStep, setRoofSubStep] = useState<'orientation' | 'type' | 'surface'>('orientation');
  const [moduleSubStep, setModuleSubStep] = useState<'puissance' | 'surplus' | 'contact'>('puissance');
  const [submittingLead, setSubmittingLead] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(5);
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
    // Step 5: Modules
    puissanceChoisie: "",
    surplusChoice: "",
    contactEmail: "",
    contactPhone: "",
    acceptCgu: false,
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

  const totalSteps = 6;

  const steps = [
    { id: 1, label: 'Client' },
    { id: 2, label: 'Adresse' },
    { id: 3, label: 'Consommation' },
    { id: 4, label: 'Toiture' },
    { id: 5, label: 'Modules' },
    { id: 6, label: 'Résultats' },
  ];

  // Power options in kWc
  const powerOptions = [3, 4.5, 6, 7.5, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36];

  // Calculate recommended power based on consumption & roof
  const getRecommendedPower = () => {
    const conso = parseFloat(formData.consommationAnnuelle) || 5000;
    // ~1100 kWh/kWc average production in France
    const idealKwc = conso / 1100;
    // Find closest power option
    let closest = powerOptions[0];
    let minDiff = Math.abs(idealKwc - closest);
    for (const p of powerOptions) {
      const diff = Math.abs(idealKwc - p);
      if (diff < minDiff) {
        minDiff = diff;
        closest = p;
      }
    }
    return closest;
  };

  // Submit simulation lead
  const submitSimulationLead = async () => {
    setSubmittingLead(true);
    try {
      // Ensure form configuration exists
      const { data: existingForm } = await supabase
        .from('form_configurations_public')
        .select('id')
        .eq('form_identifier', 'simulation-solaire')
        .maybeSingle();

      let formId = existingForm?.id;

      if (!formId) {
        const { data: newForm, error: formError } = await supabase
          .from('form_configurations')
          .insert({
            name: 'Simulation Solaire / Photovoltaïque',
            form_identifier: 'simulation-solaire',
            description: 'Leads issus du simulateur solaire photovoltaïque',
            fields_schema: {
              fields: [
                { name: 'firstName', label: 'Prénom', type: 'text' },
                { name: 'lastName', label: 'Nom', type: 'text' },
                { name: 'email', label: 'Email', type: 'email' },
                { name: 'phone', label: 'Téléphone', type: 'tel' },
                { name: 'address', label: 'Adresse', type: 'text' },
                { name: 'postalCode', label: 'Code postal', type: 'text' },
                { name: 'city', label: 'Ville', type: 'text' },
                { name: 'region', label: 'Région détectée', type: 'text' },
                { name: 'consommationAnnuelle', label: 'Consommation annuelle (kWh)', type: 'number' },
                { name: 'factureAnnuelle', label: 'Facture annuelle (€)', type: 'number' },
                { name: 'compteur', label: 'Type de compteur', type: 'text' },
                { name: 'monoTri', label: 'Mono/Triphasé', type: 'text' },
                { name: 'typeChauffage', label: 'Type de chauffage', type: 'text' },
                { name: 'typeChauffageEau', label: 'Chauffage eau', type: 'text' },
                { name: 'surfaceHabitat', label: 'Surface habitat', type: 'text' },
                { name: 'equipments', label: 'Équipements', type: 'text' },
                { name: 'orientationToiture', label: 'Orientation toiture', type: 'text' },
                { name: 'typeToiture', label: 'Type de toiture', type: 'text' },
                { name: 'surfaceToiture', label: 'Surface toiture', type: 'text' },
                { name: 'puissanceChoisie', label: 'Puissance choisie (kWc)', type: 'number' },
                { name: 'surplusChoice', label: 'Gestion du surplus', type: 'text' },
              ]
            },
            webhook_enabled: false,
          })
          .select('id')
          .single();

        if (formError) throw formError;
        formId = newForm?.id;
      }

      if (!formId) throw new Error('Impossible de créer le formulaire');

      // Capture attribution from URL params
      const urlParams = new URLSearchParams(window.location.search);
      const refArticle = urlParams.get('ref_article') || null;
      const refCta = urlParams.get('ref_cta') || null;

      // Submit the lead data
      const { error: submitError } = await supabase
        .from('form_submissions')
        .insert({
          form_id: formId,
          data: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.contactEmail,
            phone: formData.contactPhone,
            address: formData.address,
            postalCode: formData.postalCode,
            city: formData.city,
            region: formData.detectedRegion,
            latitude: formData.latitude,
            longitude: formData.longitude,
            consommationAnnuelle: formData.consommationAnnuelle,
            factureAnnuelle: formData.factureAnnuelle,
            tarifKwh: formData.tarifKwh,
            compteur: formData.compteur,
            monoTri: formData.monoTri,
            typeChauffage: formData.typeChauffage,
            typeChauffageEau: formData.typeChauffageEau,
            surfaceHabitat: formData.surfaceHabitat,
            equipments: formData.equipments.join(', '),
            orientationToiture: formData.orientationToiture,
            typeToiture: formData.typeToiture,
            surfaceToiture: formData.surfaceToiture,
            puissanceChoisie: formData.puissanceChoisie,
            surplusChoice: formData.surplusChoice,
            _attribution: {
              ref_article: refArticle,
              ref_cta: refCta,
              ref_page: '/simulateurs/solaire',
              ref_referrer: document.referrer || null,
            },
          },
          status: 'new',
        });

      if (submitError) throw submitError;

      toast.success("Simulation enregistrée ! Vos résultats sont prêts.");
      setCurrentStep(6);
    } catch (err) {
      console.error("Error submitting simulation:", err);
      toast.error("Erreur lors de l'envoi. Veuillez réessayer.");
    } finally {
      setSubmittingLead(false);
    }
  };

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

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Reset validation when address fields change
    if (['address', 'postalCode', 'city'].includes(field)) {
      setAddressValidated(false);
    }
    
    // Fetch suggestions for full address
    if (field === 'fullAddress') {
      fetchAddressSuggestions(value as string);
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
    if (currentStep === 5) {
      if (moduleSubStep === 'puissance') {
        return formData.puissanceChoisie.trim() !== "";
      }
      if (moduleSubStep === 'surplus') {
        return formData.surplusChoice.trim() !== "";
      }
      if (moduleSubStep === 'contact') {
        const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail);
        return emailValid && formData.contactPhone.trim() !== "" && formData.acceptCgu;
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
      if (consumptionSubStep === 'equipments') {
        setCurrentStep(prev => prev + 1);
        setConsumptionSubStep('energy');
        setRoofSubStep('orientation');
        return;
      }
    }

    // Handle sub-steps within step 4 (Toiture)
    if (currentStep === 4) {
      if (roofSubStep === 'orientation' && canProceedToNextStep()) {
        setRoofSubStep('type');
        return;
      }
      if (roofSubStep === 'type' && canProceedToNextStep()) {
        setRoofSubStep('surface');
        return;
      }
      if (roofSubStep === 'surface') {
        setCurrentStep(5);
        setRoofSubStep('orientation');
        setModuleSubStep('puissance');
        // Auto-select recommended power
        if (!formData.puissanceChoisie) {
          setFormData(prev => ({ ...prev, puissanceChoisie: getRecommendedPower().toString() }));
        }
        return;
      }
    }

    // Handle sub-steps within step 5 (Modules)
    if (currentStep === 5) {
      if (moduleSubStep === 'puissance' && canProceedToNextStep()) {
        setModuleSubStep('surplus');
        return;
      }
      if (moduleSubStep === 'surplus' && canProceedToNextStep()) {
        setModuleSubStep('contact');
        return;
      }
      if (moduleSubStep === 'contact' && canProceedToNextStep()) {
        // Submit lead and go to results
        submitSimulationLead();
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

    // Handle sub-steps within step 4 (Toiture)
    if (currentStep === 4) {
      if (roofSubStep === 'surface') {
        setRoofSubStep('type');
        return;
      }
      if (roofSubStep === 'type') {
        setRoofSubStep('orientation');
        return;
      }
      // Going back from orientation -> step 3 equipments
      if (roofSubStep === 'orientation') {
        setCurrentStep(3);
        setConsumptionSubStep('equipments');
        return;
      }
    }

    // Handle sub-steps within step 5 (Modules)
    if (currentStep === 5) {
      if (moduleSubStep === 'contact') {
        setModuleSubStep('surplus');
        return;
      }
      if (moduleSubStep === 'surplus') {
        setModuleSubStep('puissance');
        return;
      }
      if (moduleSubStep === 'puissance') {
        setCurrentStep(4);
        setRoofSubStep('surface');
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

      <main className="relative min-h-screen py-12 overflow-hidden" style={{
        background: 'linear-gradient(160deg, #fdf8f0 0%, #fefcf7 30%, #f0f7ff 60%, #fefaf3 100%)'
      }}>
        {/* Subtle solar decorative background */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          {/* Large soft sun glow top-right */}
          <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full" style={{
            background: 'radial-gradient(circle, rgba(251,191,36,0.08) 0%, rgba(251,191,36,0.03) 40%, transparent 70%)'
          }} />
          {/* Smaller warm accent bottom-left */}
          <div className="absolute -bottom-20 -left-20 w-[350px] h-[350px] rounded-full" style={{
            background: 'radial-gradient(circle, rgba(245,158,11,0.06) 0%, transparent 60%)'
          }} />
          {/* Very subtle grid pattern */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: `linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }} />
          {/* Diagonal sun rays */}
          <div className="absolute top-0 right-0 w-full h-full opacity-[0.025]" style={{
            backgroundImage: `repeating-linear-gradient(135deg, transparent, transparent 80px, rgba(251,191,36,0.3) 80px, rgba(251,191,36,0.3) 81px)`
          }} />
        </div>
        {/* Step Breadcrumb Navigation - Always narrow */}
        <div className="relative z-10 container mx-auto px-4 max-w-2xl mb-8">
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
        <div className={`relative z-10 container mx-auto px-4 ${[2, 3, 4].includes(currentStep) ? 'max-w-6xl' : 'max-w-2xl'}`}>

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

          {/* Step 4: Toiture - Two Column Layout */}
          {currentStep === 4 && (
            <div className="grid gap-6 lg:grid-cols-5">
              {roofSubStep === 'orientation' ? (
                <Card className="shadow-xl border-0 lg:col-span-3">
                  <CardHeader className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-t-lg">
                    <div className="flex items-center gap-3">
                      <Compass className="w-6 h-6" />
                      <div>
                        <CardTitle className="text-xl">Orientation de la toiture</CardTitle>
                        <CardDescription className="text-white/80">
                          Dans quelle direction est orientée votre toiture ?
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-5">
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">
                        Orientation principale <span className="text-destructive">*</span>
                      </Label>
                      <Select value={formData.orientationToiture} onValueChange={(value) => handleInputChange("orientationToiture", value)}>
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Sélectionnez l'orientation" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sud">Sud</SelectItem>
                          <SelectItem value="sud-est">Sud-Est</SelectItem>
                          <SelectItem value="sud-ouest">Sud-Ouest</SelectItem>
                          <SelectItem value="est">Est</SelectItem>
                          <SelectItem value="ouest">Ouest</SelectItem>
                          <SelectItem value="nord">Nord</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-start gap-2">
                      <Compass className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                      <p className="text-xs text-emerald-700">
                        <strong>Conseil :</strong> L'orientation Sud est idéale pour maximiser la production solaire. Les orientations Sud-Est et Sud-Ouest restent très performantes.
                      </p>
                    </div>
                    <div className="flex justify-between pt-4">
                      <Button variant="outline" onClick={handlePrevious} className="px-6 py-6">
                        <ArrowLeft className="w-5 h-5 mr-2" /> Précédent
                      </Button>
                      <Button onClick={handleNext} disabled={!canProceedToNextStep()} className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white px-8 py-6 text-base">
                        Suivant <ArrowRight className="w-5 h-5 ml-2" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : roofSubStep === 'type' ? (
                <Card className="shadow-xl border-0 lg:col-span-3">
                  <CardHeader className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-t-lg">
                    <div className="flex items-center gap-3">
                      <LayoutGrid className="w-6 h-6" />
                      <div>
                        <CardTitle className="text-xl">Type de toiture</CardTitle>
                        <CardDescription className="text-white/80">
                          Quel est le type de couverture de votre toiture ?
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-5">
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">
                        Type de couverture <span className="text-destructive">*</span>
                      </Label>
                      <Select value={formData.typeToiture} onValueChange={(value) => handleInputChange("typeToiture", value)}>
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Sélectionnez le type de toiture" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="tuiles">Tuiles</SelectItem>
                          <SelectItem value="ardoises">Ardoises</SelectItem>
                          <SelectItem value="plaques">Plaques</SelectItem>
                          <SelectItem value="bac-acier">Bac acier</SelectItem>
                          <SelectItem value="membrane-epdm">Membrane EPDM</SelectItem>
                          <SelectItem value="toiture-plate">Toiture plate</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-start gap-2">
                      <Info className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                      <p className="text-xs text-emerald-700">
                        <strong>Info :</strong> Le type de toiture influence le mode de fixation des panneaux solaires. Chaque type nécessite un système de montage adapté.
                      </p>
                    </div>
                    <div className="flex justify-between pt-4">
                      <Button variant="outline" onClick={handlePrevious} className="px-6 py-6">
                        <ArrowLeft className="w-5 h-5 mr-2" /> Précédent
                      </Button>
                      <Button onClick={handleNext} disabled={!canProceedToNextStep()} className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white px-8 py-6 text-base">
                        Suivant <ArrowRight className="w-5 h-5 ml-2" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="shadow-xl border-0 lg:col-span-3">
                  <CardHeader className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-t-lg">
                    <div className="flex items-center gap-3">
                      <Maximize2 className="w-6 h-6" />
                      <div>
                        <CardTitle className="text-xl">Surface de toiture</CardTitle>
                        <CardDescription className="text-white/80">
                          Quelle est la surface approximative de votre toiture ?
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-5">
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">
                        Surface approximative <span className="text-destructive">*</span>
                      </Label>
                      <Select value={formData.surfaceToiture} onValueChange={(value) => handleInputChange("surfaceToiture", value)}>
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Sélectionnez une tranche de surface" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="moins-30">Moins de 30 m²</SelectItem>
                          <SelectItem value="30-60">30 à 60 m²</SelectItem>
                          <SelectItem value="60-100">60 à 100 m²</SelectItem>
                          <SelectItem value="100-150">100 à 150 m²</SelectItem>
                          <SelectItem value="plus-150">Plus de 150 m²</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-start gap-2">
                      <Maximize2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                      <p className="text-xs text-emerald-700">
                        <strong>Astuce :</strong> La surface disponible détermine la puissance maximale installable. En moyenne, 1 kWc nécessite environ 5 à 7 m² de toiture.
                      </p>
                    </div>
                    <div className="flex justify-between pt-4">
                      <Button variant="outline" onClick={handlePrevious} className="px-6 py-6">
                        <ArrowLeft className="w-5 h-5 mr-2" /> Précédent
                      </Button>
                      <Button onClick={handleNext} disabled={!canProceedToNextStep()} className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white px-8 py-6 text-base">
                        Suivant <ArrowRight className="w-5 h-5 ml-2" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Right Column - Roof Summary Panel */}
              <div className="lg:col-span-2 space-y-4">
                <Card className="overflow-hidden border-0 shadow-lg">
                  <div className="bg-gradient-to-br from-emerald-500 to-teal-500 p-6 text-white text-center">
                    <div className="w-12 h-12 mx-auto mb-3 bg-white/20 rounded-full flex items-center justify-center">
                      <Home className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-lg">Votre toiture</h3>
                    <p className="text-sm text-white/80 mt-1">
                      {formData.orientationToiture && formData.typeToiture && formData.surfaceToiture ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-green-400" /> Toiture complète
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-yellow-300" /> En cours de saisie
                        </span>
                      )}
                    </p>
                  </div>
                </Card>

                {/* Orientation */}
                <div className={`p-3 rounded-lg border flex items-center gap-3 ${formData.orientationToiture ? 'bg-emerald-50 border-emerald-200' : 'bg-muted/30'}`}>
                  <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                    <Compass className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase flex items-center gap-1">
                      Orientation {formData.orientationToiture && <Check className="w-3 h-3 text-green-600" />}
                    </p>
                    <p className="font-bold capitalize">
                      {formData.orientationToiture ? formData.orientationToiture.replace('-', ' ') : 'Non renseigné'}
                    </p>
                  </div>
                </div>

                {/* Type */}
                <div className={`p-3 rounded-lg border flex items-center gap-3 ${formData.typeToiture ? 'bg-teal-50 border-teal-200' : 'bg-muted/30'}`}>
                  <div className="w-10 h-10 rounded-full bg-teal-500 flex items-center justify-center shrink-0">
                    <LayoutGrid className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase flex items-center gap-1">
                      Type de toiture {formData.typeToiture && <Check className="w-3 h-3 text-green-600" />}
                    </p>
                    <p className="font-bold capitalize">{formData.typeToiture ? formData.typeToiture.replace('-', ' ') : 'Non renseigné'}</p>
                  </div>
                </div>

                {/* Surface */}
                <div className={`p-3 rounded-lg border flex items-center gap-3 ${formData.surfaceToiture ? 'bg-green-50 border-green-200' : 'bg-muted/30'}`}>
                  <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center shrink-0">
                    <Maximize2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase flex items-center gap-1">
                      Surface toiture {formData.surfaceToiture && <Check className="w-3 h-3 text-green-600" />}
                    </p>
                    <p className="font-bold">
                      {(() => {
                        const labels: Record<string, string> = { 'moins-30': '< 30 m²', '30-60': '30 – 60 m²', '60-100': '60 – 100 m²', '100-150': '100 – 150 m²', 'plus-150': '> 150 m²' };
                        return formData.surfaceToiture ? labels[formData.surfaceToiture] || formData.surfaceToiture : 'Non renseigné';
                      })()}
                    </p>
                  </div>
                </div>

                {/* Estimation */}
                {formData.surfaceToiture && formData.orientationToiture && (
                  <Card className="border shadow-sm">
                    <CardContent className="p-4">
                      <h4 className="font-semibold text-sm text-center mb-3">Estimation préliminaire</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="text-center">
                          <p className="text-lg font-bold text-emerald-600">
                            {(() => {
                              const sMax: Record<string, number> = { 'moins-30': 20, '30-60': 45, '60-100': 80, '100-150': 125, 'plus-150': 180 };
                              return `≈ ${Math.round((sMax[formData.surfaceToiture] || 30) / 6)} kWc`;
                            })()}
                          </p>
                          <p className="text-xs text-muted-foreground">Puissance max.</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-teal-600">
                            {(() => {
                              const oFactor: Record<string, number> = { 'sud': 1, 'sud-est': 0.94, 'sud-ouest': 0.94, 'est': 0.82, 'ouest': 0.82, 'nord': 0.45 };
                              return `${Math.round((oFactor[formData.orientationToiture] || 0.85) * 100)}%`;
                            })()}
                          </p>
                          <p className="text-xs text-muted-foreground">Rendement orientation</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}

          {/* ========== STEP 5: MODULES ========== */}
          {currentStep === 5 && (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 max-w-5xl mx-auto">
              {/* Left Column - Module Selection or Contact */}
              {moduleSubStep === 'puissance' ? (
                <Card className="shadow-xl border-0 lg:col-span-3">
                  <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-t-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                        <Battery className="w-5 h-5" />
                      </div>
                      <div>
                        <CardTitle className="text-lg text-white">Choix de la puissance</CardTitle>
                        <CardDescription className="text-white/80">Sélectionnez la puissance de votre installation</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-5">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
                      <Info className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                      <p className="text-xs text-blue-700">
                        <strong>Recommandation :</strong> Basée sur votre consommation de {formData.consommationAnnuelle || '—'} kWh/an, nous recommandons une puissance de <strong>{getRecommendedPower()} kWc</strong>.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">
                        Puissance souhaitée <span className="text-destructive">*</span>
                      </Label>
                      <Select value={formData.puissanceChoisie} onValueChange={(value) => handleInputChange("puissanceChoisie", value)}>
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Choisissez une puissance" />
                        </SelectTrigger>
                        <SelectContent>
                          {powerOptions.map(p => (
                            <SelectItem key={p} value={p.toString()}>
                              {p} kWc {p === getRecommendedPower() ? '⭐ Recommandé' : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex justify-between pt-4">
                      <Button variant="outline" onClick={handlePrevious} className="px-6 py-6">
                        <ArrowLeft className="w-5 h-5 mr-2" /> Précédent
                      </Button>
                      <Button onClick={handleNext} disabled={!canProceedToNextStep()} className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white px-8 py-6 text-base">
                        Suivant <ArrowRight className="w-5 h-5 ml-2" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : moduleSubStep === 'surplus' ? (
                <Card className="shadow-xl border-0 lg:col-span-3">
                  <CardHeader className="bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-t-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                        <Zap className="w-5 h-5" />
                      </div>
                      <div>
                        <CardTitle className="text-lg text-white">Gestion du surplus</CardTitle>
                        <CardDescription className="text-white/80">Que souhaitez-vous faire de l'excédent produit ?</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-5">
                    <p className="text-sm text-muted-foreground">
                      Vos panneaux peuvent produire plus d'énergie que votre consommation. Choisissez comment gérer ce surplus :
                    </p>
                    <div className="space-y-3">
                      {[
                        { value: 'batterie', label: '🔋 Stocker sur une batterie', desc: 'Stockez l\'excédent pour l\'utiliser le soir ou les jours nuageux.' },
                        { value: 'revente', label: '💰 Revente totale du surplus à EDF', desc: 'Revendez l\'électricité excédentaire à EDF OA et générez des revenus.' },
                        { value: 'ne-sait-pas', label: '🤝 Je ne sais pas, je préfère être conseillé', desc: 'Un expert vous guidera vers la meilleure option pour votre situation.' },
                      ].map(option => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => handleInputChange('surplusChoice', option.value)}
                          className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                            formData.surplusChoice === option.value
                              ? 'border-amber-500 bg-amber-50 shadow-md'
                              : 'border-border hover:border-amber-300 hover:bg-amber-50/50'
                          }`}
                        >
                          <p className="font-semibold text-sm">{option.label}</p>
                          <p className="text-xs text-muted-foreground mt-1">{option.desc}</p>
                        </button>
                      ))}
                    </div>
                    <div className="flex justify-between pt-4">
                      <Button variant="outline" onClick={handlePrevious} className="px-6 py-6">
                        <ArrowLeft className="w-5 h-5 mr-2" /> Précédent
                      </Button>
                      <Button onClick={handleNext} disabled={!canProceedToNextStep()} className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-8 py-6 text-base">
                        Suivant <ArrowRight className="w-5 h-5 ml-2" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="shadow-xl border-0 lg:col-span-3">
                  <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-t-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                        <Mail className="w-5 h-5" />
                      </div>
                      <div>
                        <CardTitle className="text-lg text-white">Vos coordonnées</CardTitle>
                        <CardDescription className="text-white/80">Recevez vos résultats et recommandations</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="contactEmail" className="text-sm font-semibold flex items-center gap-2">
                        <Mail className="w-4 h-4" /> Adresse email <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="contactEmail"
                        type="email"
                        placeholder="votre@email.com"
                        value={formData.contactEmail}
                        onChange={(e) => handleInputChange("contactEmail", e.target.value)}
                        className="h-12"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contactPhone" className="text-sm font-semibold flex items-center gap-2">
                        <Phone className="w-4 h-4" /> Numéro de téléphone <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="contactPhone"
                        type="tel"
                        placeholder="06 12 34 56 78"
                        value={formData.contactPhone}
                        onChange={(e) => handleInputChange("contactPhone", e.target.value)}
                        className="h-12"
                      />
                    </div>
                    <div className="flex items-start space-x-3 p-4 bg-muted/30 rounded-lg border">
                      <Checkbox
                        id="acceptCgu"
                        checked={formData.acceptCgu}
                        onCheckedChange={(checked) => handleInputChange("acceptCgu", checked as boolean)}
                        className="mt-0.5"
                      />
                      <label htmlFor="acceptCgu" className="text-sm leading-relaxed cursor-pointer">
                        J'accepte les <a href="/conditions-utilisation" target="_blank" className="text-blue-600 underline hover:text-blue-800">conditions générales d'utilisation</a> et consens à recevoir mes résultats de simulation ainsi que des recommandations commerciales par email et/ou téléphone.
                      </label>
                    </div>
                    <div className="flex justify-between pt-4 gap-3">
                      <Button variant="outline" onClick={handlePrevious} className="px-4 py-5 shrink-0">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Précédent
                      </Button>
                      <Button 
                        onClick={handleNext} 
                        disabled={!canProceedToNextStep() || submittingLead} 
                        className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white px-4 py-5 text-sm whitespace-nowrap shrink min-w-0"
                      >
                        {submittingLead ? (
                          <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Envoi...</>
                        ) : (
                          <>Résultats <ArrowRight className="w-4 h-4 ml-1" /></>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Right Column - Consumption vs Production Chart */}
              <div className="lg:col-span-2 space-y-4">
                <Card className="overflow-hidden border-0 shadow-lg">
                  <div className="bg-gradient-to-br from-blue-500 to-indigo-500 p-6 text-white text-center">
                    <div className="w-12 h-12 mx-auto mb-3 bg-white/20 rounded-full flex items-center justify-center">
                      <BarChart3 className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-lg">Comparaison énergétique</h3>
                    <p className="text-sm text-white/80 mt-1">Consommation vs Production</p>
                  </div>
                </Card>

                {/* Visual Bar Chart */}
                <Card className="border shadow-sm">
                  <CardContent className="p-5">
                    {(() => {
                      const conso = parseFloat(formData.consommationAnnuelle) || 5000;
                      const puissance = parseFloat(formData.puissanceChoisie) || getRecommendedPower();
                      const oFactor: Record<string, number> = { 'sud': 1, 'sud-est': 0.94, 'sud-ouest': 0.94, 'est': 0.82, 'ouest': 0.82, 'nord': 0.45 };
                      const orientation = oFactor[formData.orientationToiture] || 0.85;
                      const productionAnnuelle = Math.round(puissance * 1100 * orientation);
                      const maxVal = Math.max(conso, productionAnnuelle);
                      const consoPercent = (conso / maxVal) * 100;
                      const prodPercent = (productionAnnuelle / maxVal) * 100;
                      const difference = productionAnnuelle - conso;
                      const coveragePercent = Math.round((productionAnnuelle / conso) * 100);

                      return (
                        <div className="space-y-5">
                          <h4 className="font-semibold text-sm text-center">Production annuelle estimée</h4>
                          
                          {/* Consumption Bar */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="font-medium text-orange-600">Consommation</span>
                              <span className="font-bold">{conso.toLocaleString()} kWh/an</span>
                            </div>
                            <div className="h-8 bg-muted/30 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full transition-all duration-700 flex items-center justify-end pr-2"
                                style={{ width: `${consoPercent}%` }}
                              >
                                <Zap className="w-4 h-4 text-white" />
                              </div>
                            </div>
                          </div>

                          {/* Production Bar */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="font-medium text-blue-600">Production ({puissance} kWc)</span>
                              <span className="font-bold">{productionAnnuelle.toLocaleString()} kWh/an</span>
                            </div>
                            <div className="h-8 bg-muted/30 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-blue-400 to-blue-500 rounded-full transition-all duration-700 flex items-center justify-end pr-2"
                                style={{ width: `${prodPercent}%` }}
                              >
                                <Sun className="w-4 h-4 text-white" />
                              </div>
                            </div>
                          </div>

                          {/* Difference indicator */}
                          <div className={`p-3 rounded-lg text-center ${difference >= 0 ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}>
                            {difference >= 0 ? (
                              <>
                                <p className="text-sm font-bold text-green-700">
                                  ✅ Couverture : {coveragePercent}%
                                </p>
                                <p className="text-xs text-green-600 mt-1">
                                  Surplus estimé : +{difference.toLocaleString()} kWh/an
                                </p>
                              </>
                            ) : (
                              <>
                                <p className="text-sm font-bold text-amber-700">
                                  ⚡ Couverture : {coveragePercent}%
                                </p>
                                <p className="text-xs text-amber-600 mt-1">
                                  Complément réseau : {Math.abs(difference).toLocaleString()} kWh/an
                                </p>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>

                {/* Selected power summary */}
                <div className={`p-3 rounded-lg border flex items-center gap-3 ${formData.puissanceChoisie ? 'bg-blue-50 border-blue-200' : 'bg-muted/30'}`}>
                  <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center shrink-0">
                    <Battery className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase flex items-center gap-1">
                      Puissance choisie {formData.puissanceChoisie && <Check className="w-3 h-3 text-green-600" />}
                    </p>
                    <p className="font-bold">{formData.puissanceChoisie ? `${formData.puissanceChoisie} kWc` : 'Non renseigné'}</p>
                  </div>
                </div>

                {/* Contact summary */}
                {formData.contactEmail && (
                  <div className="p-3 rounded-lg border bg-indigo-50 border-indigo-200 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center shrink-0">
                      <Mail className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase flex items-center gap-1">
                        Contact {formData.acceptCgu && <Check className="w-3 h-3 text-green-600" />}
                      </p>
                      <p className="font-bold text-sm truncate max-w-[180px]">{formData.contactEmail}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========== STEP 6: RÉSULTATS ========== */}
          {currentStep === 6 && (
            <RedirectResults
              formData={formData}
              redirectCountdown={redirectCountdown}
              setRedirectCountdown={setRedirectCountdown}
              navigate={navigate}
            />
          )}

        </div>
      </main>

      <Footer />
    </>
  );
};

export default SimulateurSolaire;
