-- Table pour les puissances du simulateur solaire
CREATE TABLE public.solar_simulator_powers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  puissance_kwc NUMERIC NOT NULL,
  prix_euros NUMERIC NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.solar_simulator_powers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view solar simulator powers"
  ON public.solar_simulator_powers
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert solar simulator powers"
  ON public.solar_simulator_powers
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "Admins can update solar simulator powers"
  ON public.solar_simulator_powers
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "Admins can delete solar simulator powers"
  ON public.solar_simulator_powers
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('super_admin', 'admin')
    )
  );

-- Trigger pour updated_at
CREATE TRIGGER update_solar_simulator_powers_updated_at
  BEFORE UPDATE ON public.solar_simulator_powers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insérer les puissances par défaut
INSERT INTO public.solar_simulator_powers (puissance_kwc, prix_euros, display_order) VALUES
  (3, 10900, 0),
  (6, 16900, 1),
  (9, 19900, 2);