import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loader2, AlertTriangle } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import Index from "@/pages/Index";

const signInSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
});

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showMemberDisabled, setShowMemberDisabled] = useState(false);
  const [open, setOpen] = useState(true);
  const isAuthenticatingRef = useRef(false);
  const { signIn, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && !showMemberDisabled && !isAuthenticatingRef.current) {
      navigate("/dashboard");
    }
  }, [user, navigate, showMemberDisabled]);

  const handleClose = (next: boolean) => {
    setOpen(next);
    if (!next) navigate("/");
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    try {
      const data = signInSchema.parse({
        email: formData.get("email"),
        password: formData.get("password"),
      });

      isAuthenticatingRef.current = true;
      setShowMemberDisabled(false);
      setIsLoading(true);

      const { error } = await signIn(data.email, data.password);

      if (error) {
        toast.error("Erreur de connexion", {
          description:
            error.message === "Invalid login credentials"
              ? "Email ou mot de passe incorrect"
              : error.message,
        });
        return;
      }

      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (currentUser) {
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", currentUser.id)
          .single();

        const isAdmin =
          !!roleData && (roleData.role === "super_admin" || roleData.role === "admin");

        const { data: headerFooterData } = await supabase
          .from("site_settings")
          .select("value")
          .eq("key", "header_footer")
          .maybeSingle();

        const isMemberSpaceEnabled = headerFooterData?.value
          ? (headerFooterData.value as any).showMemberSpace ?? true
          : true;

        if (!isMemberSpaceEnabled && !isAdmin) {
          await supabase.auth.signOut();
          setShowMemberDisabled(true);
          return;
        }

        const { data: maintenanceData } = await supabase
          .from("site_settings")
          .select("value")
          .eq("key", "maintenance_mode")
          .maybeSingle();

        const isMaintenanceMode = maintenanceData?.value
          ? (maintenanceData.value as { enabled: boolean }).enabled
          : false;

        if (isMaintenanceMode && !isAdmin) {
          await supabase.auth.signOut();
          toast.error("Accès refusé", {
            description:
              "Le site est actuellement en maintenance. Veuillez réessayer plus tard.",
          });
          navigate("/");
          return;
        }
      }

      toast.success("Connexion réussie");
      navigate("/dashboard");
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      }
    } finally {
      isAuthenticatingRef.current = false;
      setIsLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Connexion | Prime Énergies</title>
        <meta name="description" content="Connectez-vous à votre espace Prime Énergies" />
      </Helmet>

      {/* Page d'accueil en arrière-plan */}
      <div aria-hidden="true">
        <Index />
      </div>

      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          {showMemberDisabled ? (
            <>
              <DialogHeader>
                <DialogTitle className="text-center">
                  <span className="text-2xl font-bold leading-tight block">
                    <span className="text-primary">Prime </span>
                    <span className="text-foreground">energies</span>
                  </span>
                  <span className="text-xs text-muted-foreground font-normal">prime-energies.fr</span>
                </DialogTitle>
              </DialogHeader>
              <div className="flex flex-col items-center gap-4 py-6 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-foreground mb-2">
                    Espace membre temporairement désactivé
                  </h2>
                  <p className="text-muted-foreground">
                    L'accès à l'espace membre est actuellement suspendu. Veuillez réessayer ultérieurement.
                  </p>
                </div>
                <Button variant="outline" onClick={() => setShowMemberDisabled(false)}>
                  Retour
                </Button>
              </div>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="text-center">
                  <span className="text-2xl font-bold leading-tight block">
                    <span className="text-primary">Prime </span>
                    <span className="text-foreground">energies</span>
                  </span>
                  <span className="text-xs text-muted-foreground font-normal">prime-energies.fr</span>
                </DialogTitle>
                <DialogDescription className="text-center">
                  Accédez à votre espace personnel
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    name="email"
                    type="email"
                    placeholder="votre@email.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Mot de passe</Label>
                  <Input
                    id="signin-password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Connexion...
                    </>
                  ) : (
                    "Se connecter"
                  )}
                </Button>

                <div className="text-center pt-4 border-t">
                  <a
                    href="/mot-de-passe-oublie"
                    className="text-sm text-primary hover:underline"
                  >
                    Mot de passe oublié ?
                  </a>
                </div>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Auth;
