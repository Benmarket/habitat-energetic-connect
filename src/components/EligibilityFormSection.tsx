import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Home, Building2, Clock, KeyRound, Flame, Droplets, Zap, Logs, Sun, Thermometer, Layers, Hammer, HelpCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const formSchema = z.object({
  propertyType: z.enum(["maison", "appartement"]),
  isOwner: z.enum(["oui", "non"]),
  heatingSystem: z.enum(["gaz", "fuel", "electrique", "autres"]),
  installationType: z.enum(["panneaux-photovoltaiques", "chauffage", "isolation", "renovation", "ne-sait-pas"]),
  fullName: z.string().trim().min(1, "Le nom complet est requis"),
  phone: z.string().trim().min(10, "Téléphone invalide"),
  email: z.string().trim().email("Email invalide"),
  postalCode: z.string().trim().min(5, "Code postal invalide"),
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
  const [formData, setFormData] = useState({
    propertyType: "",
    isOwner: "",
    heatingSystem: "",
    installationType: "",
    fullName: "",
    phone: "",
    email: "",
    postalCode: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePropertyTypeSelect = (type: "maison" | "appartement") => {
    setFormData({ ...formData, propertyType: type });
    setStep(2);
  };

  const handleOwnerSelect = (isOwner: "oui" | "non") => {
    setFormData({ ...formData, isOwner });
    setStep(3);
  };

  const handleHeatingSelect = (heatingSystem: "gaz" | "fuel" | "electrique" | "autres") => {
    setFormData({ ...formData, heatingSystem });
    setStep(4);
  };

  const handleInstallationSelect = (installationType: "panneaux-photovoltaiques" | "chauffage" | "isolation" | "renovation" | "ne-sait-pas") => {
    setFormData({ ...formData, installationType });
    setStep(5);
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
        name: validated.fullName,
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

  // Calculer le pourcentage de progression (étapes 2-5)
  const getProgressPercentage = () => {
    if (step === 1) return 0;
    // Étape 2 = 25%, Étape 3 = 50%, Étape 4 = 75%, Étape 5 = 100%
    return ((step - 1) / 4) * 100;
  };

  // Bouton de sélection réutilisable
  const SelectionButton = ({ 
    onClick, 
    icon: Icon, 
    customIcon,
    label,
    className = ""
  }: { 
    onClick: () => void; 
    icon?: React.ElementType; 
    customIcon?: React.ReactNode;
    label: string;
    className?: string;
  }) => (
    <button
      onClick={onClick}
      className={`group relative overflow-hidden rounded-xl border-4 border-primary/30 hover:border-primary transition-all duration-300 hover:scale-105 hover:shadow-xl bg-white p-4 md:p-8 ${className}`}
    >
      <div className="flex flex-col items-center gap-2 md:gap-4">
        <div className="w-16 h-16 md:w-24 md:h-24 flex items-center justify-center bg-primary/10 rounded-full group-hover:bg-primary/20 transition-colors">
          {customIcon ? customIcon : Icon && <Icon className="w-8 h-8 md:w-14 md:h-14 text-primary" />}
        </div>
        <span className="text-base md:text-xl font-bold text-primary">{label}</span>
      </div>
    </button>
  );

  // En-tête avec bouton retour et indicateur d'étape
  const StepHeader = ({ currentStep, totalSteps, onBack }: { currentStep: number; totalSteps: number; onBack: () => void }) => (
    <div className="space-y-4 mb-6">
      {/* Barre de progression */}
      <div className="w-full">
        <Progress value={getProgressPercentage()} className="h-2 bg-muted" />
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

  return (
    <section id="etude" className="pt-16 pb-8 bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4">
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

          {/* Form Content */}
          <Card className="p-8 shadow-lg">
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
                  />
                  <SelectionButton
                    onClick={() => handlePropertyTypeSelect("appartement")}
                    icon={Building2}
                    label="Appartement"
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
                  />
                  <SelectionButton
                    onClick={() => handleOwnerSelect("non")}
                    customIcon={<KeyCrossedIcon className="w-8 h-8 md:w-14 md:h-14 text-primary" />}
                    label="Non"
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
                    icon={Flame}
                    label="Gaz"
                  />
                  <SelectionButton
                    onClick={() => handleHeatingSelect("fuel")}
                    icon={Droplets}
                    label="Fuel"
                  />
                  <SelectionButton
                    onClick={() => handleHeatingSelect("electrique")}
                    icon={Zap}
                    label="Électrique"
                  />
                  <SelectionButton
                    onClick={() => handleHeatingSelect("autres")}
                    icon={Logs}
                    label="Autres"
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

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 max-w-3xl mx-auto">
                  <SelectionButton
                    onClick={() => handleInstallationSelect("panneaux-photovoltaiques")}
                    icon={Sun}
                    label="Panneaux solaires"
                  />
                  <SelectionButton
                    onClick={() => handleInstallationSelect("chauffage")}
                    icon={Thermometer}
                    label="Chauffage"
                  />
                  <SelectionButton
                    onClick={() => handleInstallationSelect("isolation")}
                    icon={Layers}
                    label="Isolation"
                  />
                  <SelectionButton
                    onClick={() => handleInstallationSelect("renovation")}
                    icon={Hammer}
                    label="Rénovation globale"
                  />
                  <SelectionButton
                    onClick={() => handleInstallationSelect("ne-sait-pas")}
                    icon={HelpCircle}
                    label="Je ne sais pas"
                    className="md:col-start-2"
                  />
                </div>
              </div>
            )}

            {/* Étape 5 : Coordonnées */}
            {step === 5 && (
              <div className="space-y-6">
                <StepHeader currentStep={5} totalSteps={5} onBack={() => setStep(4)} />

                <h3 className="text-xl font-semibold text-center mb-6">
                  Vos coordonnées pour recevoir votre étude personnalisée
                </h3>

                <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto">
                  <div>
                    <Label htmlFor="fullName" className="text-sm">
                      Nom complet
                    </Label>
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) =>
                        setFormData({ ...formData, fullName: e.target.value })
                      }
                      placeholder="Votre nom et prénom"
                      className="h-10"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone" className="text-sm">
                      Téléphone
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="06 12 34 56 78"
                      className="h-10"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="email" className="text-sm">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="votre@email.com"
                      className="h-10"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="postalCode" className="text-sm">
                      Code postal
                    </Label>
                    <Input
                      id="postalCode"
                      value={formData.postalCode}
                      onChange={(e) =>
                        setFormData({ ...formData, postalCode: e.target.value })
                      }
                      placeholder="75001"
                      maxLength={5}
                      className="h-10"
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-11 text-base font-semibold mt-6"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Envoi en cours..." : "Vérifier mon éligibilité"}
                  </Button>
                </form>

                <p className="text-center text-xs text-muted-foreground mt-6">
                  Vos données sont protégées. En savoir plus sur notre{" "}
                  <Link to="/politique-confidentialite" className="text-primary hover:underline">
                    politique de confidentialité
                  </Link>
                  .
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </section>
  );
};

export default EligibilityFormSection;
