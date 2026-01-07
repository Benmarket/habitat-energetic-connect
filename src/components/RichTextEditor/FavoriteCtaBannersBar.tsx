import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Waves, Box, Sparkles, Minus } from "lucide-react";

interface FavoriteBanner {
  id: string;
  name: string;
  template_style: string;
  background_color: string;
  secondary_color: string;
  text_color: string;
  accent_color: string;
  title: string;
  subtitle: string | null;
}

interface FavoriteCtaBannersBarProps {
  onSelectBanner: (bannerHtml: string) => void;
}

export const FavoriteCtaBannersBar = ({ onSelectBanner }: FavoriteCtaBannersBarProps) => {
  const [favorites, setFavorites] = useState<FavoriteBanner[]>([]);
  const [defaultButton, setDefaultButton] = useState<{
    text: string;
    background_color: string;
    text_color: string;
    border_radius: number;
    use_gradient: boolean;
    gradient_color1: string;
    gradient_color2: string;
    gradient_angle: number;
  } | null>(null);

  useEffect(() => {
    loadFavorites();
    loadDefaultButton();
  }, []);

  const loadFavorites = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('cta_banners')
      .select('id, name, template_style, background_color, secondary_color, text_color, accent_color, title, subtitle')
      .eq('user_id', user.id)
      .eq('is_favorite', true)
      .order('favorite_order', { ascending: true })
      .limit(5);

    if (data) {
      setFavorites(data);
    }
  };

  const loadDefaultButton = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('button_presets')
      .select('text, background_color, text_color, border_radius, use_gradient, gradient_color1, gradient_color2, gradient_angle')
      .eq('user_id', user.id)
      .eq('is_favorite', true)
      .order('favorite_order', { ascending: true })
      .limit(1)
      .single();

    if (data) {
      setDefaultButton(data);
    } else {
      // Fallback default button
      setDefaultButton({
        text: 'En savoir plus',
        background_color: '#10b981',
        text_color: '#ffffff',
        border_radius: 6,
        use_gradient: false,
        gradient_color1: '#10b981',
        gradient_color2: '#059669',
        gradient_angle: 90
      });
    }
  };

  const getBackgroundStyle = (banner: FavoriteBanner) => {
    switch (banner.template_style) {
      case 'wave':
        return `linear-gradient(135deg, ${banner.background_color} 0%, ${banner.secondary_color} 100%)`;
      case 'geometric':
        return banner.background_color;
      case 'gradient':
        return `linear-gradient(90deg, ${banner.background_color}, ${banner.secondary_color})`;
      case 'minimal':
        return banner.background_color;
      default:
        return banner.background_color;
    }
  };

  const getBackgroundCss = (banner: FavoriteBanner) => {
    switch (banner.template_style) {
      case 'wave':
        return `background: linear-gradient(135deg, ${banner.background_color} 0%, ${banner.secondary_color} 100%);`;
      case 'geometric':
        return `background: ${banner.background_color}; background-image: linear-gradient(45deg, ${banner.secondary_color} 25%, transparent 25%), linear-gradient(-45deg, ${banner.secondary_color} 25%, transparent 25%); background-size: 20px 20px;`;
      case 'gradient':
        return `background: linear-gradient(90deg, ${banner.background_color} 0%, ${banner.secondary_color} 50%, ${banner.accent_color} 100%);`;
      case 'minimal':
        return `background: ${banner.background_color}; border-left: 4px solid ${banner.accent_color};`;
      default:
        return `background: ${banner.background_color};`;
    }
  };

  const handleBannerClick = (banner: FavoriteBanner) => {
    if (!defaultButton) return;

    const buttonBackground = defaultButton.use_gradient 
      ? `linear-gradient(${defaultButton.gradient_angle}deg, ${defaultButton.gradient_color1}, ${defaultButton.gradient_color2})`
      : defaultButton.background_color;

    const bannerHtml = `
<div data-cta-banner="${banner.id}" class="cta-banner-wrapper my-8" style="border-radius: 12px; overflow: hidden; ${getBackgroundCss(banner)}">
  <div style="padding: 32px; text-align: center; position: relative;">
    <h3 style="color: ${banner.text_color}; font-size: 24px; font-weight: 700; margin-bottom: 8px;">${banner.title}</h3>
    ${banner.subtitle ? `<p style="color: ${banner.text_color}; opacity: 0.9; margin-bottom: 16px;">${banner.subtitle}</p>` : ''}
    <a href="#contact" style="display: inline-block; padding: 12px 24px; background: ${buttonBackground}; color: ${defaultButton.text_color}; font-weight: 500; border-radius: ${defaultButton.border_radius}px; text-decoration: none; cursor: pointer;">${defaultButton.text}</a>
  </div>
</div>
    `.trim();

    onSelectBanner(bannerHtml);
  };

  const STYLE_ICONS: Record<string, typeof Waves> = {
    wave: Waves,
    geometric: Box,
    gradient: Sparkles,
    minimal: Minus,
  };

  if (favorites.length === 0) return null;

  return (
    <div className="border-b bg-muted/30 px-4 py-2">
      <div className="flex items-center gap-2 mb-2">
        <Waves className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium text-muted-foreground">Bandeaux CTA favoris</span>
      </div>
      <ScrollArea className="w-full">
        <div className="flex gap-2 pb-2">
          {favorites.map((banner) => {
            const StyleIcon = STYLE_ICONS[banner.template_style] || Waves;
            return (
              <Button
                key={banner.id}
                type="button"
                variant="ghost"
                onClick={() => handleBannerClick(banner)}
                className="h-auto p-2 flex items-center gap-2 hover:bg-background"
              >
                <div 
                  className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0"
                  style={{ background: getBackgroundStyle(banner) }}
                >
                  <StyleIcon className="w-4 h-4" style={{ color: banner.text_color }} />
                </div>
                <span className="text-xs max-w-[100px] truncate">{banner.name}</span>
              </Button>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
};