import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const AdminSettings = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  
  const [settings, setSettings] = useState({
    siteName: "Prime Énergies",
    siteDescription: "Réduisez vos factures énergétiques jusqu'à 80%",
    contactEmail: "contact@prime-energies.fr",
    contactPhone: "01 23 45 67 89",
    address: "123 Rue de l'Énergie, 75001 Paris",
    metaDescription: "Bénéficiez d'une étude énergétique gratuite et découvrez les travaux subventionnés adaptés à votre logement.",
    maintenanceMode: false,
    maintenanceMessage: "Site en maintenance. Nous reviendrons bientôt!",
  });

  useEffect(() => {
    if (user) {
      loadMaintenanceSettings();
    }
  }, [user]);

  const loadMaintenanceSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "maintenance_mode")
        .single();

      if (error) throw error;

      if (data) {
        const value = data.value as { enabled: boolean; message: string };
        setSettings(prev => ({
          ...prev,
          maintenanceMode: value.enabled,
          maintenanceMessage: value.message,
        }));
      }
    } catch (error) {
      console.error("Error loading maintenance settings:", error);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/connexion");
    }
  }, [user, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Sauvegarder le mode maintenance
      const { error } = await supabase
        .from("site_settings")
        .update({
          value: {
            enabled: settings.maintenanceMode,
            message: settings.maintenanceMessage,
          }
        })
        .eq("key", "maintenance_mode");

      if (error) throw error;

      toast({
        title: "Paramètres sauvegardés",
        description: "Les modifications ont été enregistrées avec succès",
      });
    } catch (error: any) {
      console.error("Error saving settings:", error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de sauvegarder les paramètres",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Paramètres généraux | Administration</title>
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="pt-20">
          <div className="container mx-auto px-4 py-8 max-w-4xl">
            <Link 
              to="/administration"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour à l'administration
            </Link>

            <h1 className="text-3xl font-bold mb-2">Paramètres généraux</h1>
            <p className="text-muted-foreground mb-8">
              Configurez les informations globales de votre site
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Informations du site */}
              <Card>
                <CardHeader>
                  <CardTitle>Informations du site</CardTitle>
                  <CardDescription>
                    Les informations générales de votre site web
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="siteName">Nom du site</Label>
                    <Input
                      id="siteName"
                      value={settings.siteName}
                      onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                      placeholder="Prime Énergies"
                    />
                  </div>

                  <div>
                    <Label htmlFor="siteDescription">Slogan / Description courte</Label>
                    <Input
                      id="siteDescription"
                      value={settings.siteDescription}
                      onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
                      placeholder="Réduisez vos factures énergétiques jusqu'à 80%"
                    />
                  </div>

                  <div>
                    <Label htmlFor="metaDescription">Meta description (SEO)</Label>
                    <Textarea
                      id="metaDescription"
                      value={settings.metaDescription}
                      onChange={(e) => setSettings({ ...settings, metaDescription: e.target.value })}
                      placeholder="Description pour les moteurs de recherche"
                      rows={3}
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Maximum 160 caractères recommandés
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Coordonnées */}
              <Card>
                <CardHeader>
                  <CardTitle>Coordonnées</CardTitle>
                  <CardDescription>
                    Les informations de contact affichées sur le site
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="contactEmail">Email de contact</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      value={settings.contactEmail}
                      onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                      placeholder="contact@prime-energies.fr"
                    />
                  </div>

                  <div>
                    <Label htmlFor="contactPhone">Téléphone</Label>
                    <Input
                      id="contactPhone"
                      type="tel"
                      value={settings.contactPhone}
                      onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
                      placeholder="01 23 45 67 89"
                    />
                  </div>

                  <div>
                    <Label htmlFor="address">Adresse</Label>
                    <Textarea
                      id="address"
                      value={settings.address}
                      onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                      placeholder="123 Rue de l'Énergie, 75001 Paris"
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Mode Maintenance */}
              <Card>
                <CardHeader>
                  <CardTitle>Mode maintenance</CardTitle>
                  <CardDescription>
                    Activer le mode maintenance pour mettre le site hors ligne temporairement
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="maintenanceMode" className="text-base">
                        Activer le mode maintenance
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Le site sera inaccessible pour tous les visiteurs (sauf administrateurs)
                      </p>
                    </div>
                    <Switch
                      id="maintenanceMode"
                      checked={settings.maintenanceMode}
                      onCheckedChange={(checked) => 
                        setSettings({ ...settings, maintenanceMode: checked })
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="maintenanceMessage">Message de maintenance</Label>
                    <Textarea
                      id="maintenanceMessage"
                      value={settings.maintenanceMessage}
                      onChange={(e) => setSettings({ ...settings, maintenanceMessage: e.target.value })}
                      placeholder="Site en maintenance. Nous reviendrons bientôt!"
                      rows={3}
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Ce message sera affiché aux visiteurs pendant la maintenance
                    </p>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Enregistrer les modifications
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default AdminSettings;
