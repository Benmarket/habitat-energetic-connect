-- Create button_presets table for reusable button styles
CREATE TABLE IF NOT EXISTS public.button_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  user_id UUID NOT NULL,
  
  -- Button configuration
  text TEXT NOT NULL DEFAULT 'Mon bouton',
  url TEXT NOT NULL DEFAULT '#contact',
  background_color TEXT NOT NULL DEFAULT '#10b981',
  text_color TEXT NOT NULL DEFAULT '#ffffff',
  size TEXT NOT NULL DEFAULT 'medium' CHECK (size IN ('small', 'medium', 'large')),
  width TEXT NOT NULL DEFAULT 'auto' CHECK (width IN ('auto', 'full', 'custom')),
  custom_width INTEGER NOT NULL DEFAULT 200,
  align TEXT NOT NULL DEFAULT 'center' CHECK (align IN ('left', 'center', 'right')),
  border_radius INTEGER NOT NULL DEFAULT 6,
  padding_x INTEGER NOT NULL DEFAULT 24,
  padding_y INTEGER NOT NULL DEFAULT 12,
  border_width INTEGER NOT NULL DEFAULT 0,
  border_color TEXT NOT NULL DEFAULT '#000000',
  border_style TEXT NOT NULL DEFAULT 'solid' CHECK (border_style IN ('solid', 'dashed', 'dotted', 'none')),
  shadow_size TEXT NOT NULL DEFAULT 'md' CHECK (shadow_size IN ('none', 'sm', 'md', 'lg')),
  hover_effect BOOLEAN NOT NULL DEFAULT true,
  
  -- Gradient configuration
  use_gradient BOOLEAN NOT NULL DEFAULT false,
  gradient_type TEXT NOT NULL DEFAULT 'linear' CHECK (gradient_type IN ('linear', 'radial')),
  gradient_color1 TEXT NOT NULL DEFAULT '#ec4899',
  gradient_color2 TEXT NOT NULL DEFAULT '#8b5cf6',
  gradient_angle INTEGER NOT NULL DEFAULT 90,
  hover_gradient_shift BOOLEAN NOT NULL DEFAULT true,
  
  -- Favorite status
  is_favorite BOOLEAN NOT NULL DEFAULT false,
  favorite_order INTEGER,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.button_presets ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own button presets"
  ON public.button_presets
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own button presets"
  ON public.button_presets
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id 
    AND (
      SELECT COUNT(*) 
      FROM public.button_presets 
      WHERE user_id = auth.uid()
    ) < 50
  );

CREATE POLICY "Users can update their own button presets"
  ON public.button_presets
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own button presets"
  ON public.button_presets
  FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger to update updated_at
CREATE TRIGGER update_button_presets_updated_at
  BEFORE UPDATE ON public.button_presets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_button_presets_user_id ON public.button_presets(user_id);
CREATE INDEX idx_button_presets_favorites ON public.button_presets(user_id, is_favorite, favorite_order) WHERE is_favorite = true;