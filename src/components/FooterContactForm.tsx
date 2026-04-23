import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import { Send } from "lucide-react";

const formSchema = z.object({
  lastName: z.string().min(1, "Nom requis"),
  firstName: z.string().min(1, "Prénom requis"),
  phone: z.string().min(10, "Téléphone invalide"),
  email: z.string().email("Email invalide"),
  postalCode: z.string().regex(/^\d{5}$/, "Code postal invalide"),
  workType: z.string().min(1, "Type de travaux requis"),
});

const FooterContactForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    lastName: "",
    firstName: "",
    phone: "",
    email: "",
    postalCode: "",
    workType: "",
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      formSchema.parse(formData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      // Insert into leads table for CRM
      const { error: leadError } = await supabase.from("leads").insert({
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formData.phone,
        email: formData.email,
        postal_code: formData.postalCode,
        address: "",
        city: "",
        needs: [formData.workType],
      });

      if (leadError) throw leadError;

      // Also insert into form_submissions for admin tracking
      const { error: formError } = await supabase.from("form_submissions").insert({
        form_id: "b0e21b71-1c2c-4474-895d-7b43117fa2ec",
        data: {
          nom: formData.lastName,
          prenom: formData.firstName,
          telephone: formData.phone,
          email: formData.email,
          code_postal: formData.postalCode,
          type_travaux: formData.workType,
        },
      });

      if (formError) console.error("Form submission tracking error:", formError);

      // Fire-and-forget confirmation email (uses admin toggles)
      const { sendFormConfirmationEmail } = await import("@/lib/sendFormConfirmationEmail");
      sendFormConfirmationEmail({
        formIdentifier: "footer-contact",
        recipient: {
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
        },
        formLabel: "votre demande Prime énergies",
        requestSummary: `${formData.workType} • ${formData.postalCode}`,
      });

      toast.success("Votre demande a bien été envoyée !");
      setFormData({
        lastName: "",
        firstName: "",
        phone: "",
        email: "",
        postalCode: "",
        workType: "",
      });
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("Erreur lors de l'envoi, veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="bg-[#1a2332] pt-14 pb-0">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-8">
          <h2 className="text-2xl lg:text-3xl font-extrabold text-white">
            Je souhaite bénéficier de la Prime énergies pour mon habitat
          </h2>
          <p className="text-primary font-semibold mt-2 text-sm lg:text-base">
            Propriétaires de maison individuelle exclusivement
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid sm:grid-cols-2 gap-x-6 gap-y-4">
            <div className="space-y-1.5">
              <Label className="text-primary text-xs font-semibold uppercase tracking-wide">
                Nom de famille <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="Nom de famille"
                value={formData.lastName}
                onChange={(e) => handleChange("lastName", e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-primary h-11"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-primary text-xs font-semibold uppercase tracking-wide">
                Prénom <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="Prénom"
                value={formData.firstName}
                onChange={(e) => handleChange("firstName", e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-primary h-11"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-primary text-xs font-semibold uppercase tracking-wide">
                Téléphone <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="Téléphone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-primary h-11"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-primary text-xs font-semibold uppercase tracking-wide">
                E-mail <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="Ex. email@exemple.fr"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-primary h-11"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-primary text-xs font-semibold uppercase tracking-wide">
                Code postal <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="Code postal"
                value={formData.postalCode}
                onChange={(e) => handleChange("postalCode", e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-primary h-11"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-primary text-xs font-semibold uppercase tracking-wide">
                Type de travaux <span className="text-destructive">*</span>
              </Label>
              <Select value={formData.workType} onValueChange={(v) => handleChange("workType", v)}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white h-11 [&>span]:text-white/40 data-[state=open]:border-primary">
                  <SelectValue placeholder="Sélectionnez" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="panneaux-photovoltaiques">Panneaux photovoltaïques</SelectItem>
                  <SelectItem value="pompe-a-chaleur">Pompe à chaleur</SelectItem>
                  <SelectItem value="isolation">Isolation</SelectItem>
                  <SelectItem value="renovation-globale">Rénovation globale</SelectItem>
                  <SelectItem value="ballon-thermodynamique">Ballon thermodynamique</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-center pt-2 pb-10">
            <Button
              type="submit"
              disabled={isSubmitting}
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-full px-12 h-12 text-base gap-2"
            >
              <Send className="w-4 h-4" />
              {isSubmitting ? "Envoi en cours..." : "Envoyer ma demande"}
            </Button>
          </div>
        </form>
      </div>

      {/* Séparateur subtil vers le footer */}
      <div className="border-t border-white/10" />
    </section>
  );
};

export default FooterContactForm;
