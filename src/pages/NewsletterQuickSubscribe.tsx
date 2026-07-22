import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, AlertCircle, Mail } from "lucide-react";
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
          setMessage("Votre inscription à la newsletter est confirmée !");
        }
      } catch {
        if (!cancelled) {
          setStatus("error");
          setMessage("Une erreur est survenue. Merci de réessayer.");
        }
      }
    })();
    return () => { cancelled = true; };
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
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Mail className="w-6 h-6 text-emerald-600" />
                Newsletter Prime Energies
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {status === "loading" && (
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Confirmation de votre inscription en cours…
                </div>
              )}

              {status === "success" && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-emerald-700">
                    <CheckCircle2 className="w-6 h-6" />
                    <p className="font-semibold text-lg">{message}</p>
                  </div>
                  <p className="text-muted-foreground">
                    Merci ! Vous recevrez nos prochaines actualités énergie
                    (aides, économies, innovations) directement dans votre boîte
                    <strong> {email}</strong>. Un email de bienvenue vient de
                    partir avec nos 3 derniers articles.
                  </p>
                </div>
              )}

              {status === "already" && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-blue-700">
                    <CheckCircle2 className="w-6 h-6" />
                    <p className="font-semibold text-lg">{message}</p>
                  </div>
                  <p className="text-muted-foreground">
                    Rien à faire, vous recevrez chaque nouvelle actualité
                    publiée.
                  </p>
                </div>
              )}

              {status === "error" && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-destructive">
                    <AlertCircle className="w-6 h-6" />
                    <p className="font-semibold">{message}</p>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    Vous pouvez vous inscrire manuellement via le formulaire en
                    pied de page du site.
                  </p>
                </div>
              )}

              <div className="pt-4 flex gap-2">
                <Link to="/">
                  <Button variant="outline">Retour à l'accueil</Button>
                </Link>
                <Link to="/actualites">
                  <Button>Voir les actualités</Button>
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
