import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { RichTextEditor } from "@/components/RichTextEditor";
import { MediaLibrary } from "@/components/MediaLibrary";
import { GuideSectionsEditor } from "@/components/GuideSectionsEditor";
import { CreatePostFormData, sectionsToContent } from "@/hooks/useCreatePost";

interface ContentFieldsProps {
  formData: CreatePostFormData;
  setFormData: React.Dispatch<React.SetStateAction<CreatePostFormData>>;
  contentType: string;
}

export function ContentFields({ formData, setFormData, contentType }: ContentFieldsProps) {
  const [mediaLibraryOpen, setMediaLibraryOpen] = useState(false);

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="featured_image">Image à la une</Label>
        <div className="flex gap-2">
          <Input
            id="featured_image"
            value={formData.featured_image}
            onChange={(e) => setFormData({ ...formData, featured_image: e.target.value })}
            placeholder="URL de l'image"
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => setMediaLibraryOpen(true)}
          >
            Bibliothèque
          </Button>
        </div>
        {formData.featured_image && (
          <img 
            src={formData.featured_image} 
            alt="Aperçu" 
            className="w-full h-48 object-cover rounded-md mt-2"
          />
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="excerpt">Extrait</Label>
        <Textarea
          id="excerpt"
          value={formData.excerpt}
          onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
          placeholder="Court résumé de l'article"
          rows={3}
          maxLength={770}
        />
        <p className="text-xs text-muted-foreground">
          {formData.excerpt.length}/770 caractères
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="tldr">En résumé (TL;DR) - Optimisation GEO</Label>
        <Textarea
          id="tldr"
          value={formData.tldr}
          onChange={(e) => setFormData({ ...formData, tldr: e.target.value })}
          placeholder="Résumé court en 3-4 points clés"
          rows={4}
          maxLength={500}
        />
        <p className="text-xs text-muted-foreground">
          Ce résumé sera affiché au début de l'article.
        </p>
      </div>

      {contentType === "guide" ? (
        <div className="space-y-2">
          <GuideSectionsEditor
            sections={formData.guide_sections}
            onChange={(sections) => {
              const combinedContent = sectionsToContent(sections);
              setFormData({ 
                ...formData, 
                guide_sections: sections,
                content: combinedContent
              });
            }}
          />
        </div>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="content">Contenu *</Label>
          <RichTextEditor
            content={formData.content}
            onChange={(content) => setFormData({ ...formData, content })}
          />
          <p className="text-xs text-muted-foreground">
            Utilisez la barre d'outils pour formater votre texte
          </p>
        </div>
      )}

      <MediaLibrary 
        open={mediaLibraryOpen}
        onOpenChange={setMediaLibraryOpen}
        onSelect={(url, alt) => {
          setFormData({ ...formData, featured_image: url });
          setMediaLibraryOpen(false);
        }}
      />
    </>
  );
}
