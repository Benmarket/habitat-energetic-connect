import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useState, useEffect } from "react";
import { AlignLeft, AlignCenter, AlignRight, Sparkles, Palette, Star, ExternalLink, FileText, Layers, Hash } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ButtonConfig {
  text: string;
  url: string;
  destinationType: 'external' | 'internal' | 'popup' | 'anchor';
  popupId?: string;
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
  gradientDirection: 'to-right' | 'to-left' | 'to-top' | 'to-bottom' | 'to-top-right' | 'to-bottom-right' | 'to-top-left' | 'to-bottom-left';
  gradientColor1: string;
  gradientColor2: string;
  gradientAngle: number;
  hoverGradientShift: boolean;
}

interface ButtonEditorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (config: ButtonConfig) => void;
  initialConfig?: Partial<ButtonConfig>;
}

const defaultConfig: ButtonConfig = {
  text: 'Cliquez ici',
  url: '#contact',
  destinationType: 'anchor',
  popupId: undefined,
  backgroundColor: '#10b981',
  textColor: '#ffffff',
  size: 'medium',
  width: 'auto',
  customWidth: 200,
  align: 'center',
  borderRadius: 6,
  paddingX: 24,
  paddingY: 12,
  borderWidth: 0,
  borderColor: '#000000',
  borderStyle: 'solid',
  shadowSize: 'md',
  hoverEffect: true,
  useGradient: false,
  gradientType: 'linear',
  gradientDirection: 'to-right',
  gradientColor1: '#ec4899',
  gradientColor2: '#8b5cf6',
  gradientAngle: 90,
  hoverGradientShift: true,
};

const presetStyles = [
  {
    name: 'Primaire (Vert)',
    config: {
      useGradient: false,
      backgroundColor: '#10b981',
      textColor: '#ffffff',
      borderRadius: 6,
      borderWidth: 0,
      shadowSize: 'md' as const,
    }
  },
  {
    name: 'Dégradé Rose-Violet',
    config: {
      useGradient: true,
      gradientColor1: '#ec4899',
      gradientColor2: '#8b5cf6',
      gradientAngle: 90,
      textColor: '#ffffff',
      borderRadius: 25,
      borderWidth: 0,
      shadowSize: 'lg' as const,
    }
  },
  {
    name: 'Dégradé Bleu-Cyan',
    config: {
      useGradient: true,
      gradientColor1: '#3b82f6',
      gradientColor2: '#06b6d4',
      gradientAngle: 135,
      textColor: '#ffffff',
      borderRadius: 25,
      borderWidth: 0,
      shadowSize: 'lg' as const,
    }
  },
  {
    name: 'Dégradé Sunset',
    config: {
      useGradient: true,
      gradientColor1: '#f97316',
      gradientColor2: '#ec4899',
      gradientAngle: 45,
      textColor: '#ffffff',
      borderRadius: 25,
      borderWidth: 0,
      shadowSize: 'lg' as const,
    }
  },
];

const colorPresets = [
  { name: 'Rose', value: '#ec4899' },
  { name: 'Violet', value: '#8b5cf6' },
  { name: 'Bleu', value: '#3b82f6' },
  { name: 'Cyan', value: '#06b6d4' },
  { name: 'Vert', value: '#10b981' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Rouge', value: '#ef4444' },
  { name: 'Jaune', value: '#eab308' },
];

interface FavoriteButton {
  id: string;
  name: string;
  text: string;
  url: string;
  background_color: string;
  text_color: string;
  use_gradient: boolean;
  gradient_type: string;
  gradient_color1: string;
  gradient_color2: string;
  gradient_angle: number;
  border_radius: number;
  padding_x: number;
  padding_y: number;
  border_width: number;
  border_color: string;
  border_style: string;
  shadow_size: string;
  hover_effect: boolean;
  hover_gradient_shift: boolean;
  size: string;
  width: string;
  custom_width: number;
  align: string;
}

export const ButtonEditorModal = ({ 
  open, 
  onOpenChange, 
  onSave,
  initialConfig 
}: ButtonEditorModalProps) => {
  const [config, setConfig] = useState<ButtonConfig>({
    ...defaultConfig,
    ...initialConfig,
  });
  const [favoriteButtons, setFavoriteButtons] = useState<FavoriteButton[]>([]);
  const [availablePopups, setAvailablePopups] = useState<Array<{ id: string; name: string }>>([]);
  const [internalPages, setInternalPages] = useState<Array<{ path: string; label: string }>>([]);

  useEffect(() => {
    if (open) {
      setConfig({
        ...defaultConfig,
        ...initialConfig,
      });
      loadFavoriteButtons();
      loadAvailablePopups();
      loadInternalPages();
    }
  }, [open, initialConfig]);

  const loadInternalPages = async () => {
    const staticPages = [
      { path: '/', label: 'Accueil' },
      { path: '/actualites', label: 'Actualités' },
      { path: '/guides', label: 'Guides' },
      { path: '/aides', label: 'Aides' },
      { path: '/simulateurs/solaire', label: 'Simulateur Solaire' },
      { path: '/faq', label: 'FAQ' },
      { path: '/forum', label: 'Forum' },
      { path: '/installer-app', label: "Installer l'app" },
    ];
    try {
      const { data: landingPages } = await supabase
        .from('landing_pages')
        .select('path, title')
        .order('title');
      const lpPages = (landingPages || []).map(lp => ({
        path: lp.path,
        label: `LP: ${lp.title}`,
      }));
      setInternalPages([...staticPages, ...lpPages]);
    } catch {
      setInternalPages(staticPages);
    }
  };

  const loadFavoriteButtons = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('button_presets')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_favorite', true)
        .order('favorite_order', { ascending: true })
        .limit(5);

      if (error) throw error;
      if (data) setFavoriteButtons(data);
    } catch (error) {
      // Silent fail - favorite buttons are optional
    }
  };

  const loadAvailablePopups = async () => {
    try {
      const { data, error } = await supabase
        .from('popups')
        .select('id, name')
        .order('name', { ascending: true });

      if (error) throw error;
      if (data) setAvailablePopups(data);
    } catch (error) {
      // Silent fail - popups are optional
    }
  };

  const handleSave = () => {
    onSave(config);
    onOpenChange(false);
  };

  const applyPreset = (preset: typeof presetStyles[0]) => {
    setConfig(prev => ({
      ...prev,
      ...preset.config,
    }));
  };

  const applyFavoriteButton = (favorite: FavoriteButton) => {
    setConfig(prev => ({
      ...prev,
      text: favorite.text,
      url: favorite.url,
      backgroundColor: favorite.background_color,
      textColor: favorite.text_color,
      useGradient: favorite.use_gradient,
      gradientType: favorite.gradient_type as 'linear' | 'radial',
      gradientColor1: favorite.gradient_color1,
      gradientColor2: favorite.gradient_color2,
      gradientAngle: favorite.gradient_angle,
      borderRadius: favorite.border_radius,
      paddingX: favorite.padding_x,
      paddingY: favorite.padding_y,
      borderWidth: favorite.border_width,
      borderColor: favorite.border_color,
      borderStyle: favorite.border_style as 'solid' | 'dashed' | 'dotted' | 'none',
      shadowSize: favorite.shadow_size as 'none' | 'sm' | 'md' | 'lg',
      hoverEffect: favorite.hover_effect,
      hoverGradientShift: favorite.hover_gradient_shift,
      size: favorite.size as 'small' | 'medium' | 'large',
      width: favorite.width as 'auto' | 'full' | 'custom',
      customWidth: favorite.custom_width,
      align: favorite.align as 'left' | 'center' | 'right',
    }));
  };

  const getFavoriteButtonBackground = (favorite: FavoriteButton) => {
    if (!favorite.use_gradient) return favorite.background_color;
    if (favorite.gradient_type === 'linear') {
      return `linear-gradient(${favorite.gradient_angle}deg, ${favorite.gradient_color1}, ${favorite.gradient_color2})`;
    }
    return `radial-gradient(circle at center, ${favorite.gradient_color1}, ${favorite.gradient_color2})`;
  };

  const getButtonBackground = () => {
    if (!config.useGradient) {
      return config.backgroundColor;
    }

    const angle = config.gradientAngle;
    const color1 = config.gradientColor1;
    const color2 = config.gradientColor2;

    if (config.gradientType === 'linear') {
      return `linear-gradient(${angle}deg, ${color1}, ${color2})`;
    } else {
      return `radial-gradient(circle at center, ${color1}, ${color2})`;
    }
  };

  const getButtonStyle = (): React.CSSProperties => {
    const sizeMap = {
      small: '14px',
      medium: '16px',
      large: '18px',
    };

    const shadowMap = {
      none: 'none',
      sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    };

    const border = config.borderWidth > 0 
      ? `${config.borderWidth}px ${config.borderStyle} ${config.borderColor}`
      : 'none';

    return {
      background: getButtonBackground(),
      color: config.textColor,
      paddingLeft: `${config.paddingX}px`,
      paddingRight: `${config.paddingX}px`,
      paddingTop: `${config.paddingY}px`,
      paddingBottom: `${config.paddingY}px`,
      borderRadius: `${config.borderRadius}px`,
      fontSize: sizeMap[config.size],
      fontWeight: 500,
      cursor: 'pointer',
      border,
      display: 'inline-block',
      textDecoration: 'none',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      width: config.width === 'full' ? '100%' : config.width === 'custom' ? `${config.customWidth}px` : 'auto',
      textAlign: 'center',
      boxShadow: shadowMap[config.shadowSize],
    };
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Personnaliser le bouton
          </DialogTitle>
        </DialogHeader>

        {/* Boutons favoris */}
        {favoriteButtons.length > 0 && (
          <div className="space-y-2 pb-4 border-b">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              Mes boutons favoris
            </Label>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {favoriteButtons.map((favorite) => (
                <button
                  key={favorite.id}
                  type="button"
                  onClick={() => applyFavoriteButton(favorite)}
                  className="flex-shrink-0 group relative"
                  title={favorite.name}
                >
                  <div
                    className="px-4 py-2 rounded text-xs font-medium transition-transform hover:scale-105 cursor-pointer"
                    style={{
                      background: getFavoriteButtonBackground(favorite),
                      color: favorite.text_color,
                      borderRadius: `${favorite.border_radius}px`,
                      border: favorite.border_width > 0 ? `${favorite.border_width}px ${favorite.border_style} ${favorite.border_color}` : 'none',
                      boxShadow: {
                        none: 'none',
                        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                      }[favorite.shadow_size]
                    }}
                  >
                    {favorite.text}
                  </div>
                  <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                    {favorite.name}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Presets rapides */}
        <div className="space-y-2 pb-4 border-b">
          <Label className="text-sm font-medium">Styles prédéfinis</Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {presetStyles.map((preset) => (
              <Button
                key={preset.name}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => applyPreset(preset)}
                className="h-auto py-2 text-xs"
              >
                {preset.name}
              </Button>
            ))}
          </div>
        </div>

        <Tabs defaultValue="content" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="content">Contenu</TabsTrigger>
            <TabsTrigger value="destination">Destination</TabsTrigger>
            <TabsTrigger value="style">Couleurs</TabsTrigger>
            <TabsTrigger value="gradient">
              <Palette className="w-3 h-3 mr-1" />
              Dégradé
            </TabsTrigger>
            <TabsTrigger value="size">Tailles</TabsTrigger>
            <TabsTrigger value="effects">Effets</TabsTrigger>
          </TabsList>

          {/* Onglet Contenu */}
          <TabsContent value="content" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="text">Texte du bouton *</Label>
              <Input
                id="text"
                placeholder="Ex: Contactez-nous"
                value={config.text}
                onChange={(e) => setConfig(prev => ({ ...prev, text: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Alignement du bouton</Label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  type="button"
                  variant={config.align === 'left' ? 'default' : 'outline'}
                  onClick={() => setConfig(prev => ({ ...prev, align: 'left' }))}
                  className="gap-2"
                >
                  <AlignLeft className="w-4 h-4" />
                  Gauche
                </Button>
                <Button
                  type="button"
                  variant={config.align === 'center' ? 'default' : 'outline'}
                  onClick={() => setConfig(prev => ({ ...prev, align: 'center' }))}
                  className="gap-2"
                >
                  <AlignCenter className="w-4 h-4" />
                  Centre
                </Button>
                <Button
                  type="button"
                  variant={config.align === 'right' ? 'default' : 'outline'}
                  onClick={() => setConfig(prev => ({ ...prev, align: 'right' }))}
                  className="gap-2"
                >
                  <AlignRight className="w-4 h-4" />
                  Droite
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Onglet Destination */}
          <TabsContent value="destination" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Type de destination</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={config.destinationType === 'anchor' ? 'default' : 'outline'}
                  onClick={() => setConfig(prev => ({ ...prev, destinationType: 'anchor', url: '#contact' }))}
                  className="gap-2 h-auto py-3 flex-col"
                >
                  <Hash className="w-5 h-5" />
                  <span className="text-xs">Ancre sur la page</span>
                </Button>
                <Button
                  type="button"
                  variant={config.destinationType === 'internal' ? 'default' : 'outline'}
                  onClick={() => setConfig(prev => ({ ...prev, destinationType: 'internal', url: '/' }))}
                  className="gap-2 h-auto py-3 flex-col"
                >
                  <FileText className="w-5 h-5" />
                  <span className="text-xs">Page interne</span>
                </Button>
                <Button
                  type="button"
                  variant={config.destinationType === 'external' ? 'default' : 'outline'}
                  onClick={() => setConfig(prev => ({ ...prev, destinationType: 'external', url: 'https://' }))}
                  className="gap-2 h-auto py-3 flex-col"
                >
                  <ExternalLink className="w-5 h-5" />
                  <span className="text-xs">Lien externe</span>
                </Button>
                <Button
                  type="button"
                  variant={config.destinationType === 'popup' ? 'default' : 'outline'}
                  onClick={() => setConfig(prev => ({ ...prev, destinationType: 'popup', url: '#popup' }))}
                  className="gap-2 h-auto py-3 flex-col"
                >
                  <Layers className="w-5 h-5" />
                  <span className="text-xs">Ouvrir un popup</span>
                </Button>
              </div>
            </div>

            {config.destinationType === 'anchor' && (
              <div className="space-y-2">
                <Label htmlFor="anchor">Ancre sur la page</Label>
                <Input
                  id="anchor"
                  placeholder="Ex: #contact, #formulaire"
                  value={config.url}
                  onChange={(e) => setConfig(prev => ({ ...prev, url: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">
                  Utilisez # suivi du nom de la section (ex: #contact, #aides, #formulaire)
                </p>
              </div>
            )}

            {config.destinationType === 'internal' && (
              <div className="space-y-2">
                <Label>Sélectionner une page</Label>
                <Select
                  value={config.url || '/'}
                  onValueChange={(val) => setConfig(prev => ({ ...prev, url: val }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir une page..." />
                  </SelectTrigger>
                  <SelectContent>
                    {internalPages.map((page) => (
                      <SelectItem key={page.path} value={page.path}>
                        {page.label} ({page.path})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {config.destinationType === 'external' && (
              <div className="space-y-2">
                <Label htmlFor="external-url">URL externe</Label>
                <Input
                  id="external-url"
                  placeholder="https://www.exemple.fr"
                  value={config.url}
                  onChange={(e) => setConfig(prev => ({ ...prev, url: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">
                  Lien complet vers un site externe (s'ouvre dans un nouvel onglet)
                </p>
              </div>
            )}

            {config.destinationType === 'popup' && (
              <div className="space-y-2">
                <Label>Sélectionner un popup</Label>
                {availablePopups.length > 0 ? (
                  <Select 
                    value={config.popupId || ''} 
                    onValueChange={(value) => setConfig(prev => ({ ...prev, popupId: value, url: `#popup-${value}` }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir un popup..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availablePopups.map((popup) => (
                        <SelectItem key={popup.id} value={popup.id}>
                          {popup.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="p-4 bg-muted/50 rounded-lg text-center">
                    <p className="text-sm text-muted-foreground">Aucun popup disponible</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Créez d'abord un popup dans Administration &gt; Popups
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="p-4 bg-muted/30 rounded-lg mt-4">
              <p className="text-sm font-medium mb-2">📍 Destination actuelle :</p>
              <code className="text-xs bg-background px-2 py-1 rounded">{config.url}</code>
            </div>
          </TabsContent>

          {/* Onglet Couleurs */}
          <TabsContent value="style" className="space-y-4 mt-4">
            {!config.useGradient && (
              <div className="space-y-2">
                <Label>Couleur de fond</Label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {colorPresets.map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => setConfig(prev => ({ ...prev, backgroundColor: preset.value }))}
                      className="h-10 rounded-md border-2 hover:scale-105 transition-transform"
                      style={{ 
                        backgroundColor: preset.value,
                        borderColor: config.backgroundColor === preset.value ? '#3b82f6' : 'transparent'
                      }}
                      title={preset.name}
                    />
                  ))}
                </div>
                <div className="flex gap-2 items-center">
                  <Input
                    type="color"
                    value={config.backgroundColor}
                    onChange={(e) => setConfig(prev => ({ ...prev, backgroundColor: e.target.value }))}
                    className="w-20 h-10 cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={config.backgroundColor}
                    onChange={(e) => setConfig(prev => ({ ...prev, backgroundColor: e.target.value }))}
                    placeholder="#000000"
                    className="font-mono"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Couleur du texte</Label>
              <div className="flex gap-2 items-center">
                <Input
                  type="color"
                  value={config.textColor}
                  onChange={(e) => setConfig(prev => ({ ...prev, textColor: e.target.value }))}
                  className="w-20 h-10 cursor-pointer"
                />
                <Input
                  type="text"
                  value={config.textColor}
                  onChange={(e) => setConfig(prev => ({ ...prev, textColor: e.target.value }))}
                  placeholder="#ffffff"
                  className="font-mono"
                />
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t">
              <div className="space-y-2">
                <Label>Bordure</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Épaisseur: {config.borderWidth}px</Label>
                    <Slider
                      value={[config.borderWidth]}
                      onValueChange={([value]) => setConfig(prev => ({ ...prev, borderWidth: value }))}
                      min={0}
                      max={8}
                      step={1}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Style</Label>
                    <Select 
                      value={config.borderStyle} 
                      onValueChange={(value: 'solid' | 'dashed' | 'dotted' | 'none') => 
                        setConfig(prev => ({ ...prev, borderStyle: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="solid">Pleine</SelectItem>
                        <SelectItem value="dashed">Tirets</SelectItem>
                        <SelectItem value="dotted">Points</SelectItem>
                        <SelectItem value="none">Aucune</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {config.borderWidth > 0 && (
                  <div className="flex gap-2 items-center">
                    <Input
                      type="color"
                      value={config.borderColor}
                      onChange={(e) => setConfig(prev => ({ ...prev, borderColor: e.target.value }))}
                      className="w-20 h-10 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={config.borderColor}
                      onChange={(e) => setConfig(prev => ({ ...prev, borderColor: e.target.value }))}
                      placeholder="#000000"
                      className="font-mono"
                    />
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Onglet Dégradé */}
          <TabsContent value="gradient" className="space-y-4 mt-4">
            <div className="flex items-center justify-between p-4 border rounded-lg bg-gradient-to-r from-pink-500 to-violet-600 text-white">
              <div className="space-y-0.5">
                <Label className="text-base text-white">Utiliser un dégradé</Label>
                <p className="text-sm text-white/90">
                  Créez des boutons avec des dégradés modernes
                </p>
              </div>
              <Switch
                checked={config.useGradient}
                onCheckedChange={(checked) => setConfig(prev => ({ ...prev, useGradient: checked }))}
              />
            </div>

            {config.useGradient && (
              <>
                <div className="space-y-2">
                  <Label>Type de dégradé</Label>
                  <Select 
                    value={config.gradientType} 
                    onValueChange={(value: 'linear' | 'radial') => 
                      setConfig(prev => ({ ...prev, gradientType: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="linear">Linéaire</SelectItem>
                      <SelectItem value="radial">Radial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Couleur de départ</Label>
                  <div className="grid grid-cols-4 gap-2 mb-2">
                    {colorPresets.map((preset) => (
                      <button
                        key={`grad1-${preset.value}`}
                        type="button"
                        onClick={() => setConfig(prev => ({ ...prev, gradientColor1: preset.value }))}
                        className="h-10 rounded-md border-2 hover:scale-105 transition-transform"
                        style={{ 
                          backgroundColor: preset.value,
                          borderColor: config.gradientColor1 === preset.value ? '#3b82f6' : 'transparent'
                        }}
                        title={preset.name}
                      />
                    ))}
                  </div>
                  <div className="flex gap-2 items-center">
                    <Input
                      type="color"
                      value={config.gradientColor1}
                      onChange={(e) => setConfig(prev => ({ ...prev, gradientColor1: e.target.value }))}
                      className="w-20 h-10 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={config.gradientColor1}
                      onChange={(e) => setConfig(prev => ({ ...prev, gradientColor1: e.target.value }))}
                      placeholder="#ec4899"
                      className="font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Couleur de fin</Label>
                  <div className="grid grid-cols-4 gap-2 mb-2">
                    {colorPresets.map((preset) => (
                      <button
                        key={`grad2-${preset.value}`}
                        type="button"
                        onClick={() => setConfig(prev => ({ ...prev, gradientColor2: preset.value }))}
                        className="h-10 rounded-md border-2 hover:scale-105 transition-transform"
                        style={{ 
                          backgroundColor: preset.value,
                          borderColor: config.gradientColor2 === preset.value ? '#3b82f6' : 'transparent'
                        }}
                        title={preset.name}
                      />
                    ))}
                  </div>
                  <div className="flex gap-2 items-center">
                    <Input
                      type="color"
                      value={config.gradientColor2}
                      onChange={(e) => setConfig(prev => ({ ...prev, gradientColor2: e.target.value }))}
                      className="w-20 h-10 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={config.gradientColor2}
                      onChange={(e) => setConfig(prev => ({ ...prev, gradientColor2: e.target.value }))}
                      placeholder="#8b5cf6"
                      className="font-mono"
                    />
                  </div>
                </div>

                {config.gradientType === 'linear' && (
                  <div className="space-y-2">
                    <Label>Angle du dégradé: {config.gradientAngle}°</Label>
                    <Slider
                      value={[config.gradientAngle]}
                      onValueChange={([value]) => setConfig(prev => ({ ...prev, gradientAngle: value }))}
                      min={0}
                      max={360}
                      step={15}
                      className="w-full"
                    />
                    <div className="grid grid-cols-4 gap-2 mt-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setConfig(prev => ({ ...prev, gradientAngle: 0 }))}
                      >
                        0° (→)
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setConfig(prev => ({ ...prev, gradientAngle: 90 }))}
                      >
                        90° (↓)
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setConfig(prev => ({ ...prev, gradientAngle: 180 }))}
                      >
                        180° (←)
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setConfig(prev => ({ ...prev, gradientAngle: 270 }))}
                      >
                        270° (↑)
                      </Button>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-0.5">
                    <Label className="text-base">Animation au survol</Label>
                    <p className="text-sm text-muted-foreground">
                      Le dégradé pivote de 45° au survol
                    </p>
                  </div>
                  <Switch
                    checked={config.hoverGradientShift}
                    onCheckedChange={(checked) => setConfig(prev => ({ ...prev, hoverGradientShift: checked }))}
                  />
                </div>
              </>
            )}
          </TabsContent>

          {/* Onglet Tailles */}
          <TabsContent value="size" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Taille prédéfinie</Label>
              <div className="grid grid-cols-3 gap-2">
                {(['small', 'medium', 'large'] as const).map((size) => (
                  <Button
                    key={size}
                    type="button"
                    variant={config.size === size ? 'default' : 'outline'}
                    onClick={() => setConfig(prev => ({ ...prev, size }))}
                    className="capitalize"
                  >
                    {size === 'small' ? 'Petit' : size === 'medium' ? 'Moyen' : 'Grand'}
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Espacement horizontal: {config.paddingX}px</Label>
                <Slider
                  value={[config.paddingX]}
                  onValueChange={([value]) => setConfig(prev => ({ ...prev, paddingX: value }))}
                  min={8}
                  max={80}
                  step={4}
                />
              </div>
              <div className="space-y-2">
                <Label>Espacement vertical: {config.paddingY}px</Label>
                <Slider
                  value={[config.paddingY]}
                  onValueChange={([value]) => setConfig(prev => ({ ...prev, paddingY: value }))}
                  min={4}
                  max={40}
                  step={2}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Arrondi des coins: {config.borderRadius}px</Label>
              <Slider
                value={[config.borderRadius]}
                onValueChange={([value]) => setConfig(prev => ({ ...prev, borderRadius: value }))}
                min={0}
                max={50}
                step={1}
              />
            </div>

            <div className="space-y-2">
              <Label>Largeur du bouton</Label>
              <Select 
                value={config.width} 
                onValueChange={(value: 'auto' | 'full' | 'custom') => 
                  setConfig(prev => ({ ...prev, width: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Automatique (adapté au texte)</SelectItem>
                  <SelectItem value="custom">Personnalisée</SelectItem>
                  <SelectItem value="full">Pleine largeur</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {config.width === 'custom' && (
              <div className="space-y-2">
                <Label>Largeur personnalisée: {config.customWidth}px</Label>
                <Slider
                  value={[config.customWidth]}
                  onValueChange={([value]) => setConfig(prev => ({ ...prev, customWidth: value }))}
                  min={100}
                  max={600}
                  step={10}
                />
              </div>
            )}
          </TabsContent>

          {/* Onglet Effets */}
          <TabsContent value="effects" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Ombre portée</Label>
              <Select 
                value={config.shadowSize} 
                onValueChange={(value: 'none' | 'sm' | 'md' | 'lg') => 
                  setConfig(prev => ({ ...prev, shadowSize: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucune</SelectItem>
                  <SelectItem value="sm">Petite</SelectItem>
                  <SelectItem value="md">Moyenne</SelectItem>
                  <SelectItem value="lg">Grande</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-0.5">
                <Label className="text-base">Effet au survol</Label>
                <p className="text-sm text-muted-foreground">
                  Le bouton se soulève avec une ombre plus grande
                </p>
              </div>
              <Switch
                checked={config.hoverEffect}
                onCheckedChange={(checked) => setConfig(prev => ({ ...prev, hoverEffect: checked }))}
              />
            </div>

            <div className="p-4 bg-muted/30 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">💡 Conseils d'accessibilité :</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Assurez-vous d'un bon contraste entre le texte et le fond</li>
                <li>• Les dégradés fonctionnent mieux avec des couleurs adjacentes</li>
                <li>• Gardez une taille de bouton suffisante pour le mobile</li>
                <li>• Les animations subtiles améliorent l'expérience</li>
              </ul>
            </div>
          </TabsContent>
        </Tabs>

        {/* Aperçu du bouton avec hover */}
        <div className="mt-6 p-6 bg-gradient-to-br from-muted/30 to-muted/10 rounded-lg border">
          <p className="text-sm font-medium mb-3 text-muted-foreground">Aperçu en temps réel (survolez pour voir l'animation) :</p>
          <div style={{ textAlign: config.align }}>
            <a
              href={config.url}
              style={getButtonStyle()}
              onClick={(e) => e.preventDefault()}
              onMouseEnter={(e) => {
                if (config.hoverEffect) {
                  e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                  e.currentTarget.style.boxShadow = '0 12px 24px -6px rgba(0, 0, 0, 0.25)';
                }
                if (config.useGradient && config.hoverGradientShift) {
                  const shiftedAngle = (config.gradientAngle + 45) % 360;
                  if (config.gradientType === 'linear') {
                    e.currentTarget.style.background = `linear-gradient(${shiftedAngle}deg, ${config.gradientColor1}, ${config.gradientColor2})`;
                  } else {
                    e.currentTarget.style.background = `radial-gradient(circle at 30% 30%, ${config.gradientColor1}, ${config.gradientColor2})`;
                  }
                }
              }}
              onMouseLeave={(e) => {
                if (config.hoverEffect) {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  const shadowMap = {
                    none: 'none',
                    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                  };
                  e.currentTarget.style.boxShadow = shadowMap[config.shadowSize];
                }
                e.currentTarget.style.background = getButtonBackground();
              }}
            >
              {config.text || 'Texte du bouton'}
            </a>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button 
            type="button" 
            onClick={handleSave}
            disabled={!config.text.trim() || !config.url.trim()}
          >
            {initialConfig ? 'Mettre à jour le bouton' : 'Insérer le bouton'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};