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

const signInSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
});

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AuthModal = ({ open, onOpenChange }: AuthModalProps) => {
  const { signIn } = useAuth();
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
