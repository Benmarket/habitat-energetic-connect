import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle, User, Phone, Mail } from "lucide-react";

const leadSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(100, "Le nom ne doit pas dépasser 100 caractères"),
  phone: z
    .string()
    .trim()
    .min(10, "Le numéro de téléphone doit contenir au moins 10 chiffres")
    .max(20, "Le numéro de téléphone est trop long")
    .regex(/^[\d\s+\-().]+$/, "Format de téléphone invalide"),
  email: z
    .string()
    .trim()
    .email("Adresse email invalide")
    .max(255, "L'email ne doit pas dépasser 255 caractères"),
});

type LeadFormData = z.infer<typeof leadSchema>;

interface LeadOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  offerData: {
    offerId: string;
    offerTitle: string;
    advertiserName: string;
    advertiserId: string;
    productType: string;
  };
  onSuccess?: () => void;
}

export default function LeadOfferModal({
  isOpen,
  onClose,
  offerData,
  onSuccess,
}: LeadOfferModalProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema),
  });

  const onSubmit = async (data: LeadFormData) => {
    setIsSubmitting(true);

    try {
      // First, get the form configuration ID for lead-annonce
      const { data: formConfig, error: formError } = await supabase
        .from("form_configurations")
        .select("id")
        .eq("form_identifier", "lead-annonce")
        .maybeSingle();

      if (formError) throw formError;

      if (!formConfig) {
        throw new Error("Configuration du formulaire non trouvée");
      }

      // Submit the form data
      const { error: submitError } = await supabase
        .from("form_submissions")
        .insert({
          form_id: formConfig.id,
          data: {
            fullName: data.fullName,
            phone: data.phone,
            email: data.email,
            // Auto-captured data
            offerId: offerData.offerId,
            offerTitle: offerData.offerTitle,
            advertiserName: offerData.advertiserName,
            advertiserId: offerData.advertiserId,
            productType: offerData.productType,
            submittedAt: new Date().toISOString(),
          },
        });

      if (submitError) throw submitError;

      reset();
      onClose();
      
      // Call onSuccess callback for tracking
      onSuccess?.();
      
      // Rediriger avec paramètres personnalisés
      const params = new URLSearchParams({
        name: data.fullName,
        offer: offerData.offerTitle,
        partner: offerData.advertiserName,
      });
      navigate(`/merci?${params.toString()}`);
    } catch (error) {
      console.error("Error submitting lead:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      reset();
      setIsSuccess(false);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Demandez plus d'informations
          </DialogTitle>
          <DialogDescription>
            Remplissez le formulaire ci-dessous pour être recontacté par notre
            partenaire <span className="font-semibold text-foreground">{offerData.advertiserName}</span> concernant
            l'offre <span className="font-semibold text-foreground">{offerData.offerTitle}</span>.
          </DialogDescription>
        </DialogHeader>

        {isSuccess ? (
          <div className="py-8 flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <p className="text-lg font-semibold text-center">
              Merci pour votre demande !
            </p>
            <p className="text-muted-foreground text-center text-sm">
              Un conseiller vous contactera très prochainement.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                Nom complet
              </Label>
              <Input
                id="fullName"
                placeholder="Jean Dupont"
                {...register("fullName")}
                className={errors.fullName ? "border-destructive" : ""}
              />
              {errors.fullName && (
                <p className="text-sm text-destructive">
                  {errors.fullName.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-muted-foreground" />
                Téléphone
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="06 12 34 56 78"
                {...register("phone")}
                className={errors.phone ? "border-destructive" : ""}
              />
              {errors.phone && (
                <p className="text-sm text-destructive">
                  {errors.phone.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="jean.dupont@email.com"
                {...register("email")}
                className={errors.email ? "border-destructive" : ""}
              />
              {errors.email && (
                <p className="text-sm text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="pt-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-bold py-6"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  "Envoyer ma demande"
                )}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              En soumettant ce formulaire, vous acceptez d'être contacté par
              notre partenaire concernant cette offre.
            </p>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
