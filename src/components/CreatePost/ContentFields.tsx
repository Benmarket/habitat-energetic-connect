import { useState, useRef } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { RichTextEditor } from "@/components/RichTextEditor";
import { MediaLibrary } from "@/components/MediaLibrary";
import { GuideSectionsEditor } from "@/components/GuideSectionsEditor";
import { ImageRegenerateModal } from "@/components/ImageRegenerateModal";
import { CreatePostFormData, sectionsToContent } from "@/hooks/useCreatePost";
import { RefreshCw, Upload, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ContentFieldsProps {
  formData: CreatePostFormData;
  setFormData: React.Dispatch<React.SetStateAction<CreatePostFormData>>;
  contentType: string;
}

export function ContentFields({ formData, setFormData, contentType }: ContentFieldsProps) {
  const [mediaLibraryOpen, setMediaLibraryOpen] = useState(false);
  const [regenModalOpen, setRegenModalOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;
      if (!userId) { toast.error("Non connecté"); return; }

      const ext = file.name.split('.').pop();
      const filename = `featured-${Date.now()}.${ext}`;
      const storagePath = `${userId}/${filename}`;

      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(storagePath, file, { contentType: file.type, upsert: false });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(storagePath);

      await supabase.from('media').insert({
        user_id: userId,
        filename,
        storage_path: publicUrl,
        alt_text: file.name,
        mime_type: file.type,
        file_size: file.size,
      });

      setFormData(prev => ({ ...prev, featured_image: publicUrl }));
      toast.success("Image uploadée !");
    } catch (err: any) {
      toast.error(err.message || "Erreur upload");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

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
          <Button type="button" variant="outline" onClick={() => setMediaLibraryOpen(true)}>
            Bibliothèque
          </Button>
        </div>

        {formData.featured_image && (
          <div
            className="relative group mt-2 rounded-md overflow-hidden cursor-pointer"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <img
              src={formData.featured_image}
              alt="Aperçu"
              className={`w-full h-48 object-cover transition-all duration-300 ${isHovered ? 'brightness-50 scale-[1.02]' : ''}`}
            />
            {isHovered && (
              <div className="absolute inset-0 flex items-center justify-center gap-3 animate-in fade-in duration-200">
                <Button
                  type="button"
                  size="sm"
                  className="gap-2 bg-primary/90 hover:bg-primary shadow-lg"
                  onClick={() => setRegenModalOpen(true)}
                >
                  <RefreshCw className="w-4 h-4" />
                  Régénérer
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="gap-2 shadow-lg"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  <Upload className="w-4 h-4" />
                  {uploading ? "Upload..." : "Uploader"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="gap-2 shadow-lg"
                  onClick={() => setMediaLibraryOpen(true)}
                >
                  <ImageIcon className="w-4 h-4" />
                  Bibliothèque
                </Button>
              </div>
            )}
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileUpload}
        />
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

      <ImageRegenerateModal
        open={regenModalOpen}
        onOpenChange={setRegenModalOpen}
        onImageGenerated={(url) => setFormData(prev => ({ ...prev, featured_image: url }))}
        context={`${formData.title}\n${formData.excerpt}`}
        contextLabel="l'image à la une"
      />
    </>
  );
}
