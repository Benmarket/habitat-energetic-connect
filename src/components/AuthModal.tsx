import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Home, Building2 } from "lucide-react";

const signInSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
});

const signUpParticulierSchema = z.object({
  fullName: z.string().min(2, "Le nom complet doit contenir au moins 2 caractères"),
  phone: z.string().min(10, "Numéro de téléphone invalide"),
  email: z.string().email("Email invalide"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
});

const signUpProfessionnelSchema = z.object({
  contactName: z.string().min(2, "Le nom du contact doit contenir au moins 2 caractères"),
  companyName: z.string().min(2, "Le nom de l'entreprise doit contenir au moins 2 caractères"),
  phone: z.string().min(10, "Numéro de téléphone invalide"),
  email: z.string().email("Email invalide"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
});

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AuthModal = ({ open, onOpenChange }: AuthModalProps) => {
  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signin");
  const [accountType, setAccountType] = useState<"particulier" | "professionnel">("particulier");
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

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
      if (accountType === "particulier") {
        const data = {
          fullName: formData.get("fullName") as string,
          phone: formData.get("phone") as string,
          email: formData.get("email") as string,
          password: formData.get("password") as string,
        };

        signUpParticulierSchema.parse(data);
        
        // Split full name into first and last name
        const nameParts = data.fullName.trim().split(" ");
        const firstName = nameParts[0] || data.fullName;
        const lastName = nameParts.slice(1).join(" ") || "";

        const { error } = await signUp(
          data.email,
          data.password,
          firstName,
          lastName,
          data.phone,
          "particulier"
        );
        
        if (error) {
          toast.error(error.message);
          return;
        }
      } else {
        const data = {
          contactName: formData.get("contactName") as string,
          companyName: formData.get("companyName") as string,
          phone: formData.get("phone") as string,
          email: formData.get("email") as string,
          password: formData.get("password") as string,
        };

        signUpProfessionnelSchema.parse(data);
        
        // Split contact name into first and last name
        const nameParts = data.contactName.trim().split(" ");
        const firstName = nameParts[0] || data.contactName;
        const lastName = nameParts.slice(1).join(" ") || "";

        const { error } = await signUp(
          data.email,
          data.password,
          firstName,
          lastName,
          data.phone,
          "professionnel",
          data.companyName
        );
        
        if (error) {
          toast.error(error.message);
          return;
        }
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
          <DialogTitle className="text-2xl font-bold">
            {activeTab === "signin" ? "Connexion" : "Inscription"}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "signin" | "signup")} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="signin">Connexion</TabsTrigger>
            <TabsTrigger value="signup">Inscription</TabsTrigger>
          </TabsList>

          <TabsContent value="signin">
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
                  onClick={() => setActiveTab("signup")}
                  className="text-sm text-primary hover:underline"
                >
                  Pas encore de compte ? S'inscrire
                </button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="signup">
            {/* Account Type Selection */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                type="button"
                onClick={() => setAccountType("particulier")}
                className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                  accountType === "particulier"
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <Home className="h-5 w-5" />
                <span className="text-sm font-medium">Particulier</span>
              </button>
              <button
                type="button"
                onClick={() => setAccountType("professionnel")}
                className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                  accountType === "professionnel"
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <Building2 className="h-5 w-5" />
                <span className="text-sm font-medium">Professionnel</span>
              </button>
            </div>

            <form onSubmit={handleSignUp} className="space-y-4">
              {accountType === "particulier" ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Nom et prénom</Label>
                    <Input
                      id="signup-name"
                      name="fullName"
                      type="text"
                      placeholder="Jean Dupont"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-phone">Téléphone</Label>
                    <Input
                      id="signup-phone"
                      name="phone"
                      type="tel"
                      placeholder="06 12 34 56 78"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      name="email"
                      type="email"
                      placeholder="exemple@email.fr"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Mot de passe</Label>
                    <Input
                      id="signup-password"
                      name="password"
                      type="password"
                      placeholder="exemple123"
                      required
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="signup-contact">Nom du contact</Label>
                    <Input
                      id="signup-contact"
                      name="contactName"
                      type="text"
                      placeholder="Jean Dupont"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-company">Entreprise</Label>
                    <Input
                      id="signup-company"
                      name="companyName"
                      type="text"
                      placeholder="Société XYZ"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-phone-pro">Téléphone</Label>
                    <Input
                      id="signup-phone-pro"
                      name="phone"
                      type="tel"
                      placeholder="06 12 34 56 78"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email-pro">Email</Label>
                    <Input
                      id="signup-email-pro"
                      name="email"
                      type="email"
                      placeholder="exemple@email.fr"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password-pro">Mot de passe</Label>
                    <Input
                      id="signup-password-pro"
                      name="password"
                      type="password"
                      placeholder="exemple123"
                      required
                    />
                  </div>
                </>
              )}

              <Button type="submit" className="w-full">
                S'inscrire
              </Button>

              <div className="text-center pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setActiveTab("signin")}
                  className="text-sm text-primary hover:underline"
                >
                  Déjà un compte ? Se connecter
                </button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
