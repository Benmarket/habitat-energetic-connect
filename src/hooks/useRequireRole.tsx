import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

type AppRole = "super_admin" | "admin" | "moderator" | "user";

interface UseRequireRoleOptions {
  allowedRoles: AppRole[];
  redirectTo?: string;
}

export const useRequireRole = ({ allowedRoles, redirectTo = "/" }: UseRequireRoleOptions) => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);
  const [userRole, setUserRole] = useState<AppRole | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      navigate(redirectTo, { replace: true });
      setChecking(false);
      return;
    }

    const checkRole = async () => {
      try {
        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .single();

        if (error || !data) {
          navigate(redirectTo, { replace: true });
          setChecking(false);
          return;
        }

        const role = data.role as AppRole;
        setUserRole(role);

        if (allowedRoles.includes(role)) {
          setAuthorized(true);
        } else {
          navigate(redirectTo, { replace: true });
        }
      } catch {
        navigate(redirectTo, { replace: true });
      } finally {
        setChecking(false);
      }
    };

    checkRole();
  }, [user, authLoading, allowedRoles, redirectTo, navigate]);

  return { authorized, checking, userRole };
};
