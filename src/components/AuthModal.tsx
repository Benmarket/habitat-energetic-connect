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

const signInSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
});

const signUpSchema = z.object({
  firstName: z.string().min(2, "Le prénom doit contenir au moins 2 caractères"),
  lastName: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().email("Email invalide"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AuthModal = ({ open, onOpenChange }: AuthModalProps) => {
  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signin");
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
    const data = {
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      confirmPassword: formData.get("confirmPassword") as string,
    };

    try {
      signUpSchema.parse(data);
      const { error } = await signUp(data.email, data.password, data.firstName, data.lastName);
      
      if (error) {
        toast.error(error.message);
        return;
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
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-firstname">Prénom</Label>
                  <Input
                    id="signup-firstname"
                    name="firstName"
                    type="text"
                    placeholder="Jean"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-lastname">Nom</Label>
                  <Input
                    id="signup-lastname"
                    name="lastName"
                    type="text"
                    placeholder="Dupont"
                    required
                  />
                </div>
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
                  placeholder="••••••••"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-confirm-password">Confirmer le mot de passe</Label>
                <Input
                  id="signup-confirm-password"
                  name="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  required
                />
              </div>

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
