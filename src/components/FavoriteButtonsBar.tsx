import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Star } from "lucide-react";

interface FavoriteButton {
  id: string;
  text: string;
  backgroundColor: string;
  textColor: string;
  size: 'small' | 'medium' | 'large';
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
}

interface FavoriteButtonsBarProps {
  onSelectButton: (config: any) => void;
}

export const FavoriteButtonsBar = ({ onSelectButton }: FavoriteButtonsBarProps) => {
  const [favorites, setFavorites] = useState<FavoriteButton[]>([]);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('button_presets')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_favorite', true)
      .order('favorite_order', { ascending: true })
      .limit(5);

    if (data) {
      setFavorites(data.map(p => ({
        id: p.id,
        text: p.text,
        backgroundColor: p.background_color,
        textColor: p.text_color,
        size: p.size as 'small' | 'medium' | 'large',
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
      })));
    }
  };

  const getButtonBackground = (btn: FavoriteButton) => {
    if (!btn.useGradient) return btn.backgroundColor;
    if (btn.gradientType === 'linear') {
      return `linear-gradient(${btn.gradientAngle}deg, ${btn.gradientColor1}, ${btn.gradientColor2})`;
    }
    return `radial-gradient(circle at center, ${btn.gradientColor1}, ${btn.gradientColor2})`;
  };

  const handleButtonClick = async (buttonId: string) => {
    const { data } = await supabase
      .from('button_presets')
      .select('*')
      .eq('id', buttonId)
      .single();

    if (data) {
      onSelectButton({
        text: data.text,
        url: data.url,
        backgroundColor: data.background_color,
        textColor: data.text_color,
        size: data.size,
        width: data.width,
        customWidth: data.custom_width,
        align: data.align,
        borderRadius: data.border_radius,
        paddingX: data.padding_x,
        paddingY: data.padding_y,
        borderWidth: data.border_width,
        borderColor: data.border_color,
        borderStyle: data.border_style,
        shadowSize: data.shadow_size,
        hoverEffect: data.hover_effect,
        useGradient: data.use_gradient,
        gradientType: data.gradient_type,
        gradientColor1: data.gradient_color1,
        gradientColor2: data.gradient_color2,
        gradientAngle: data.gradient_angle,
        hoverGradientShift: data.hover_gradient_shift,
      });
    }
  };

  if (favorites.length === 0) return null;

  return (
    <div className="border-b bg-muted/30 px-4 py-2">
      <div className="flex items-center gap-2 mb-2">
        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
        <span className="text-sm font-medium text-muted-foreground">Boutons favoris</span>
      </div>
      <ScrollArea className="w-full">
        <div className="flex gap-2 pb-2">
          {favorites.map((btn) => (
            <Button
              key={btn.id}
              type="button"
              onClick={() => handleButtonClick(btn.id)}
              style={{
                background: getButtonBackground(btn),
                color: btn.textColor,
                padding: `${btn.paddingY}px ${btn.paddingX}px`,
                borderRadius: `${btn.borderRadius}px`,
                fontSize: btn.size === 'small' ? '14px' : btn.size === 'large' ? '18px' : '16px',
                fontWeight: 500,
                border: btn.borderWidth > 0 ? `${btn.borderWidth}px ${btn.borderStyle} ${btn.borderColor}` : 'none',
                boxShadow: {
                  none: 'none',
                  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                }[btn.shadowSize],
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {btn.text}
            </Button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
};