import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface LandingPageGuardProps {
  slug: string;
  children: React.ReactNode;
}

const LandingPageGuard = ({ slug, children }: LandingPageGuardProps) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAccessible, setIsAccessible] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const { data, error } = await supabase
          .from("landing_pages")
          .select("seo_status")
          .eq("slug", slug)
          .single();

        if (error || !data) {
          // Page not found in DB, redirect to 404
          navigate("/404", { replace: true });
          return;
        }

        if (data.seo_status === "disabled") {
          // Page is disabled, redirect to 404
          navigate("/404", { replace: true });
          return;
        }

        // Page is accessible (seo or hidden)
        setIsAccessible(true);
      } catch (err) {
        console.error("Error checking landing page access:", err);
        navigate("/404", { replace: true });
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [slug, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAccessible) {
    return null;
  }

  return <>{children}</>;
};

export default LandingPageGuard;
