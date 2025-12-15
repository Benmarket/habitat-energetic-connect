import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loader2, AlertTriangle, ArrowLeft } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

const signInSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
});

const signUpSchema = z
  .object({
    firstName: z.string().min(2, "Le prénom doit contenir au moins 2 caractères"),
    lastName: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
    email: z.string().email("Email invalide"),
    password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showMemberDisabled, setShowMemberDisabled] = useState(false);
  const isAuthenticatingRef = useRef(false);
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirection auto uniquement si l'utilisateur arrive déjà connecté
    // (on bloque pendant une tentative de connexion pour éviter tout "flash" sur le dashboard)
    if (user && !showMemberDisabled && !isAuthenticatingRef.current) {
      navigate("/dashboard");
    }
  }, [user, navigate, showMemberDisabled]);

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    try {
      const data = signInSchema.parse({
        email: formData.get("email"),
        password: formData.get("password"),
      });

      setIsLoading(true);
      const { error } = await signIn(data.email, data.password);
      
      if (error) {
        toast.error("Erreur de connexion", {
          description: error.message === "Invalid login credentials" 
            ? "Email ou mot de passe incorrect"
            : error.message,
        });
        setIsLoading(false);
        return;
      }

      // CRITICAL SECURITY: Vérifier le mode maintenance, l'espace membre et le rôle après connexion
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (currentUser) {
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", currentUser.id)
          .single();

        const isAdmin = roleData && (roleData.role === 'super_admin' || roleData.role === 'admin');

        // Check member space settings
        const { data: headerFooterData } = await supabase
          .from("site_settings")
          .select("value")
          .eq("key", "header_footer")
          .maybeSingle();

        const isMemberSpaceEnabled = headerFooterData?.value 
          ? (headerFooterData.value as any).showMemberSpace ?? true
          : true;

        if (!isMemberSpaceEnabled && !isAdmin) {
          // Non-admin avec espace membre désactivé : déconnecter et afficher page désactivé
          await supabase.auth.signOut();
          setShowMemberDisabled(true);
          setIsLoading(false);
          return;
        }

        // Check maintenance mode
        const { data: maintenanceData } = await supabase
          .from("site_settings")
          .select("value")
          .eq("key", "maintenance_mode")
          .maybeSingle();

        const isMaintenanceMode = maintenanceData?.value 
          ? (maintenanceData.value as { enabled: boolean }).enabled 
          : false;

        if (isMaintenanceMode && !isAdmin) {
          // Non-admin en mode maintenance : refuser l'accès et rediriger vers accueil
          await supabase.auth.signOut();
          toast.error("Accès refusé", {
            description: "Le site est actuellement en maintenance. Veuillez réessayer plus tard.",
          });
          navigate("/");
          setIsLoading(false);
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
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    try {
      const data = signUpSchema.parse({
        firstName: formData.get("firstName"),
        lastName: formData.get("lastName"),
        email: formData.get("email"),
        password: formData.get("password"),
        confirmPassword: formData.get("confirmPassword"),
      });

      setIsLoading(true);

      // Vérifier si l'espace membre est activé AVANT inscription
      const { data: headerFooterData } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "header_footer")
        .maybeSingle();

      const isMemberSpaceEnabled = headerFooterData?.value 
        ? (headerFooterData.value as any).showMemberSpace ?? true
        : true;

      if (!isMemberSpaceEnabled) {
        // Espace membre désactivé : ne pas permettre l'inscription
        setShowMemberDisabled(true);
        setIsLoading(false);
        return;
      }

      const { error } = await signUp(data.email, data.password, data.firstName, data.lastName, "", "particulier");
      
      if (error) {
        toast.error("Erreur d'inscription", {
          description: error.message === "User already registered"
            ? "Cette adresse email est déjà utilisée"
            : error.message,
        });
        setIsLoading(false);
        return;
      }

      // CRITICAL SECURITY: Vérifier le mode maintenance après inscription
      const { data: maintenanceData } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "maintenance_mode")
        .maybeSingle();

      const isMaintenanceMode = maintenanceData?.value 
        ? (maintenanceData.value as { enabled: boolean }).enabled 
        : false;

      if (isMaintenanceMode) {
        // Les nouveaux comptes créés pendant la maintenance ne sont jamais admin
        // Déconnecter et refuser l'accès
        await supabase.auth.signOut();
        toast.error("Inscription bloquée", {
          description: "Le site est actuellement en maintenance. Les nouvelles inscriptions sont temporairement désactivées.",
        });
        navigate("/");
        setIsLoading(false);
        return;
      }

      toast.success("Inscription réussie", {
        description: "Vous pouvez maintenant vous connecter",
      });
      navigate("/dashboard");
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Afficher la page "espace membre désactivé" après tentative de connexion refusée
  if (showMemberDisabled) {
    return (
      <>
        <Helmet>
          <title>Espace membre désactivé | Prime Énergies</title>
          <meta name="description" content="L'espace membre est temporairement désactivé" />
        </Helmet>

        <div className="min-h-screen flex items-center justify-center bg-muted p-4">
          <Card className="w-full max-w-md relative">
            {/* Flèche retour vers /connexion */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4"
              onClick={() => setShowMemberDisabled(false)}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            
            <CardHeader className="text-center pt-12">
              <div className="mb-4 flex flex-col items-center">
                <span className="text-2xl font-bold leading-tight">
                  <span className="text-primary">Prime </span>
                  <span className="text-foreground">energies</span>
                </span>
                <span className="text-xs text-muted-foreground">prime-energies.fr</span>
              </div>
            </CardHeader>
            <CardContent className="text-center">
              <div className="flex flex-col items-center gap-4 py-6">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-8 h-8 text-orange-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-foreground mb-2">
                    Espace membre temporairement désactivé
                  </h2>
                  <p className="text-muted-foreground">
                    L'accès à l'espace membre est actuellement suspendu. Veuillez réessayer ultérieurement.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Connexion | Prime Énergies</title>
        <meta name="description" content="Connectez-vous à votre espace Prime Énergies" />
      </Helmet>

      <div className="min-h-screen flex items-center justify-center bg-muted p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mb-4 flex flex-col items-center">
              <span className="text-2xl font-bold leading-tight">
                <span className="text-primary">Prime </span>
                <span className="text-foreground">energies</span>
              </span>
              <span className="text-xs text-muted-foreground">prime-energies.fr</span>
            </div>
            <CardDescription>
              Accédez à votre espace personnel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
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
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">Prénom</Label>
                      <Input
                        id="firstName"
                        name="firstName"
                        placeholder="Jean"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Nom</Label>
                      <Input
                        id="lastName"
                        name="lastName"
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
                      placeholder="votre@email.com"
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
                    <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Inscription...
                      </>
                    ) : (
                      "S'inscrire"
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default Auth;
