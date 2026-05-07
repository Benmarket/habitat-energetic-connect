import { useEffect, useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2, AlertCircle, Mail } from "lucide-react";
import { PasswordStrengthIndicator, isPasswordValid } from "@/components/PasswordStrengthIndicator";

type Status =
  | "request"
  | "request_sent"
  | "no_account"
  | "loading"
  | "valid"
  | "invalid"
  | "expired"
  | "used"
  | "submitting"
  | "success";

export default function PasswordReset() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<Status>(token ? "loading" : "request");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const res = await fetch(
          `${supabaseUrl}/functions/v1/reset-password?token=${encodeURIComponent(token)}`,
          { headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` } },
        );
        const data = await res.json();
        if (!res.ok) {
          if (data.error === "expired") setStatus("expired");
          else if (data.error === "already_used") setStatus("used");
          else setStatus("invalid");
          return;
        }
        setEmail(data.email || "");
        setStatus("valid");
      } catch {
        setStatus("invalid");
      }
    })();
  }, [token, supabaseUrl, anonKey]);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatus("submitting");
    try {
      const { data, error } = await supabase.functions.invoke("request-password-reset", {
        body: { email, siteOrigin: window.location.origin },
      });
      if (error) throw error;
      if (data?.sent) {
        setStatus("request_sent");
      } else if (data?.reason === "no_account") {
        setStatus("no_account");
      } else if (data?.reason === "rate_limited") {
        toast({ title: "Trop de demandes", description: data.message, variant: "destructive" });
        setStatus("request");
      } else {
        toast({ title: "Erreur", description: data?.message || "Réessayez.", variant: "destructive" });
        setStatus("request");
      }
    } catch (err: any) {
      toast({ title: "Erreur", description: err?.message || "Réessayez.", variant: "destructive" });
      setStatus("request");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordValid(password)) {
      toast({ title: "Mot de passe invalide", description: "Min. 8 caractères + 1 majuscule.", variant: "destructive" });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: "Les mots de passe ne correspondent pas", variant: "destructive" });
      return;
    }
    setStatus("submitting");
    try {
      const res = await fetch(`${supabaseUrl}/functions/v1/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
        },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || "Erreur");
      setStatus("success");
      setTimeout(() => navigate("/connexion"), 2000);
    } catch (err: any) {
      setStatus("valid");
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    }
  };

  return (
    <>
      <Helmet>
        <title>Mot de passe oublié | Prime Énergies</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>
      <div className="min-h-screen flex items-center justify-center bg-muted p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Mot de passe oublié</CardTitle>
            <CardDescription>
              {token
                ? "Choisissez un nouveau mot de passe pour votre compte."
                : "Entrez votre email pour recevoir un lien de réinitialisation."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {status === "loading" && (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin mr-2" /> Validation du lien...
              </div>
            )}

            {status === "request" && (
              <form onSubmit={handleRequest} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="exemple@email.fr" autoFocus />
                </div>
                <Button type="submit" className="w-full">Envoyer le lien</Button>
                <div className="text-center pt-2">
                  <Link to="/connexion" className="text-sm text-primary hover:underline">← Retour à la connexion</Link>
                </div>
              </form>
            )}

            {status === "submitting" && !token && (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin mr-2" /> Envoi...
              </div>
            )}

            {status === "request_sent" && (
              <div className="text-center py-6 space-y-3">
                <Mail className="h-12 w-12 text-primary mx-auto" />
                <p className="font-medium">Si un compte existe avec cette adresse, un email vient de partir.</p>
                <p className="text-sm text-muted-foreground">Vérifiez votre boîte de réception (et vos spams). Le lien est valable 1 heure.</p>
                <Button asChild variant="outline"><Link to="/connexion">Retour à la connexion</Link></Button>
              </div>
            )}

            {status === "invalid" && (
              <div className="text-center py-6 space-y-3">
                <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
                <p className="font-medium">Ce lien est invalide.</p>
                <Button asChild variant="outline"><Link to="/mot-de-passe-oublie">Faire une nouvelle demande</Link></Button>
              </div>
            )}

            {status === "expired" && (
              <div className="text-center py-6 space-y-3">
                <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
                <p className="font-medium">Ce lien a expiré.</p>
                <Button asChild variant="outline"><Link to="/mot-de-passe-oublie">Faire une nouvelle demande</Link></Button>
              </div>
            )}

            {status === "used" && (
              <div className="text-center py-6 space-y-3">
                <CheckCircle2 className="h-12 w-12 text-emerald-600 mx-auto" />
                <p className="font-medium">Ce lien a déjà été utilisé.</p>
                <Button asChild><Link to="/connexion">Me connecter</Link></Button>
              </div>
            )}

            {status === "success" && (
              <div className="text-center py-6 space-y-3">
                <CheckCircle2 className="h-12 w-12 text-emerald-600 mx-auto" />
                <p className="font-medium">Mot de passe mis à jour !</p>
                <p className="text-sm text-muted-foreground">Redirection vers la connexion...</p>
              </div>
            )}

            {(status === "valid" || (status === "submitting" && token)) && (
              <form onSubmit={handleSubmit} className="space-y-4">
                {email && (
                  <div className="rounded-md bg-muted/50 p-3 text-sm">
                    <strong>Compte :</strong> {email}
                  </div>
                )}
                <div>
                  <Label htmlFor="pwd">Nouveau mot de passe</Label>
                  <Input id="pwd" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoFocus />
                  <PasswordStrengthIndicator password={password} />
                </div>
                <div>
                  <Label htmlFor="pwd2">Confirmez le mot de passe</Label>
                  <Input id="pwd2" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full" disabled={status === "submitting"}>
                  {status === "submitting" && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Mettre à jour mon mot de passe
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
