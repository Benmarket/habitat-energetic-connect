import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Smartphone, Copy } from "lucide-react";

const AdminApp = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const baseUrl = window.location.origin;
  const installUrl = `${baseUrl}/installer-app`;

  useEffect(() => {
    // Just check auth, no need to load anything
    setLoading(false);
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Lien copié dans le presse-papier");
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
                Progressive Web App - Installation directe depuis le site
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* PWA Info */}
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="text-base">Application Web Progressive (PWA)</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>
                L'application Prime énergies est une PWA qui permet aux utilisateurs d'installer 
                le site comme une application native sur leur smartphone ou ordinateur.
              </p>
              <p className="font-semibold text-foreground">
                Avantages : Pas de développement natif nécessaire, installation simple, 
                accès hors ligne, notifications push.
              </p>
            </CardContent>
          </Card>

          {/* Installation Link */}
          <Card className="border-l-4 border-l-primary/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Lien d'installation universel
              </CardTitle>
              <CardDescription>
                Partagez ce lien pour permettre l'installation de l'app sur tous les appareils
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    value={installUrl}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    onClick={() => copyToClipboard(installUrl)}
                    variant="outline"
                  >
                    Copier
                  </Button>
                </div>
                <Button
                  onClick={() => window.open(installUrl, '_blank')}
                  className="w-full"
                  variant="outline"
                >
                  Tester le lien d'installation
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Android Instructions */}
          <Card className="border-l-4 border-l-green-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <svg viewBox="0 0 24 24" className="w-6 h-6 fill-green-600">
                  <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.916V2.73a1 1 0 0 1 .609-.916zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 0 1 0 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.802 8.99l-2.303 2.303-8.635-8.635z"/>
                </svg>
                Installation sur Android
              </CardTitle>
              <CardDescription>
                Pour les utilisateurs Android (Chrome)
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <p>L'utilisateur doit :</p>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground ml-2">
                <li>Ouvrir le lien d'installation dans Chrome</li>
                <li>Cliquer sur "Installer l'application" si le bouton apparaît</li>
                <li>Ou menu Chrome (⋮) → "Ajouter à l'écran d'accueil"</li>
              </ol>
            </CardContent>
          </Card>

          {/* iOS Instructions */}
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <svg viewBox="0 0 24 24" className="w-6 h-6 fill-blue-600">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
                Installation sur iOS
              </CardTitle>
              <CardDescription>
                Pour les utilisateurs iPhone/iPad (Safari)
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <p>L'utilisateur doit :</p>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground ml-2">
                <li>Ouvrir le lien d'installation dans Safari</li>
                <li>Appuyer sur le bouton Partager (□↑)</li>
                <li>Sélectionner "Sur l'écran d'accueil"</li>
                <li>Appuyer sur "Ajouter"</li>
              </ol>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminApp;
