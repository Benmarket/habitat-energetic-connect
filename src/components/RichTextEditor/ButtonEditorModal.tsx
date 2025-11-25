import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { useState, useEffect } from "react";
import { AlignLeft, AlignCenter, AlignRight } from "lucide-react";

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
};

const sizePresets = {
  small: { paddingX: 16, paddingY: 8, fontSize: '14px' },
  medium: { paddingX: 24, paddingY: 12, fontSize: '16px' },
  large: { paddingX: 32, paddingY: 16, fontSize: '18px' },
};

const colorPresets = [
  { name: 'Vert (Primaire)', value: '#10b981' },
  { name: 'Bleu', value: '#3b82f6' },
  { name: 'Rouge', value: '#ef4444' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Violet', value: '#8b5cf6' },
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

  const applySize = (size: 'small' | 'medium' | 'large') => {
    const preset = sizePresets[size];
    setConfig(prev => ({
      ...prev,
      size,
      paddingX: preset.paddingX,
      paddingY: preset.paddingY,
    }));
  };

  const getButtonStyle = (): React.CSSProperties => {
    const preset = sizePresets[config.size];
    return {
      backgroundColor: config.backgroundColor,
      color: config.textColor,
      paddingLeft: `${config.paddingX}px`,
      paddingRight: `${config.paddingX}px`,
      paddingTop: `${config.paddingY}px`,
      paddingBottom: `${config.paddingY}px`,
      borderRadius: `${config.borderRadius}px`,
      fontSize: preset.fontSize,
      fontWeight: 500,
      cursor: 'pointer',
      border: 'none',
      display: 'inline-block',
      textDecoration: 'none',
      transition: 'all 0.2s',
      width: config.width === 'full' ? '100%' : config.width === 'custom' ? `${config.customWidth}px` : 'auto',
      textAlign: 'center',
    };
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Personnaliser le bouton</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="content" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="content">Contenu</TabsTrigger>
            <TabsTrigger value="style">Style</TabsTrigger>
            <TabsTrigger value="layout">Disposition</TabsTrigger>
          </TabsList>

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
          </TabsContent>

          <TabsContent value="style" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Taille du bouton</Label>
              <div className="grid grid-cols-3 gap-2">
                {(['small', 'medium', 'large'] as const).map((size) => (
                  <Button
                    key={size}
                    type="button"
                    variant={config.size === size ? 'default' : 'outline'}
                    onClick={() => applySize(size)}
                    className="capitalize"
                  >
                    {size === 'small' ? 'Petit' : size === 'medium' ? 'Moyen' : 'Grand'}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Couleur de fond</Label>
              <div className="grid grid-cols-4 gap-2 mb-2">
                {colorPresets.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => setConfig(prev => ({ ...prev, backgroundColor: preset.value }))}
                    className="h-10 rounded border-2 hover:scale-105 transition-transform"
                    style={{ 
                      backgroundColor: preset.value,
                      borderColor: config.backgroundColor === preset.value ? '#000' : 'transparent'
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
                  className="w-20 h-10"
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
                  className="w-20 h-10"
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

            <div className="space-y-2">
              <Label>Arrondi des coins: {config.borderRadius}px</Label>
              <Slider
                value={[config.borderRadius]}
                onValueChange={([value]) => setConfig(prev => ({ ...prev, borderRadius: value }))}
                min={0}
                max={50}
                step={1}
                className="w-full"
              />
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
          </TabsContent>

          <TabsContent value="layout" className="space-y-4 mt-4">
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

            <div className="space-y-2">
              <Label>Alignement</Label>
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
        </Tabs>

        {/* Aperçu */}
        <div className="mt-6 p-6 bg-muted/30 rounded-lg border">
          <p className="text-sm font-medium mb-3 text-muted-foreground">Aperçu du bouton :</p>
          <div style={{ textAlign: config.align }}>
            <a
              href={config.url}
              style={getButtonStyle()}
              onClick={(e) => e.preventDefault()}
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
            {initialConfig ? 'Mettre à jour' : 'Insérer le bouton'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};