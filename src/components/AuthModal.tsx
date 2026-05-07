import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Home, Building2 } from "lucide-react";
import { PasswordStrengthIndicator } from "@/components/PasswordStrengthIndicator";

const strongPassword = z
  .string()
  .min(8, "8 caractères minimum")
  .regex(/[A-Z]/, "Au moins une majuscule");

const signInSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
});

const signUpParticulierSchema = z.object({
  fullName: z.string().min(2, "Le nom complet doit contenir au moins 2 caractères"),
  phone: z.string().min(10, "Numéro de téléphone invalide"),
  email: z.string().email("Email invalide"),
  password: strongPassword,
});

const signUpProfessionnelSchema = z.object({
  contactName: z.string().min(2, "Le nom du contact doit contenir au moins 2 caractères"),
  companyName: z.string().min(2, "Le nom de l'entreprise doit contenir au moins 2 caractères"),
  phone: z.string().min(10, "Numéro de téléphone invalide"),
  email: z.string().email("Email invalide"),
  password: strongPassword,
});

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AuthModal = ({ open, onOpenChange }: AuthModalProps) => {
  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signin");
  const [accountType, setAccountType] = useState<"particulier" | "professionnel">("particulier");
  const [signupPassword, setSignupPassword] = useState("");
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  // Reset to signin tab whenever modal opens
  useEffect(() => {
    if (open) {
      setActiveTab("signin");
    }
  }, [open]);

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
    };

    try {
      signInSchema.parse(data);
      const { error } = await signIn(data.email, data.password);
      
      if (error) {
        toast.error(error.message);
        return;
      }
      
      toast.success("Connexion réussie !");
      onOpenChange(false);
      navigate("/dashboard");
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      }
    }
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    try {
      const email = formData.get("email") as string;
      const phone = formData.get("phone") as string;

      const [{ data: emailUsed }, { data: phoneUsed }] = await Promise.all([
        supabase.rpc("email_already_used", { _email: email }),
        supabase.rpc("phone_already_used", { _phone: phone }),
      ]);
      if (emailUsed) {
        toast.error("Un compte existe déjà avec cet email.");
        return;
      }
      if (phoneUsed) {
        toast.error("Un compte existe déjà avec ce numéro de téléphone.");
        return;
      }

      if (accountType === "particulier") {
        const data = {
          fullName: formData.get("fullName") as string,
          phone,
          email,
          password: formData.get("password") as string,
        };

        signUpParticulierSchema.parse(data);

        const nameParts = data.fullName.trim().split(" ");
        const firstName = nameParts[0] || data.fullName;
        const lastName = nameParts.slice(1).join(" ") || "";

        const { error } = await signUp(
          data.email, data.password, firstName, lastName, data.phone, "particulier"
        );
        if (error) { toast.error(error.message); return; }
      } else {
        const data = {
          contactName: formData.get("contactName") as string,
          companyName: formData.get("companyName") as string,
          phone,
          email,
          password: formData.get("password") as string,
        };

        signUpProfessionnelSchema.parse(data);

        const nameParts = data.contactName.trim().split(" ");
        const firstName = nameParts[0] || data.contactName;
        const lastName = nameParts.slice(1).join(" ") || "";

        const { error } = await signUp(
          data.email, data.password, firstName, lastName, data.phone, "professionnel", data.companyName
        );
        if (error) { toast.error(error.message); return; }
      }

      toast.success("Inscription réussie ! Vous pouvez maintenant vous connecter.");
      setActiveTab("signin");
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Connexion</DialogTitle>
        </DialogHeader>

        <div className="pt-4">
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="signin-email">Email</Label>
              <Input
                id="signin-email"
                name="email"
                type="email"
                placeholder="exemple@email.fr"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="signin-password">Mot de passe</Label>
              <Input
                id="signin-password"
                name="password"
                type="password"
                placeholder="exemple123"
                required
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox id="remember" />
              <label
                htmlFor="remember"
                className="text-sm text-muted-foreground cursor-pointer"
              >
                Rester connecté
              </label>
            </div>

            <Button type="submit" className="w-full">
              Se connecter
            </Button>

            <div className="text-center pt-4 border-t">
              <button
                type="button"
                onClick={() => {
                  onOpenChange(false);
                  navigate("/mot-de-passe-oublie");
                }}
                className="text-sm text-primary hover:underline"
              >
                Mot de passe oublié ?
              </button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};
