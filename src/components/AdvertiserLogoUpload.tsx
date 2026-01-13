import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Upload, X, Loader2, Image as ImageIcon } from "lucide-react";

interface AdvertiserLogoUploadProps {
  currentLogo: string;
  onLogoChange: (url: string) => void;
}

const AdvertiserLogoUpload = ({ currentLogo, onLogoChange }: AdvertiserLogoUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validation
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      toast.error("Format non supporté. Utilisez JPG, PNG, WEBP ou GIF.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("L'image ne doit pas dépasser 2 Mo");
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `advertiser-logos/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('media')
        .getPublicUrl(fileName);

      onLogoChange(urlData.publicUrl);
      toast.success("Logo uploadé avec succès");
    } catch (error) {
      console.error("Error uploading logo:", error);
      toast.error("Erreur lors de l'upload du logo");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = () => {
    onLogoChange('');
  };

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleUpload}
        className="hidden"
      />

      {currentLogo ? (
        <div className="relative inline-block">
          <div className="w-24 h-24 rounded-lg border overflow-hidden bg-muted">
            <img 
              src={currentLogo} 
              alt="Logo" 
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute -top-2 -right-2 flex gap-1">
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="h-6 w-6 rounded-full shadow-md"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Upload className="w-3 h-3" />
              )}
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="h-6 w-6 rounded-full shadow-md"
              onClick={handleRemove}
              disabled={uploading}
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-24 h-24 rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-primary"
        >
          {uploading ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <>
              <ImageIcon className="w-6 h-6" />
              <span className="text-xs">Ajouter</span>
            </>
          )}
        </button>
      )}
      
      <p className="text-xs text-muted-foreground">
        JPG, PNG, WEBP ou GIF (max. 2 Mo)
      </p>
    </div>
  );
};

export default AdvertiserLogoUpload;
