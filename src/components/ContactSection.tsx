import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Phone, Mail, MapPin, Home, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";

const contactSchemaBase = z.object({
  fullName: z.string().trim().min(2, "Le nom doit contenir au moins 2 caractères").max(100),
  email: z.string().trim().email("Email invalide").max(255),
  phone: z.string().trim().min(10, "Numéro de téléphone invalide").max(20),
  subject: z.string().min(1, "Veuillez sélectionner un sujet"),
  message: z.string().trim().min(10, "Le message doit contenir au moins 10 caractères").max(500),
  companyName: z.string().optional(),
});

const ContactSection = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [accountType, setAccountType] = useState<"particulier" | "professionnel">("particulier");
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
    companyName: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Listen for pre-selection events from other components
  useEffect(() => {
    const handlePreselect = (event: CustomEvent<{ subject: string; accountType: "particulier" | "professionnel" }>) => {
      setAccountType(event.detail.accountType);
      setFormData(prev => ({ ...prev, subject: event.detail.subject }));
    };

    window.addEventListener('contact-preselect', handlePreselect as EventListener);
    return () => window.removeEventListener('contact-preselect', handlePreselect as EventListener);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validate form data with company name required for professionnel
      const schema = accountType === "professionnel" 
        ? contactSchemaBase.extend({
            companyName: z.string().trim().min(2, "Le nom de l'entreprise est requis").max(100),
          })
        : contactSchemaBase;
      
      schema.parse(formData);
      
      setIsSubmitting(true);

      // Split name into first and last name
      const nameParts = formData.fullName.trim().split(" ");
      const firstName = nameParts[0] || formData.fullName;
      const lastName = nameParts.slice(1).join(" ") || "";

      // Insert into leads table
      const leadData: any = {
        first_name: firstName,
        last_name: lastName,
        email: formData.email,
        phone: formData.phone,
        address: "N/A", // Required field, but not collected in contact form
        city: "N/A", // Required field, but not collected in contact form
        postal_code: "00000", // Required field, but not collected in contact form
        property_type: accountType,
        notes: `Sujet: ${formData.subject}\n\n${accountType === "professionnel" && formData.companyName ? `Entreprise: ${formData.companyName}\n\n` : ""}Message: ${formData.message}`,
        status: "new",
      };

      const { error } = await supabase.from("leads").insert(leadData);

      if (error) throw error;

      // Rediriger avec le nom pour personnaliser
      const params = new URLSearchParams({ name: formData.fullName });
      navigate(`/merci?${params.toString()}`);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error("Erreur lors de l'envoi du message");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const messageLength = formData.message.length;

  return (
    <section id="contact" className="bg-background py-16">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Nous Contacter</h2>
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
            Une question sur les énergies renouvelables ? Besoin d'un conseil personnalisé ?
            <br />
            Notre équipe d'experts est là pour vous accompagner.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Left Column - Contact Info */}
          <div>
            <h3 className="text-2xl font-bold mb-8">Restons en contact</h3>
            
            <div className="space-y-6 mb-10">
              {/* Phone */}
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Phone className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Téléphone</h4>
                  <p className="text-foreground font-medium">01 23 45 67 89</p>
                  <p className="text-sm text-muted-foreground">Lun-Ven 9h-18h</p>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Email</h4>
                  <p className="text-foreground font-medium">contact@prime-energies.fr</p>
                  <p className="text-sm text-muted-foreground">Réponse sous 24h</p>
                </div>
              </div>

              {/* Address */}
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Adresse</h4>
                  <p className="text-foreground font-medium">15 Avenue des Énergies Vertes</p>
                  <p className="text-sm text-muted-foreground">75001 Paris, France</p>
                </div>
              </div>
            </div>

            {/* Why choose us */}
            <div>
              <h4 className="font-semibold mb-4">Pourquoi nous choisir ?</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li>✓ Conseil gratuit et personnalisé</li>
                <li>✓ Réseau d'installateurs certifiés RGE</li>
                <li>✓ Accompagnement dans vos démarches</li>
                <li>✓ Suivi post-installation inclus</li>
              </ul>
            </div>
          </div>

          {/* Right Column - Contact Form */}
          <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
            <h3 className="text-2xl font-bold mb-6">Envoyez-nous un message</h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Account Type Selection */}
              <div className="grid grid-cols-2 gap-3 mb-2">
                <button
                  type="button"
                  onClick={() => {
                    setAccountType("particulier");
                    setFormData({ ...formData, subject: "" }); // Reset subject when changing type
                  }}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                    accountType === "particulier"
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <Home className="h-4 w-4" />
                  <span className="text-sm font-medium">Particulier</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAccountType("professionnel");
                    setFormData({ ...formData, subject: "" }); // Reset subject when changing type
                  }}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                    accountType === "professionnel"
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <Building2 className="h-4 w-4" />
                  <span className="text-sm font-medium">Professionnel</span>
                </button>
              </div>

              {/* Full Name and Email */}
              <div className="grid md:grid-cols-2 gap-4">
                <Input
                  placeholder={accountType === "professionnel" ? "Nom du contact" : "Nom et prénom"}
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required
                  maxLength={100}
                />
                <Input
                  type="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  maxLength={255}
                />
              </div>

              {/* Phone and Company Name (for professionnel only) */}
              <div className="grid md:grid-cols-2 gap-4">
                <Input
                  type="tel"
                  placeholder="Téléphone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                  maxLength={20}
                />
                {accountType === "professionnel" && (
                  <Input
                    placeholder="Nom de l'entreprise"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    required
                    maxLength={100}
                  />
                )}
              </div>

              {/* Subject Dropdown */}
              <Select value={formData.subject} onValueChange={(value) => setFormData({ ...formData, subject: value })}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Sélectionnez un sujet" />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  {accountType === "particulier" ? (
                    <>
                      <SelectItem value="demande-devis">Demande de devis</SelectItem>
                      <SelectItem value="information-produit">Information produit</SelectItem>
                      <SelectItem value="questions-aides">Questions sur les aides</SelectItem>
                      <SelectItem value="suivi-installation">Suivi d'installation</SelectItem>
                      <SelectItem value="autre-question">Autre question</SelectItem>
                    </>
                  ) : (
                  <>
                      <SelectItem value="demande-partenariat">Demande de partenariat</SelectItem>
                      <SelectItem value="aide-dossier-subvention">Demande d'aide dossier de subvention</SelectItem>
                      <SelectItem value="referencement-installateur">Référencement installateur</SelectItem>
                      <SelectItem value="formation-equipes">Formation équipes</SelectItem>
                      <SelectItem value="support-technique">Support technique</SelectItem>
                      <SelectItem value="autre-demande">Autre demande</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>

              {/* Message */}
              <div className="relative">
                <Textarea
                  placeholder="Décrivez votre projet ou votre question..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  required
                  rows={5}
                  maxLength={500}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {messageLength}/500 caractères
                </p>
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary/90 text-white font-medium"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Envoi en cours..." : "Envoyer le message"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
