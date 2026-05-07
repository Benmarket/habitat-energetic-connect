import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const AdminEconomiesAccess = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [allowTenants, setAllowTenants] = useState(false);
  const [allowApartments, setAllowApartments] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("economies_settings")
        .select("allow_tenants, allow_apartments")
        .eq("id", 1)
        .maybeSingle();
      if (data) {
        setAllowTenants(data.allow_tenants);
        setAllowApartments(data.allow_apartments);
      }
      setLoading(false);
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("economies_settings")
      .upsert({ id: 1, allow_tenants: allowTenants, allow_apartments: allowApartments }, { onConflict: "id" });
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Réglages enregistrés");
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-muted/30 pt-24 pb-16">
        <div className="container max-w-3xl mx-auto px-4 space-y-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Accès « Mes économies »</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Contrôle l'accès à <code>/economies</code> pour les locataires et les habitants d'appartement.
            </p>
          </div>

          <Card className="p-6 space-y-6">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <Label htmlFor="tenants" className="font-semibold">Autoriser les locataires</Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Si désactivé, les locataires verront un écran explicatif (forum/contact) au lieu du parcours.
                    </p>
                  </div>
                  <Switch id="tenants" checked={allowTenants} onCheckedChange={setAllowTenants} />
                </div>

                <div className="flex items-center justify-between gap-4 pt-4 border-t">
                  <div>
                    <Label htmlFor="apt" className="font-semibold">Autoriser les appartements</Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Si désactivé, les habitants d'appartement seront bloqués sur la page (réservé aux maisons individuelles).
                    </p>
                  </div>
                  <Switch id="apt" checked={allowApartments} onCheckedChange={setAllowApartments} />
                </div>

                <Button onClick={save} disabled={saving} className="w-full">
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Enregistrer
                </Button>
              </>
            )}
          </Card>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default AdminEconomiesAccess;
