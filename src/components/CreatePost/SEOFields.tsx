// SEOFields component v4
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CreatePostFormData } from "@/hooks/useCreatePost";

interface SEOFieldsProps {
  formData: CreatePostFormData;
  setFormData: React.Dispatch<React.SetStateAction<CreatePostFormData>>;
}

export function SEOFields({ formData, setFormData }: SEOFieldsProps) {
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
    </>
  );
}
