import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { CreatePostFormData } from "@/hooks/useCreatePost";

interface GuideOptionsProps {
  formData: CreatePostFormData;
  setFormData: React.Dispatch<React.SetStateAction<CreatePostFormData>>;
}

export function GuideOptions({ formData, setFormData }: GuideOptionsProps) {
  return (
    <div className="space-y-4 p-4 border-2 border-primary/20 rounded-lg bg-primary/5">
      <h3 className="font-semibold text-primary flex items-center gap-2">
        📚 Options du guide
      </h3>
      
      <div className="space-y-2">
        <Label htmlFor="guide_template">Template du guide</Label>
        <Select
          value={formData.guide_template || undefined}
          onValueChange={(value: "classique" | "premium" | "expert" | "epure" | "vibrant" | "sombre") => 
            setFormData({ ...formData, guide_template: value })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Choisir un template" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="classique">
              <div className="flex flex-col">
                <span className="font-medium">Classique</span>
                <span className="text-xs text-muted-foreground">Simple et épuré, avec sidebar TOC</span>
              </div>
            </SelectItem>
            <SelectItem value="premium">
              <div className="flex flex-col">
                <span className="font-medium">⭐ Premium</span>
                <span className="text-xs text-muted-foreground">Hero imposant, 2 colonnes, badge doré</span>
              </div>
            </SelectItem>
            <SelectItem value="expert">
              <div className="flex flex-col">
                <span className="font-medium">🎓 Expert</span>
                <span className="text-xs text-muted-foreground">Barre de progression, numérotation, style technique</span>
              </div>
            </SelectItem>
            <SelectItem value="epure">
              <div className="flex flex-col">
                <span className="font-medium">✨ Épuré</span>
                <span className="text-xs text-muted-foreground">Minimaliste, grande typographie, lecture fluide</span>
              </div>
            </SelectItem>
            <SelectItem value="vibrant">
              <div className="flex flex-col">
                <span className="font-medium">🎨 Vibrant</span>
                <span className="text-xs text-muted-foreground">Coloré, moderne, sections avec dégradés</span>
              </div>
            </SelectItem>
            <SelectItem value="sombre">
              <div className="flex flex-col">
                <span className="font-medium">🌙 Sombre</span>
                <span className="text-xs text-muted-foreground">Mode sombre élégant, contraste élevé</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="is_members_only"
          checked={formData.is_members_only}
          onCheckedChange={(checked) =>
            setFormData({ ...formData, is_members_only: !!checked })
          }
        />
        <Label htmlFor="is_members_only" className="cursor-pointer text-sm">
          Réservé aux membres (paywall)
        </Label>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="is_downloadable"
          checked={formData.is_downloadable}
          onCheckedChange={(checked) =>
            setFormData({ ...formData, is_downloadable: !!checked })
          }
        />
        <Label htmlFor="is_downloadable" className="cursor-pointer text-sm">
          Téléchargeable en PDF
        </Label>
      </div>
    </div>
  );
}
