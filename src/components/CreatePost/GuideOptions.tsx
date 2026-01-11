import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { CreatePostFormData } from "@/hooks/useCreatePost";

interface GuideOptionsProps {
  formData: CreatePostFormData;
  setFormData: React.Dispatch<React.SetStateAction<CreatePostFormData>>;
}

// Couleurs par template
const templateColors: Record<string, { name: string; colors: { label: string; value: string }[] }> = {
  classique: {
    name: "Classique",
    colors: [
      { label: "Principal", value: "#22c55e" },
      { label: "Secondaire", value: "#f8fafc" },
      { label: "Texte", value: "#1e293b" },
    ]
  },
  premium: {
    name: "Premium",
    colors: [
      { label: "Or", value: "#f59e0b" },
      { label: "Fond hero", value: "#1e293b" },
      { label: "Accent", value: "#22c55e" },
    ]
  },
  expert: {
    name: "Expert",
    colors: [
      { label: "Principal", value: "#2563eb" },
      { label: "Progression", value: "#22c55e" },
      { label: "Fond sections", value: "#f1f5f9" },
    ]
  },
  epure: {
    name: "Épuré",
    colors: [
      { label: "Fond", value: "#fafafa" },
      { label: "Texte", value: "#18181b" },
      { label: "Accent", value: "#a1a1aa" },
    ]
  },
  vibrant: {
    name: "Vibrant",
    colors: [
      { label: "Principal", value: "#6366f1" },
      { label: "Secondaire", value: "#8b5cf6" },
      { label: "Accent", value: "#f59e0b" },
    ]
  },
  sombre: {
    name: "Sombre",
    colors: [
      { label: "Fond", value: "#0f172a" },
      { label: "Texte", value: "#f8fafc" },
      { label: "Accent", value: "#22c55e" },
    ]
  },
};

export function GuideOptions({ formData, setFormData }: GuideOptionsProps) {
  const selectedTemplateColors = formData.guide_template ? templateColors[formData.guide_template] : null;

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

        {/* Aperçu des couleurs du template */}
        {selectedTemplateColors && (
          <div className="mt-3 p-3 bg-background rounded-md border">
            <p className="text-xs text-muted-foreground mb-2">
              Couleurs du template "{selectedTemplateColors.name}" :
            </p>
            <div className="flex flex-wrap gap-3">
              {selectedTemplateColors.colors.map((color, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div 
                    className="w-6 h-6 rounded-md border shadow-sm" 
                    style={{ backgroundColor: color.value }}
                  />
                  <div className="flex flex-col">
                    <span className="text-xs font-medium">{color.label}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">{color.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Champ Topline */}
      <div className="space-y-3">
        <Label htmlFor="topline">
          Topline (bandeau sur l'image)
        </Label>
        <Input
          id="topline"
          value={formData.topline || ""}
          onChange={(e) => setFormData({ ...formData, topline: e.target.value })}
          placeholder="Ex: Jusqu'à 63 000€ de subvention pour vos travaux"
          maxLength={100}
        />
        
        {/* Couleurs du bandeau topline */}
        {formData.topline && (
          <div className="grid grid-cols-2 gap-4 p-3 bg-background rounded-lg border">
            <div className="space-y-2">
              <Label htmlFor="topline_bg_color" className="text-xs">
                Couleur de fond
              </Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  id="topline_bg_color"
                  value={formData.topline_bg_color || "#22c55e"}
                  onChange={(e) => setFormData({ ...formData, topline_bg_color: e.target.value })}
                  className="w-10 h-10 rounded-lg border cursor-pointer"
                />
                <Input
                  value={formData.topline_bg_color || "#22c55e"}
                  onChange={(e) => setFormData({ ...formData, topline_bg_color: e.target.value })}
                  className="flex-1 font-mono text-xs"
                  maxLength={7}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="topline_text_color" className="text-xs">
                Couleur du texte
              </Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  id="topline_text_color"
                  value={formData.topline_text_color || "#ffffff"}
                  onChange={(e) => setFormData({ ...formData, topline_text_color: e.target.value })}
                  className="w-10 h-10 rounded-lg border cursor-pointer"
                />
                <Input
                  value={formData.topline_text_color || "#ffffff"}
                  onChange={(e) => setFormData({ ...formData, topline_text_color: e.target.value })}
                  className="flex-1 font-mono text-xs"
                  maxLength={7}
                />
              </div>
            </div>
            
            {/* Preview du bandeau */}
            <div className="col-span-2">
              <p className="text-xs text-muted-foreground mb-2">Aperçu :</p>
              <div 
                className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold shadow-md"
                style={{
                  backgroundColor: formData.topline_bg_color || "#22c55e",
                  color: formData.topline_text_color || "#ffffff",
                }}
              >
                {formData.topline}
              </div>
            </div>
          </div>
        )}
        
        <p className="text-xs text-muted-foreground">
          Ce texte apparaîtra dans un bandeau coloré sur l'image du guide.
        </p>
      </div>

      {/* Badge Image */}
      <div className="space-y-3">
        <Label htmlFor="badge_image">
          Badge image (PNG/AVIF transparent)
        </Label>
        <Input
          id="badge_image"
          value={formData.badge_image || ""}
          onChange={(e) => setFormData({ ...formData, badge_image: e.target.value })}
          placeholder="URL de l'image du badge (ex: classe énergétique)"
        />
        
        {formData.badge_image && (
          <div className="p-3 bg-background rounded-lg border">
            <p className="text-xs text-muted-foreground mb-2">Aperçu du badge :</p>
            <div className="relative inline-block bg-muted rounded-lg p-4">
              <img 
                src={formData.badge_image} 
                alt="Badge preview"
                className="h-16 w-auto object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          </div>
        )}
        
        <p className="text-xs text-muted-foreground">
          Cette image apparaîtra en bas à gauche de l'image principale du guide.
        </p>
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
