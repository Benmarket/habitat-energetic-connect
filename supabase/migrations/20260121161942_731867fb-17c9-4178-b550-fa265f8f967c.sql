-- Create table for simulator settings with regional rates
CREATE TABLE public.simulator_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  simulator_id TEXT NOT NULL,
  setting_key TEXT NOT NULL,
  setting_value JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(simulator_id, setting_key)
);

-- Enable RLS
ALTER TABLE public.simulator_settings ENABLE ROW LEVEL SECURITY;

-- Create policies - only admins can manage simulator settings
CREATE POLICY "Admins can view simulator settings"
ON public.simulator_settings
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('super_admin', 'admin')
  )
);

CREATE POLICY "Admins can insert simulator settings"
ON public.simulator_settings
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('super_admin', 'admin')
  )
);

CREATE POLICY "Admins can update simulator settings"
ON public.simulator_settings
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('super_admin', 'admin')
  )
);

CREATE POLICY "Admins can delete simulator settings"
ON public.simulator_settings
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('super_admin', 'admin')
  )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_simulator_settings_updated_at
BEFORE UPDATE ON public.simulator_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial solar simulator settings
INSERT INTO public.simulator_settings (simulator_id, setting_key, setting_value)
VALUES (
  'solaire',
  'tarifs_rachat_kwh',
  '{"france": 0.13, "regions": []}'::jsonb
);