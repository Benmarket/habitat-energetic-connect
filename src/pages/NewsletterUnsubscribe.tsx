import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Loader2,
  Mail,
  CheckCircle2,
  ShieldAlert,
  ArrowRight,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Status = "idle" | "loading" | "done" | "error";

export default function NewsletterUnsubscribe() {
  const [params] = useSearchParams();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const prefill = params.get("email");
    if (prefill) setEmail(prefill);
  }, [params]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const trimmed = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setErrorMsg("Merci d'entrer une adresse email valide.");
      return;
    }
    setStatus("loading");
    try {
      const { data, error } = await supabase.functions.invoke(
        "newsletter-unsubscribe",
        { body: { email: trimmed } },
      );
      if (error) throw error;
      if (data?.success) {
        setStatus("done");
      } else {
        throw new Error(data?.error ?? "Erreur inconnue");
      }
    } catch (err) {
      console.error(err);
      setStatus("error");
      setErrorMsg(
        "Impossible de traiter votre demande pour l'instant. Merci de réessayer plus tard.",
      );
      toast({
        title: "Erreur",
        description: "La désinscription a échoué.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 py-12 px-4">
      <Helmet>
        <title>Se désinscrire de la newsletter | Prime Énergies</title>
        <meta
          name="description"
          content="Gérez votre abonnement à la newsletter Prime Énergies. Désinscription instantanée en un clic."
        />
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>

      <div className="max-w-xl mx-auto">
        <Card>
          <CardHeader className="space-y-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Mail className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="text-2xl">
              Se désinscrire de la newsletter
            </CardTitle>
            <CardDescription>
              Vous ne recevrez plus nos emails d'actualités et de conseils. Vos
              autres données (compte, historique de demandes) restent
              inchangées.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {status !== "done" ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Adresse email abonnée</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="vous@exemple.fr"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={status === "loading"}
                  />
                  {errorMsg && (
                    <p className="text-sm text-destructive">{errorMsg}</p>
                  )}
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={status === "loading"}
                >
                  {status === "loading" ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Traitement...
                    </>
                  ) : (
                    "Confirmer ma désinscription"
                  )}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Cette action concerne uniquement la newsletter. Pour effacer
                  toutes vos données personnelles, voyez le registre RGPD
                  ci-dessous.
                </p>
              </form>
            ) : (
              <div className="space-y-6 text-center">
                <div className="flex flex-col items-center gap-3">
                  <CheckCircle2 className="w-14 h-14 text-emerald-600" />
                  <h3 className="text-xl font-semibold">
                    Vous êtes bien désinscrit(e)
                  </h3>
                  <p className="text-muted-foreground">
                    <strong>{email}</strong> ne recevra plus la newsletter
                    Prime Énergies. Merci d'avoir fait partie de la
                    communauté 💚
                  </p>
                </div>

                <div className="rounded-lg border border-orange-200 bg-orange-50 p-5 text-left">
                  <div className="flex gap-3">
                    <ShieldAlert className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                    <div className="space-y-2">
                      <p className="font-semibold text-orange-900">
                        Vous souhaitez aussi être retiré(e) du registre RGPD ?
                      </p>
                      <p className="text-sm text-orange-900/80">
                        C'est une démarche différente : elle efface également
                        vos demandes de devis, votre compte et toutes les
                        données associées à votre email. Une fois lancée, cette
                        suppression est définitive.
                      </p>
                      <Button
                        asChild
                        variant="outline"
                        className="mt-2 bg-white"
                      >
                        <Link
                          to={`/desinscription-registre?email=${encodeURIComponent(email)}`}
                        >
                          Ouvrir le registre RGPD
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>

                <Button asChild variant="ghost" className="w-full">
                  <Link to="/">Retour à l'accueil</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
