import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Loader2, ArrowLeft } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { usePageMaintenance } from "@/hooks/usePageMaintenance";
import { PageMaintenance } from "@/components/PageMaintenance";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const profileSchema = z.object({
  full_name: z.string().min(2, "Le nom est requis").max(200),
  phone: z.string().optional(),
  account_type: z.string(),
  company_name: z.string().optional(),
});

const passwordSchema = z.object({
  newPassword: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

type ProfileFormValues = z.infer<typeof profileSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;

const Profil = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isLoadingPassword, setIsLoadingPassword] = useState(false);
  const { isUnderMaintenance, isLoading: maintenanceLoading } = usePageMaintenance('account');

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: "",
      phone: "",
      account_type: "particulier",
      company_name: "",
    },
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/connexion");
      return;
    }

    if (user) {
      fetchProfile();
    }
  }, [user, authLoading, navigate]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;

      if (data) {
        const fullName = [data.first_name, data.last_name].filter(Boolean).join(' ');
        profileForm.reset({
          full_name: fullName,
          phone: data.phone || "",
          account_type: data.account_type || "particulier",
          company_name: data.company_name || "",
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Erreur lors du chargement du profil");
    }
  };

  const onProfileSubmit = async (values: ProfileFormValues) => {
    if (!user) return;

    setIsLoadingProfile(true);
    try {
      // Parse full_name into first_name and last_name
      const nameParts = values.full_name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const { error } = await supabase
        .from("profiles")
        .update({
          first_name: firstName,
          last_name: lastName,
          phone: values.phone || null,
          account_type: values.account_type,
          company_name: values.company_name || null,
        })
        .eq("id", user.id);

      if (error) throw error;

      toast.success("Profil mis à jour avec succès");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Erreur lors de la mise à jour du profil");
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const onPasswordSubmit = async (values: PasswordFormValues) => {
    setIsLoadingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: values.newPassword,
      });

      if (error) throw error;

      toast.success("Mot de passe modifié avec succès");
      passwordForm.reset();
    } catch (error) {
      console.error("Error updating password:", error);
      toast.error("Erreur lors de la modification du mot de passe");
    } finally {
      setIsLoadingPassword(false);
    }
  };

  if (authLoading || maintenanceLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show maintenance page if this page is disabled
  if (isUnderMaintenance) {
    return <PageMaintenance pageName="Mon compte" description="La page Mon compte est actuellement en maintenance. Nous travaillons pour vous offrir une meilleure expérience. Veuillez réessayer ultérieurement." />;
  }

  return (
    <>
      <Helmet>
        <title>Mon Compte - Renovation Energie</title>
      </Helmet>

      <Header />

      <main className="min-h-screen bg-background pt-24 pb-16">
        <div className="container max-w-4xl mx-auto px-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard")}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour au tableau de bord
          </Button>

          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Mon Compte</h1>
              <p className="text-muted-foreground mt-2">
                Gérez vos informations personnelles et votre sécurité
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Informations personnelles</CardTitle>
                <CardDescription>
                  Mettez à jour vos informations de profil
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...profileForm}>
                  <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                    <FormField
                      control={profileForm.control}
                      name="full_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {profileForm.watch("account_type") === "professionnel" 
                              ? "Nom du contact" 
                              : "Nom complet"}
                          </FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder={profileForm.watch("account_type") === "professionnel" 
                                ? "Jean Dupont" 
                                : "Prénom Nom"}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={profileForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Téléphone</FormLabel>
                          <FormControl>
                            <Input {...field} type="tel" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={profileForm.control}
                      name="account_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Type de compte</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="particulier">Particulier</SelectItem>
                              <SelectItem value="professionnel">Professionnel</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {profileForm.watch("account_type") === "professionnel" && (
                      <FormField
                        control={profileForm.control}
                        name="company_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nom de l'entreprise</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <Button type="submit" disabled={isLoadingProfile}>
                      {isLoadingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Enregistrer les modifications
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Changer le mot de passe</CardTitle>
                <CardDescription>
                  Assurez-vous que votre compte reste sécurisé
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...passwordForm}>
                  <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                    <FormField
                      control={passwordForm.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nouveau mot de passe</FormLabel>
                          <FormControl>
                            <Input {...field} type="password" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={passwordForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirmer le mot de passe</FormLabel>
                          <FormControl>
                            <Input {...field} type="password" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" disabled={isLoadingPassword}>
                      {isLoadingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Changer le mot de passe
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
};

export default Profil;
