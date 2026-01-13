import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface PresenceState {
  [key: string]: Array<{
    presence_ref: string;
    user_id?: string;
    user_name?: string;
    account_type?: string;
    region_code?: string;
    online_at?: string;
  }>;
}

// Get region from localStorage (same source as useRegionContext)
const getActiveRegion = (): string => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("activeRegion") || "fr";
  }
  return "fr";
};

export const useOnlinePresence = () => {
  const [presenceState, setPresenceState] = useState<PresenceState>({});
  const [liveCount, setLiveCount] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    const channel = supabase.channel('online-users', {
      config: {
        presence: {
          key: user?.id || `anonymous-${Math.random().toString(36).substr(2, 9)}`,
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        setPresenceState(state);
        setLiveCount(Object.keys(state).length);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        // Présence mise à jour
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        // Présence supprimée
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          const presenceData = user?.id
            ? {
                user_id: user.id,
                user_name: user.user_metadata?.first_name 
                  ? `${user.user_metadata.first_name} ${user.user_metadata.last_name || ''}`.trim()
                  : user.email,
                account_type: user.user_metadata?.account_type || 'particulier',
                region_code: getActiveRegion(),
                online_at: new Date().toISOString(),
              }
            : {
                region_code: getActiveRegion(),
                online_at: new Date().toISOString(),
              };

          await channel.track(presenceData);
        }
      });

    return () => {
      channel.unsubscribe();
    };
  }, [user]);

  return { presenceState, liveCount };
};
