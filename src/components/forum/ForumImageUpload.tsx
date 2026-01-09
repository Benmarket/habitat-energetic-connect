import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ImagePlus, X, Loader2 } from "lucide-react";

interface ForumImageUploadProps {
  userId: string;
  onImageUploaded: (imageUrl: string) => void;
  images: string[];
  onRemoveImage: (imageUrl: string) => void;
  disabled?: boolean;
}

const ForumImageUpload = ({
  userId,
  onImageUploaded,
  images,
  onRemoveImage,
  disabled = false,
}: ForumImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Type de fichier invalide",
        description: "Veuillez sélectionner une image (JPG, PNG, GIF, WebP)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Fichier trop volumineux",
        description: "La taille maximum est de 5 Mo",
        variant: "destructive",
      });
      return;
    }

    // Max 3 images per post
    if (images.length >= 3) {
      toast({
        title: "Limite atteinte",
        description: "Vous pouvez ajouter maximum 3 images par message",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("forum-images")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("forum-images")
        .getPublicUrl(fileName);

      const publicUrl = urlData.publicUrl;

      // Save metadata to forum_images table
      const { error: metaError } = await supabase.from("forum_images").insert({
        user_id: userId,
        storage_path: fileName,
        filename: file.name,
        mime_type: file.type,
        file_size: file.size,
        ip_address: null, // Will be set by edge function if needed
        user_agent: navigator.userAgent,
      });

      // Silent fail for metadata - image is still uploaded

      onImageUploaded(publicUrl);

      toast({
        title: "Image ajoutée",
        description: "L'image a été téléchargée avec succès",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de télécharger l'image",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="space-y-3">
      {/* Image previews */}
      {images.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {images.map((imageUrl, index) => (
            <div
              key={index}
              className="relative group rounded-lg overflow-hidden border border-border"
            >
              <img
                src={imageUrl}
                alt={`Image ${index + 1}`}
                className="w-24 h-24 object-cover"
              />
              <button
                type="button"
                onClick={() => onRemoveImage(imageUrl)}
                className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                disabled={disabled}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload button */}
      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleUpload}
          className="hidden"
          disabled={disabled || uploading}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploading || images.length >= 3}
          className="gap-2"
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Envoi...
            </>
          ) : (
            <>
              <ImagePlus className="w-4 h-4" />
              Ajouter une image
            </>
          )}
        </Button>
        <span className="text-xs text-muted-foreground">
          {images.length}/3 images (max 5 Mo chacune)
        </span>
      </div>
    </div>
  );
};

export default ForumImageUpload;