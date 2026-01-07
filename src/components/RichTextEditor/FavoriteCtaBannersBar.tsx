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
  title: string;
}

interface FavoriteCtaBannersBarProps {
  onSelectBanner: (bannerId: string) => void;
}

export const FavoriteCtaBannersBar = ({ onSelectBanner }: FavoriteCtaBannersBarProps) => {
  const [favorites, setFavorites] = useState<FavoriteBanner[]>([]);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('cta_banners')
      .select('id, name, template_style, background_color, secondary_color, text_color, title')
      .eq('user_id', user.id)
      .eq('is_favorite', true)
      .order('favorite_order', { ascending: true })
      .limit(5);

    if (data) {
      setFavorites(data);
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
                onClick={() => onSelectBanner(banner.id)}
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