import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Image as ImageIcon, Loader2, Pencil, Save } from "lucide-react";
import { MediaLibrary } from "@/components/MediaLibrary";

interface Slot {
  src: string;
  alt: string;
}

interface Props {
  workType: string;
  workTypeLabel: string;
  onSaved?: () => void;
}

const EMPTY: Slot = { src: "", alt: "" };

export function EmailGalleryEditor({ workType, workTypeLabel, onSaved }: Props) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [slots, setSlots] = useState<Slot[]>([EMPTY, EMPTY, EMPTY]);
  const [mediaOpen, setMediaOpen] = useState(false);
  const [activeSlot, setActiveSlot] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("email_template_gallery")
      .select("*")
      .eq("work_type", workType)
      .maybeSingle();

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    setSlots([
      { src: data?.image_1_url ?? "", alt: data?.image_1_alt ?? "" },
      { src: data?.image_2_url ?? "", alt: data?.image_2_alt ?? "" },
      { src: data?.image_3_url ?? "", alt: data?.image_3_alt ?? "" },
    ]);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workType]);

  const updateSlot = (idx: number, patch: Partial<Slot>) => {
    setSlots((prev) => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  };

  const openMediaFor = (idx: number) => {
    setActiveSlot(idx);
    setMediaOpen(true);
  };

  const handleMediaSelect = (url: string, altText: string) => {
    if (activeSlot !== null) {
      updateSlot(activeSlot, { src: url, alt: altText || slots[activeSlot].alt });
    }
    setMediaOpen(false);
    setActiveSlot(null);
  };

  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("email_template_gallery")
      .upsert(
        {
          work_type: workType,
          image_1_url: slots[0].src || null,
          image_1_alt: slots[0].alt || null,
          image_2_url: slots[1].src || null,
          image_2_alt: slots[1].alt || null,
          image_3_url: slots[2].src || null,
          image_3_alt: slots[2].alt || null,
        },
        { onConflict: "work_type" }
      );
    setSaving(false);
    if (error) {
      toast({ title: "Erreur de sauvegarde", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Galerie enregistrée", description: `Les 3 images de "${workTypeLabel}" sont à jour.` });
    onSaved?.();
  };

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-primary" />
          Images du template « {workTypeLabel} »
        </CardTitle>
        <CardDescription>
          Survolez une image pour la <strong>changer</strong>. L'ordre (1 → 2 → 3) est figé et utilisé tel quel dans tous les emails envoyés pour ce produit.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {slots.map((slot, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                      Slot {idx + 1}
                    </Label>
                  </div>
                  <div className="group relative aspect-[4/3] rounded-lg border-2 border-border bg-muted overflow-hidden">
                    {slot.src ? (
                      <img src={slot.src} alt={slot.alt} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <ImageIcon className="w-10 h-10 opacity-40" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => openMediaFor(idx)}
                        className="shadow-lg"
                      >
                        <Pencil className="w-4 h-4 mr-2" />
                        {slot.src ? "Changer" : "Choisir une image"}
                      </Button>
                    </div>
                  </div>
                  <Input
                    value={slot.alt}
                    onChange={(e) => updateSlot(idx, { alt: e.target.value })}
                    placeholder="Texte alternatif (accessibilité)"
                    className="text-xs"
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-end mt-4">
              <Button onClick={save} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Enregistrer la galerie
              </Button>
            </div>
          </>
        )}
      </CardContent>

      <MediaLibrary open={mediaOpen} onOpenChange={setMediaOpen} onSelect={handleMediaSelect} />
    </Card>
  );
}
