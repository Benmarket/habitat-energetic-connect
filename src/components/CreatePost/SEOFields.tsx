// SEOFields component v2
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, Sparkles, FileText } from "lucide-react";
import { CreatePostFormData } from "@/hooks/useCreatePost";

interface SEOFieldsProps {
  formData: CreatePostFormData;
  setFormData: React.Dispatch<React.SetStateAction<CreatePostFormData>>;
  onGenerateArticle: () => void;
  onOpenAiInstructions: () => void;
  generatingArticle: boolean;
  contentType: string;
}

export function SEOFields({
  formData,
  setFormData,
  onGenerateArticle,
  onOpenAiInstructions,
  generatingArticle,
  contentType,
}: SEOFieldsProps) {
  const generateButtonLabel = contentType === 'guide' ? 'Générer le guide' : 'Générer l\'article';
  const [keywordInput, setKeywordInput] = useState("");

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="meta_title">Titre SEO (max 60 caractères)</Label>
        <Input
          id="meta_title"
          value={formData.meta_title}
          onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
          placeholder="Titre pour les moteurs de recherche"
          maxLength={60}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="meta_description">Description SEO (max 160 caractères)</Label>
        <Textarea
          id="meta_description"
          value={formData.meta_description}
          onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
          placeholder="Description pour les moteurs de recherche"
          rows={2}
          maxLength={160}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <Label htmlFor="focus_keywords">Mots-clés ciblés (SEO, IA & GEO)</Label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onOpenAiInstructions}
              className="gap-2"
            >
              <FileText className="w-4 h-4" />
              Instruction article IA
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onGenerateArticle}
              disabled={generatingArticle || formData.focus_keywords.length === 0}
              className="gap-2"
            >
              <Sparkles className="w-4 h-4" />
              {generateButtonLabel}
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          <Input
            id="focus_keywords"
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                const keyword = keywordInput.trim();
                if (keyword && !formData.focus_keywords.includes(keyword)) {
                  setFormData({
                    ...formData,
                    focus_keywords: [...formData.focus_keywords, keyword],
                  });
                  setKeywordInput("");
                }
              }
            }}
            placeholder="Tapez un mot-clé et appuyez sur Entrée"
          />
          {formData.focus_keywords.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.focus_keywords.map((keyword, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="gap-1 pr-1"
                >
                  {keyword}
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        focus_keywords: formData.focus_keywords.filter((_, i) => i !== index),
                      });
                    }}
                    className="ml-1 hover:bg-muted rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Ces mots-clés aident votre article à mieux ranker sur Google, Bing et les IA comme ChatGPT.
        </p>
      </div>
    </>
  );
}
