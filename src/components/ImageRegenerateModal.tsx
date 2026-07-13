import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles, Wand2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ImageRegenerateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImageGenerated: (url: string) => void;
  context?: string; // section content or article title for context
  contextLabel?: string; // "image à la une" or "image de section"
}

export function ImageRegenerateModal({ open, onOpenChange, onImageGenerated, context, contextLabel }: ImageRegenerateModalProps) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const handleGenerate = async (e?: React.MouseEvent | React.FormEvent) => {
    // Sécurité : empêche toute soumission du formulaire parent (page CreatePost)
    e?.preventDefault?.();
    e?.stopPropagation?.();

    setLoading(true);
    setElapsed(0);
    const timer = setInterval(() => setElapsed(prev => prev + 1), 1000);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) { toast.error("Vous devez être connecté"); return; }

      // Priorité absolue au prompt utilisateur, fallback contextuel sinon
      let finalPrompt = prompt.trim();
      const usedUserPrompt = !!finalPrompt;
      console.log('[ImageRegenerate] prompt utilisateur:', usedUserPrompt ? finalPrompt : '(vide → auto)');

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

      console.log('[ImageRegenerate] appel generate-images avec prompt final:', finalPrompt.slice(0, 200));
      const { data, error } = await supabase.functions.invoke('generate-images', {
        body: { imageDescriptions: [finalPrompt] },
        headers: { Authorization: `Bearer ${token}` }
      });

      if (error) throw error;
      console.log('[ImageRegenerate] réponse:', data);
      const url = data?.images?.[0]?.url;
      const imgError = data?.images?.[0]?.error;
      if (!url || !data?.images?.[0]?.success) {
        throw new Error(imgError || data?.error || "Échec de la génération de l'image");
      }

      onImageGenerated(url);
      toast.success("Image générée avec succès !");
      setPrompt("");
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
            Régénérer {contextLabel || "l'image"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Décrivez l'image à générer, puis lancez la génération sans quitter l'éditeur.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Décrivez l'image souhaitée <span className="text-muted-foreground font-normal">(facultatif)</span></Label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ex: panneaux solaires sur toit de villa aux Antilles, ciel bleu tropical, style photo réaliste lumineux..."
              rows={4}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              {prompt.trim()
                ? "✓ Votre description sera envoyée telle quelle à l'IA."
                : "Sans description, l'IA créera une image basée sur le titre + extrait de l'article."}
            </p>
          </div>

          {loading && (
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <div>
                <p className="text-sm font-medium">Génération en cours... (~20-40s)</p>
                <p className="text-xs text-muted-foreground">{elapsed}s écoulées — ne fermez pas cette fenêtre</p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Annuler
          </Button>
          <Button type="button" onClick={(e) => handleGenerate(e)} disabled={loading} className="gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
            Générer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
