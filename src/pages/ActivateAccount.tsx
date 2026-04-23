import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

type Status = "loading" | "valid" | "invalid" | "expired" | "used" | "submitting" | "success";

export default function ActivateAccount() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<Status>("loading");
  const [tokenInfo, setTokenInfo] = useState<{ email?: string; firstName?: string; lastName?: string; phone?: string } | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      return;
    }
    const validate = async () => {
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        const res = await fetch(
          `${supabaseUrl}/functions/v1/activate-account?token=${encodeURIComponent(token)}`,
          { headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` } },
        );
        const data = await res.json();
        if (!res.ok) {
          if (data.error === "expired") setStatus("expired");
          else if (data.error === "already_used") setStatus("used");
          else setStatus("invalid");
          return;
        }
        setTokenInfo({
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
        });
        setStatus("valid");
      } catch (e) {
        setStatus("invalid");
      }
    };
    validate();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast({ title: "Mot de passe trop court", description: "Minimum 8 caractères.", variant: "destructive" });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: "Les mots de passe ne correspondent pas", variant: "destructive" });
      return;
    }
    setStatus("submitting");
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const res = await fetch(`${supabaseUrl}/functions/v1/activate-account`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
        },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === "user_exists") {
          toast({
            title: "Compte déjà existant",
            description: "Connectez-vous avec votre mot de passe habituel.",
          });
          navigate("/connexion");
          return;
        }
        throw new Error(data.message || data.error || "Erreur");
      }
      // Auto-login
      if (tokenInfo?.email) {
        await supabase.auth.signInWithPassword({ email: tokenInfo.email, password });
      }
      setStatus("success");
      setTimeout(() => navigate("/tableau-de-bord"), 1500);
    } catch (err: any) {
      setStatus("valid");
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-blue-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Activez votre espace Prime Énergies</CardTitle>
          <CardDescription>Définissez votre mot de passe pour accéder à votre espace membre.</CardDescription>
        </CardHeader>
        <CardContent>
          {status === "loading" && (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin mr-2" /> Validation du lien...
            </div>
          )}

          {status === "invalid" && (
            <div className="text-center py-6 space-y-3">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
              <p className="font-medium">Ce lien d'activation est invalide.</p>
              <Button asChild variant="outline"><Link to="/connexion">Aller à la connexion</Link></Button>
            </div>
          )}

          {status === "expired" && (
            <div className="text-center py-6 space-y-3">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
              <p className="font-medium">Ce lien a expiré (validité 7 jours).</p>
              <p className="text-sm text-muted-foreground">Soumettez à nouveau un formulaire ou contactez-nous.</p>
              <Button asChild variant="outline"><Link to="/">Retour à l'accueil</Link></Button>
            </div>
          )}

          {status === "used" && (
            <div className="text-center py-6 space-y-3">
              <CheckCircle2 className="h-12 w-12 text-emerald-600 mx-auto" />
              <p className="font-medium">Votre compte est déjà activé.</p>
              <Button asChild><Link to="/connexion">Me connecter</Link></Button>
            </div>
          )}

          {status === "success" && (
            <div className="text-center py-6 space-y-3">
              <CheckCircle2 className="h-12 w-12 text-emerald-600 mx-auto" />
              <p className="font-medium">Compte créé avec succès !</p>
              <p className="text-sm text-muted-foreground">Redirection vers votre espace...</p>
            </div>
          )}

          {(status === "valid" || status === "submitting") && tokenInfo && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="rounded-md bg-muted/50 p-3 text-sm space-y-1">
                {tokenInfo.firstName && <p><strong>Bonjour</strong> {tokenInfo.firstName} {tokenInfo.lastName}</p>}
                <p><strong>Email :</strong> {tokenInfo.email}</p>
                {tokenInfo.phone && <p><strong>Téléphone :</strong> {tokenInfo.phone}</p>}
              </div>
              <div>
                <Label htmlFor="pwd">Mot de passe (min. 8 caractères)</Label>
                <Input id="pwd" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} autoFocus />
              </div>
              <div>
                <Label htmlFor="pwd2">Confirmez le mot de passe</Label>
                <Input id="pwd2" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full" disabled={status === "submitting"}>
                {status === "submitting" && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Créer mon espace
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
