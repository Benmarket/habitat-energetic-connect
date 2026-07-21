import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, CheckCircle2, ShieldAlert, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const schema = z.object({
  last_name: z.string().trim().min(1, "Nom requis").max(100),
  first_name: z.string().trim().min(1, "Prénom requis").max(100),
  email: z.string().trim().email("Email invalide").max(255),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
  request_type: z.string().min(1, "Sélectionnez le type de demande"),
  reason: z.string().max(1000).optional().or(z.literal("")),
  confirm_identity: z.literal(true, {
    errorMap: () => ({ message: "Vous devez certifier être la personne concernée." }),
  }),
});

const FORM_IDENTIFIER = "desinscription-registre";

export default function DesinscriptionRegistre() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [data, setData] = useState({
    last_name: "",
    first_name: "",
    email: "",
    phone: "",
    request_type: "",
    reason: "",
    confirm_identity: false,
  });

  const set = (k: string, v: string | boolean) => setData((p) => ({ ...p, [k]: v }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(data);
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }
    setIsSubmitting(true);
    try {
      const { data: formConfig, error: formError } = await supabase
        .from("form_configurations_public")
        .select("id")
        .eq("form_identifier", FORM_IDENTIFIER)
        .maybeSingle();
      if (formError || !formConfig) throw formError ?? new Error("Formulaire introuvable");

      const { getAttribution } = await import("@/lib/attribution");
      const { getConsentPayload } = await import("@/lib/consent");
      const { error } = await supabase.from("form_submissions").insert({
        form_id: formConfig.id,
        data: {
          ...parsed.data,
          _priority: "high",
          _rgpd_request: true,
          _submitted_at: new Date().toISOString(),
          _ref_page: window.location.pathname,
        },
        attribution: getAttribution(),
        consent: getConsentPayload(),
      });
      if (error) throw error;

      setIsDone(true);
      toast.success("Votre demande a bien été enregistrée.");
    } catch (err) {
      console.error(err);
      toast.error("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <title>Désinscription du registre – Droit à l'oubli (RGPD) | Prime Énergies</title>
      <meta
        name="description"
        content="Exercez votre droit RGPD : demande de désinscription, d'effacement, d'accès ou de rectification de vos données personnelles."
      />
      <meta name="robots" content="noindex, follow" />

      <Header />

      <main className="min-h-screen bg-muted/20 py-12">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="mb-8 text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-red-50 border border-red-200 text-red-700 px-3 py-1 text-xs font-semibold mb-3">
              <ShieldAlert className="w-3.5 h-3.5" />
              Traitement prioritaire — Conformité RGPD
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              Désinscription du registre
            </h1>
            <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
              Conformément au Règlement Général sur la Protection des Données
              (RGPD), vous pouvez à tout moment exercer votre droit à l'oubli,
              d'accès, de rectification ou d'opposition sur vos données
              personnelles.
            </p>
          </div>

          {isDone ? (
            <Card>
              <CardContent className="py-10 flex flex-col items-center text-center gap-3">
                <CheckCircle2 className="w-14 h-14 text-emerald-600" />
                <h2 className="text-xl font-bold">Demande enregistrée</h2>
                <p className="text-muted-foreground max-w-md">
                  Votre demande a été transmise à notre Délégué à la Protection
                  des Données (DPO). Elle sera traitée en priorité dans un délai
                  maximum d'un mois, conformément au RGPD (art. 12). Vous
                  recevrez un email de confirmation à l'issue du traitement.
                </p>
                <Button asChild className="mt-2">
                  <Link to="/">Retour à l'accueil</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  Formulaire de demande RGPD
                </CardTitle>
                <CardDescription>
                  Remplissez ce formulaire pour formuler votre demande. Elle
                  sera traitée manuellement et en priorité par notre équipe. La
                  désinscription n'est pas immédiate : elle est effectuée après
                  vérification de votre identité.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={onSubmit} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="last_name">Nom <span className="text-destructive">*</span></Label>
                      <Input id="last_name" value={data.last_name} onChange={(e) => set("last_name", e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="first_name">Prénom <span className="text-destructive">*</span></Label>
                      <Input id="first_name" value={data.first_name} onChange={(e) => set("first_name", e.target.value)} />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="email">Email utilisé lors de vos demandes <span className="text-destructive">*</span></Label>
                    <Input id="email" type="email" value={data.email} onChange={(e) => set("email", e.target.value)} />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="phone">Téléphone (facultatif)</Label>
                    <Input id="phone" type="tel" value={data.phone} onChange={(e) => set("phone", e.target.value)} />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="request_type">Type de demande <span className="text-destructive">*</span></Label>
                    <Select value={data.request_type} onValueChange={(v) => set("request_type", v)}>
                      <SelectTrigger id="request_type">
                        <SelectValue placeholder="Sélectionnez votre demande" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="desinscription">Désinscription du registre</SelectItem>
                        <SelectItem value="effacement">Effacement complet de mes données</SelectItem>
                        <SelectItem value="acces">Accès à mes données</SelectItem>
                        <SelectItem value="rectification">Rectification de mes données</SelectItem>
                        <SelectItem value="opposition">Opposition au traitement</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="reason">Motif de votre demande (facultatif)</Label>
                    <Textarea
                      id="reason"
                      rows={4}
                      placeholder="Précisez le contexte si vous le souhaitez…"
                      value={data.reason}
                      onChange={(e) => set("reason", e.target.value)}
                    />
                  </div>

                  <label className="flex items-start gap-2 rounded-md border bg-muted/30 p-3 cursor-pointer">
                    <Checkbox
                      checked={data.confirm_identity}
                      onCheckedChange={(v) => set("confirm_identity", v === true)}
                      className="mt-0.5"
                    />
                    <span className="text-xs leading-snug">
                      Je certifie sur l'honneur être la personne concernée par
                      cette demande et j'accepte que mes données soient traitées
                      dans le cadre de l'exercice de mes droits RGPD.{" "}
                      <span className="text-destructive">*</span>
                    </span>
                  </label>

                  <Button type="submit" disabled={isSubmitting || !data.confirm_identity} className="w-full h-11">
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Envoi…
                      </>
                    ) : (
                      "Envoyer ma demande RGPD"
                    )}
                  </Button>

                  <p className="text-[11px] text-muted-foreground text-center">
                    Base légale : RGPD art. 15 à 22 · Délai de traitement max. 1 mois.
                    Voir notre{" "}
                    <Link to="/politique-confidentialite" className="underline">
                      politique de confidentialité
                    </Link>.
                  </p>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}
