import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useRegionContext } from "@/hooks/useRegionContext";

type EventType = 'view' | 'click' | 'conversion';

// Generate or retrieve visitor ID
function getVisitorId(): string {
  const STORAGE_KEY = 'ad-visitor-id';
  let visitorId = localStorage.getItem(STORAGE_KEY);
  
  if (!visitorId) {
    visitorId = `v_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    localStorage.setItem(STORAGE_KEY, visitorId);
  }
  
  return visitorId;
}

export function useAdTracking() {
  const { activeRegion } = useRegionContext();

  const trackEvent = useCallback(async (
    advertisementId: string, 
    eventType: EventType
  ) => {
    try {
      const visitorId = getVisitorId();
      
      await supabase.from('ad_analytics').insert({
        advertisement_id: advertisementId,
        event_type: eventType,
        region_code: activeRegion,
        visitor_id: visitorId,
        referrer: document.referrer || null,
      });

      // Update the counter cache on the advertisement
      // We'll do this via a simple increment update
      const { data: currentAd } = await supabase
        .from('advertisements')
        .select('views_count, clicks_count, conversions_count')
        .eq('id', advertisementId)
        .single();
      
      if (currentAd) {
        const updateData: Record<string, number> = {};
        if (eventType === 'view') {
          updateData.views_count = (currentAd.views_count || 0) + 1;
        } else if (eventType === 'click') {
          updateData.clicks_count = (currentAd.clicks_count || 0) + 1;
        } else if (eventType === 'conversion') {
          updateData.conversions_count = (currentAd.conversions_count || 0) + 1;
        }
        
        await supabase
          .from('advertisements')
          .update(updateData)
          .eq('id', advertisementId);
      }
      
    } catch (error) {
      // Silent fail - tracking should not break user experience
      console.debug('Ad tracking error:', error);
    }
  }, [activeRegion]);

  const trackView = useCallback((advertisementId: string) => {
    trackEvent(advertisementId, 'view');
  }, [trackEvent]);

  const trackClick = useCallback((advertisementId: string) => {
    trackEvent(advertisementId, 'click');
  }, [trackEvent]);

  const trackConversion = useCallback((advertisementId: string) => {
    trackEvent(advertisementId, 'conversion');
  }, [trackEvent]);

  return {
    trackView,
    trackClick,
    trackConversion,
  };
}

export default useAdTracking;
