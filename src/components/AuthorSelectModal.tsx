import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Plus, User } from "lucide-react";
import { MediaLibrary } from "@/components/MediaLibrary";

interface Author {
  id: string;
  name: string;
  bio: string | null;
  avatar_url: string | null;
  job_title: string | null;
}

interface AuthorSelectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAuthorCreated: (author: Author) => void;
}

export const AuthorSelectModal = ({ open, onOpenChange, onAuthorCreated }: AuthorSelectModalProps) => {
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [mediaLibraryOpen, setMediaLibraryOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error("Le nom de l'auteur est requis");
      return;
    }

    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from("authors")
        .insert({
          name: name.trim(),
          bio: bio.trim() || null,
          avatar_url: avatarUrl.trim() || null,
          created_by: userData.user?.id
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Auteur créé avec succès");
      onAuthorCreated(data);
      onOpenChange(false);
      
      // Reset form
      setName("");
      setBio("");
      setAvatarUrl("");
    } catch (error: any) {
      console.error("Error creating author:", error);
      toast.error("Erreur lors de la création de l'auteur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Créer un nouvel auteur
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="author-name">Nom de l'auteur *</Label>
              <Input
                id="author-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Jean Dupont, Rédaction Prime Énergies..."
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="author-bio">Bio / Expertise (optionnel)</Label>
              <Textarea
                id="author-bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Expert en énergies renouvelables..."
                rows={3}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground">
                La bio améliore le SEO et donne de la crédibilité à l'article.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="author-avatar">Photo (optionnel)</Label>
              <div className="flex gap-2">
                <Input
                  id="author-avatar"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="URL de la photo"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setMediaLibraryOpen(true)}
                >
                  Choisir
                </Button>
              </div>
              {avatarUrl && (
                <div className="flex items-center gap-3 mt-2">
                  <img
                    src={avatarUrl}
                    alt="Aperçu avatar"
                    className="w-12 h-12 rounded-full object-cover border"
                  />
                  <span className="text-sm text-muted-foreground">Aperçu</span>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Créer l'auteur
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <MediaLibrary
        open={mediaLibraryOpen}
        onOpenChange={setMediaLibraryOpen}
        onSelect={(url) => {
          setAvatarUrl(url);
          setMediaLibraryOpen(false);
        }}
      />
    </>
  );
};
