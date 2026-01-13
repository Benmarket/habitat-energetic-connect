import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useRegionContext } from "@/hooks/useRegionContext";
import { useAuth } from "@/hooks/useAuth";

// Generate or retrieve a unique visitor ID for anonymous users
const getVisitorId = (): string => {
  let visitorId = localStorage.getItem("visitor_id");
  if (!visitorId) {
    visitorId = `visitor-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem("visitor_id", visitorId);
  }
  return visitorId;
};

export const usePageViewTracking = () => {
  const location = useLocation();
  const { activeRegion } = useRegionContext();
  const { user } = useAuth();
  const lastTrackedPath = useRef<string | null>(null);

  useEffect(() => {
    const trackPageView = async () => {
      const currentPath = location.pathname + location.search;
      
      // Avoid duplicate tracking for the same page
      if (lastTrackedPath.current === currentPath) {
        return;
      }
      
      lastTrackedPath.current = currentPath;

      try {
        await supabase.from("page_views").insert({
          page_url: location.pathname,
          region_code: activeRegion,
          user_id: user?.id || null,
          visitor_id: getVisitorId(),
          user_agent: navigator.userAgent,
          referrer: document.referrer || null,
        });
      } catch (error) {
        console.error("Error tracking page view:", error);
      }
    };

    trackPageView();
  }, [location.pathname, location.search, activeRegion, user?.id]);
};
