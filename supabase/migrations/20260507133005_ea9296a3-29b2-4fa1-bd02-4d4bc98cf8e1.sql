
-- Enums
CREATE TYPE public.housing_status AS ENUM ('proprietaire', 'locataire');
CREATE TYPE public.housing_type AS ENUM ('maison', 'appartement');
CREATE TYPE public.equipment_status AS ENUM ('owned', 'wanted');
CREATE TYPE public.equipment_category AS ENUM ('heating', 'solar', 'insulation', 'water', 'ventilation');
CREATE TYPE public.dpe_grade AS ENUM ('A','B','C','D','E','F','G');

-- member_home_profiles
CREATE TABLE public.member_home_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  housing_status public.housing_status,
  housing_type public.housing_type,
  address text,
  postal_code text,
  city text,
  latitude numeric,
  longitude numeric,
  surface_m2 integer,
  dpe_estimated public.dpe_grade,
  dpe_user_provided boolean NOT NULL DEFAULT false,
  installed_by_global text,
  wizard_step_completed integer NOT NULL DEFAULT 0,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.member_home_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own home profile"
ON public.member_home_profiles FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins view all home profiles"
ON public.member_home_profiles FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE TRIGGER update_member_home_profiles_updated_at
BEFORE UPDATE ON public.member_home_profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- member_home_equipments
CREATE TABLE public.member_home_equipments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.member_home_profiles(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  category public.equipment_category NOT NULL,
  equipment_key text NOT NULL,
  status public.equipment_status NOT NULL DEFAULT 'owned',
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  installed_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (profile_id, equipment_key)
);

CREATE INDEX idx_member_home_equipments_profile ON public.member_home_equipments(profile_id);

ALTER TABLE public.member_home_equipments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own equipments"
ON public.member_home_equipments FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins view all equipments"
ON public.member_home_equipments FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE TRIGGER update_member_home_equipments_updated_at
BEFORE UPDATE ON public.member_home_equipments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- equipment_savings_reference
CREATE TABLE public.equipment_savings_reference (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_key text NOT NULL UNIQUE,
  category public.equipment_category NOT NULL,
  label text NOT NULL,
  description text,
  avg_savings_per_year_eur numeric NOT NULL DEFAULT 0,
  avg_savings_per_m2_eur numeric NOT NULL DEFAULT 0,
  eligible_aids text[] DEFAULT ARRAY[]::text[],
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.equipment_savings_reference ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read savings reference"
ON public.equipment_savings_reference FOR SELECT
USING (true);

CREATE POLICY "Admins manage savings reference"
ON public.equipment_savings_reference FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE TRIGGER update_equipment_savings_reference_updated_at
BEFORE UPDATE ON public.equipment_savings_reference
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- economies_settings (singleton)
CREATE TABLE public.economies_settings (
  id integer PRIMARY KEY DEFAULT 1,
  allow_tenants boolean NOT NULL DEFAULT false,
  allow_apartments boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT economies_settings_singleton CHECK (id = 1)
);

ALTER TABLE public.economies_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read economies settings"
ON public.economies_settings FOR SELECT
USING (true);

CREATE POLICY "Super admins manage economies settings"
ON public.economies_settings FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

INSERT INTO public.economies_settings (id) VALUES (1);

-- Seed equipment_savings_reference
INSERT INTO public.equipment_savings_reference (equipment_key, category, label, description, avg_savings_per_year_eur, avg_savings_per_m2_eur, eligible_aids, display_order) VALUES
-- Chauffage
('pac_air_air', 'heating', 'Pompe à chaleur Air/Air', 'Climatisation réversible offrant chauffage et rafraîchissement. Économies estimées par rapport à un chauffage électrique classique.', 600, 8, ARRAY['cee'], 10),
('pac_air_eau', 'heating', 'Pompe à chaleur Air/Eau', 'Système de chauffage central performant alimentant radiateurs ou plancher chauffant.', 1100, 14, ARRAY['maprimerenov','cee','eco_ptz'], 20),
('poele_granules', 'heating', 'Poêle à granulés', 'Chauffage bois performant avec rendement élevé, complément ou principal.', 700, 9, ARRAY['maprimerenov','cee'], 30),
('chaudiere_biomasse', 'heating', 'Chaudière biomasse', 'Chaudière à granulés ou bûches, alternative renouvelable au fioul/gaz.', 900, 12, ARRAY['maprimerenov','cee','eco_ptz'], 40),
('plancher_chauffant', 'heating', 'Plancher chauffant', 'Diffusion homogène et confort thermique, souvent couplé PAC.', 200, 3, ARRAY[]::text[], 50),
-- Solaire
('panneaux_solaires_pv', 'solar', 'Panneaux solaires photovoltaïques', 'Production d''électricité auto-consommée et/ou revendue.', 900, 0, ARRAY['prime_autoconsommation','tva_reduite'], 60),
('panneaux_solaires_pv_batterie', 'solar', 'Panneaux PV + batterie', 'Stockage permettant de consommer son électricité en soirée.', 1300, 0, ARRAY['prime_autoconsommation','tva_reduite'], 70),
('solaire_thermique', 'solar', 'Solaire thermique (eau chaude)', 'Chauffe-eau solaire individuel pour ECS.', 350, 0, ARRAY['maprimerenov','cee'], 80),
-- Isolation
('isolation_combles', 'insulation', 'Isolation des combles', 'Premier poste de déperdition. Travaux rapides et très rentables.', 450, 6, ARRAY['maprimerenov','cee'], 90),
('isolation_murs_ite', 'insulation', 'Isolation murs par l''extérieur (ITE)', 'Réduit fortement les ponts thermiques, valorise le bâti.', 600, 9, ARRAY['maprimerenov','cee','eco_ptz'], 100),
('isolation_murs_iti', 'insulation', 'Isolation murs par l''intérieur (ITI)', 'Alternative à l''ITE, plus simple à mettre en oeuvre.', 400, 6, ARRAY['maprimerenov','cee'], 110),
('isolation_plancher_bas', 'insulation', 'Isolation plancher bas', 'Sol sur cave/vide sanitaire, gain de confort important.', 250, 4, ARRAY['maprimerenov','cee'], 120),
('isolation_toiture', 'insulation', 'Isolation toiture (sarking)', 'Isolation par l''extérieur de la toiture.', 500, 7, ARRAY['maprimerenov','cee'], 130),
('menuiseries_double_vitrage', 'insulation', 'Menuiseries double/triple vitrage', 'Remplacement des fenêtres anciennes.', 200, 3, ARRAY['maprimerenov','cee'], 140),
-- Eau chaude
('chauffe_eau_thermodynamique', 'water', 'Chauffe-eau thermodynamique', 'Production ECS par PAC, jusqu''à 70 % d''économies sur l''ECS.', 250, 0, ARRAY['maprimerenov','cee'], 150),
-- Ventilation
('vmc_double_flux', 'ventilation', 'VMC double flux', 'Ventilation avec récupération de chaleur, qualité de l''air optimale.', 200, 3, ARRAY['maprimerenov','cee'], 160),
('vmc_simple_flux_hygro', 'ventilation', 'VMC simple flux hygroréglable', 'Renouvellement d''air modulé selon l''humidité.', 80, 1, ARRAY['cee'], 170),
('thermostat_connecte', 'heating', 'Thermostat / régulation connectée', 'Pilotage fin du chauffage, économies immédiates.', 150, 2, ARRAY['cee'], 180);
