import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Loader2, AlertCircle, ArrowRight, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Status = "loading" | "success" | "already" | "error";

const NewsletterQuickSubscribe = () => {
  const [params] = useSearchParams();
  const email = (params.get("email") || "").trim().toLowerCase();
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setStatus("error");
        setMessage("Lien invalide ou email manquant.");
        return;
      }
      try {
        const { data, error } = await supabase.functions.invoke("newsletter-one-click", {
          body: { email },
        });
        if (cancelled) return;
        if (error) {
          setStatus("error");
          setMessage("Une erreur est survenue. Merci de réessayer.");
          return;
        }
        if (data?.alreadyActive) {
          setStatus("already");
          setMessage("Vous êtes déjà inscrit(e) à notre newsletter.");
        } else {
          setStatus("success");
          setMessage("Inscription confirmée !");
        }
      } catch {
        if (!cancelled) {
          setStatus("error");
          setMessage("Une erreur est survenue. Merci de réessayer.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [email]);

  return (
    <>
      <Helmet>
        <title>Inscription newsletter | Prime Energies</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-16 max-w-2xl">
          <Card className="overflow-hidden border-border/50 shadow-xl border-l-4 border-l-primary">
            <CardContent className="p-8 md:p-10 flex flex-col">
              <Badge
                variant="secondary"
                className="mb-5 self-start bg-primary/10 text-primary hover:bg-primary/20 rounded-full px-4 py-1 uppercase tracking-wider text-xs font-bold"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                Newsletter Prime Energies
              </Badge>

              {status === "loading" && (
                <>
                  <h1 className="text-2xl md:text-3xl font-bold mb-3 leading-tight tracking-tight">
                    Confirmation en cours…
                  </h1>
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Validation de votre inscription</span>
                  </div>
                </>
              )}

              {status === "success" && (
                <>
                  <h1 className="text-2xl md:text-3xl font-bold mb-3 leading-tight tracking-tight flex items-center gap-2">
                    <CheckCircle2 className="w-7 h-7 text-primary shrink-0" />
                    {message}
                  </h1>
                  <p className="text-muted-foreground text-base leading-relaxed mb-6">
                    Merci ! Vous recevrez nos prochaines actualités énergie
                    (aides, primes, économies, innovations) directement sur{" "}
                    <strong className="text-foreground">{email}</strong>. Un
                    email de bienvenue vient de partir avec nos derniers
                    articles.
                  </p>
                </>
              )}

              {status === "already" && (
                <>
                  <h1 className="text-2xl md:text-3xl font-bold mb-3 leading-tight tracking-tight flex items-center gap-2">
                    <CheckCircle2 className="w-7 h-7 text-primary shrink-0" />
                    {message}
                  </h1>
                  <p className="text-muted-foreground text-base leading-relaxed mb-6">
                    Rien à faire de plus, vous recevrez chaque nouvelle
                    actualité publiée par notre équipe.
                  </p>
                </>
              )}

              {status === "error" && (
                <>
                  <h1 className="text-2xl md:text-3xl font-bold mb-3 leading-tight tracking-tight flex items-center gap-2">
                    <AlertCircle className="w-7 h-7 text-destructive shrink-0" />
                    Oups…
                  </h1>
                  <p className="text-muted-foreground text-base leading-relaxed mb-2">
                    {message}
                  </p>
                  <p className="text-muted-foreground text-sm mb-6">
                    Vous pouvez vous inscrire manuellement via le formulaire en
                    pied de page du site.
                  </p>
                </>
              )}

              <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-border/50 mt-2">
                <Link to="/actualites" className="flex-1">
                  <Button className="w-full group">
                    Voir les actualités
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link to="/" className="flex-1">
                  <Button variant="outline" className="w-full">
                    Retour à l'accueil
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default NewsletterQuickSubscribe;
