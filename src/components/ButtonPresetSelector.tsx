import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Star, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ButtonPreset {
  id: string;
  name: string;
  description: string | null;
  text: string;
  backgroundColor: string;
  textColor: string;
  borderRadius: number;
  paddingX: number;
  paddingY: number;
  borderWidth: number;
  borderColor: string;
  borderStyle: string;
  shadowSize: string;
  useGradient: boolean;
  gradientType: string;
  gradientColor1: string;
  gradientColor2: string;
  gradientAngle: number;
  isFavorite: boolean;
}

interface ButtonPresetSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (preset: ButtonPreset) => void;
  currentPresetId?: string | null;
}

const getShadowClass = (size: string) => {
  switch (size) {
    case 'sm': return '0 1px 2px rgba(0,0,0,0.05)';
    case 'md': return '0 4px 6px rgba(0,0,0,0.1)';
    case 'lg': return '0 10px 15px rgba(0,0,0,0.15)';
    default: return 'none';
  }
};

export const ButtonPresetSelector = ({ open, onOpenChange, onSelect, currentPresetId }: ButtonPresetSelectorProps) => {
  const { toast } = useToast();
  const [presets, setPresets] = useState<ButtonPreset[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadPresets();
    }
  }, [open]);

  const loadPresets = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('button_presets')
        .select('*')
        .eq('user_id', user.id)
        .order('is_favorite', { ascending: false })
        .order('favorite_order', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      setPresets((data || []).map(p => ({
        id: p.id,
        name: p.name,
        description: p.description,
        text: p.text,
        backgroundColor: p.background_color,
        textColor: p.text_color,
        borderRadius: p.border_radius,
        paddingX: p.padding_x,
        paddingY: p.padding_y,
        borderWidth: p.border_width,
        borderColor: p.border_color,
        borderStyle: p.border_style,
        shadowSize: p.shadow_size,
        useGradient: p.use_gradient,
        gradientType: p.gradient_type,
        gradientColor1: p.gradient_color1,
        gradientColor2: p.gradient_color2,
        gradientAngle: p.gradient_angle,
        isFavorite: p.is_favorite,
      })));
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getButtonStyle = (preset: ButtonPreset) => {
    const background = preset.useGradient
      ? `linear-gradient(${preset.gradientAngle}deg, ${preset.gradientColor1}, ${preset.gradientColor2})`
      : preset.backgroundColor;

    return {
      background,
      color: preset.textColor,
      borderRadius: `${preset.borderRadius}px`,
      padding: `${preset.paddingY}px ${preset.paddingX}px`,
      border: preset.borderWidth > 0 ? `${preset.borderWidth}px ${preset.borderStyle} ${preset.borderColor}` : 'none',
      boxShadow: getShadowClass(preset.shadowSize),
    };
  };

  const handleSelect = (preset: ButtonPreset) => {
    onSelect(preset);
    onOpenChange(false);
  };

  const favorites = presets.filter(p => p.isFavorite);
  const others = presets.filter(p => !p.isFavorite);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] p-0">
        <DialogHeader className="p-4 border-b flex flex-row items-center justify-between">
          <DialogTitle>Sélectionner un bouton</DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="h-8 w-8"
          >
            <X className="h-5 w-5" />
            <span className="sr-only">Fermer</span>
          </Button>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh] p-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : presets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucun bouton disponible. Créez des boutons depuis la bibliothèque.
            </div>
          ) : (
            <div className="space-y-6">
              {favorites.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    Favoris
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {favorites.map((preset) => (
                      <div
                        key={preset.id}
                        onClick={() => handleSelect(preset)}
                        className={`p-4 border rounded-lg cursor-pointer transition-all hover:border-primary hover:shadow-md ${
                          currentPresetId === preset.id ? 'border-primary ring-2 ring-primary/20' : 'border-border'
                        }`}
                      >
                        <div className="flex flex-col items-center gap-3">
                          <button
                            type="button"
                            style={getButtonStyle(preset)}
                            className="font-medium transition-all pointer-events-none"
                          >
                            {preset.text}
                          </button>
                          <p className="text-xs text-muted-foreground text-center">{preset.name}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {others.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">
                    Autres boutons
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {others.map((preset) => (
                      <div
                        key={preset.id}
                        onClick={() => handleSelect(preset)}
                        className={`p-4 border rounded-lg cursor-pointer transition-all hover:border-primary hover:shadow-md ${
                          currentPresetId === preset.id ? 'border-primary ring-2 ring-primary/20' : 'border-border'
                        }`}
                      >
                        <div className="flex flex-col items-center gap-3">
                          <button
                            type="button"
                            style={getButtonStyle(preset)}
                            className="font-medium transition-all pointer-events-none"
                          >
                            {preset.text}
                          </button>
                          <p className="text-xs text-muted-foreground text-center">{preset.name}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default ButtonPresetSelector;
