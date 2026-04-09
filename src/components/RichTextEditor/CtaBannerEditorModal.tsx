import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect } from "react";
import { Waves, Box, Sparkles, Minus, ExternalLink, FileText, Layers, Hash } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { CtaBannerAttributes } from "./CustomCtaBanner";

interface CtaBannerEditorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (config: Partial<CtaBannerAttributes>) => void;
  initialConfig?: Partial<CtaBannerAttributes>;
  isEditing?: boolean;
}

const defaultConfig: CtaBannerAttributes = {
  bannerId: '',
  templateStyle: 'wave',
  backgroundColor: '#10b981',
  secondaryColor: '#059669',
  textColor: '#ffffff',
  accentColor: '#34d399',
  title: 'Titre du bandeau',
  subtitle: '',
  buttonText: 'En savoir plus',
  buttonUrl: '#contact',
  buttonBackground: '#ffffff',
  buttonTextColor: '#10b981',
  buttonBorderRadius: 6,
  popupId: null,
};

const templateStyles = [
  { id: 'wave', name: 'Vague', icon: Waves },
  { id: 'geometric', name: 'Géométrique', icon: Box },
  { id: 'gradient', name: 'Dégradé', icon: Sparkles },
  { id: 'minimal', name: 'Minimal', icon: Minus },
];

const colorPresets = [
  { name: 'Vert', bg: '#10b981', secondary: '#059669', accent: '#34d399' },
  { name: 'Bleu', bg: '#3b82f6', secondary: '#2563eb', accent: '#60a5fa' },
  { name: 'Violet', bg: '#8b5cf6', secondary: '#7c3aed', accent: '#a78bfa' },
  { name: 'Rose', bg: '#ec4899', secondary: '#db2777', accent: '#f472b6' },
  { name: 'Orange', bg: '#f97316', secondary: '#ea580c', accent: '#fb923c' },
];

export const CtaBannerEditorModal = ({
  open,
  onOpenChange,
  onSave,
  initialConfig,
  isEditing = false,
}: CtaBannerEditorModalProps) => {
  const [config, setConfig] = useState<CtaBannerAttributes>({
    ...defaultConfig,
    ...initialConfig,
  });
  const [availablePopups, setAvailablePopups] = useState<Array<{ id: string; name: string }>>([]);
  const [availablePages, setAvailablePages] = useState<Array<{ path: string; label: string }>>([]);
  const [destinationType, setDestinationType] = useState<'anchor' | 'internal' | 'external' | 'popup'>('anchor');

  useEffect(() => {
    if (open) {
      setConfig({
        ...defaultConfig,
        ...initialConfig,
      });
      loadAvailablePopups();
      loadAvailablePages();
      // Déterminer le type de destination initial
      if (initialConfig?.popupId) {
        setDestinationType('popup');
      } else if (initialConfig?.buttonUrl?.startsWith('http')) {
        setDestinationType('external');
      } else if (initialConfig?.buttonUrl?.startsWith('/')) {
        setDestinationType('internal');
      } else {
        setDestinationType('anchor');
      }
    }
  }, [open, initialConfig]);

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

  const loadAvailablePages = async () => {
    const staticPages = [
      { path: '/', label: 'Accueil' },
      { path: '/actualites', label: 'Actualités' },
      { path: '/guides', label: 'Guides' },
      { path: '/aides', label: 'Aides' },
      { path: '/simulateur-solaire', label: 'Simulateur Solaire' },
      { path: '/faq', label: 'FAQ' },
      { path: '/forum', label: 'Forum' },
      { path: '/installer-app', label: 'Installer l\'app' },
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

      setAvailablePages([...staticPages, ...lpPages]);
    } catch {
      setAvailablePages(staticPages);
    }
  };

  const handleSave = () => {
    onSave(config);
    onOpenChange(false);
  };

  const applyColorPreset = (preset: typeof colorPresets[0]) => {
    setConfig(prev => ({
      ...prev,
      backgroundColor: preset.bg,
      secondaryColor: preset.secondary,
      accentColor: preset.accent,
    }));
  };

  const getBackgroundStyle = (): React.CSSProperties => {
    switch (config.templateStyle) {
      case 'wave':
        return {
          background: `linear-gradient(135deg, ${config.backgroundColor} 0%, ${config.secondaryColor} 100%)`,
        };
      case 'geometric':
        return {
          background: config.backgroundColor,
          backgroundImage: `linear-gradient(45deg, ${config.secondaryColor} 25%, transparent 25%), 
                            linear-gradient(-45deg, ${config.secondaryColor} 25%, transparent 25%)`,
          backgroundSize: '20px 20px',
        };
      case 'gradient':
        return {
          background: `linear-gradient(90deg, ${config.backgroundColor} 0%, ${config.secondaryColor} 50%, ${config.accentColor} 100%)`,
        };
      case 'minimal':
        return {
          background: config.backgroundColor,
          borderLeft: `4px solid ${config.accentColor}`,
        };
      default:
        return { background: config.backgroundColor };
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Waves className="w-5 h-5 text-primary" />
            Personnaliser le bandeau CTA
          </DialogTitle>
        </DialogHeader>

        {/* Presets couleurs */}
        <div className="space-y-2 pb-4 border-b">
          <Label className="text-sm font-medium">Palettes de couleurs</Label>
          <div className="flex gap-2">
            {colorPresets.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => applyColorPreset(preset)}
                className="flex-1 p-2 rounded-lg border hover:border-primary transition-colors"
              >
                <div className="flex gap-1 mb-1">
                  <div className="w-4 h-4 rounded" style={{ background: preset.bg }} />
                  <div className="w-4 h-4 rounded" style={{ background: preset.secondary }} />
                  <div className="w-4 h-4 rounded" style={{ background: preset.accent }} />
                </div>
                <span className="text-xs">{preset.name}</span>
              </button>
            ))}
          </div>
        </div>

        <Tabs defaultValue="content" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="content">Contenu</TabsTrigger>
            <TabsTrigger value="style">Style</TabsTrigger>
            <TabsTrigger value="button">Bouton</TabsTrigger>
            <TabsTrigger value="destination">Destination</TabsTrigger>
          </TabsList>

          {/* Onglet Contenu */}
          <TabsContent value="content" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titre du bandeau *</Label>
              <Input
                id="title"
                placeholder="Ex: Profitez de notre offre"
                value={config.title}
                onChange={(e) => setConfig(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subtitle">Sous-titre (optionnel)</Label>
              <Input
                id="subtitle"
                placeholder="Ex: Offre valable jusqu'au..."
                value={config.subtitle}
                onChange={(e) => setConfig(prev => ({ ...prev, subtitle: e.target.value }))}
              />
            </div>
          </TabsContent>

          {/* Onglet Style */}
          <TabsContent value="style" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Type de design</Label>
              <div className="grid grid-cols-4 gap-2">
                {templateStyles.map((style) => {
                  const IconComponent = style.icon;
                  return (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() => setConfig(prev => ({ ...prev, templateStyle: style.id }))}
                      className={`p-3 rounded-lg border flex flex-col items-center gap-2 transition-colors ${
                        config.templateStyle === style.id ? 'border-primary bg-primary/10' : 'hover:border-muted-foreground'
                      }`}
                    >
                      <IconComponent className="w-5 h-5" />
                      <span className="text-xs">{style.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Couleur principale</Label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={config.backgroundColor}
                    onChange={(e) => setConfig(prev => ({ ...prev, backgroundColor: e.target.value }))}
                    className="w-10 h-10 rounded cursor-pointer"
                  />
                  <Input
                    value={config.backgroundColor}
                    onChange={(e) => setConfig(prev => ({ ...prev, backgroundColor: e.target.value }))}
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Couleur secondaire</Label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={config.secondaryColor}
                    onChange={(e) => setConfig(prev => ({ ...prev, secondaryColor: e.target.value }))}
                    className="w-10 h-10 rounded cursor-pointer"
                  />
                  <Input
                    value={config.secondaryColor}
                    onChange={(e) => setConfig(prev => ({ ...prev, secondaryColor: e.target.value }))}
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Couleur du texte</Label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={config.textColor}
                    onChange={(e) => setConfig(prev => ({ ...prev, textColor: e.target.value }))}
                    className="w-10 h-10 rounded cursor-pointer"
                  />
                  <Input
                    value={config.textColor}
                    onChange={(e) => setConfig(prev => ({ ...prev, textColor: e.target.value }))}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Onglet Bouton */}
          <TabsContent value="button" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="buttonText">Texte du bouton</Label>
              <Input
                id="buttonText"
                placeholder="Ex: En savoir plus"
                value={config.buttonText}
                onChange={(e) => setConfig(prev => ({ ...prev, buttonText: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fond du bouton</Label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={config.buttonBackground}
                    onChange={(e) => setConfig(prev => ({ ...prev, buttonBackground: e.target.value }))}
                    className="w-10 h-10 rounded cursor-pointer"
                  />
                  <Input
                    value={config.buttonBackground}
                    onChange={(e) => setConfig(prev => ({ ...prev, buttonBackground: e.target.value }))}
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Texte du bouton</Label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={config.buttonTextColor}
                    onChange={(e) => setConfig(prev => ({ ...prev, buttonTextColor: e.target.value }))}
                    className="w-10 h-10 rounded cursor-pointer"
                  />
                  <Input
                    value={config.buttonTextColor}
                    onChange={(e) => setConfig(prev => ({ ...prev, buttonTextColor: e.target.value }))}
                    className="flex-1"
                  />
                </div>
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
                  variant={destinationType === 'anchor' ? 'default' : 'outline'}
                  onClick={() => {
                    setDestinationType('anchor');
                    setConfig(prev => ({ ...prev, buttonUrl: '#contact', popupId: null }));
                  }}
                  className="gap-2 h-auto py-3 flex-col"
                >
                  <Hash className="w-5 h-5" />
                  <span className="text-xs">Ancre</span>
                </Button>
                <Button
                  type="button"
                  variant={destinationType === 'internal' ? 'default' : 'outline'}
                  onClick={() => {
                    setDestinationType('internal');
                    setConfig(prev => ({ ...prev, buttonUrl: '/', popupId: null }));
                  }}
                  className="gap-2 h-auto py-3 flex-col"
                >
                  <FileText className="w-5 h-5" />
                  <span className="text-xs">Page interne</span>
                </Button>
                <Button
                  type="button"
                  variant={destinationType === 'external' ? 'default' : 'outline'}
                  onClick={() => {
                    setDestinationType('external');
                    setConfig(prev => ({ ...prev, buttonUrl: 'https://', popupId: null }));
                  }}
                  className="gap-2 h-auto py-3 flex-col"
                >
                  <ExternalLink className="w-5 h-5" />
                  <span className="text-xs">Lien externe</span>
                </Button>
                <Button
                  type="button"
                  variant={destinationType === 'popup' ? 'default' : 'outline'}
                  onClick={() => {
                    setDestinationType('popup');
                    setConfig(prev => ({ ...prev, buttonUrl: '#popup' }));
                  }}
                  className="gap-2 h-auto py-3 flex-col"
                >
                  <Layers className="w-5 h-5" />
                  <span className="text-xs">Popup</span>
                </Button>
              </div>
            </div>

            {destinationType === 'popup' ? (
              <div className="space-y-2">
                <Label>Sélectionner un popup</Label>
                <Select 
                  value={config.popupId || ''} 
                  onValueChange={(val) => setConfig(prev => ({ ...prev, popupId: val || null }))}
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
              </div>
            ) : (
              <div className="space-y-2">
                <Label>URL de destination</Label>
                <Input
                  value={config.buttonUrl}
                  onChange={(e) => setConfig(prev => ({ ...prev, buttonUrl: e.target.value }))}
                  placeholder={destinationType === 'anchor' ? '#section' : destinationType === 'internal' ? '/page' : 'https://...'}
                />
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Aperçu */}
        <div className="mt-4 p-4 bg-muted/30 rounded-lg">
          <Label className="text-sm font-medium mb-2 block">Aperçu</Label>
          <div
            style={{
              ...getBackgroundStyle(),
              borderRadius: '12px',
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: '32px', textAlign: 'center' }}>
              <h3 style={{ 
                color: config.textColor, 
                fontSize: '24px', 
                fontWeight: 700, 
                marginBottom: '8px',
                margin: 0,
                marginBlockEnd: '8px'
              }}>
                {config.title || 'Titre du bandeau'}
              </h3>
              {config.subtitle && (
                <p style={{ 
                  color: config.textColor, 
                  opacity: 0.9, 
                  marginBottom: '16px',
                  margin: 0,
                  marginBlockEnd: '16px'
                }}>
                  {config.subtitle}
                </p>
              )}
              <span
                style={{
                  display: 'inline-block',
                  padding: '12px 24px',
                  background: config.buttonBackground,
                  color: config.buttonTextColor,
                  fontWeight: 500,
                  borderRadius: `${config.buttonBorderRadius}px`,
                  textDecoration: 'none',
                }}
              >
                {config.buttonText || 'Bouton'}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button 
            type="button" 
            onClick={handleSave}
            disabled={!config.title.trim()}
          >
            {isEditing ? 'Mettre à jour' : 'Insérer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
