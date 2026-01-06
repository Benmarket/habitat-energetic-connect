import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, Home, Phone, Mail, Clock, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Helmet } from "react-helmet";
import { Card, CardContent } from "@/components/ui/card";

const Merci = () => {
  const [searchParams] = useSearchParams();
  
  // Récupérer les paramètres de personnalisation
  const name = searchParams.get("name");
  const offerTitle = searchParams.get("offer");
  const advertiserName = searchParams.get("partner");
  const isFromOffer = offerTitle && advertiserName;

  // Extraire le prénom du nom complet
  const firstName = name ? name.split(" ")[0] : null;

  return (
    <>
      <Helmet>
        <title>Merci - Prime-Energies</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-muted/30">
        <Header />
        
        <main className="flex-1 flex items-center justify-center py-12 px-4">
          <div className="w-full max-w-2xl">
            {/* Success Icon avec animation */}
            <div className="text-center mb-8">
              <div className="relative inline-flex">
                <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center animate-pulse">
                  <CheckCircle2 className="w-14 h-14 text-primary" />
                </div>
                <Sparkles className="w-6 h-6 text-amber-500 absolute -top-1 -right-1 animate-bounce" />
              </div>
            </div>

            {/* Message principal personnalisé */}
            <div className="text-center mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                {firstName ? `Merci ${firstName} !` : "Merci !"}
              </h1>
              <p className="text-lg text-muted-foreground">
                Votre demande a bien été enregistrée avec succès.
              </p>
            </div>

            {/* Carte avec infos de l'offre (si provient d'une annonce) */}
            {isFromOffer && (
              <Card className="mb-8 border-primary/20 bg-primary/5">
                <CardContent className="pt-6">
                  <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    Récapitulatif de votre demande
                  </h2>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center py-2 border-b border-border/50">
                      <span className="text-muted-foreground">Offre demandée</span>
                      <span className="font-medium text-foreground">{offerTitle}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-muted-foreground">Partenaire</span>
                      <span className="font-medium text-foreground">{advertiserName}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Prochaines étapes */}
            <Card className="mb-8">
              <CardContent className="pt-6">
                <h2 className="font-semibold text-lg mb-4">Et maintenant ?</h2>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Clock className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">Réponse rapide</h3>
                      <p className="text-sm text-muted-foreground">
                        {isFromOffer 
                          ? `Notre partenaire ${advertiserName} vous contactera sous 24 à 48h.`
                          : "Un conseiller vous contactera dans les plus brefs délais."}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Phone className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">Gardez votre téléphone à portée</h3>
                      <p className="text-sm text-muted-foreground">
                        Vous recevrez un appel pour discuter de votre projet et répondre à vos questions.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Mail className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">Vérifiez vos emails</h3>
                      <p className="text-sm text-muted-foreground">
                        Un email de confirmation vous a été envoyé avec les détails de votre demande.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Boutons d'action */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="gap-2">
                <Link to="/">
                  <Home className="w-4 h-4" />
                  Retour à l'accueil
                </Link>
              </Button>
              
              <Button asChild variant="outline" size="lg" className="gap-2">
                <Link to="/guides">
                  Découvrir nos guides
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          </div>
        </main>
        
        <Footer />
      </div>
    </>
  );
};

export default Merci;
