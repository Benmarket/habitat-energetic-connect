import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, Plus, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Author, CreatePostFormData } from "@/hooks/useCreatePost";

interface AuthorSectionProps {
  formData: CreatePostFormData;
  setFormData: React.Dispatch<React.SetStateAction<CreatePostFormData>>;
  userProfile: { first_name: string | null; last_name: string | null } | null;
  availableAuthors: Author[];
  setAvailableAuthors: React.Dispatch<React.SetStateAction<Author[]>>;
  onOpenAuthorModal: () => void;
}

export function AuthorSection({
  formData,
  setFormData,
  userProfile,
  availableAuthors,
  setAvailableAuthors,
  onOpenAuthorModal,
}: AuthorSectionProps) {
  const [registeringCustomAuthor, setRegisteringCustomAuthor] = useState(false);

  const handleCreateAuthor = async () => {
    if (!formData.custom_author_name.trim()) return;
    
    setRegisteringCustomAuthor(true);
    try {
      const { data, error } = await supabase
        .from("authors")
        .insert({ name: formData.custom_author_name.trim() })
        .select()
        .single();
      
      if (error) {
        if (error.code === '23505') {
          toast.error("Cet auteur existe déjà");
        } else {
          throw error;
        }
      } else {
        setAvailableAuthors((prev) => [...prev, data]);
        setFormData((prev) => ({
          ...prev,
          author_display_type: "author",
          display_author_id: data.id,
          custom_author_name: "",
        }));
        toast.success(`Auteur "${data.name}" créé et sélectionné`);
      }
    } catch (error) {
      console.error("Error registering author:", error);
      toast.error("Erreur lors de l'enregistrement de l'auteur");
    } finally {
      setRegisteringCustomAuthor(false);
    }
  };

  return (
    <div className="space-y-4 border rounded-md p-4 bg-muted/30">
      <div className="flex items-center space-x-2">
        <Checkbox
          id="hide_author"
          checked={formData.hide_author}
          onCheckedChange={(checked) => {
            setFormData({
              ...formData,
              hide_author: !!checked,
              author_display_type: checked ? "none" : "user",
            });
          }}
        />
        <Label htmlFor="hide_author" className="cursor-pointer">
          Masquer l'auteur de l'article
        </Label>
      </div>

      {!formData.hide_author && (
        <div className="space-y-4 pt-2">
          <Label>Comment afficher l'auteur ?</Label>
          <RadioGroup
            value={formData.author_display_type}
            onValueChange={(value: "user" | "custom" | "author") =>
              setFormData({ ...formData, author_display_type: value })
            }
            className="space-y-3"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="user" id="author_user" />
              <Label htmlFor="author_user" className="cursor-pointer font-normal">
                Mon nom ({userProfile?.first_name || ""} {userProfile?.last_name || ""})
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="custom" id="author_custom" />
              <Label htmlFor="author_custom" className="cursor-pointer font-normal">
                Saisir un nom personnalisé
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="author" id="author_registered" />
              <Label htmlFor="author_registered" className="cursor-pointer font-normal">
                Choisir un auteur enregistré
              </Label>
            </div>
          </RadioGroup>

          {formData.author_display_type === "custom" && (
            <div className="pl-6 space-y-2">
              <div className="flex gap-2">
                <Input
                  value={formData.custom_author_name}
                  onChange={(e) => {
                    setFormData({ ...formData, custom_author_name: e.target.value });
                  }}
                  placeholder="Nom de l'auteur à créer"
                  maxLength={100}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!formData.custom_author_name.trim() || registeringCustomAuthor}
                  onClick={handleCreateAuthor}
                  className="whitespace-nowrap"
                >
                  {registeringCustomAuthor ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Créer l'auteur"
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Saisissez le nom puis cliquez sur "Créer l'auteur" pour l'enregistrer
              </p>
            </div>
          )}

          {formData.author_display_type === "author" && (
            <div className="pl-6 space-y-2">
              <div className="flex gap-2">
                <Select
                  value={formData.display_author_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, display_author_id: value })
                  }
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Sélectionner un auteur" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableAuthors.map((author) => (
                      <SelectItem key={author.id} value={author.id}>
                        <div className="flex items-center gap-2">
                          {author.avatar_url ? (
                            <img
                              src={author.avatar_url}
                              alt={author.name}
                              className="w-5 h-5 rounded-full object-cover"
                            />
                          ) : (
                            <User className="w-5 h-5 text-muted-foreground" />
                          )}
                          <span>{author.name}</span>
                          {author.job_title && (
                            <span className="text-xs text-muted-foreground">— {author.job_title}</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={onOpenAuthorModal}
                  title="Créer un nouvel auteur"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {availableAuthors.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Aucun auteur enregistré. Créez-en un avec le bouton +
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
