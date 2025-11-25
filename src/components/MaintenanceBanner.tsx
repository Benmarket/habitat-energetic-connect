import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Wrench, X, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const MaintenanceBanner = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(true);
  const [activatedAt, setActivatedAt] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState("");

  useEffect(() => {
    // Récupérer le timestamp d'activation du mode maintenance
    const fetchMaintenanceData = async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "maintenance_mode")
        .maybeSingle();

      console.log("MaintenanceBanner: Fetched maintenance data", data);

      if (data?.value) {
        const value = data.value as { enabled: boolean; message: string; activatedAt?: string };
        console.log("MaintenanceBanner: activatedAt value", value.activatedAt);
        if (value.activatedAt) {
          setActivatedAt(value.activatedAt);
        } else if (value.enabled) {
          // Si le mode maintenance est activé mais n'a pas de timestamp, on en crée un maintenant
          console.log("MaintenanceBanner: No activatedAt found, setting current time");
          const now = new Date().toISOString();
          setActivatedAt(now);
          
          // Mettre à jour la base de données avec le timestamp
          await supabase
            .from("site_settings")
            .update({
              value: {
                ...value,
                activatedAt: now
              }
            })
            .eq("key", "maintenance_mode");
        }
      }
    };

    fetchMaintenanceData();

    // Écouter les changements en temps réel
    const channel = supabase
      .channel('maintenance-banner-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'site_settings',
          filter: 'key=eq.maintenance_mode'
        },
        (payload) => {
          const value = payload.new.value as { enabled: boolean; message: string; activatedAt?: string };
          if (value.activatedAt) {
            setActivatedAt(value.activatedAt);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (!activatedAt) return;

    const updateElapsedTime = () => {
      const now = new Date();
      const activated = new Date(activatedAt);
      const diffMs = now.getTime() - activated.getTime();
      
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

      if (hours > 0) {
        setElapsedTime(`${hours}h ${minutes}m ${seconds}s`);
      } else if (minutes > 0) {
        setElapsedTime(`${minutes}m ${seconds}s`);
      } else {
        setElapsedTime(`${seconds}s`);
      }
    };

    // Mise à jour immédiate
    updateElapsedTime();

    // Mise à jour toutes les secondes
    const interval = setInterval(updateElapsedTime, 1000);

    return () => clearInterval(interval);
  }, [activatedAt]);

  if (!isVisible) return null;

  return (
    <Alert className="fixed top-20 left-0 right-0 z-40 rounded-none border-x-0 border-t-0 border-b-2 border-orange-500 bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50 shadow-lg">
      <div className="container mx-auto flex items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500/10">
            <Wrench className="h-5 w-5 text-orange-600 animate-pulse" />
          </div>
          <div className="flex flex-col">
            <AlertDescription className="text-sm font-medium text-orange-900">
              ⚠️ Mode maintenance activé - Vous êtes connecté en tant qu'administrateur
            </AlertDescription>
            {elapsedTime && (
              <div className="flex items-center gap-1.5 mt-1">
                <Clock className="h-3.5 w-3.5 text-orange-600" />
                <span className="text-xs text-orange-700 font-medium">
                  Actif depuis {elapsedTime}
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => navigate("/admin/parametres")}
            variant="default"
            size="sm"
            className="bg-orange-600 hover:bg-orange-700 text-white shadow-md"
          >
            Désactiver le mode maintenance
          </Button>
          <Button
            onClick={() => setIsVisible(false)}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-orange-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Alert>
  );
};

export default MaintenanceBanner;
