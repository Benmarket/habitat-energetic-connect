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
import { Loader2, Save, ArrowLeft, Upload, X, Image as ImageIcon } from "lucide-react";
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
    aiApiUrl: "https://api.openai.com/v1/chat/completions",
    aiModel: "gpt-4o-mini",
    aiEnabled: true,
    aiCustomInstructions: "",
  });

  const [heroSlider, setHeroSlider] = useState({
    enabled: false,
    duration: 5,
    images: [] as string[],
  });

  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (user) {
      loadMaintenanceSettings();
      loadAiSettings();
      loadHeroSliderSettings();
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

  const loadAiSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("site_settings")
        .select("key, value")
        .in("key", ["ai_generation_api_url", "ai_generation_model", "ai_generation_enabled", "ai_custom_instructions"]);

      if (error) throw error;

      if (data) {
        const aiUrl = data.find(s => s.key === "ai_generation_api_url");
        const aiModel = data.find(s => s.key === "ai_generation_model");
        const aiEnabled = data.find(s => s.key === "ai_generation_enabled");
        const aiInstructions = data.find(s => s.key === "ai_custom_instructions");

        setSettings(prev => ({
          ...prev,
          aiApiUrl: aiUrl?.value as string || "https://api.openai.com/v1/chat/completions",
          aiModel: aiModel?.value as string || "gpt-4o-mini",
          aiEnabled: aiEnabled?.value as boolean ?? true,
          aiCustomInstructions: aiInstructions?.value as string || "",
        }));
      }
    } catch (error) {
      console.error("Error loading AI settings:", error);
    }
  };

  const loadHeroSliderSettings = async () => {
    try {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "hero_slider")
        .maybeSingle();

      if (data?.value) {
        const value = data.value as any;
        setHeroSlider({
          enabled: value.enabled || false,
          duration: value.duration || 5,
          images: Array.isArray(value.images) ? value.images : [],
        });
      }
    } catch (error) {
      console.error("Error loading hero slider settings:", error);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner une image",
        variant: "destructive",
      });
      return;
    }

    setUploadingImage(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `hero-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('media')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('media')
        .getPublicUrl(filePath);

      setHeroSlider(prev => ({
        ...prev,
        images: [...prev.images, publicUrlData.publicUrl],
      }));

      toast({
        title: "Image ajoutée",
        description: "L'image a été uploadée avec succès",
      });
    } catch (error: any) {
      console.error("Error uploading image:", error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'uploader l'image",
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const removeImage = (index: number) => {
    setHeroSlider(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const saveHeroSlider = async () => {
    try {
      const { error } = await supabase
        .from("site_settings")
        .upsert({
          key: "hero_slider",
          value: heroSlider,
          updated_by: user?.id,
        });

      if (error) throw error;

      toast({
        title: "Slider sauvegardé",
        description: "Les paramètres du slider ont été enregistrés",
      });
    } catch (error: any) {
      console.error("Error saving hero slider:", error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de sauvegarder le slider",
        variant: "destructive",
      });
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
      const maintenanceUpdate = supabase
        .from("site_settings")
        .update({
          value: {
            enabled: settings.maintenanceMode,
            message: settings.maintenanceMessage,
          }
        })
        .eq("key", "maintenance_mode");

      // Sauvegarder les paramètres IA
      const aiUrlUpdate = supabase
        .from("site_settings")
        .update({ value: settings.aiApiUrl })
        .eq("key", "ai_generation_api_url");

      const aiModelUpdate = supabase
        .from("site_settings")
        .update({ value: settings.aiModel })
        .eq("key", "ai_generation_model");

      const aiEnabledUpdate = supabase
        .from("site_settings")
        .update({ value: settings.aiEnabled })
        .eq("key", "ai_generation_enabled");

      const aiInstructionsUpdate = supabase
        .from("site_settings")
        .upsert({
          key: "ai_custom_instructions",
          value: settings.aiCustomInstructions
        }, {
          onConflict: "key"
        });

      const [maintenanceResult, urlResult, modelResult, enabledResult, instructionsResult] = await Promise.all([
        maintenanceUpdate,
        aiUrlUpdate,
        aiModelUpdate,
        aiEnabledUpdate,
        aiInstructionsUpdate
      ]);

      if (maintenanceResult.error) throw maintenanceResult.error;
      if (urlResult.error) throw urlResult.error;
      if (modelResult.error) throw modelResult.error;
      if (enabledResult.error) throw enabledResult.error;
      if (instructionsResult.error) throw instructionsResult.error;

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
              {/* Banner/Hero Slider */}
              <Card>
                <CardHeader>
                  <CardTitle>Slider du banner principal</CardTitle>
                  <CardDescription>
                    Gérez les images de fond du banner d'accueil avec transitions automatiques
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="sliderEnabled" className="text-base">
                        Activer le slider automatique
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Les images défileront automatiquement selon la durée définie
                      </p>
                    </div>
                    <Switch
                      id="sliderEnabled"
                      checked={heroSlider.enabled}
                      onCheckedChange={(checked) => 
                        setHeroSlider({ ...heroSlider, enabled: checked })
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="sliderDuration">
                      Durée d'affichage par image (secondes)
                    </Label>
                    <Input
                      id="sliderDuration"
                      type="number"
                      min="2"
                      max="30"
                      value={heroSlider.duration}
                      onChange={(e) => 
                        setHeroSlider({ ...heroSlider, duration: parseInt(e.target.value) || 5 })
                      }
                      className="max-w-xs"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Recommandé : entre 5 et 10 secondes
                    </p>
                  </div>

                  <div>
                    <Label>Images du slider ({heroSlider.images.length})</Label>
                    <p className="text-sm text-muted-foreground mb-3">
                      Ajoutez des images de haute qualité (1920x1080 recommandé)
                    </p>

                    {/* Grid d'images */}
                    {heroSlider.images.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                        {heroSlider.images.map((image, index) => (
                          <div
                            key={index}
                            className="relative group aspect-video rounded-lg overflow-hidden border border-border"
                          >
                            <img
                              src={image}
                              alt={`Hero ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Button
                                variant="destructive"
                                size="icon"
                                onClick={() => removeImage(index)}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                            <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                              #{index + 1}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Bouton upload */}
                    <div>
                      <input
                        type="file"
                        id="heroImageUpload"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('heroImageUpload')?.click()}
                        disabled={uploadingImage}
                        className="w-full"
                      >
                        {uploadingImage ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Upload en cours...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 mr-2" />
                            Ajouter une image
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t">
                    <Button
                      type="button"
                      onClick={saveHeroSlider}
                      variant="default"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Enregistrer le slider
                    </Button>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <p className="text-sm text-blue-900 dark:text-blue-100">
                      <strong>💡 Astuce :</strong> Les transitions entre images sont fluides (fondu enchaîné). Les visiteurs ne peuvent pas contrôler le slider manuellement.
                    </p>
                  </div>
                </CardContent>
              </Card>

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

              {/* Génération IA */}
              <Card>
                <CardHeader>
                  <CardTitle>Génération d'articles par IA</CardTitle>
                  <CardDescription>
                    Configurez l'API d'intelligence artificielle pour la génération automatique d'articles
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="aiEnabled" className="text-base">
                        Activer la génération IA
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Permet aux rédacteurs de générer des articles avec l'IA
                      </p>
                    </div>
                    <Switch
                      id="aiEnabled"
                      checked={settings.aiEnabled}
                      onCheckedChange={(checked) => 
                        setSettings({ ...settings, aiEnabled: checked })
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="aiApiUrl">URL de l'API</Label>
                    <Input
                      id="aiApiUrl"
                      type="url"
                      value={settings.aiApiUrl}
                      onChange={(e) => setSettings({ ...settings, aiApiUrl: e.target.value })}
                      placeholder="https://api.openai.com/v1/chat/completions"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      🔒 Cette URL est sécurisée et ne sera pas visible côté client
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="aiModel">Modèle IA</Label>
                    <Input
                      id="aiModel"
                      value={settings.aiModel}
                      onChange={(e) => setSettings({ ...settings, aiModel: e.target.value })}
                      placeholder="gpt-4o-mini"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Modèle utilisé pour la génération (gpt-4o-mini, gpt-5, etc.)
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="aiCustomInstructions">Instructions personnalisées</Label>
                    <Textarea
                      id="aiCustomInstructions"
                      value={settings.aiCustomInstructions}
                      onChange={(e) => setSettings({ ...settings, aiCustomInstructions: e.target.value })}
                      placeholder="Préférences supplémentaires en matière de comportement, de style et de ton&#10;&#10;Exemple:&#10;- Adopte un ton professionnel et technique&#10;- Utilise des exemples concrets et chiffrés&#10;- Structure l'article avec des sous-titres clairs"
                      rows={6}
                      className="font-mono text-sm"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Ces instructions seront ajoutées à tous les prompts de génération d'articles. Elles peuvent être modifiées temporairement lors de la création d'un article.
                    </p>
                  </div>

                  <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                    <p className="text-sm text-amber-900 dark:text-amber-100">
                      <strong>Note importante :</strong> La clé API est stockée de manière sécurisée dans les secrets du serveur. 
                      Elle n'est jamais exposée côté client, même en inspectant les éléments de la page.
                    </p>
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
