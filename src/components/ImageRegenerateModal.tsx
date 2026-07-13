import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Loader2, Sparkles, Wand2, Pencil, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ImageRegenerateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImageGenerated: (url: string) => void;
  context?: string;         // titre + extrait / contexte de section
  contextLabel?: string;    // ex: "image à la une"
  currentImageUrl?: string; // URL de l'image actuelle (active le mode "Retoucher")
}

type Mode = "edit" | "fresh";

export function ImageRegenerateModal({
  open,
  onOpenChange,
  onImageGenerated,
  context,
  contextLabel,
  currentImageUrl,
}: ImageRegenerateModalProps) {
  const canEdit = !!currentImageUrl;
  const [mode, setMode] = useState<Mode>(canEdit ? "edit" : "fresh");
  const [editPrompt, setEditPrompt] = useState("");
  const [freshPrompt, setFreshPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (open) {
      setMode(canEdit ? "edit" : "fresh");
      setEditPrompt("");
      setFreshPrompt("");
      setElapsed(0);
    }
  }, [open, canEdit]);

  const handleGenerate = async (e?: React.MouseEvent | React.FormEvent) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();

    if (mode === "edit" && !editPrompt.trim()) {
      toast.error("Décris ce que tu veux corriger sur l'image actuelle.");
      return;
    }

    setLoading(true);
    setElapsed(0);
    const timer = setInterval(() => setElapsed((s) => s + 1), 1000);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) { toast.error("Vous devez être connecté"); return; }

      let payload: Record<string, unknown>;

      if (mode === "edit" && canEdit) {
        // Mode retouche : on garde l'image actuelle comme base + instructions
        payload = {
          mode: "edit",
          sourceImageUrl: currentImageUrl,
          editInstructions: editPrompt.trim(),
          context: context?.slice(0, 500) || "",
          seoContext: context?.slice(0, 160) || contextLabel || "",
        };
        console.log('[ImageRegenerate] mode=edit', { editPrompt: editPrompt.trim(), currentImageUrl });
      } else {
        // Mode génération depuis zéro
        let finalPrompt = freshPrompt.trim();
        if (!finalPrompt && context) {
          const { data: aiData, error: aiError } = await supabase.functions.invoke('generate-article', {
            body: {
              mode: 'image_prompt',
              context: context.slice(0, 2000),
              contextLabel: contextLabel || 'article',
            },
            headers: { Authorization: `Bearer ${token}` }
          });
          if (aiError) throw aiError;
          finalPrompt = aiData?.prompt || `Photo professionnelle illustrant: ${context.slice(0, 200)}`;
        } else if (!finalPrompt) {
          finalPrompt = "Photo professionnelle et engageante sur le thème de la rénovation énergétique";
        }
        payload = {
          imageDescriptions: [finalPrompt],
          seoContext: [context?.slice(0, 160) || contextLabel || finalPrompt.slice(0, 160)],
        };
        console.log('[ImageRegenerate] mode=fresh', finalPrompt.slice(0, 200));
      }

      const { data, error } = await supabase.functions.invoke('generate-images', {
        body: payload,
        headers: { Authorization: `Bearer ${token}` }
      });

      if (error) throw error;
      const url = data?.images?.[0]?.url;
      const imgError = data?.images?.[0]?.error;
      if (!url || !data?.images?.[0]?.success) {
        throw new Error(imgError || data?.error || "Échec de la génération de l'image");
      }

      onImageGenerated(url);
      toast.success(mode === "edit" ? "Image retouchée !" : "Image générée !");
      onOpenChange(false);
    } catch (err: any) {
      console.error('[ImageRegenerate] erreur:', err);
      toast.error(err?.message || "Erreur lors de la génération");
    } finally {
      clearInterval(timer);
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (loading) return; onOpenChange(v); }}>
      <DialogContent
        className="max-w-lg"
        onPointerDownOutside={(e) => { if (loading) e.preventDefault(); }}
        onEscapeKeyDown={(e) => { if (loading) e.preventDefault(); }}
        onInteractOutside={(e) => { if (loading) e.preventDefault(); }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            {mode === "edit" ? "Retoucher" : "Regénérer"} {contextLabel || "l'image"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Deux modes disponibles : retoucher l'image actuelle ou en générer une nouvelle depuis zéro.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)}>
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="edit" disabled={!canEdit || loading} className="gap-2">
              <Pencil className="w-3.5 h-3.5" /> Retoucher
            </TabsTrigger>
            <TabsTrigger value="fresh" disabled={loading} className="gap-2">
              <RefreshCw className="w-3.5 h-3.5" /> Depuis zéro
            </TabsTrigger>
          </TabsList>

          <TabsContent value="edit" className="space-y-3 mt-4">
            {canEdit && (
              <div className="flex items-center gap-3 p-2 border rounded-lg bg-muted/30">
                <img src={currentImageUrl} alt="actuelle" className="w-16 h-16 object-cover rounded" />
                <p className="text-xs text-muted-foreground">
                  L'IA <strong>conserve cette image</strong> comme base et applique uniquement vos modifications.
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label>Que faut-il modifier ?</Label>
              <Textarea
                value={editPrompt}
                onChange={(e) => setEditPrompt(e.target.value)}
                placeholder="Ex : corrige les fautes d'orthographe visibles dans l'image. Garde la composition, le style et les couleurs identiques."
                rows={4}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                ✏️ Décris uniquement les changements à faire. Le reste de l'image sera préservé.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="fresh" className="space-y-3 mt-4">
            <div className="space-y-2">
              <Label>
                Décrivez la nouvelle image{" "}
                <span className="text-muted-foreground font-normal">(facultatif)</span>
              </Label>
              <Textarea
                value={freshPrompt}
                onChange={(e) => setFreshPrompt(e.target.value)}
                placeholder="Ex : panneaux solaires sur toit de villa aux Antilles, ciel bleu tropical, style photo réaliste lumineux..."
                rows={4}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                {freshPrompt.trim()
                  ? "✓ Votre description sera envoyée telle quelle à l'IA."
                  : "Sans description, l'IA créera une image basée sur le titre + extrait."}
              </p>
            </div>
          </TabsContent>
        </Tabs>

        {loading && (
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <div>
              <p className="text-sm font-medium">Génération en cours... (~20-40s)</p>
              <p className="text-xs text-muted-foreground">{elapsed}s écoulées — ne fermez pas cette fenêtre</p>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Annuler
          </Button>
          <Button type="button" onClick={(e) => handleGenerate(e)} disabled={loading} className="gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
            {mode === "edit" ? "Appliquer" : "Générer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
