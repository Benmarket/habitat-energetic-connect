import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

type PageKey = 'account' | 'dashboard' | 'economies' | 'forum';

const PAGE_SETTINGS_MAP: Record<PageKey, string> = {
  account: 'memberMenuShowAccount',
  dashboard: 'memberMenuShowDashboard', 
  economies: 'memberMenuShowEconomies',
  forum: 'memberMenuShowForum'
};

export const usePageMaintenance = (pageKey: PageKey) => {
  const [isUnderMaintenance, setIsUnderMaintenance] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkMaintenance = async () => {
      try {
        const { data } = await supabase
          .from("site_settings")
          .select("value")
          .eq("key", "header_footer")
          .maybeSingle();

        if (data?.value) {
          const settings = typeof data.value === 'string' 
            ? JSON.parse(data.value) 
            : data.value;
          
          const settingKey = PAGE_SETTINGS_MAP[pageKey];
          // If the setting is false, the page is under maintenance
          const isEnabled = settings[settingKey] !== false;
          setIsUnderMaintenance(!isEnabled);
        }
      } catch (error) {
        console.error("Error checking page maintenance status:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkMaintenance();
  }, [pageKey]);

  return { isUnderMaintenance, isLoading };
};
