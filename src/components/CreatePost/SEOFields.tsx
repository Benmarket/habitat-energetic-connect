// SEOFields component v3
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Sparkles, FileText } from "lucide-react";
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
  const generateButtonLabel = contentType === 'guide' ? 'Générer le guide (IA)' : 'Générer l\'article (IA)';

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

      <div className="flex items-center justify-end gap-2 flex-wrap">
        <Button type="button" variant="outline" size="sm" onClick={onOpenAiInstructions} className="gap-2">
          <FileText className="w-4 h-4" /> Instruction article IA
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onGenerateArticle}
          disabled={generatingArticle || formData.focus_keywords.length === 0} className="gap-2">
          <Sparkles className="w-4 h-4" /> {generateButtonLabel}
        </Button>
      </div>
    </>
  );
}
