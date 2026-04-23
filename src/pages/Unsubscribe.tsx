import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

type Status = "loading" | "valid" | "invalid" | "confirming" | "done";

export default function Unsubscribe() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<Status>("loading");
  const [email, setEmail] = useState<string | null>(null);

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  useEffect(() => {
    if (!token) { setStatus("invalid"); return; }
    fetch(`${supabaseUrl}/functions/v1/handle-email-unsubscribe?token=${encodeURIComponent(token)}`, {
      headers: { apikey: anonKey },
    })
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) { setStatus("invalid"); return; }
        setEmail(data.email ?? null);
        setStatus(data.already_unsubscribed ? "done" : "valid");
      })
      .catch(() => setStatus("invalid"));
  }, [token, supabaseUrl, anonKey]);

  const confirm = async () => {
    setStatus("confirming");
    try {
      const r = await fetch(`${supabaseUrl}/functions/v1/handle-email-unsubscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: anonKey, Authorization: `Bearer ${anonKey}` },
        body: JSON.stringify({ token }),
      });
      if (!r.ok) throw new Error();
      setStatus("done");
    } catch { setStatus("valid"); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Désinscription</CardTitle>
          <CardDescription>Gestion de vos préférences email Prime Énergies.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === "loading" && <div className="flex items-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin mr-2" /> Validation...</div>}
          {status === "invalid" && (
            <div className="text-center space-y-3">
              <AlertCircle className="h-10 w-10 text-destructive mx-auto" />
              <p>Ce lien de désinscription est invalide ou a expiré.</p>
              <Button asChild variant="outline"><Link to="/">Retour</Link></Button>
            </div>
          )}
          {status === "valid" && (
            <div className="space-y-3 text-center">
              <p>Vous êtes sur le point de désinscrire <strong>{email}</strong> de nos emails.</p>
              <Button onClick={confirm} variant="destructive" className="w-full">Confirmer ma désinscription</Button>
              <Button asChild variant="ghost" className="w-full"><Link to="/">Annuler</Link></Button>
            </div>
          )}
          {status === "confirming" && <div className="flex items-center justify-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin mr-2" /> Traitement...</div>}
          {status === "done" && (
            <div className="text-center space-y-3">
              <CheckCircle2 className="h-12 w-12 text-emerald-600 mx-auto" />
              <p className="font-medium">{email ? `${email} a été désinscrit.` : "Désinscription effectuée."}</p>
              <Button asChild><Link to="/">Retour à l'accueil</Link></Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
