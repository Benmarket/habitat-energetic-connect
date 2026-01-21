import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, RefreshCw, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AIDescriptionButtonProps {
  title: string;
  advertiserName?: string;
  price?: string;
  features?: string[];
  currentDescription: string;
  onContentGenerated: (data: { description: string; features: string[] }) => void;
}

export const AIDescriptionButton = ({
  title,
  advertiserName,
  price,
  features,
  currentDescription,
  onContentGenerated,
}: AIDescriptionButtonProps) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateContent = async (regenerate: boolean) => {
    if (!title.trim()) {
      toast.error("Veuillez d'abord renseigner un titre");
      return;
    }

    setIsGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke("generate-ad-description", {
        body: {
          title,
          advertiserName,
          price,
          features: regenerate ? features : undefined,
          currentDescription: regenerate ? currentDescription : undefined,
          regenerate,
        },
      });

      if (error) {
        console.error("Error generating content:", error);
        throw new Error(error.message || "Erreur lors de la génération");
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      if (data?.description) {
        onContentGenerated({
          description: data.description,
          features: data.features || []
        });
        toast.success(regenerate ? "Nouveau contenu généré !" : "Description et avantages générés !");
      } else {
        throw new Error("Aucun contenu reçu");
      }
    } catch (error) {
      console.error("Error:", error);
      const message = error instanceof Error ? error.message : "Erreur lors de la génération";
      toast.error(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const hasContent = currentDescription.trim().length > 0;

  return (
    <div className="flex gap-2">
      {!hasContent ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => generateContent(false)}
          disabled={isGenerating || !title.trim()}
          className="gap-2"
        >
          {isGenerating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          Générer avec l'IA
        </Button>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => generateContent(true)}
          disabled={isGenerating || !title.trim()}
          className="gap-2"
        >
          {isGenerating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          Régénérer
        </Button>
      )}
    </div>
  );
};
