-- Role-only authorization. No email or JWT metadata may grant privileges.
-- Preflight before deploy: verify every legitimate privileged account has a
-- matching public.profiles role (the current production aggregate check passed).

CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, auth AS $$
  SELECT auth.role() = 'service_role' OR EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, auth AS $$
  SELECT auth.role() = 'service_role' OR EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_reviewer()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, auth AS $$
  SELECT auth.role() = 'service_role' OR EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('reviewer', 'admin', 'superadmin')
  );
$$;

CREATE OR REPLACE FUNCTION public.profile_role_is_unchanged(p_id uuid, p_role text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_id AND role = p_role);
$$;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Users and admins update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users update own profile except role" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

CREATE POLICY "Authenticated users insert own unprivileged profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id AND role = 'user');
CREATE POLICY "Users and admins update profile without role change" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id OR public.is_admin())
  WITH CHECK ((auth.uid() = id OR public.is_admin()) AND public.profile_role_is_unchanged(id, role));

-- No browser client may mutate user_roles directly; role changes are RPC-only.
ALTER TABLE IF EXISTS public.user_roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can insert or modify roles" ON public.user_roles;

CREATE OR REPLACE FUNCTION public.set_profile_role(p_target_id uuid, p_role text, p_reason text)
RETURNS public.profiles LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
DECLARE target public.profiles; previous_role text;
BEGIN
  IF NOT public.is_superadmin() THEN RAISE EXCEPTION 'Superadmin permission required'; END IF;
  IF p_role NOT IN ('user', 'reviewer', 'admin', 'superadmin') THEN RAISE EXCEPTION 'Invalid role'; END IF;
  SELECT * INTO target FROM public.profiles WHERE id = p_target_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Profile not found'; END IF;
  previous_role := target.role;
  IF previous_role = p_role THEN RETURN target; END IF;
  UPDATE public.profiles SET role = p_role, updated_at = now() WHERE id = p_target_id RETURNING * INTO target;
  INSERT INTO public.admin_audit_logs(action, target_user_id, target_email, performed_by, performed_by_email, details)
  VALUES ('SET_ROLE', target.id, target.email, auth.uid(), '', jsonb_build_object('previous_role', previous_role, 'new_role', p_role, 'reason', coalesce(p_reason, '')));
  RETURN target;
END; $$;

REVOKE ALL ON FUNCTION public.set_profile_role(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_profile_role(uuid, text, text) TO authenticated;
REVOKE ALL ON FUNCTION public.profile_role_is_unchanged(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_reviewer() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_superadmin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin(), public.is_reviewer(), public.is_superadmin() TO authenticated, service_role;
