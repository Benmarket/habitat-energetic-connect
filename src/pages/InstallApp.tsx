import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Smartphone, Download, ArrowRight, Apple, Chrome } from "lucide-react";

const InstallApp = () => {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    // Detect platform
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    const isAndroidDevice = /android/.test(userAgent);
    
    setIsIOS(isIOSDevice);
    setIsAndroid(isAndroidDevice);

    // Capture PWA install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Helmet>
        <title>Installer l'App Prime Énergies</title>
        <meta name="description" content="Installez l'application Prime Énergies sur votre smartphone" />
      </Helmet>

      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-2xl mb-6">
            <Smartphone className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-4xl font-bold mb-4">
            Installer l'App <span className="text-primary">Prime Énergies</span>
          </h1>
          <p className="text-lg text-muted-foreground">
            Accédez à votre tableau de bord où que vous soyez
          </p>
        </div>

        <div className="space-y-6">
          {/* Android Installation */}
          {isAndroid && (
            <Card className="border-l-4 border-l-primary">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Chrome className="w-6 h-6 text-primary" />
                  Installation sur Android
                </CardTitle>
                <CardDescription>
                  Installez l'application directement depuis Chrome
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {deferredPrompt ? (
                  <Button 
                    onClick={handleInstallClick}
                    className="w-full bg-primary hover:bg-primary/90"
                    size="lg"
                  >
                    <Download className="w-5 h-5 mr-2" />
                    Installer l'application
                  </Button>
                ) : (
                  <div className="space-y-3 text-sm">
                    <p className="font-semibold">Instructions d'installation :</p>
                    <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                      <li>Ouvrez le menu Chrome (⋮) en haut à droite</li>
                      <li>Sélectionnez "Ajouter à l'écran d'accueil"</li>
                      <li>Confirmez en appuyant sur "Ajouter"</li>
                      <li>L'application apparaîtra sur votre écran d'accueil</li>
                    </ol>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* iOS Installation */}
          {isIOS && (
            <Card className="border-l-4 border-l-primary">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Apple className="w-6 h-6 text-primary" />
                  Installation sur iOS
                </CardTitle>
                <CardDescription>
                  Installez l'application depuis Safari
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <p className="font-semibold">Instructions d'installation :</p>
                  <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                    <li>Ouvrez cette page dans Safari (si vous utilisez un autre navigateur)</li>
                    <li>Appuyez sur le bouton Partager (□↑) en bas de l'écran</li>
                    <li>Faites défiler et sélectionnez "Sur l'écran d'accueil"</li>
                    <li>Appuyez sur "Ajouter" en haut à droite</li>
                    <li>L'application apparaîtra sur votre écran d'accueil</li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Desktop Installation */}
          {!isIOS && !isAndroid && (
            <Card className="border-l-4 border-l-primary">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Chrome className="w-6 h-6 text-primary" />
                  Installation sur ordinateur
                </CardTitle>
                <CardDescription>
                  Installez l'application sur votre ordinateur
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {deferredPrompt ? (
                  <Button 
                    onClick={handleInstallClick}
                    className="w-full bg-primary hover:bg-primary/90"
                    size="lg"
                  >
                    <Download className="w-5 h-5 mr-2" />
                    Installer l'application
                  </Button>
                ) : (
                  <div className="space-y-3 text-sm">
                    <p className="font-semibold">Instructions d'installation :</p>
                    <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                      <li>Recherchez l'icône d'installation dans la barre d'adresse (à droite)</li>
                      <li>Ou ouvrez le menu Chrome et sélectionnez "Installer Prime Énergies"</li>
                      <li>Confirmez l'installation</li>
                      <li>L'application s'ouvrira dans une fenêtre dédiée</li>
                    </ol>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Features */}
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="text-base">Fonctionnalités de l'application</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <ArrowRight className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Accès rapide depuis votre écran d'accueil</span>
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Tableau de bord personnalisé</span>
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Suivi de vos économies en temps réel</span>
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Toutes les fonctionnalités du site web</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <div className="text-center">
            <Button 
              variant="outline"
              onClick={() => navigate("/")}
            >
              Retour au site
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstallApp;
