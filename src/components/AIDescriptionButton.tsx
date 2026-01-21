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
  onDescriptionGenerated: (description: string) => void;
}

export const AIDescriptionButton = ({
  title,
  advertiserName,
  price,
  features,
  currentDescription,
  onDescriptionGenerated,
}: AIDescriptionButtonProps) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateDescription = async (regenerate: boolean) => {
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
          features,
          currentDescription: regenerate ? currentDescription : undefined,
          regenerate,
        },
      });

      if (error) {
        console.error("Error generating description:", error);
        throw new Error(error.message || "Erreur lors de la génération");
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      if (data?.description) {
        onDescriptionGenerated(data.description);
        toast.success(regenerate ? "Nouvelle description générée !" : "Description générée avec succès !");
      } else {
        throw new Error("Aucune description reçue");
      }
    } catch (error) {
      console.error("Error:", error);
      const message = error instanceof Error ? error.message : "Erreur lors de la génération";
      toast.error(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const hasDescription = currentDescription.trim().length > 0;

  return (
    <div className="flex gap-2">
      {!hasDescription ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => generateDescription(false)}
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
          onClick={() => generateDescription(true)}
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
