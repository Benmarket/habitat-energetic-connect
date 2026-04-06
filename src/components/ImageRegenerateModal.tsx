import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
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

  const handleGenerate = async () => {
    setLoading(true);
    setElapsed(0);
    const timer = setInterval(() => setElapsed(prev => prev + 1), 1000);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) { toast.error("Vous devez être connecté"); return; }

      // Build a smart prompt: user prompt if provided, otherwise auto-generate from context
      let finalPrompt = prompt.trim();
      if (!finalPrompt && context) {
        // Use AI to craft a viral image prompt from context
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

      const { data, error } = await supabase.functions.invoke('generate-images', {
        body: { imageDescriptions: [finalPrompt] },
        headers: { Authorization: `Bearer ${token}` }
      });

      if (error) throw error;
      const url = data?.images?.[0]?.url;
      if (!url || !data?.images?.[0]?.success) {
        throw new Error("Échec de la génération de l'image");
      }

      onImageGenerated(url);
      toast.success("Image générée avec succès !");
      setPrompt("");
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de la génération");
    } finally {
      clearInterval(timer);
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Régénérer {contextLabel || "l'image"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Décrivez l'image souhaitée <span className="text-muted-foreground font-normal">(facultatif)</span></Label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Laissez vide pour générer automatiquement une image virale liée au contenu de l'article..."
              rows={4}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              {prompt.trim()
                ? "L'image sera générée selon votre description."
                : "Sans description, l'IA créera une image percutante basée sur le contenu."}
            </p>
          </div>

          {loading && (
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <div>
                <p className="text-sm font-medium">Génération en cours...</p>
                <p className="text-xs text-muted-foreground">{elapsed}s écoulées</p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Annuler
          </Button>
          <Button onClick={handleGenerate} disabled={loading} className="gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
            Générer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
