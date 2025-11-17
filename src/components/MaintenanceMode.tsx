import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Wrench } from "lucide-react";

interface MaintenanceModeProps {
  children: React.ReactNode;
}

const MaintenanceMode = ({ children }: MaintenanceModeProps) => {
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkMaintenanceMode();
    checkAdminStatus();
    
    // S'abonner aux changements en temps réel
    const channel = supabase
      .channel('site-settings-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'site_settings',
          filter: 'key=eq.maintenance_mode'
        },
        (payload) => {
          const value = payload.new.value as { enabled: boolean; message: string };
          setIsMaintenanceMode(value.enabled);
          setMaintenanceMessage(value.message);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const checkMaintenanceMode = async () => {
    try {
      const { data, error } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "maintenance_mode")
        .single();

      if (error) throw error;

      if (data) {
        const value = data.value as { enabled: boolean; message: string };
        setIsMaintenanceMode(value.enabled);
        setMaintenanceMessage(value.message);
      }
    } catch (error) {
      console.error("Error checking maintenance mode:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkAdminStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .single();

        if (data) {
          setIsAdmin(data.role === 'super_admin' || data.role === 'admin');
        }
      }
    } catch (error) {
      console.error("Error checking admin status:", error);
    }
  };

  if (loading) {
    return null;
  }

  // Si le mode maintenance est activé et que l'utilisateur n'est pas admin
  if (isMaintenanceMode && !isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="mb-8 flex justify-center">
            <div className="p-6 bg-primary/10 rounded-full">
              <Wrench className="w-16 h-16 text-primary animate-pulse" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-4">
            Site en maintenance
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            {maintenanceMessage || "Nous effectuons actuellement des opérations de maintenance. Nous reviendrons bientôt!"}
          </p>
          <div className="text-sm text-muted-foreground">
            Merci de votre patience
          </div>
        </div>
      </div>
    );
  }

  // Sinon, afficher l'application normalement
  return <>{children}</>;
};

export default MaintenanceMode;
