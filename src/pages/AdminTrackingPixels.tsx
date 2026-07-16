import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Loader2, Save, Facebook, CheckCircle2, AlertCircle } from "lucide-react";

const AdminTrackingPixels = () => {
  const { user } = useAuth();
  const [pixelId, setPixelId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "meta_pixel_id")
        .maybeSingle();
      const raw = data?.value as unknown;
      const val =
        typeof raw === "string"
          ? raw
          : typeof raw === "object" && raw && "id" in (raw as any)
            ? String((raw as any).id ?? "")
            : "";
      setPixelId(val);
      setLoading(false);
    })();
  }, []);

  const isValid = /^\d{6,20}$/.test(pixelId.trim());

  const save = async () => {
    if (pixelId && !isValid) {
      toast.error("Le Pixel ID doit être un nombre (15-16 chiffres généralement).");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("site_settings")
      .upsert(
        { key: "meta_pixel_id", value: pixelId.trim(), updated_by: user?.id ?? null },
        { onConflict: "key" },
      );
    setSaving(false);
    if (error) {
      toast.error("Erreur lors de l'enregistrement");
      return;
    }
    toast.success("Pixel Meta enregistré. Rechargez le site pour l'activer.");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-3xl">
        <Link to="/administration" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Retour à l'administration
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Pixels de tracking</h1>
          <p className="text-muted-foreground">
            Configurez les pixels de conversion des régies publicitaires (Meta, ...).
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Facebook className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <CardTitle>Pixel Meta (Facebook / Instagram)</CardTitle>
                <CardDescription>
                  Colle ici l'ID de ton Pixel Meta pour tracker les conversions sur Facebook & Instagram Ads.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {loading ? (
              <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" /> Chargement…</div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="pixel-id">Pixel ID Meta</Label>
                  <Input
                    id="pixel-id"
                    value={pixelId}
                    onChange={(e) => setPixelId(e.target.value.replace(/\D/g, ""))}
                    placeholder="Ex : 1234567890123456"
                    inputMode="numeric"
                    maxLength={20}
                  />
                  <div className="flex items-center gap-2 text-xs">
                    {pixelId === "" ? (
                      <span className="text-muted-foreground">Aucun pixel actif — laissez vide pour désactiver</span>
                    ) : isValid ? (
                      <Badge variant="secondary" className="gap-1 bg-emerald-500/10 text-emerald-700 border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" /> Format valide
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="gap-1">
                        <AlertCircle className="w-3 h-3" /> Doit contenir uniquement des chiffres (15-16)
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="rounded-lg border bg-muted/40 p-4 space-y-2 text-sm">
                  <p className="font-medium">Où trouver ton Pixel ID ?</p>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                    <li>Va sur <a href="https://business.facebook.com/events_manager" target="_blank" rel="noreferrer noopener" className="text-primary underline">Meta Events Manager</a></li>
                    <li>Sélectionne ton Pixel dans la liste de gauche</li>
                    <li>Ton Pixel ID apparaît en haut, sous le nom (15-16 chiffres)</li>
                  </ol>
                </div>

                <div className="rounded-lg border bg-muted/40 p-4 space-y-2 text-sm">
                  <p className="font-medium">Événements envoyés automatiquement</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li><strong>PageView</strong> — sur toutes les pages du site (y compris les changements de route SPA)</li>
                    <li><strong>Lead</strong> — simulateur solaire (étape finale), landings (solaire, régionale), formulaire contact du footer</li>
                  </ul>
                  <p className="text-xs text-muted-foreground pt-2">
                    Chaque événement Lead inclut <code className="text-xs bg-background px-1 rounded">content_name</code> pour identifier la source (ex. <code className="text-xs bg-background px-1 rounded">simulateur-solaire</code>).
                  </p>
                </div>

                <div className="flex justify-end">
                  <Button onClick={save} disabled={saving} className="gap-2">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Enregistrer
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default AdminTrackingPixels;
