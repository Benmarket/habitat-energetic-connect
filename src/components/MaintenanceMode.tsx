import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Wrench, Shield, AlertTriangle } from "lucide-react";
import { useLocation } from "react-router-dom";
import MaintenanceBanner from "./MaintenanceBanner";

interface MaintenanceModeProps {
  children: React.ReactNode;
}

const MaintenanceMode = ({ children }: MaintenanceModeProps) => {
  const location = useLocation();
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

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
        .maybeSingle();

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
        setIsAuthenticated(true);
        
        // CRITICAL SECURITY: Vérification côté base de données via RLS
        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .single();

        if (error) {
          console.error("Error checking admin status:", error);
          setIsAdmin(false);
          return;
        }

        if (data) {
          // Seuls les super_admin et admin peuvent bypasser la maintenance
          const isAdminUser = data.role === 'super_admin' || data.role === 'admin';
          setIsAdmin(isAdminUser);
        } else {
          setIsAdmin(false);
        }
      } else {
        setIsAuthenticated(false);
        setIsAdmin(false);
      }
    } catch (error) {
      console.error("Error checking admin status:", error);
      setIsAdmin(false);
      setIsAuthenticated(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // CRITICAL: Toujours autoriser l'accès à la page de connexion en mode maintenance
  const isAuthPage = location.pathname === '/connexion';

  // Si le mode maintenance est activé et que l'utilisateur n'est pas admin
  // MAIS autoriser la page de connexion
  if (isMaintenanceMode && !isAdmin && !isAuthPage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-amber-50 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-orange-200/30 to-transparent rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-amber-200/30 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="max-w-2xl w-full relative z-10">
          <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-orange-200/50 p-8 md:p-12">
            <div className="mb-8 flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-amber-500 rounded-full blur-xl opacity-50 animate-pulse"></div>
                <div className="relative p-8 bg-gradient-to-br from-orange-500 to-amber-600 rounded-full shadow-xl">
                  <Wrench className="w-20 h-20 text-white animate-bounce" />
                </div>
              </div>
            </div>
            
            <div className="text-center space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-100 rounded-full">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                <span className="text-sm font-semibold text-orange-900">Maintenance en cours</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-orange-600 via-amber-600 to-orange-600 bg-clip-text text-transparent">
                Site en maintenance
              </h1>
              
              <div className="max-w-lg mx-auto">
                <p className="text-lg text-slate-700 leading-relaxed">
                  {maintenanceMessage || "Nous effectuons actuellement des opérations de maintenance pour améliorer votre expérience. Notre équipe travaille activement pour rétablir le service."}
                </p>
              </div>

              <div className="flex items-center justify-center gap-2 pt-4">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                </div>
                <p className="text-sm font-medium text-slate-600">
                  Nous reviendrons très bientôt
                </p>
              </div>

              <div className="pt-6 flex items-center justify-center gap-2 text-sm text-slate-500">
                <Shield className="w-4 h-4" />
                <span>Merci de votre patience et de votre compréhension</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Si admin connecté en mode maintenance : afficher le site + bandeau
  if (isMaintenanceMode && isAdmin) {
    return (
      <>
        <MaintenanceBanner />
        <div className="pt-16">
          {children}
        </div>
      </>
    );
  }

  // Sinon, afficher l'application normalement
  return <>{children}</>;
};

export default MaintenanceMode;
