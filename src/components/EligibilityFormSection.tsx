import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Home, Building2, Clock, KeyRound, Flame, Droplets, Zap, Logs, Sun, Thermometer, Layers, Hammer, HelpCircle, MapPin, User, Mail, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import naturePrimeGif from "@/assets/nature-prime.gif";

const formSchema = z.object({
  propertyType: z.enum(["maison", "appartement"]),
  isOwner: z.enum(["oui", "non"]),
  heatingSystem: z.enum(["gaz", "fuel", "electrique", "autres"]),
  installationType: z.enum(["panneaux-photovoltaiques", "chauffage", "isolation", "renovation", "ne-sait-pas"]),
  firstName: z.string().trim().min(1, "Le prénom est requis"),
  lastName: z.string().trim().min(1, "Le nom est requis"),
  phone: z.string().trim().min(10, "Téléphone invalide"),
  email: z.string().trim().email("Email invalide"),
  postalCode: z.string().trim().regex(/^\d{5}$/, "Code postal invalide (5 chiffres)"),
});

// Composant icône clé barrée pour "Non propriétaire" - même clé que KeyRound avec barre
const KeyCrossedIcon = ({ className }: { className?: string }) => (
  <div className="relative">
    <KeyRound className={className} />
    <svg 
      className={`absolute inset-0 ${className}`}
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2.5" 
      strokeLinecap="round"
    >
      <line x1="4" y1="4" x2="20" y2="20" />
    </svg>
  </div>
);

const EligibilityFormSection = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selectedValue, setSelectedValue] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    propertyType: "",
    isOwner: "",
    heatingSystem: "",
    installationType: "",
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    postalCode: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [buttonBounce, setButtonBounce] = useState<number | null>(null);

  // Fonction pour déclencher le bounce et passer à l'étape suivante
  const handleNextStepWithBounce = (currentStep: number, nextStep: number) => {
    setButtonBounce(currentStep);
    setTimeout(() => {
      setStep(nextStep);
      setButtonBounce(null);
    }, 500);
  };

  // Transition vers l'étape suivante avec délai pour le double bounce
  const goToNextStep = (nextStep: number) => {
    setTimeout(() => {
      setStep(nextStep);
      setSelectedValue(null);
    }, 500);
  };

  const handlePropertyTypeSelect = (type: "maison" | "appartement") => {
    setSelectedValue(type);
    setFormData({ ...formData, propertyType: type });
    goToNextStep(2);
  };

  const handleOwnerSelect = (isOwner: "oui" | "non") => {
    setSelectedValue(isOwner);
    setFormData({ ...formData, isOwner });
    goToNextStep(3);
  };

  const handleHeatingSelect = (heatingSystem: "gaz" | "fuel" | "electrique" | "autres") => {
    setSelectedValue(heatingSystem);
    setFormData({ ...formData, heatingSystem });
    goToNextStep(4);
  };

  const handleInstallationSelect = (installationType: "panneaux-photovoltaiques" | "chauffage" | "isolation" | "renovation" | "ne-sait-pas") => {
    setSelectedValue(installationType);
    setFormData({ ...formData, installationType });
    goToNextStep(5);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const validated = formSchema.parse(formData);

      // Récupérer la configuration du formulaire
      const { data: formConfig } = await supabase
        .from("form_configurations")
        .select("id")
        .eq("form_identifier", "eligibility-form-accueil")
        .maybeSingle();

      if (!formConfig) {
        toast({
          title: "Erreur",
          description: "Configuration du formulaire introuvable",
          variant: "destructive",
        });
        return;
      }

      // Soumettre les données
      const { error } = await supabase.from("form_submissions").insert({
        form_id: formConfig.id,
        data: validated,
      });

      if (error) throw error;

      // Mapper le type d'installation vers le workType de la page Merci
      const workTypeMap: Record<string, string> = {
        "panneaux-photovoltaiques": "energie-solaire",
        "chauffage": "chauffage",
        "isolation": "isolation",
        "renovation": "renovation-globale",
        "ne-sait-pas": "autre",
      };

      // Rediriger avec le nom et le type de travaux
      const params = new URLSearchParams({ 
        name: `${validated.firstName} ${validated.lastName}`,
        workType: workTypeMap[validated.installationType] || "autre"
      });
      navigate(`/merci?${params.toString()}`);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Erreur de validation",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erreur",
          description: "Une erreur est survenue lors de l'envoi",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculer le pourcentage de progression (étapes 2-7)
  const getProgressPercentage = () => {
    if (step === 1) return 0;
    // 7 étapes au total, progression de 2 à 7
    return ((step - 1) / 6) * 100;
  };

  // Validation du code postal (5 chiffres)
  const isPostalCodeValid = /^\d{5}$/.test(formData.postalCode);
  
  // Validation nom/prénom
  const isNameValid = formData.firstName.trim().length > 0 && formData.lastName.trim().length > 0;
  
  // Validation email/téléphone
  const isContactValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) && formData.phone.trim().length >= 10;

  // Bouton de sélection réutilisable avec animations
  const SelectionButton = ({ 
    onClick, 
    icon: Icon, 
    customIcon,
    label,
    value,
    className = ""
  }: { 
    onClick: () => void; 
    icon?: React.ElementType; 
    customIcon?: React.ReactNode;
    label: string;
    value?: string;
    className?: string;
  }) => {
    const isSelected = selectedValue === value;
    
    return (
      <button
        onClick={onClick}
        className={cn(
          "group relative overflow-hidden rounded-xl border-4 border-primary/30 hover:border-primary transition-all duration-300 hover:scale-105 hover:shadow-xl bg-white p-4 md:p-8",
          isSelected && "animate-double-bounce border-primary shadow-[0_0_20px_rgba(34,197,94,0.5),0_0_40px_rgba(34,197,94,0.3)]",
          className
        )}
      >
        <div className="flex flex-col items-center gap-2 md:gap-4">
          <div className={cn(
            "w-16 h-16 md:w-24 md:h-24 flex items-center justify-center bg-primary/10 rounded-full group-hover:bg-primary/20 transition-colors",
            isSelected && "bg-primary/30"
          )}>
            {customIcon ? customIcon : Icon && <Icon className="w-8 h-8 md:w-14 md:h-14 text-primary" />}
          </div>
          <span className="text-sm md:text-base font-bold text-primary text-center leading-tight">{label}</span>
        </div>
      </button>
    );
  };

  // En-tête avec bouton retour et indicateur d'étape
  const StepHeader = ({ currentStep, totalSteps, onBack }: { currentStep: number; totalSteps: number; onBack: () => void }) => (
    <div className="space-y-4 mb-6">
      {/* Barre de progression bleue */}
      <div className="w-full">
        <Progress value={getProgressPercentage()} className="h-2 bg-muted [&>div]:bg-blue-500" />
      </div>
      
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={onBack}
          type="button"
        >
          ← Retour
        </Button>
        <span className="text-sm text-muted-foreground">
          Étape <span className="font-semibold text-primary">{currentStep}</span> / {totalSteps}
        </span>
      </div>
    </div>
  );

  // Composant pour les étapes avec champs de saisie
  const InputStepContainer = ({ children }: { children: React.ReactNode }) => (
    <div className="flex flex-col items-center justify-center min-h-[320px] md:min-h-[380px]">
      {children}
    </div>
  );

  return (
    <section 
      id="etude" 
      className="pt-16 pb-8 relative"
      style={{
        backgroundImage: `url(${naturePrimeGif})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Overlay pour lisibilité */}
      <div className="absolute inset-0 bg-white/70"></div>
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              <span className="text-primary">Vérifier mon éligibilité</span>{" "}
              <span className="text-foreground">à la prime énergie :</span>
            </h2>
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Clock className="h-5 w-5" />
              <span className="text-sm">Estimation : 1 minute</span>
            </div>
          </div>

          {/* Form Content - Bump animation only on step 1 */}
          <Card className={`p-8 shadow-lg overflow-hidden ${step === 1 ? 'animate-attention-bump' : ''}`}>
            {/* Étape 1 : Type de logement */}
            {step === 1 && (
              <div className="space-y-8">
                <h3 className="text-xl md:text-2xl font-semibold text-center uppercase tracking-wide">
                  Sélectionner votre type de{" "}
                  <span className="text-primary">logement :</span>
                </h3>

                <div className="grid grid-cols-2 gap-3 md:gap-6 max-w-2xl mx-auto">
                  <SelectionButton
                    onClick={() => handlePropertyTypeSelect("maison")}
                    icon={Home}
                    label="Maison"
                    value="maison"
                  />
                  <SelectionButton
                    onClick={() => handlePropertyTypeSelect("appartement")}
                    icon={Building2}
                    label="Appartement"
                    value="appartement"
                  />
                </div>

                <p className="text-center text-sm text-muted-foreground mt-8">
                  Vos données sont protégées. En savoir plus sur notre{" "}
                  <Link to="/politique-confidentialite" className="text-primary hover:underline">
                    politique de confidentialité
                  </Link>
                  .
                </p>
              </div>
            )}

            {/* Étape 2 : Propriétaire ou non */}
            {step === 2 && (
              <div className="space-y-8">
                <StepHeader currentStep={2} totalSteps={5} onBack={() => setStep(1)} />

                <h3 className="text-xl md:text-2xl font-semibold text-center">
                  Êtes-vous <span className="text-primary">propriétaire</span> ?
                </h3>

                <div className="grid grid-cols-2 gap-3 md:gap-6 max-w-2xl mx-auto">
                  <SelectionButton
                    onClick={() => handleOwnerSelect("oui")}
                    icon={KeyRound}
                    label="Oui"
                    value="oui"
                  />
                  <SelectionButton
                    onClick={() => handleOwnerSelect("non")}
                    customIcon={<KeyCrossedIcon className="w-8 h-8 md:w-14 md:h-14 text-primary" />}
                    label="Non"
                    value="non"
                  />
                </div>
              </div>
            )}

            {/* Étape 3 : Système de chauffage */}
            {step === 3 && (
              <div className="space-y-8">
                <StepHeader currentStep={3} totalSteps={5} onBack={() => setStep(2)} />

                <h3 className="text-xl md:text-2xl font-semibold text-center">
                  Quel est votre système de{" "}
                  <span className="text-primary">chauffage actuel</span> ?
                </h3>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 max-w-3xl mx-auto">
                  <SelectionButton
                    onClick={() => handleHeatingSelect("gaz")}
                    customIcon={<Flame className="w-8 h-8 md:w-14 md:h-14 text-gray-500" />}
                    label="Gaz"
                    value="gaz"
                  />
                  <SelectionButton
                    onClick={() => handleHeatingSelect("fuel")}
                    customIcon={<Droplets className="w-8 h-8 md:w-14 md:h-14 text-red-500" />}
                    label="Fuel"
                    value="fuel"
                  />
                  <SelectionButton
                    onClick={() => handleHeatingSelect("electrique")}
                    customIcon={<Zap className="w-8 h-8 md:w-14 md:h-14 text-yellow-500" />}
                    label="Électrique"
                    value="electrique"
                  />
                  <SelectionButton
                    onClick={() => handleHeatingSelect("autres")}
                    customIcon={<Logs className="w-8 h-8 md:w-14 md:h-14 text-black" />}
                    label="Autres"
                    value="autres"
                  />
                </div>
              </div>
            )}

            {/* Étape 4 : Type d'installation */}
            {step === 4 && (
              <div className="space-y-8">
                <StepHeader currentStep={4} totalSteps={5} onBack={() => setStep(3)} />

                <h3 className="text-xl md:text-2xl font-semibold text-center">
                  Pour quel type{" "}
                  <span className="text-primary">d'installation</span> ?
                </h3>

                <div className="grid grid-cols-3 md:grid-cols-5 gap-2 md:gap-3 max-w-5xl mx-auto">
                  <SelectionButton
                    onClick={() => handleInstallationSelect("panneaux-photovoltaiques")}
                    customIcon={<Sun className="w-6 h-6 md:w-10 md:h-10 text-yellow-500" />}
                    label="Panneaux solaires"
                    value="panneaux-photovoltaiques"
                    className="p-2 md:p-4"
                  />
                  <SelectionButton
                    onClick={() => handleInstallationSelect("chauffage")}
                    customIcon={<Thermometer className="w-6 h-6 md:w-10 md:h-10 text-red-500" />}
                    label="Chauffage"
                    value="chauffage"
                    className="p-2 md:p-4"
                  />
                  <SelectionButton
                    onClick={() => handleInstallationSelect("isolation")}
                    customIcon={<Layers className="w-6 h-6 md:w-10 md:h-10 text-blue-500" />}
                    label="Isolation"
                    value="isolation"
                    className="p-2 md:p-4"
                  />
                  <SelectionButton
                    onClick={() => handleInstallationSelect("renovation")}
                    customIcon={<Hammer className="w-6 h-6 md:w-10 md:h-10 text-orange-500" />}
                    label="Rénovation globale"
                    value="renovation"
                    className="p-2 md:p-4 col-span-1"
                  />
                  <SelectionButton
                    onClick={() => handleInstallationSelect("ne-sait-pas")}
                    customIcon={<HelpCircle className="w-6 h-6 md:w-10 md:h-10 text-gray-600" />}
                    label="Je ne sais pas"
                    value="ne-sait-pas"
                    className="p-2 md:p-4 col-span-2 md:col-span-1"
                  />
                </div>
              </div>
            )}

            {/* Étape 5 : Code postal */}
            {step === 5 && (
              <div className="space-y-6">
                <StepHeader currentStep={5} totalSteps={7} onBack={() => setStep(4)} />

                <InputStepContainer>
                  <div className="w-full max-w-lg mx-auto space-y-6">
                    {/* Icône */}
                    <div className="flex justify-center">
                      <div className="w-20 h-20 md:w-28 md:h-28 flex items-center justify-center bg-primary/10 rounded-full">
                        <MapPin className="w-10 h-10 md:w-14 md:h-14 text-primary" />
                      </div>
                    </div>

                    {/* Titre */}
                    <div className="text-center space-y-2">
                      <h3 className="text-xl md:text-2xl font-bold text-foreground">
                        Dans quelle <span className="text-primary">zone</span> se situe votre logement ?
                      </h3>
                      <p className="text-muted-foreground text-sm md:text-base">
                        Le code postal nous permet de vérifier les aides disponibles dans votre région.
                      </p>
                    </div>

                    {/* Champ */}
                    <div className="space-y-3">
                      <Label htmlFor="postalCode" className="text-base font-medium flex items-center gap-1">
                        Code postal <span className="text-orange-500">*</span>
                      </Label>
                      <Input
                        id="postalCode"
                        value={formData.postalCode}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 5);
                          setFormData({ ...formData, postalCode: value });
                        }}
                        placeholder="Ex: 75001"
                        className="h-14 text-lg text-center border-2 border-primary/30 focus:border-primary"
                        maxLength={5}
                      />
                    </div>

                    {/* Bouton */}
                    <Button
                      onClick={() => handleNextStepWithBounce(5, 6)}
                      disabled={!isPostalCodeValid}
                      className={cn(
                        "w-full h-14 text-lg font-semibold",
                        buttonBounce === 5 && "animate-double-bounce"
                      )}
                    >
                      Suivant →
                    </Button>
                  </div>
                </InputStepContainer>
              </div>
            )}

            {/* Étape 6 : Nom et Prénom */}
            {step === 6 && (
              <div className="space-y-6">
                <StepHeader currentStep={6} totalSteps={7} onBack={() => setStep(5)} />

                <InputStepContainer>
                  <div className="w-full max-w-lg mx-auto space-y-6">
                    {/* Icône */}
                    <div className="flex justify-center">
                      <div className="w-20 h-20 md:w-28 md:h-28 flex items-center justify-center bg-primary/10 rounded-full">
                        <User className="w-10 h-10 md:w-14 md:h-14 text-primary" />
                      </div>
                    </div>

                    {/* Titre */}
                    <div className="text-center space-y-2">
                      <h3 className="text-xl md:text-2xl font-bold text-foreground">
                        <span className="text-primary">Félicitations</span>, votre zone est éligible !
                      </h3>
                      <p className="text-muted-foreground text-sm md:text-base">
                        Maintenant, dites-nous qui vous êtes pour personnaliser votre étude.
                      </p>
                    </div>

                    {/* Champs */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName" className="text-base font-medium flex items-center gap-1">
                          Prénom <span className="text-orange-500">*</span>
                        </Label>
                        <Input
                          id="firstName"
                          value={formData.firstName}
                          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                          placeholder="Votre prénom"
                          className="h-14 text-lg border-2 border-primary/30 focus:border-primary"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName" className="text-base font-medium flex items-center gap-1">
                          Nom <span className="text-orange-500">*</span>
                        </Label>
                        <Input
                          id="lastName"
                          value={formData.lastName}
                          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                          placeholder="Votre nom"
                          className="h-14 text-lg border-2 border-primary/30 focus:border-primary"
                        />
                      </div>
                    </div>

                    {/* Bouton */}
                    <Button
                      onClick={() => handleNextStepWithBounce(6, 7)}
                      disabled={!isNameValid}
                      className={cn(
                        "w-full h-14 text-lg font-semibold",
                        buttonBounce === 6 && "animate-double-bounce"
                      )}
                    >
                      Suivant →
                    </Button>
                  </div>
                </InputStepContainer>
              </div>
            )}

            {/* Étape 7 : Email et Téléphone */}
            {step === 7 && (
              <div className="space-y-6">
                <StepHeader currentStep={7} totalSteps={7} onBack={() => setStep(6)} />

                <InputStepContainer>
                  <div className="w-full max-w-lg mx-auto space-y-6">
                    {/* Icône */}
                    <div className="flex justify-center">
                      <div className="w-20 h-20 md:w-28 md:h-28 flex items-center justify-center bg-primary/10 rounded-full">
                        <Mail className="w-10 h-10 md:w-14 md:h-14 text-primary" />
                      </div>
                    </div>

                    {/* Titre */}
                    <div className="text-center space-y-2">
                      <h3 className="text-xl md:text-2xl font-bold text-foreground">
                        Dernière étape, <span className="text-primary">{formData.firstName || "..."}</span> !
                      </h3>
                      <p className="text-muted-foreground text-sm md:text-base">
                        Vos coordonnées pour recevoir votre étude personnalisée gratuite.
                      </p>
                    </div>

                    {/* Champs */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-base font-medium flex items-center gap-1">
                          <Mail className="w-4 h-4" /> Email <span className="text-orange-500">*</span>
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="votre@email.com"
                          className="h-14 text-lg border-2 border-primary/30 focus:border-primary"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-base font-medium flex items-center gap-1">
                          <Phone className="w-4 h-4" /> Téléphone <span className="text-orange-500">*</span>
                        </Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="06 12 34 56 78"
                          className="h-14 text-lg border-2 border-primary/30 focus:border-primary"
                        />
                      </div>

                      {/* Bouton */}
                      <Button
                        type="submit"
                        disabled={!isContactValid || isSubmitting}
                        className={cn(
                          "w-full h-14 text-lg font-semibold mt-4",
                          isSubmitting && "animate-double-bounce"
                        )}
                      >
                        {isSubmitting ? "Envoi en cours..." : "Vérifier mon éligibilité →"}
                      </Button>
                    </form>

                    <p className="text-center text-xs text-muted-foreground">
                      Vos données sont protégées. En savoir plus sur notre{" "}
                      <Link to="/politique-confidentialite" className="text-primary hover:underline">
                        politique de confidentialité
                      </Link>
                      .
                    </p>
                  </div>
                </InputStepContainer>
              </div>
            )}
          </Card>
        </div>
      </div>
    </section>
  );
};

export default EligibilityFormSection;
