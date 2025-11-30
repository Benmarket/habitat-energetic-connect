import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Smartphone, Save } from "lucide-react";

const AdminApp = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [androidLink, setAndroidLink] = useState("");
  const [iosLink, setIosLink] = useState("");

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "app_download_links")
        .single();

      if (error && error.code !== "PGRST116") throw error;

      if (data?.value) {
        const settings = data.value as { android?: string; ios?: string };
        setAndroidLink(settings.android || "");
        setIosLink(settings.ios || "");
      }
    } catch (error) {
      console.error("Erreur lors du chargement:", error);
      toast.error("Erreur lors du chargement des paramètres");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("site_settings")
        .upsert({
          key: "app_download_links",
          value: { android: androidLink, ios: iosLink },
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast.success("Liens de téléchargement enregistrés");
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate("/administration")}
          className="mb-6 hover:bg-primary/10"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour à l'administration
        </Button>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-primary/10 rounded-xl">
              <Smartphone className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Gestion de l'App Prime énergies</h1>
              <p className="text-muted-foreground">
                Configurez les liens de téléchargement de l'application mobile
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Android Link */}
          <Card className="border-l-4 border-l-primary/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <svg viewBox="0 0 24 24" className="w-6 h-6 fill-primary">
                  <path d="M17.523 15.341c-.759 0-1.378-.618-1.378-1.378s.619-1.379 1.378-1.379c.76 0 1.379.619 1.379 1.379s-.619 1.378-1.379 1.378zm-11.046 0c-.76 0-1.379-.618-1.379-1.378s.619-1.379 1.379-1.379 1.378.619 1.378 1.379-.618 1.378-1.378 1.378zm11.405-9.763a.145.145 0 01-.058.128c-.041.03-.1.026-.135-.008L16.5 4.414c-.035-.032-.039-.088-.009-.123a.1.1 0 01.135-.009l1.189 1.284c.036.033.041.088.009.123a.09.09 0 01-.042.024v-.135zm-11.691.003a.145.145 0 00.058.128.107.107 0 00.135-.008L7.573 4.417c.035-.032.039-.088.009-.123a.1.1 0 00-.135-.009L6.258 5.569a.09.09 0 00-.009.123.09.09 0 00.042.024v-.135zM12 2.542c5.165 0 9.375 4.21 9.375 9.375 0 5.165-4.21 9.375-9.375 9.375-5.165 0-9.375-4.21-9.375-9.375C2.625 6.752 6.835 2.542 12 2.542z"/>
                </svg>
                Application Android
              </CardTitle>
              <CardDescription>
                Lien de téléchargement pour Google Play Store
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="android">Lien Google Play</Label>
                <Input
                  id="android"
                  placeholder="https://play.google.com/store/apps/details?id=..."
                  value={androidLink}
                  onChange={(e) => setAndroidLink(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* iOS Link */}
          <Card className="border-l-4 border-l-primary/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <svg viewBox="0 0 24 24" className="w-6 h-6 fill-primary">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
                Application iOS
              </CardTitle>
              <CardDescription>
                Lien de téléchargement pour Apple App Store
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="ios">Lien App Store</Label>
                <Input
                  id="ios"
                  placeholder="https://apps.apple.com/app/..."
                  value={iosLink}
                  onChange={(e) => setIosLink(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end gap-3">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-primary hover:bg-primary/90"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Enregistrer les liens
                </>
              )}
            </Button>
          </div>

          {/* Info Card */}
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="text-base">À propos de l'application</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>
                L'application Prime énergies est une version mobile de votre site web avec connexion directe.
              </p>
              <p>
                Les liens configurés ici seront utilisés dans la section "Téléchargez l'app Prime Énergies" 
                de la page d'accueil pour permettre aux utilisateurs de télécharger l'application depuis 
                Google Play Store (Android) ou App Store (iOS).
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminApp;
