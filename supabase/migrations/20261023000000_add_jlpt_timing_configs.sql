-- Task 11: JLPT N5-N1 timing configuration (admin-managed)
-- N2/N1 model Language Knowledge + Reading as one combined timing block.

CREATE TABLE IF NOT EXISTS public.jlpt_timing_configs (
  level TEXT PRIMARY KEY,
  config JSONB NOT NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT jlpt_timing_configs_level_check CHECK (level IN ('N5', 'N4', 'N3', 'N2', 'N1')),
  CONSTRAINT jlpt_timing_configs_config_is_array CHECK (jsonb_typeof(config) = 'array')
);

COMMENT ON TABLE public.jlpt_timing_configs IS
  'Admin-managed JLPT timing blocks. N2/N1 use one combined language_reading block.';
COMMENT ON COLUMN public.jlpt_timing_configs.config IS
  'Array of { block, officialMinutes, simulationMinutes } objects.';

ALTER TABLE public.jlpt_timing_configs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read JLPT timing configs" ON public.jlpt_timing_configs;
CREATE POLICY "Anyone can read JLPT timing configs"
  ON public.jlpt_timing_configs FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Admins can insert JLPT timing configs" ON public.jlpt_timing_configs;
CREATE POLICY "Admins can insert JLPT timing configs"
  ON public.jlpt_timing_configs FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can update JLPT timing configs" ON public.jlpt_timing_configs;
CREATE POLICY "Admins can update JLPT timing configs"
  ON public.jlpt_timing_configs FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete JLPT timing configs" ON public.jlpt_timing_configs;
CREATE POLICY "Admins can delete JLPT timing configs"
  ON public.jlpt_timing_configs FOR DELETE TO authenticated
  USING (public.is_admin());

GRANT SELECT ON public.jlpt_timing_configs TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.jlpt_timing_configs TO authenticated;

CREATE OR REPLACE FUNCTION public.set_jlpt_timing_config_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_jlpt_timing_configs_updated_at ON public.jlpt_timing_configs;
CREATE TRIGGER update_jlpt_timing_configs_updated_at
  BEFORE UPDATE ON public.jlpt_timing_configs
  FOR EACH ROW EXECUTE FUNCTION public.set_jlpt_timing_config_updated_at();

INSERT INTO public.jlpt_timing_configs (level, config) VALUES
  ('N5', '[{"block":"knowledge","officialMinutes":20,"simulationMinutes":15},{"block":"reading","officialMinutes":40,"simulationMinutes":20},{"block":"listening","officialMinutes":30,"simulationMinutes":15}]'),
  ('N4', '[{"block":"knowledge","officialMinutes":25,"simulationMinutes":15},{"block":"reading","officialMinutes":55,"simulationMinutes":25},{"block":"listening","officialMinutes":35,"simulationMinutes":15}]'),
  ('N3', '[{"block":"knowledge","officialMinutes":30,"simulationMinutes":18},{"block":"reading","officialMinutes":70,"simulationMinutes":30},{"block":"listening","officialMinutes":40,"simulationMinutes":20}]'),
  ('N2', '[{"block":"language_reading","officialMinutes":105,"simulationMinutes":45},{"block":"listening","officialMinutes":50,"simulationMinutes":20}]'),
  ('N1', '[{"block":"language_reading","officialMinutes":110,"simulationMinutes":45},{"block":"listening","officialMinutes":60,"simulationMinutes":20}]')
ON CONFLICT (level) DO NOTHING;
