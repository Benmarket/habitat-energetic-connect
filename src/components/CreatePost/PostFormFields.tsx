import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { Category, Tag, CreatePostFormData } from "@/hooks/useCreatePost";

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
  return (
    <>
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
    </>
  );
}
