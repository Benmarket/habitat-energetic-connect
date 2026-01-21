-- Table pour les régions du simulateur solaire
CREATE TABLE public.solar_simulator_regions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  tarif_kwh NUMERIC NOT NULL DEFAULT 0.248,
  variation_prix_installation NUMERIC NOT NULL DEFAULT 0,
  module_puissance_defaut TEXT NOT NULL DEFAULT 'aucun',
  -- Tarifs de rachat EDF par tranche
  tarif_rachat_0_3 NUMERIC NOT NULL DEFAULT 0.04,
  tarif_rachat_4_9 NUMERIC NOT NULL DEFAULT 0.04,
  tarif_rachat_10_36 NUMERIC NOT NULL DEFAULT 0.0761,
  tarif_rachat_37_100 NUMERIC NOT NULL DEFAULT 0.0761,
  tarif_rachat_101_500 NUMERIC NOT NULL DEFAULT 0.0761,
  -- Primes par tranche
  prime_0_3 NUMERIC NOT NULL DEFAULT 0.08,
  prime_4_9 NUMERIC NOT NULL DEFAULT 0.08,
  prime_10_36 NUMERIC NOT NULL DEFAULT 0.19,
  prime_37_100 NUMERIC NOT NULL DEFAULT 0.10,
  prime_101_500 NUMERIC NOT NULL DEFAULT 0.00,
  -- Métadonnées
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table pour les paramètres globaux du simulateur solaire
CREATE TABLE public.solar_simulator_global_params (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  -- Paramètres de production
  ratio_jour NUMERIC NOT NULL DEFAULT 60,
  angle_inclinaison NUMERIC NOT NULL DEFAULT 25,
  -- Paramètres économiques
  hausse_electricite NUMERIC NOT NULL DEFAULT 1,
  hausse_electricite_graph NUMERIC NOT NULL DEFAULT 5,
  periode_calcul INTEGER NOT NULL DEFAULT 20,
  -- Métadonnées
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.solar_simulator_regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solar_simulator_global_params ENABLE ROW LEVEL SECURITY;

-- RLS Policies for solar_simulator_regions
CREATE POLICY "Anyone can view solar simulator regions"
  ON public.solar_simulator_regions
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert solar simulator regions"
  ON public.solar_simulator_regions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "Admins can update solar simulator regions"
  ON public.solar_simulator_regions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "Admins can delete solar simulator regions"
  ON public.solar_simulator_regions
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('super_admin', 'admin')
    )
  );

-- RLS Policies for solar_simulator_global_params
CREATE POLICY "Anyone can view solar simulator global params"
  ON public.solar_simulator_global_params
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert solar simulator global params"
  ON public.solar_simulator_global_params
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "Admins can update solar simulator global params"
  ON public.solar_simulator_global_params
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "Admins can delete solar simulator global params"
  ON public.solar_simulator_global_params
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('super_admin', 'admin')
    )
  );

-- Trigger pour updated_at
CREATE TRIGGER update_solar_simulator_regions_updated_at
  BEFORE UPDATE ON public.solar_simulator_regions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_solar_simulator_global_params_updated_at
  BEFORE UPDATE ON public.solar_simulator_global_params
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insérer la région France métropolitaine par défaut
INSERT INTO public.solar_simulator_regions (name, display_order)
VALUES ('France métropolitaine', 0);

-- Insérer les paramètres globaux par défaut (une seule ligne)
INSERT INTO public.solar_simulator_global_params (ratio_jour, angle_inclinaison, hausse_electricite, hausse_electricite_graph, periode_calcul)
VALUES (60, 25, 1, 5, 20);