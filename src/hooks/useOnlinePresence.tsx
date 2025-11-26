import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface PresenceState {
  [key: string]: Array<{
    presence_ref: string;
    user_id?: string;
    user_name?: string;
    account_type?: string;
    online_at?: string;
  }>;
}

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
        console.log('Presence state updated:', state);
        setPresenceState(state);
        setLiveCount(Object.keys(state).length);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences);
      })
      .subscribe(async (status) => {
        console.log('Presence subscription status:', status);
        if (status === 'SUBSCRIBED') {
          const presenceData = user?.id
            ? {
                user_id: user.id,
                user_name: user.user_metadata?.first_name 
                  ? `${user.user_metadata.first_name} ${user.user_metadata.last_name || ''}`.trim()
                  : user.email,
                account_type: user.user_metadata?.account_type || 'particulier',
                online_at: new Date().toISOString(),
              }
            : {
                online_at: new Date().toISOString(),
              };

          console.log('Tracking presence:', presenceData);
          await channel.track(presenceData);
        }
      });

    return () => {
      console.log('Unsubscribing from presence channel');
      channel.unsubscribe();
    };
  }, [user]);

  return { presenceState, liveCount };
};
