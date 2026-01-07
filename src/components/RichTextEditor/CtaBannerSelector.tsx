import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Waves, Box, Sparkles, Minus, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
interface CtaBanner {
  id: string;
  name: string;
  template_style: string;
  background_color: string;
  secondary_color: string;
  text_color: string;
  accent_color: string;
  title: string;
  subtitle: string | null;
  is_favorite: boolean;
}

interface ButtonPreset {
  id: string;
  name: string;
  text: string;
  background_color: string;
  text_color: string;
  use_gradient: boolean;
  gradient_color1: string;
  gradient_color2: string;
  gradient_angle: number;
  border_radius: number;
}

interface Popup {
  id: string;
  name: string;
  title: string | null;
}

interface CtaBannerSelectorProps {
  open: boolean;
  onClose: () => void;
  onInsert: (bannerHtml: string) => void;
}

export const CtaBannerSelector = ({ open, onClose, onInsert }: CtaBannerSelectorProps) => {
  const { toast } = useToast();
  const [banners, setBanners] = useState<CtaBanner[]>([]);
  const [buttons, setButtons] = useState<ButtonPreset[]>([]);
  const [popups, setPopups] = useState<Popup[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedBannerId, setSelectedBannerId] = useState<string>('');
  const [selectedButtonId, setSelectedButtonId] = useState<string>('');
  const [selectedPopupId, setSelectedPopupId] = useState<string>('');
  
  // Custom text fields
  const [customTitle, setCustomTitle] = useState<string>('');
  const [customSubtitle, setCustomSubtitle] = useState<string>('');
  const [customButtonText, setCustomButtonText] = useState<string>('');

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load banners
      const { data: bannersData } = await supabase
        .from('cta_banners')
        .select('*')
        .eq('user_id', user.id)
        .order('is_favorite', { ascending: false })
        .order('name');

      // Load buttons
      const { data: buttonsData } = await supabase
        .from('button_presets')
        .select('*')
        .eq('user_id', user.id)
        .order('is_favorite', { ascending: false })
        .order('name');

      // Load popups
      const { data: popupsData } = await supabase
        .from('popups')
        .select('id, name, title')
        .eq('is_active', true)
        .order('name');

      setBanners(bannersData || []);
      setButtons(buttonsData || []);
      setPopups(popupsData || []);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les données",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedBanner = banners.find(b => b.id === selectedBannerId);
  const selectedButton = buttons.find(b => b.id === selectedButtonId);

  // Get the display text (custom or default)
  const displayTitle = customTitle || selectedBanner?.title || '';
  const displaySubtitle = customSubtitle || selectedBanner?.subtitle || '';
  const displayButtonText = customButtonText || selectedButton?.text || '';

  // Update custom text when banner/button changes
  useEffect(() => {
    if (selectedBanner) {
      setCustomTitle(selectedBanner.title);
      setCustomSubtitle(selectedBanner.subtitle || '');
    }
  }, [selectedBannerId]);

  useEffect(() => {
    if (selectedButton) {
      setCustomButtonText(selectedButton.text);
    }
  }, [selectedButtonId]);

  const renderBannerPreview = (banner: CtaBanner) => {
    const style = banner.template_style;
    
    const getBackgroundStyle = () => {
      switch (style) {
        case 'wave':
          return {
            background: `linear-gradient(135deg, ${banner.background_color} 0%, ${banner.secondary_color} 100%)`,
          };
        case 'geometric':
          return {
            background: banner.background_color,
            backgroundImage: `linear-gradient(45deg, ${banner.secondary_color} 25%, transparent 25%), 
                              linear-gradient(-45deg, ${banner.secondary_color} 25%, transparent 25%)`,
            backgroundSize: '20px 20px',
          };
        case 'gradient':
          return {
            background: `linear-gradient(90deg, ${banner.background_color} 0%, ${banner.secondary_color} 50%, ${banner.accent_color} 100%)`,
          };
        case 'minimal':
          return {
            background: banner.background_color,
            borderLeft: `4px solid ${banner.accent_color}`,
          };
        default:
          return { background: banner.background_color };
      }
    };

    return (
      <div 
        className="rounded-lg p-4 text-center relative overflow-hidden"
        style={getBackgroundStyle()}
      >
        <h4 className="text-lg font-bold mb-1" style={{ color: banner.text_color }}>
          {displayTitle}
        </h4>
        {displaySubtitle && (
          <p className="text-sm opacity-90" style={{ color: banner.text_color }}>
            {displaySubtitle}
          </p>
        )}
        {selectedButton && (
          <div 
            className="mt-3 inline-block px-4 py-2 rounded font-medium text-sm"
            style={{ 
              background: selectedButton.use_gradient 
                ? `linear-gradient(${selectedButton.gradient_angle}deg, ${selectedButton.gradient_color1}, ${selectedButton.gradient_color2})`
                : selectedButton.background_color,
              color: selectedButton.text_color,
              borderRadius: `${selectedButton.border_radius}px`
            }}
          >
            {displayButtonText}
          </div>
        )}
      </div>
    );
  };

  const handleInsert = () => {
    if (!selectedBanner || !selectedButton) {
      toast({
        title: "Sélection requise",
        description: "Veuillez sélectionner un bandeau et un bouton",
        variant: "destructive"
      });
      return;
    }

    const style = selectedBanner.template_style;
    
    const getBackgroundCss = () => {
      switch (style) {
        case 'wave':
          return `background: linear-gradient(135deg, ${selectedBanner.background_color} 0%, ${selectedBanner.secondary_color} 100%);`;
        case 'geometric':
          return `background: ${selectedBanner.background_color}; background-image: linear-gradient(45deg, ${selectedBanner.secondary_color} 25%, transparent 25%), linear-gradient(-45deg, ${selectedBanner.secondary_color} 25%, transparent 25%); background-size: 20px 20px;`;
        case 'gradient':
          return `background: linear-gradient(90deg, ${selectedBanner.background_color} 0%, ${selectedBanner.secondary_color} 50%, ${selectedBanner.accent_color} 100%);`;
        case 'minimal':
          return `background: ${selectedBanner.background_color}; border-left: 4px solid ${selectedBanner.accent_color};`;
        default:
          return `background: ${selectedBanner.background_color};`;
      }
    };

    const buttonBackground = selectedButton.use_gradient 
      ? `linear-gradient(${selectedButton.gradient_angle}deg, ${selectedButton.gradient_color1}, ${selectedButton.gradient_color2})`
      : selectedButton.background_color;

    const popupAttr = selectedPopupId ? ` data-popup-trigger="${selectedPopupId}"` : '';
    const hrefAttr = selectedPopupId ? 'href="#"' : 'href="#contact"';

    const bannerHtml = `
<div data-cta-banner="${selectedBanner.id}" class="cta-banner-wrapper my-8" style="border-radius: 12px; overflow: hidden; ${getBackgroundCss()}">
  <div style="padding: 32px; text-align: center; position: relative;">
    <h3 style="color: ${selectedBanner.text_color}; font-size: 24px; font-weight: 700; margin-bottom: 8px;">${displayTitle}</h3>
    ${displaySubtitle ? `<p style="color: ${selectedBanner.text_color}; opacity: 0.9; margin-bottom: 16px;">${displaySubtitle}</p>` : ''}
    <a ${hrefAttr}${popupAttr} style="display: inline-block; padding: 12px 24px; background: ${buttonBackground}; color: ${selectedButton.text_color}; font-weight: 500; border-radius: ${selectedButton.border_radius}px; text-decoration: none; cursor: pointer;">${displayButtonText}</a>
  </div>
</div>
    `.trim();

    onInsert(bannerHtml);
    onClose();
    
    toast({
      title: "Bandeau inséré",
      description: "Le bandeau CTA a été ajouté à votre contenu"
    });
  };

  const STYLE_ICONS: Record<string, typeof Waves> = {
    wave: Waves,
    geometric: Box,
    gradient: Sparkles,
    minimal: Minus,
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Insérer un bandeau CTA</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-6">
            {/* Selection */}
            <div className="space-y-4">
              <div>
                <Label>1. Choisir un bandeau</Label>
                <ScrollArea className="h-[200px] mt-2 border rounded-lg p-2">
                  <div className="space-y-2">
                    {banners.map((banner) => {
                      const StyleIcon = STYLE_ICONS[banner.template_style] || Waves;
                      return (
                        <button
                          key={banner.id}
                          onClick={() => setSelectedBannerId(banner.id)}
                          className={`w-full p-3 rounded-lg text-left flex items-center gap-3 transition-colors ${
                            selectedBannerId === banner.id 
                              ? 'bg-primary text-primary-foreground' 
                              : 'hover:bg-muted'
                          }`}
                        >
                          <div 
                            className="w-8 h-8 rounded flex items-center justify-center"
                            style={{ backgroundColor: banner.background_color }}
                          >
                            <StyleIcon className="w-4 h-4" style={{ color: banner.text_color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{banner.name}</p>
                            <p className="text-xs opacity-70 truncate">{banner.title}</p>
                          </div>
                          {selectedBannerId === banner.id && (
                            <Check className="w-4 h-4" />
                          )}
                        </button>
                      );
                    })}
                    {banners.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Aucun bandeau disponible
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </div>

              <div>
                <Label>2. Choisir un bouton</Label>
                <Select value={selectedButtonId} onValueChange={setSelectedButtonId}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Sélectionner un bouton" />
                  </SelectTrigger>
                  <SelectContent>
                    {buttons.map((button) => (
                      <SelectItem key={button.id} value={button.id}>
                        <span className="flex items-center gap-2">
                          <span 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: button.background_color }}
                          />
                          {button.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Text customization */}
              {selectedBannerId && (
                <div className="space-y-3 p-3 bg-muted/50 rounded-lg">
                  <Label className="text-sm font-medium">Personnaliser le texte</Label>
                  <div>
                    <Label className="text-xs text-muted-foreground">Titre de la bannière</Label>
                    <Input
                      value={customTitle}
                      onChange={(e) => setCustomTitle(e.target.value)}
                      placeholder="Titre..."
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Sous-titre (optionnel)</Label>
                    <Input
                      value={customSubtitle}
                      onChange={(e) => setCustomSubtitle(e.target.value)}
                      placeholder="Sous-titre..."
                      className="mt-1"
                    />
                  </div>
                  {selectedButtonId && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Texte du bouton</Label>
                      <Input
                        value={customButtonText}
                        onChange={(e) => setCustomButtonText(e.target.value)}
                        placeholder="Texte du bouton..."
                        className="mt-1"
                      />
                    </div>
                  )}
                </div>
              )}

              <div>
                <Label>3. Action du bouton (optionnel)</Label>
                <Select value={selectedPopupId || "none"} onValueChange={(val) => setSelectedPopupId(val === "none" ? "" : val)}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Ouvrir un popup..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucun popup (lien standard)</SelectItem>
                    {popups.map((popup) => (
                      <SelectItem key={popup.id} value={popup.id}>
                        {popup.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Sélectionnez un popup pour l'ouvrir au clic
                </p>
              </div>
            </div>

            {/* Preview */}
            <div>
              <Label className="mb-2 block">Aperçu</Label>
              {selectedBanner ? (
                renderBannerPreview(selectedBanner)
              ) : (
                <div className="h-[200px] border-2 border-dashed rounded-lg flex items-center justify-center text-muted-foreground">
                  Sélectionnez un bandeau
                </div>
              )}

              <div className="mt-6 flex gap-2">
                <Button variant="outline" onClick={onClose} className="flex-1">
                  Annuler
                </Button>
                <Button 
                  onClick={handleInsert} 
                  className="flex-1"
                  disabled={!selectedBannerId || !selectedButtonId}
                >
                  Insérer
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};