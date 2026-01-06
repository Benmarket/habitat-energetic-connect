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
      
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        
        <main className="flex-1 pt-4 pb-8 px-4">
          <div className="w-full max-w-3xl mx-auto">
            {/* Message principal */}
            <div className="text-center mb-4">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1">
                Merci !
              </h1>
              <p className="text-base text-muted-foreground">
                Votre demande a bien été enregistrée avec succès.
              </p>
            </div>

            {/* Vidéo avec icône de validation - hauteur réduite */}
            <div className="relative mb-5">
              <div className="relative rounded-xl overflow-hidden shadow-lg">
                <div className="w-full h-[280px] md:h-[340px] overflow-hidden">
                  <video
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="w-full h-[120%] object-cover object-top"
                  >
                    <source src="/videos/post-lead-confirmation.mp4" type="video/mp4" />
                  </video>
                </div>
              </div>
              
              {/* Icône de validation animée */}
              <div className="absolute -top-2 -right-2 md:-top-3 md:-right-3">
                <div className="relative">
                  <div className="w-12 h-12 md:w-14 md:h-14 bg-primary rounded-full flex items-center justify-center shadow-lg animate-scale-in">
                    <CheckCircle2 className="w-7 h-7 md:w-8 md:h-8 text-primary-foreground" />
                  </div>
                  <Sparkles className="w-4 h-4 text-amber-400 absolute -top-1 -right-1 animate-bounce" />
                </div>
              </div>
            </div>

            {/* Carte avec infos de l'offre (si provient d'une annonce) */}
            {isFromOffer && (
              <Card className="mb-4 border-primary/20 bg-primary/5">
                <CardContent className="py-4">
                  <h2 className="font-semibold text-base mb-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    Récapitulatif de votre demande
                  </h2>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center py-1.5 border-b border-border/50">
                      <span className="text-muted-foreground">Offre demandée</span>
                      <span className="font-medium text-foreground">{offerTitle}</span>
                    </div>
                    <div className="flex justify-between items-center py-1.5">
                      <span className="text-muted-foreground">Partenaire</span>
                      <span className="font-medium text-foreground">{advertiserName}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Prochaines étapes */}
            <Card className="mb-5">
              <CardContent className="py-4">
                <h2 className="font-semibold text-base mb-3">Et maintenant ?</h2>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Clock className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground text-sm">Réponse rapide</h3>
                      <p className="text-xs text-muted-foreground">
                        {isFromOffer 
                          ? `Notre partenaire ${advertiserName} vous contactera sous 24 à 48h.`
                          : "Un conseiller vous contactera dans les plus brefs délais."}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Phone className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground text-sm">Gardez votre téléphone à portée</h3>
                      <p className="text-xs text-muted-foreground">
                        Vous recevrez un appel pour discuter de votre projet et répondre à vos questions.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Mail className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground text-sm">Vérifiez vos emails</h3>
                      <p className="text-xs text-muted-foreground">
                        Un email de confirmation vous a été envoyé avec les détails de votre demande.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Boutons d'action */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild size="default" className="gap-2">
                <Link to="/">
                  <Home className="w-4 h-4" />
                  Retour à l'accueil
                </Link>
              </Button>
              
              <Button asChild variant="outline" size="default" className="gap-2">
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
