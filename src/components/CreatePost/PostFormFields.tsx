import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, MapPin } from "lucide-react";
import { Category, Tag, CreatePostFormData } from "@/hooks/useCreatePost";
import { supabase } from "@/integrations/supabase/client";

function KeywordsField({ formData, setFormData }: { formData: CreatePostFormData; setFormData: React.Dispatch<React.SetStateAction<CreatePostFormData>> }) {
  const [keywordInput, setKeywordInput] = useState("");
  return (
    <div className="space-y-2">
      <Label htmlFor="focus_keywords">Mots-clés ciblés (SEO, IA & GEO)</Label>
      <Input
        id="focus_keywords"
        value={keywordInput}
        onChange={(e) => setKeywordInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            const keyword = keywordInput.trim();
            if (keyword && !formData.focus_keywords.includes(keyword)) {
              setFormData({ ...formData, focus_keywords: [...formData.focus_keywords, keyword] });
              setKeywordInput("");
            }
          }
        }}
        placeholder="Tapez un mot-clé et appuyez sur Entrée"
      />
      {formData.focus_keywords.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {formData.focus_keywords.map((keyword, index) => (
            <Badge key={index} variant="secondary" className="gap-1 pr-1">
              {keyword}
              <button type="button" onClick={() => setFormData({ ...formData, focus_keywords: formData.focus_keywords.filter((_, i) => i !== index) })} className="ml-1 hover:bg-muted rounded-full p-0.5">
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        Ces mots-clés aident votre article à mieux ranker sur Google, Bing et les IA comme ChatGPT.
      </p>
    </div>
  );
}

interface PostFormFieldsProps {
  formData: CreatePostFormData;
  setFormData: React.Dispatch<React.SetStateAction<CreatePostFormData>>;
  categories: Category[];
  tags: Tag[];
  onTitleChange: (title: string) => void;
}

export function PostFormFields({
  formData,
  setFormData,
  categories,
  tags,
  onTitleChange,
}: PostFormFieldsProps) {
  const [regions, setRegions] = useState<Array<{code: string; name: string}>>([]);

  useEffect(() => {
    supabase.from('regions').select('code, name').eq('is_active', true).order('display_order')
      .then(({ data }) => { if (data) setRegions(data); });
  }, []);

  const toggleRegion = (code: string) => {
    const current = formData.target_regions;
    if (current.includes(code)) {
      if (current.length === 1) return;
      setFormData({ ...formData, target_regions: current.filter(r => r !== code) });
    } else {
      setFormData({ ...formData, target_regions: [...current, code] });
    }
  };

  return (
    <>
      <KeywordsField formData={formData} setFormData={setFormData} />

      <div className="space-y-2">
        <Label htmlFor="title">Titre *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Titre de l'article"
          maxLength={200}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="slug">Slug (URL) *</Label>
        <Input
          id="slug"
          value={formData.slug}
          onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
          placeholder="slug-de-larticle"
          maxLength={200}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Catégorie *</Label>
        <Select
          value={formData.category_id}
          onValueChange={(value) => setFormData({ ...formData, category_id: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Sélectionner une catégorie" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Étiquettes * (sélectionnez au moins une)</Label>
        <div className="border rounded-md p-4 space-y-3 max-h-48 overflow-y-auto bg-background">
          {tags.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune étiquette disponible</p>
          ) : (
            tags.map((tag) => (
              <div key={tag.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`tag-${tag.id}`}
                  checked={formData.tag_ids.includes(tag.id)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setFormData({
                        ...formData,
                        tag_ids: [...formData.tag_ids, tag.id],
                      });
                    } else {
                      setFormData({
                        ...formData,
                        tag_ids: formData.tag_ids.filter((id) => id !== tag.id),
                      });
                    }
                  }}
                />
                <Label
                  htmlFor={`tag-${tag.id}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {tag.name}
                </Label>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Region targeting */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2">
            <MapPin className="w-4 h-4" /> Régions cibles
          </Label>
          <Button type="button" variant="ghost" size="sm" className="text-xs h-7"
            onClick={() => setFormData({ ...formData, target_regions: regions.map(r => r.code) })}>
            Toutes
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {regions.map(r => (
            <label key={r.code} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border cursor-pointer text-sm transition-colors ${
              formData.target_regions.includes(r.code) ? 'border-primary bg-primary/10 font-medium' : 'border-border hover:border-primary/30'
            }`}>
              <Checkbox checked={formData.target_regions.includes(r.code)} onCheckedChange={() => toggleRegion(r.code)} />
              {r.name}
            </label>
          ))}
        </div>
      </div>
    </>
  );
}
