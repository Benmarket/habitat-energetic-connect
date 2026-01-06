import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Home, Building2, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const formSchema = z.object({
  propertyType: z.enum(["maison", "appartement"]),
  fullName: z.string().trim().min(1, "Le nom complet est requis"),
  phone: z.string().trim().min(10, "Téléphone invalide"),
  email: z.string().trim().email("Email invalide"),
  postalCode: z.string().trim().min(5, "Code postal invalide"),
});

const EligibilityFormSection = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    propertyType: "",
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

      // Rediriger avec le nom pour personnaliser
      const params = new URLSearchParams({ name: validated.fullName });
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
            {step === 1 && (
              <div className="space-y-8">
                <h3 className="text-xl md:text-2xl font-semibold text-center uppercase tracking-wide">
                  Sélectionner votre type de{" "}
                  <span className="text-primary">logement :</span>
                </h3>

                <div className="grid grid-cols-2 gap-3 md:gap-6 max-w-2xl mx-auto">
                  {/* Maison Card */}
                  <button
                    onClick={() => handlePropertyTypeSelect("maison")}
                    className="group relative overflow-hidden rounded-xl border-4 border-primary/30 hover:border-primary transition-all duration-300 hover:scale-105 hover:shadow-xl bg-white p-4 md:p-8"
                  >
                    <div className="flex flex-col items-center gap-2 md:gap-4">
                      <div className="w-16 h-16 md:w-24 md:h-24 flex items-center justify-center bg-primary/10 rounded-full group-hover:bg-primary/20 transition-colors">
                        <Home className="w-8 h-8 md:w-14 md:h-14 text-primary" />
                      </div>
                      <span className="text-lg md:text-2xl font-bold text-primary">Maison</span>
                    </div>
                  </button>

                  {/* Appartement Card */}
                  <button
                    onClick={() => handlePropertyTypeSelect("appartement")}
                    className="group relative overflow-hidden rounded-xl border-4 border-primary/30 hover:border-primary transition-all duration-300 hover:scale-105 hover:shadow-xl bg-white p-4 md:p-8"
                  >
                    <div className="flex flex-col items-center gap-2 md:gap-4">
                      <div className="w-16 h-16 md:w-24 md:h-24 flex items-center justify-center bg-primary/10 rounded-full group-hover:bg-primary/20 transition-colors">
                        <Building2 className="w-8 h-8 md:w-14 md:h-14 text-primary" />
                      </div>
                      <span className="text-lg md:text-2xl font-bold text-primary">Appartement</span>
                    </div>
                  </button>
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

            {step === 2 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setStep(1)}
                    type="button"
                  >
                    ← Retour
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Type sélectionné :{" "}
                    <span className="font-semibold text-primary capitalize">
                      {formData.propertyType}
                    </span>
                  </span>
                </div>

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
