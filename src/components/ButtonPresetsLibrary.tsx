import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Star, Plus, Trash2, Edit, Save, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ButtonEditorModal } from "./RichTextEditor/ButtonEditorModal";

const createDefaultButtons = async (userId: string) => {
  const defaultButtons = [
    // FAVORIS
    { name: 'Urgence Orange', description: 'Bouton d\'urgence avec fond orange vif', text: 'Action Urgente !', url: '#contact', background_color: '#ff6b35', text_color: '#ffffff', use_gradient: false, gradient_type: 'linear', gradient_color1: '#ec4899', gradient_color2: '#8b5cf6', gradient_angle: 90, hover_effect: true, hover_gradient_shift: false, border_width: 2, border_color: '#ff4500', border_style: 'solid', border_radius: 8, padding_x: 32, padding_y: 16, size: 'large', width: 'auto', custom_width: 200, align: 'center', shadow_size: 'lg', is_favorite: true, favorite_order: 1, user_id: userId },
    { name: 'Nature Vert', description: 'Bouton écologique avec dégradé vert naturel', text: 'Découvrir', url: '#services', background_color: '#10b981', text_color: '#ffffff', use_gradient: true, gradient_type: 'linear', gradient_color1: '#22c55e', gradient_color2: '#059669', gradient_angle: 135, hover_effect: true, hover_gradient_shift: false, border_width: 0, border_color: '#000000', border_style: 'solid', border_radius: 12, padding_x: 28, padding_y: 14, size: 'medium', width: 'auto', custom_width: 200, align: 'center', shadow_size: 'md', is_favorite: true, favorite_order: 2, user_id: userId },
    { name: 'Bleu Standard', description: 'Bouton professionnel bleu classique', text: 'En savoir plus', url: '#about', background_color: '#3b82f6', text_color: '#ffffff', use_gradient: false, gradient_type: 'linear', gradient_color1: '#ec4899', gradient_color2: '#8b5cf6', gradient_angle: 90, hover_effect: true, hover_gradient_shift: false, border_width: 1, border_color: '#2563eb', border_style: 'solid', border_radius: 6, padding_x: 24, padding_y: 12, size: 'medium', width: 'auto', custom_width: 200, align: 'center', shadow_size: 'sm', is_favorite: true, favorite_order: 3, user_id: userId },
    { name: 'Dégradé Rose-Violet', description: 'Dégradé moderne avec animation au survol', text: 'Commencer maintenant', url: '#start', background_color: '#ec4899', text_color: '#ffffff', use_gradient: true, gradient_type: 'linear', gradient_color1: '#ec4899', gradient_color2: '#8b5cf6', gradient_angle: 90, hover_effect: true, hover_gradient_shift: true, border_width: 0, border_color: '#000000', border_style: 'solid', border_radius: 10, padding_x: 30, padding_y: 15, size: 'large', width: 'auto', custom_width: 200, align: 'center', shadow_size: 'lg', is_favorite: true, favorite_order: 4, user_id: userId },
    { name: 'Cyber Bleu', description: 'Dégradé bleu futuriste avec effet cyber', text: 'Voir la démo', url: '#demo', background_color: '#0ea5e9', text_color: '#ffffff', use_gradient: true, gradient_type: 'linear', gradient_color1: '#06b6d4', gradient_color2: '#3b82f6', gradient_angle: 45, hover_effect: true, hover_gradient_shift: true, border_width: 2, border_color: '#0284c7', border_style: 'solid', border_radius: 8, padding_x: 26, padding_y: 13, size: 'medium', width: 'auto', custom_width: 200, align: 'center', shadow_size: 'md', is_favorite: true, favorite_order: 5, user_id: userId },
    // NON-FAVORIS
    { name: 'Rouge Élégant', description: 'Bouton rouge sombre avec bordure', text: 'Alerte', url: '#alert', background_color: '#dc2626', text_color: '#ffffff', use_gradient: false, gradient_type: 'linear', gradient_color1: '#ec4899', gradient_color2: '#8b5cf6', gradient_angle: 90, hover_effect: true, hover_gradient_shift: false, border_width: 2, border_color: '#991b1b', border_style: 'solid', border_radius: 6, padding_x: 24, padding_y: 12, size: 'medium', width: 'auto', custom_width: 200, align: 'center', shadow_size: 'md', is_favorite: false, favorite_order: null, user_id: userId },
    { name: 'Attention Jaune', description: 'Bouton jaune pour attirer l\'attention', text: 'Important', url: '#important', background_color: '#fbbf24', text_color: '#000000', use_gradient: false, gradient_type: 'linear', gradient_color1: '#ec4899', gradient_color2: '#8b5cf6', gradient_angle: 90, hover_effect: true, hover_gradient_shift: false, border_width: 2, border_color: '#f59e0b', border_style: 'solid', border_radius: 8, padding_x: 28, padding_y: 14, size: 'medium', width: 'auto', custom_width: 200, align: 'center', shadow_size: 'sm', is_favorite: false, favorite_order: null, user_id: userId },
    { name: 'Violet Profond', description: 'Dégradé violet intense', text: 'Premium', url: '#premium', background_color: '#7c3aed', text_color: '#ffffff', use_gradient: true, gradient_type: 'linear', gradient_color1: '#9333ea', gradient_color2: '#6b21a8', gradient_angle: 180, hover_effect: true, hover_gradient_shift: true, border_width: 0, border_color: '#000000', border_style: 'solid', border_radius: 12, padding_x: 32, padding_y: 16, size: 'large', width: 'auto', custom_width: 200, align: 'center', shadow_size: 'lg', is_favorite: false, favorite_order: null, user_id: userId },
    { name: 'Or Luxe', description: 'Dégradé doré pour effet premium', text: 'Offre VIP', url: '#vip', background_color: '#f59e0b', text_color: '#000000', use_gradient: true, gradient_type: 'linear', gradient_color1: '#fbbf24', gradient_color2: '#f97316', gradient_angle: 90, hover_effect: true, hover_gradient_shift: false, border_width: 2, border_color: '#d97706', border_style: 'solid', border_radius: 8, padding_x: 30, padding_y: 15, size: 'large', width: 'auto', custom_width: 200, align: 'center', shadow_size: 'lg', is_favorite: false, favorite_order: null, user_id: userId },
    { name: 'Noir Minimal', description: 'Bouton noir épuré et moderne', text: 'Continuer', url: '#continue', background_color: '#1f2937', text_color: '#ffffff', use_gradient: false, gradient_type: 'linear', gradient_color1: '#ec4899', gradient_color2: '#8b5cf6', gradient_angle: 90, hover_effect: true, hover_gradient_shift: false, border_width: 1, border_color: '#111827', border_style: 'solid', border_radius: 4, padding_x: 24, padding_y: 12, size: 'medium', width: 'auto', custom_width: 200, align: 'center', shadow_size: 'sm', is_favorite: false, favorite_order: null, user_id: userId }
  ];

  const { error } = await supabase
    .from('button_presets')
    .insert(defaultButtons);

  if (error) throw error;
};

interface ButtonPreset {
  id: string;
  name: string;
  description: string | null;
  text: string;
  url: string;
  backgroundColor: string;
  textColor: string;
  size: 'small' | 'medium' | 'large';
  width: 'auto' | 'full' | 'custom';
  customWidth: number;
  align: 'left' | 'center' | 'right';
  borderRadius: number;
  paddingX: number;
  paddingY: number;
  borderWidth: number;
  borderColor: string;
  borderStyle: 'solid' | 'dashed' | 'dotted' | 'none';
  shadowSize: 'none' | 'sm' | 'md' | 'lg';
  hoverEffect: boolean;
  useGradient: boolean;
  gradientType: 'linear' | 'radial';
  gradientColor1: string;
  gradientColor2: string;
  gradientAngle: number;
  hoverGradientShift: boolean;
  isFavorite: boolean;
  favoriteOrder: number | null;
}

interface ButtonPresetsLibraryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ButtonPresetsLibrary = ({ open, onOpenChange }: ButtonPresetsLibraryProps) => {
  const { toast } = useToast();
  const [presets, setPresets] = useState<ButtonPreset[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingPreset, setEditingPreset] = useState<ButtonPreset | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingName, setEditingName] = useState<string | null>(null);
  const [editingDescription, setEditingDescription] = useState<string | null>(null);

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

      let { data, error } = await supabase
        .from('button_presets')
        .select('*')
        .eq('user_id', user.id)
        .order('is_favorite', { ascending: false })
        .order('favorite_order', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Si aucun bouton, créer les boutons par défaut
      if (!data || data.length === 0) {
        await createDefaultButtons(user.id);
        // Re-fetch après création
        const { data: newData, error: newError } = await supabase
          .from('button_presets')
          .select('*')
          .eq('user_id', user.id)
          .order('is_favorite', { ascending: false })
          .order('favorite_order', { ascending: true, nullsFirst: false })
          .order('created_at', { ascending: false });
        
        if (newError) throw newError;
        data = newData;
      }

      setPresets(data.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description,
        text: p.text,
        url: p.url,
        backgroundColor: p.background_color,
        textColor: p.text_color,
        size: p.size as 'small' | 'medium' | 'large',
        width: p.width as 'auto' | 'full' | 'custom',
        customWidth: p.custom_width,
        align: p.align as 'left' | 'center' | 'right',
        borderRadius: p.border_radius,
        paddingX: p.padding_x,
        paddingY: p.padding_y,
        borderWidth: p.border_width,
        borderColor: p.border_color,
        borderStyle: p.border_style as 'solid' | 'dashed' | 'dotted' | 'none',
        shadowSize: p.shadow_size as 'none' | 'sm' | 'md' | 'lg',
        hoverEffect: p.hover_effect,
        useGradient: p.use_gradient,
        gradientType: p.gradient_type as 'linear' | 'radial',
        gradientColor1: p.gradient_color1,
        gradientColor2: p.gradient_color2,
        gradientAngle: p.gradient_angle,
        hoverGradientShift: p.hover_gradient_shift,
        isFavorite: p.is_favorite,
        favoriteOrder: p.favorite_order,
      })));
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (preset: ButtonPreset) => {
    const favorites = presets.filter(p => p.isFavorite);
    
    if (!preset.isFavorite && favorites.length >= 5) {
      toast({
        title: "Limite atteinte",
        description: "Vous pouvez avoir maximum 5 boutons favoris",
        variant: "destructive"
      });
      return;
    }

    const newFavoriteStatus = !preset.isFavorite;
    const newOrder = newFavoriteStatus ? favorites.length + 1 : null;

    const { error } = await supabase
      .from('button_presets')
      .update({
        is_favorite: newFavoriteStatus,
        favorite_order: newOrder
      })
      .eq('id', preset.id);

    if (error) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive"
      });
    } else {
      loadPresets();
      toast({
        title: newFavoriteStatus ? "Ajouté aux favoris" : "Retiré des favoris",
        description: newFavoriteStatus ? "Ce bouton est maintenant un favori" : "Ce bouton n'est plus un favori"
      });
    }
  };

  const deletePreset = async (id: string) => {
    const { error } = await supabase
      .from('button_presets')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive"
      });
    } else {
      loadPresets();
      toast({
        title: "Supprimé",
        description: "Le bouton a été supprimé"
      });
    }
  };

  const savePresetMetadata = async (preset: ButtonPreset) => {
    const { error } = await supabase
      .from('button_presets')
      .update({
        name: editingName || preset.name,
        description: editingDescription || preset.description
      })
      .eq('id', preset.id);

    if (error) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive"
      });
    } else {
      loadPresets();
      setEditingName(null);
      setEditingDescription(null);
      toast({
        title: "Modifié",
        description: "Les informations ont été mises à jour"
      });
    }
  };

  const createNewPreset = async (config: any) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('button_presets')
      .insert({
        user_id: user.id,
        name: "Nouveau bouton",
        description: "Description du bouton",
        ...convertConfigToDb(config)
      });

    if (error) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive"
      });
    } else {
      loadPresets();
      setEditorOpen(false);
      toast({
        title: "Créé",
        description: "Le nouveau bouton a été créé"
      });
    }
  };

  const updatePreset = async (config: any) => {
    if (!editingPreset) return;

    const { error } = await supabase
      .from('button_presets')
      .update(convertConfigToDb(config))
      .eq('id', editingPreset.id);

    if (error) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive"
      });
    } else {
      loadPresets();
      setEditorOpen(false);
      setEditingPreset(null);
      toast({
        title: "Modifié",
        description: "Le bouton a été mis à jour"
      });
    }
  };

  const convertConfigToDb = (config: any) => ({
    text: config.text,
    url: config.url,
    background_color: config.backgroundColor,
    text_color: config.textColor,
    size: config.size,
    width: config.width,
    custom_width: config.customWidth,
    align: config.align,
    border_radius: config.borderRadius,
    padding_x: config.paddingX,
    padding_y: config.paddingY,
    border_width: config.borderWidth,
    border_color: config.borderColor,
    border_style: config.borderStyle,
    shadow_size: config.shadowSize,
    hover_effect: config.hoverEffect,
    use_gradient: config.useGradient,
    gradient_type: config.gradientType,
    gradient_color1: config.gradientColor1,
    gradient_color2: config.gradientColor2,
    gradient_angle: config.gradientAngle,
    hover_gradient_shift: config.hoverGradientShift
  });

  const getButtonBackground = (preset: ButtonPreset) => {
    if (!preset.useGradient) return preset.backgroundColor;
    if (preset.gradientType === 'linear') {
      return `linear-gradient(${preset.gradientAngle}deg, ${preset.gradientColor1}, ${preset.gradientColor2})`;
    }
    return `radial-gradient(circle at center, ${preset.gradientColor1}, ${preset.gradientColor2})`;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Ma bibliothèque de boutons ({presets.length}/50)</span>
              <Button
                onClick={() => {
                  setEditingPreset(null);
                  setEditorOpen(true);
                }}
                disabled={presets.length >= 50}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Nouveau bouton
              </Button>
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-4">
              {presets.map((preset) => (
                <div
                  key={preset.id}
                  className="border rounded-lg p-4 space-y-3 hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      {editingName === preset.id ? (
                        <div className="flex gap-2">
                          <Input
                            defaultValue={preset.name}
                            onChange={(e) => setEditingName(e.target.value)}
                            className="flex-1"
                          />
                          <Button
                            size="sm"
                            onClick={() => savePresetMetadata(preset)}
                          >
                            <Save className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingName(null)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                          {preset.name}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingName(preset.id)}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                        </h3>
                      )}

                      {editingDescription === preset.id ? (
                        <div className="flex gap-2">
                          <Textarea
                            defaultValue={preset.description || ''}
                            onChange={(e) => setEditingDescription(e.target.value)}
                            className="flex-1"
                            rows={2}
                          />
                          <Button
                            size="sm"
                            onClick={() => savePresetMetadata(preset)}
                          >
                            <Save className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingDescription(null)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          {preset.description || 'Aucune description'}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingDescription(preset.id)}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={preset.isFavorite ? "default" : "outline"}
                        onClick={() => toggleFavorite(preset)}
                        className="gap-2"
                      >
                        <Star
                          className={`w-4 h-4 ${preset.isFavorite ? 'fill-yellow-400 text-yellow-400' : ''}`}
                        />
                        {preset.isFavorite && `#${preset.favoriteOrder}`}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingPreset(preset);
                          setEditorOpen(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deletePreset(preset.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Aperçu du bouton */}
                  <div className="p-4 bg-muted/30 rounded-lg flex justify-center">
                    <a
                      href={preset.url}
                      onClick={(e) => e.preventDefault()}
                      style={{
                        background: getButtonBackground(preset),
                        color: preset.textColor,
                        padding: `${preset.paddingY}px ${preset.paddingX}px`,
                        borderRadius: `${preset.borderRadius}px`,
                        fontSize: preset.size === 'small' ? '14px' : preset.size === 'large' ? '18px' : '16px',
                        fontWeight: 500,
                        textDecoration: 'none',
                        display: 'inline-block',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        border: preset.borderWidth > 0 ? `${preset.borderWidth}px ${preset.borderStyle} ${preset.borderColor}` : 'none',
                        cursor: 'pointer',
                        boxShadow: {
                          none: 'none',
                          sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                          md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                          lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                        }[preset.shadowSize]
                      }}
                    >
                      {preset.text}
                    </a>
                  </div>
                </div>
              ))}

              {presets.length === 0 && !loading && (
                <div className="text-center py-12 text-muted-foreground">
                  <p>Aucun bouton enregistré</p>
                  <p className="text-sm mt-2">Créez votre premier bouton personnalisé !</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <ButtonEditorModal
        open={editorOpen}
        onOpenChange={setEditorOpen}
        onSave={editingPreset ? updatePreset : createNewPreset}
        initialConfig={editingPreset || undefined}
      />
    </>
  );
};