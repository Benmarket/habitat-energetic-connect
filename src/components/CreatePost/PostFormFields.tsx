import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { X, MapPin, Sparkles, FileText, CalendarIcon } from "lucide-react";
import { Category, Tag, CreatePostFormData } from "@/hooks/useCreatePost";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

function KeywordsField({ formData, setFormData, onGenerateArticle, onOpenAiInstructions, generatingArticle, contentType }: {
  formData: CreatePostFormData;
  setFormData: React.Dispatch<React.SetStateAction<CreatePostFormData>>;
  onGenerateArticle: () => void;
  onOpenAiInstructions: () => void;
  generatingArticle: boolean;
  contentType: string;
}) {
  const generateButtonLabel = contentType === 'guide' ? 'Générer le guide (IA)' : 'Générer l\'article (IA)';
  const [keywordInput, setKeywordInput] = useState("");
  return (
    <div className="relative overflow-hidden rounded-xl border border-violet-300/50 bg-gradient-to-br from-violet-500/10 via-fuchsia-500/10 to-indigo-500/10 p-5 shadow-sm space-y-3">
      {/* Decorative glow */}
      <div className="pointer-events-none absolute -top-12 -right-12 h-40 w-40 rounded-full bg-fuchsia-400/20 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-16 -left-10 h-44 w-44 rounded-full bg-violet-500/20 blur-3xl" aria-hidden="true" />

      <div className="relative flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-md">
            <Sparkles className="w-4 h-4" />
          </span>
          <Label htmlFor="focus_keywords" className="font-semibold text-foreground">
            Mots-clés ciblés (SEO, IA & GEO)
          </Label>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onOpenAiInstructions} className="gap-2 bg-background/80 backdrop-blur">
            <FileText className="w-4 h-4" /> Instruction article IA
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={onGenerateArticle}
            disabled={generatingArticle || formData.focus_keywords.length === 0}
            className="gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-md hover:opacity-90 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" /> {generateButtonLabel}
          </Button>
        </div>
      </div>
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
        className="relative bg-background/80 backdrop-blur"
      />
      {formData.focus_keywords.length > 0 && (
        <div className="relative flex flex-wrap gap-2">
          {formData.focus_keywords.map((keyword, index) => (
            <Badge key={index} variant="secondary" className="gap-1 pr-1 bg-background/80">
              {keyword}
              <button type="button" onClick={() => setFormData({ ...formData, focus_keywords: formData.focus_keywords.filter((_, i) => i !== index) })} className="ml-1 hover:bg-muted rounded-full p-0.5">
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
      <p className="relative text-xs text-muted-foreground">
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
  onGenerateArticle: () => void;
  onOpenAiInstructions: () => void;
  generatingArticle: boolean;
  contentType: string;
}

export function PostFormFields({
  formData,
  setFormData,
  categories,
  tags,
  onTitleChange,
  onGenerateArticle,
  onOpenAiInstructions,
  generatingArticle,
  contentType,
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
      <KeywordsField formData={formData} setFormData={setFormData}
        onGenerateArticle={onGenerateArticle} onOpenAiInstructions={onOpenAiInstructions}
        generatingArticle={generatingArticle} contentType={contentType} />

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

      {/* Date & heure de publication */}
      <div className="space-y-2">
        <Label>Date et heure de publication</Label>
        <div className="flex gap-2 items-center">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className={cn(
                  "w-[220px] justify-start text-left font-normal",
                  !formData.published_at && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.published_at
                  ? format(new Date(formData.published_at), "dd MMM yyyy", { locale: fr })
                  : "Date auto (publication)"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={formData.published_at ? new Date(formData.published_at) : undefined}
                onSelect={(date) => {
                  if (date) {
                    const existing = formData.published_at ? new Date(formData.published_at) : new Date();
                    date.setHours(existing.getHours(), existing.getMinutes());
                    setFormData({ ...formData, published_at: date.toISOString() });
                  }
                }}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
          <Input
            type="time"
            className="w-[120px]"
            value={formData.published_at
              ? format(new Date(formData.published_at), "HH:mm")
              : ""}
            onChange={(e) => {
              const [h, m] = e.target.value.split(":").map(Number);
              const d = formData.published_at ? new Date(formData.published_at) : new Date();
              d.setHours(h, m, 0, 0);
              setFormData({ ...formData, published_at: d.toISOString() });
            }}
          />
          {formData.published_at && (
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8"
              onClick={() => setFormData({ ...formData, published_at: "" })}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Laissez vide pour utiliser la date de première publication automatique.
        </p>
      </div>

      <div className="space-y-2">
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
