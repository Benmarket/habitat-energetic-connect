import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useRegionContext } from "@/hooks/useRegionContext";
import { useAuth } from "@/hooks/useAuth";

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
  const pageViewIdRef = useRef<string | null>(null);
  const pageEntryTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    const sendDuration = () => {
      const pvId = pageViewIdRef.current;
      if (!pvId) return;
      const duration = Math.round((Date.now() - pageEntryTimeRef.current) / 1000);
      if (duration < 2 || duration > 3600) return; // ignore <2s or >1h
      
      // Use sendBeacon for reliability on page leave
      const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/page_views?id=eq.${pvId}`;
      const body = JSON.stringify({ duration_seconds: duration });
      const headers = {
        'Content-Type': 'application/json',
        'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        'Prefer': 'return=minimal',
      };
      
      // Try sendBeacon first, fallback to fetch
      try {
        const blob = new Blob([body], { type: 'application/json' });
        // sendBeacon only supports POST, so use fetch with PATCH
        navigator.sendBeacon && false; // sendBeacon doesn't support PATCH, use fetch
      } catch {}
      
      // Fire-and-forget PATCH
      fetch(url, { method: 'PATCH', headers, body, keepalive: true }).catch(() => {});
      pageViewIdRef.current = null;
    };

    const trackPageView = async () => {
      const currentPath = location.pathname + location.search;
      
      if (lastTrackedPath.current === currentPath) return;

      // Send duration for previous page
      sendDuration();
      
      lastTrackedPath.current = currentPath;
      pageEntryTimeRef.current = Date.now();

      try {
        const { data } = await supabase.from("page_views").insert({
          page_url: location.pathname,
          region_code: activeRegion,
          user_id: user?.id || null,
          visitor_id: getVisitorId(),
          user_agent: navigator.userAgent,
          referrer: document.referrer || null,
        }).select('id').single();
        
        if (data) {
          pageViewIdRef.current = data.id;
        }
      } catch (error) {
        console.error("Error tracking page view:", error);
      }
    };

    trackPageView();

    // Send duration on page unload
    const handleBeforeUnload = () => sendDuration();
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      sendDuration();
    };
  }, [location.pathname, location.search, activeRegion, user?.id]);
};
