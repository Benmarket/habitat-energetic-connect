import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useState, useEffect } from "react";
import { AlignLeft, AlignCenter, AlignRight, Sparkles } from "lucide-react";

interface ButtonConfig {
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
};

const presetStyles = [
  {
    name: 'Primaire (Vert)',
    config: {
      backgroundColor: '#10b981',
      textColor: '#ffffff',
      borderRadius: 6,
      borderWidth: 0,
      shadowSize: 'md' as const,
    }
  },
  {
    name: 'Secondaire (Bleu)',
    config: {
      backgroundColor: '#3b82f6',
      textColor: '#ffffff',
      borderRadius: 6,
      borderWidth: 0,
      shadowSize: 'md' as const,
    }
  },
  {
    name: 'Contour (Outline)',
    config: {
      backgroundColor: 'transparent',
      textColor: '#10b981',
      borderRadius: 6,
      borderWidth: 2,
      borderColor: '#10b981',
      shadowSize: 'none' as const,
    }
  },
  {
    name: 'Moderne (Gradient)',
    config: {
      backgroundColor: '#8b5cf6',
      textColor: '#ffffff',
      borderRadius: 50,
      borderWidth: 0,
      shadowSize: 'lg' as const,
    }
  },
];

const colorPresets = [
  { name: 'Vert', value: '#10b981' },
  { name: 'Bleu', value: '#3b82f6' },
  { name: 'Rouge', value: '#ef4444' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Violet', value: '#8b5cf6' },
  { name: 'Rose', value: '#ec4899' },
  { name: 'Gris foncé', value: '#1f2937' },
  { name: 'Noir', value: '#000000' },
];

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

  useEffect(() => {
    if (open) {
      setConfig({
        ...defaultConfig,
        ...initialConfig,
      });
    }
  }, [open, initialConfig]);

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
      backgroundColor: config.backgroundColor,
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
      transition: 'all 0.2s ease',
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
                className="h-auto py-2"
              >
                {preset.name}
              </Button>
            ))}
          </div>
        </div>

        <Tabs defaultValue="content" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="content">Contenu</TabsTrigger>
            <TabsTrigger value="style">Couleurs</TabsTrigger>
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
              <Label htmlFor="url">Lien (URL) *</Label>
              <Input
                id="url"
                placeholder="Ex: #contact ou https://..."
                value={config.url}
                onChange={(e) => setConfig(prev => ({ ...prev, url: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">
                Utilisez #contact, #section, etc. pour ancrer sur la page, ou une URL complète
              </p>
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

          {/* Onglet Couleurs */}
          <TabsContent value="style" className="space-y-4 mt-4">
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
                  Le bouton se soulève légèrement au survol de la souris
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
                <li>• Utilisez une ombre pour améliorer la visibilité</li>
                <li>• Gardez une taille de bouton suffisante pour le mobile</li>
              </ul>
            </div>
          </TabsContent>
        </Tabs>

        {/* Aperçu du bouton */}
        <div className="mt-6 p-6 bg-gradient-to-br from-muted/30 to-muted/10 rounded-lg border">
          <p className="text-sm font-medium mb-3 text-muted-foreground">Aperçu en temps réel :</p>
          <div style={{ textAlign: config.align }}>
            <a
              href={config.url}
              style={getButtonStyle()}
              onClick={(e) => e.preventDefault()}
              onMouseEnter={(e) => {
                if (config.hoverEffect) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 10px 20px -5px rgba(0, 0, 0, 0.2)';
                }
              }}
              onMouseLeave={(e) => {
                if (config.hoverEffect) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  const shadowMap = {
                    none: 'none',
                    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                  };
                  e.currentTarget.style.boxShadow = shadowMap[config.shadowSize];
                }
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