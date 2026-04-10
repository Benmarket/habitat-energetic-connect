import { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { Helmet } from "react-helmet";
import { useRequireRole } from "@/hooks/useRequireRole";

type AppRole = "super_admin" | "admin" | "moderator" | "user";

interface AdminGuardProps {
  children: ReactNode;
  allowedRoles?: AppRole[];
}

/**
 * Route guard for admin pages.
 * - Checks user role against allowedRoles (default: super_admin, admin, moderator)
 * - Redirects unauthorized users to "/"
 * - Adds noindex/nofollow meta for SEO privacy
 */
const AdminGuard = ({ 
  children, 
  allowedRoles = ["super_admin", "admin", "moderator"] 
}: AdminGuardProps) => {
  const { authorized, checking } = useRequireRole({ allowedRoles });

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!authorized) return null;

  return (
    <>
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      {children}
    </>
  );
};

export default AdminGuard;
