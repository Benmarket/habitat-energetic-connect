import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface GuidesModuleState {
  enabled: boolean;
  hideFromNav: boolean;
  message: string;
  loading: boolean;
}

const DEFAULT_MESSAGE =
  "Le module des guides est actuellement en refonte. Les aides et les pratiques dans l'habitat évoluent : nos guides sont temporairement mis en pause, le temps d'être entièrement remis à jour pour vous offrir des informations fiables. Ils reviendront en temps voulu, sans précipitation.";

export const DEFAULT_GUIDES_MODULE_MESSAGE = DEFAULT_MESSAGE;

export const useGuidesModule = (): GuidesModuleState => {
  const [state, setState] = useState<GuidesModuleState>({
    enabled: true,
    hideFromNav: false,
    message: DEFAULT_MESSAGE,
    loading: true,
  });

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const { data } = await supabase
          .from("site_settings")
          .select("value")
          .eq("key", "header_footer")
          .maybeSingle();
        if (!mounted) return;
        const value = (data?.value ?? {}) as any;
        setState({
          enabled: value.guidesModuleEnabled ?? true,
          hideFromNav: value.guidesModuleHideFromNav ?? false,
          message: value.guidesModuleMessage || DEFAULT_MESSAGE,
          loading: false,
        });
      } catch {
        if (mounted) setState((s) => ({ ...s, loading: false }));
      }
    };
    load();

    const channel = supabase
      .channel("guides-module-settings")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "site_settings", filter: "key=eq.header_footer" },
        (payload: any) => {
          const value = payload.new?.value ?? {};
          setState({
            enabled: value.guidesModuleEnabled ?? true,
            hideFromNav: value.guidesModuleHideFromNav ?? false,
            message: value.guidesModuleMessage || DEFAULT_MESSAGE,
            loading: false,
          });
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  return state;
};
