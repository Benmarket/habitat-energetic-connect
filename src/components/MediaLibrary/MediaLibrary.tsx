import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, X, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Media {
  id: string;
  filename: string;
  alt_text: string | null;
  storage_path: string;
  file_size: number | null;
  mime_type: string | null;
  created_at: string;
}

interface MediaLibraryProps {
  onSelect: (url: string, altText: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MediaLibrary({ onSelect, open, onOpenChange }: MediaLibraryProps) {
  const [media, setMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editingMedia, setEditingMedia] = useState<Media | null>(null);
  const [deleteMedia, setDeleteMedia] = useState<Media | null>(null);
  const [editFilename, setEditFilename] = useState("");
  const [editAltText, setEditAltText] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchMedia();
    }
  }, [open]);

  const fetchMedia = async () => {
    try {
      const { data, error } = await supabase
        .from("media")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMedia(data || []);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les médias",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5242880) {
      toast({
        title: "Fichier trop volumineux",
        description: "La taille maximale est de 5MB",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("media")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("media")
        .getPublicUrl(filePath);

      const { error: dbError } = await supabase.from("media").insert({
        user_id: user.id,
        filename: file.name,
        storage_path: publicUrl,
        file_size: file.size,
        mime_type: file.type,
      });

      if (dbError) throw dbError;

      toast({
        title: "Image uploadée",
        description: "L'image a été ajoutée à votre bibliothèque",
      });

      fetchMedia();
    } catch (error: any) {
      toast({
        title: "Erreur d'upload",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const handleEdit = async () => {
    if (!editingMedia) return;

    try {
      const { error } = await supabase
        .from("media")
        .update({
          filename: editFilename,
          alt_text: editAltText || null,
        })
        .eq("id", editingMedia.id);

      if (error) throw error;

      toast({
        title: "Média mis à jour",
        description: "Les informations ont été sauvegardées",
      });

      setEditingMedia(null);
      fetchMedia();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteMedia) return;

    try {
      const { error } = await supabase
        .from("media")
        .delete()
        .eq("id", deleteMedia.id);

      if (error) throw error;

      toast({
        title: "Média supprimé",
        description: "Le média a été retiré de votre bibliothèque",
      });

      setDeleteMedia(null);
      fetchMedia();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (item: Media) => {
    setEditingMedia(item);
    setEditFilename(item.filename);
    setEditAltText(item.alt_text || "");
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Bibliothèque de médias</DialogTitle>
          </DialogHeader>

          <div className="mb-4">
            <Label htmlFor="file-upload" className="cursor-pointer">
              <div className="flex items-center justify-center border-2 border-dashed border-border rounded-lg p-6 hover:border-primary transition-colors">
                {uploading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <>
                    <Upload className="h-6 w-6 mr-2" />
                    <span>Cliquez pour uploader une image</span>
                  </>
                )}
              </div>
            </Label>
            <Input
              id="file-upload"
              type="file"
              accept="image/*"
              onChange={handleUpload}
              className="hidden"
              disabled={uploading}
            />
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : media.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Aucune image dans votre bibliothèque
              </p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {media.map((item) => (
                  <div
                    key={item.id}
                    className="group relative border rounded-lg overflow-hidden hover:border-primary transition-colors cursor-pointer"
                    onClick={() => onSelect(item.storage_path, item.alt_text || item.filename)}
                  >
                    <img
                      src={item.storage_path}
                      alt={item.alt_text || item.filename}
                      className="w-full h-40 object-cover"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditDialog(item);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteMedia(item);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="p-2 bg-background">
                      <p className="text-xs truncate">{item.filename}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingMedia} onOpenChange={(open) => !open && setEditingMedia(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le média</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-filename">Nom du fichier (SEO)</Label>
              <Input
                id="edit-filename"
                value={editFilename}
                onChange={(e) => setEditFilename(e.target.value)}
                placeholder="mon-image-optimisee.jpg"
              />
            </div>
            <div>
              <Label htmlFor="edit-alt">Texte alternatif (SEO)</Label>
              <Input
                id="edit-alt"
                value={editAltText}
                onChange={(e) => setEditAltText(e.target.value)}
                placeholder="Description de l'image pour le SEO"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingMedia(null)}>
                Annuler
              </Button>
              <Button onClick={handleEdit}>Enregistrer</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteMedia} onOpenChange={(open) => !open && setDeleteMedia(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer ce média ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
