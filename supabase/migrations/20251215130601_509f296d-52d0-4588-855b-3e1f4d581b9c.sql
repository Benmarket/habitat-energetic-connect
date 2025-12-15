-- Create popups table for managing website popups
CREATE TABLE public.popups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  
  -- Page targeting
  target_page TEXT NOT NULL DEFAULT '/', -- URL path where popup appears
  
  -- Associated form
  form_id UUID REFERENCES public.form_configurations(id) ON DELETE SET NULL,
  
  -- Timing
  delay_seconds INTEGER NOT NULL DEFAULT 3, -- Seconds before popup appears
  
  -- Display frequency
  frequency TEXT NOT NULL DEFAULT 'session', -- 'session', 'once', 'always'
  
  -- Template
  template TEXT NOT NULL DEFAULT 'lead_capture', -- 'lead_capture', 'promotion', 'information', 'fullscreen'
  
  -- Content
  title TEXT,
  subtitle TEXT,
  
  -- Visual customization
  background_image TEXT, -- URL to background image
  background_color TEXT DEFAULT '#ffffff',
  text_color TEXT DEFAULT '#000000',
  accent_color TEXT DEFAULT '#10b981', -- Primary button/accent color
  overlay_opacity INTEGER DEFAULT 50, -- 0-100
  
  -- Size and position
  size TEXT NOT NULL DEFAULT 'medium', -- 'small', 'medium', 'large', 'fullscreen'
  position TEXT NOT NULL DEFAULT 'center', -- 'center', 'bottom-right', 'bottom-left', 'top-right', 'top-left'
  
  -- Animation
  animation TEXT NOT NULL DEFAULT 'fade', -- 'fade', 'slide-up', 'slide-down', 'scale', 'none'
  
  -- Badge (promotional)
  badge_text TEXT,
  badge_color TEXT DEFAULT '#ef4444',
  
  -- Close button
  show_close_button BOOLEAN NOT NULL DEFAULT true,
  close_button_style TEXT DEFAULT 'icon', -- 'icon', 'text', 'both'
  
  -- Custom template (saved user templates)
  is_custom_template BOOLEAN NOT NULL DEFAULT false,
  custom_template_name TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.popups ENABLE ROW LEVEL SECURITY;

-- Admins can manage popups
CREATE POLICY "Admins can manage popups"
  ON public.popups
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- Public can view active popups
CREATE POLICY "Public can view active popups"
  ON public.popups
  FOR SELECT
  USING (is_active = true);

-- Create popup_templates table for saved custom templates
CREATE TABLE public.popup_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  user_id UUID NOT NULL,
  
  -- Template settings (same as popup visual settings)
  template TEXT NOT NULL DEFAULT 'lead_capture',
  background_color TEXT DEFAULT '#ffffff',
  text_color TEXT DEFAULT '#000000',
  accent_color TEXT DEFAULT '#10b981',
  overlay_opacity INTEGER DEFAULT 50,
  size TEXT NOT NULL DEFAULT 'medium',
  position TEXT NOT NULL DEFAULT 'center',
  animation TEXT NOT NULL DEFAULT 'fade',
  badge_color TEXT DEFAULT '#ef4444',
  show_close_button BOOLEAN NOT NULL DEFAULT true,
  close_button_style TEXT DEFAULT 'icon',
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.popup_templates ENABLE ROW LEVEL SECURITY;

-- Users can manage their own templates
CREATE POLICY "Users can manage their own popup templates"
  ON public.popup_templates
  FOR ALL
  USING (auth.uid() = user_id);

-- Admins can view all templates
CREATE POLICY "Admins can view all popup templates"
  ON public.popup_templates
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- Create updated_at trigger for popups
CREATE TRIGGER update_popups_updated_at
  BEFORE UPDATE ON public.popups
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create updated_at trigger for popup_templates
CREATE TRIGGER update_popup_templates_updated_at
  BEFORE UPDATE ON public.popup_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();