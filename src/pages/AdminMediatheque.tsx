import { useState, useEffect, useCallback } from "react";
import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
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
import { ArrowLeft, Upload, Loader2, Trash2, Copy, Search, Image as ImageIcon, FileVideo, FileText, File, X, Check, Download, Pencil } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface MediaItem {
  id: string;
  filename: string;
  alt_text: string | null;
  storage_path: string;
  file_size: number | null;
  mime_type: string | null;
  width: number | null;
  height: number | null;
  created_at: string;
}

const formatFileSize = (bytes: number | null) => {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / 1048576).toFixed(1)} Mo`;
};

const getFileIcon = (mimeType: string | null) => {
  if (!mimeType) return File;
  if (mimeType.startsWith("image/")) return ImageIcon;
  if (mimeType.startsWith("video/")) return FileVideo;
  return FileText;
};

const isPreviewable = (mimeType: string | null) =>
  mimeType?.startsWith("image/") || mimeType === "image/gif" || mimeType === "image/svg+xml";

const AdminMediatheque = () => {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteItem, setDeleteItem] = useState<MediaItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [renameItem, setRenameItem] = useState<MediaItem | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [renaming, setRenaming] = useState(false);

  const fetchMedia = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("media")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setMedia(data || []);
    } catch {
      toast.error("Impossible de charger les médias");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      for (const file of Array.from(files)) {
        if (file.size > 10485760) {
          toast.error(`${file.name} dépasse 10 Mo`);
          continue;
        }

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

        await supabase.from("media").insert({
          user_id: user.id,
          filename: file.name,
          storage_path: publicUrl,
          file_size: file.size,
          mime_type: file.type,
        });
      }

      toast.success(`${files.length} fichier(s) uploadé(s)`);
      fetchMedia();
    } catch (error: any) {
      toast.error(error.message || "Erreur d'upload");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    try {
      // Extract storage path from URL
      const url = new URL(deleteItem.storage_path);
      const pathParts = url.pathname.split("/storage/v1/object/public/media/");
      if (pathParts[1]) {
        await supabase.storage.from("media").remove([decodeURIComponent(pathParts[1])]);
      }
      await supabase.from("media").delete().eq("id", deleteItem.id);
      toast.success("Fichier supprimé");
      setMedia(prev => prev.filter(m => m.id !== deleteItem.id));
    } catch {
      toast.error("Erreur lors de la suppression");
    } finally {
      setDeleteItem(null);
    }
  };

  const handleCopyUrl = (item: MediaItem) => {
    navigator.clipboard.writeText(item.storage_path);
    setCopiedId(item.id);
    toast.success("URL copiée !");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownload = async (item: MediaItem) => {
    try {
      const response = await fetch(item.storage_path);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = item.filename || "fichier";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Téléchargement impossible");
    }
  };

  const openRename = (item: MediaItem) => {
    setRenameItem(item);
    setRenameValue(item.filename);
  };

  const handleRename = async () => {
    if (!renameItem) return;
    const newName = renameValue.trim();
    if (!newName) {
      toast.error("Le nom ne peut pas être vide");
      return;
    }
    setRenaming(true);
    try {
      const { error } = await supabase
        .from("media")
        .update({ filename: newName })
        .eq("id", renameItem.id);
      if (error) throw error;
      setMedia(prev => prev.map(m => (m.id === renameItem.id ? { ...m, filename: newName } : m)));
      toast.success("Fichier renommé");
      setRenameItem(null);
    } catch {
      toast.error("Renommage impossible");
    } finally {
      setRenaming(false);
    }
  };

  const filtered = media.filter(m =>
    m.filename.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const imageCount = media.filter(m => m.mime_type?.startsWith("image/")).length;
  const videoCount = media.filter(m => m.mime_type?.startsWith("video/")).length;
  const otherCount = media.length - imageCount - videoCount;
  const totalSize = media.reduce((acc, m) => acc + (m.file_size || 0), 0);

  return (
    <>
      <Helmet>
        <title>Médiathèque | Administration</title>
      </Helmet>
      <Header />
      <main className="min-h-screen bg-background pt-20">
        <div className="container mx-auto px-4 py-6 max-w-7xl">
          <Link
            to="/administration"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à l'administration
          </Link>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Médiathèque</h1>
              <p className="text-muted-foreground text-sm mt-1">
                Tous vos fichiers hébergés — {media.length} fichiers ({formatFileSize(totalSize)})
              </p>
            </div>
            <div className="flex gap-2">
              <label>
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*,.gif,.svg,.webp,.pdf"
                  onChange={handleUpload}
                  className="hidden"
                  disabled={uploading}
                />
                <Button asChild disabled={uploading} className="cursor-pointer">
                  <span>
                    {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                    Uploader
                  </span>
                </Button>
              </label>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
              <ImageIcon className="w-5 h-5 text-blue-600 mx-auto mb-1" />
              <div className="text-lg font-bold text-blue-700">{imageCount}</div>
              <div className="text-xs text-blue-600">Images</div>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-center">
              <FileVideo className="w-5 h-5 text-purple-600 mx-auto mb-1" />
              <div className="text-lg font-bold text-purple-700">{videoCount}</div>
              <div className="text-xs text-purple-600">Vidéos</div>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
              <FileText className="w-5 h-5 text-gray-600 mx-auto mb-1" />
              <div className="text-lg font-bold text-gray-700">{otherCount}</div>
              <div className="text-xs text-gray-600">Autres</div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
              <File className="w-5 h-5 text-green-600 mx-auto mb-1" />
              <div className="text-lg font-bold text-green-700">{formatFileSize(totalSize)}</div>
              <div className="text-xs text-green-600">Total</div>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un fichier..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>

          {/* Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>{searchQuery ? "Aucun résultat" : "Aucun fichier uploadé"}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {filtered.map(item => {
                const IconComp = getFileIcon(item.mime_type);
                return (
                  <Card key={item.id} className="group overflow-hidden hover:shadow-lg transition-shadow">
                    {/* Preview */}
                    <div className="aspect-square bg-muted relative overflow-hidden">
                      {isPreviewable(item.mime_type) ? (
                        <img
                          src={item.storage_path}
                          alt={item.alt_text || item.filename}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-4">
                          <IconComp className="w-10 h-10 text-muted-foreground/40" />
                          <Badge variant="secondary" className="text-[10px]">
                            {item.mime_type?.split("/")[1]?.toUpperCase() || "FICHIER"}
                          </Badge>
                        </div>
                      )}

                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-wrap items-center justify-center gap-2 p-2">
                        <Button
                          size="icon"
                          variant="secondary"
                          className="h-8 w-8"
                          title="Copier l'URL"
                          onClick={() => handleCopyUrl(item)}
                        >
                          {copiedId === item.id ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                        </Button>
                        <Button
                          size="icon"
                          variant="secondary"
                          className="h-8 w-8"
                          title="Télécharger"
                          onClick={() => handleDownload(item)}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="secondary"
                          className="h-8 w-8"
                          title="Renommer"
                          onClick={() => openRename(item)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="destructive"
                          className="h-8 w-8"
                          title="Supprimer"
                          onClick={() => setDeleteItem(item)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-2">
                      <p className="text-xs font-medium truncate" title={item.filename}>
                        {item.filename}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {formatFileSize(item.file_size)} • {new Date(item.created_at).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteItem} onOpenChange={() => setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce fichier ?</AlertDialogTitle>
            <AlertDialogDescription>
              Le fichier « {deleteItem?.filename} » sera définitivement supprimé du stockage.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default AdminMediatheque;
