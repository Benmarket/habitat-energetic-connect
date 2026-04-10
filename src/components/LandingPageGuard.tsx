import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface LandingPageGuardProps {
  slug: string;
  fallbackSlug?: string;
  children: React.ReactNode;
}

const LandingPageGuard = ({ slug, fallbackSlug, children }: LandingPageGuardProps) => {
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
          // Page not found — try fallback if provided
          if (fallbackSlug) {
            const { data: fallbackData, error: fallbackError } = await supabase
              .from("landing_pages")
              .select("seo_status")
              .eq("slug", fallbackSlug)
              .single();

            if (!fallbackError && fallbackData && fallbackData.seo_status !== "disabled") {
              // Fallback exists and is accessible → allow rendering with fallback content
              setIsAccessible(true);
              setLoading(false);
              return;
            }
          }
          navigate("/404", { replace: true });
          return;
        }

        if (data.seo_status === "disabled") {
          navigate("/404", { replace: true });
          return;
        }

        setIsAccessible(true);
      } catch (err) {
        console.error("Error checking landing page access:", err);
        navigate("/404", { replace: true });
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [slug, fallbackSlug, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAccessible) return null;

  return <>{children}</>;
};

export default LandingPageGuard;
