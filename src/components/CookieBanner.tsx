import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface CookieBannerSettings {
  enabled: boolean;
  text: string;
  backgroundColor: string;
  textColor: string;
  buttonColor: string;
  buttonTextColor: string;
}

const CookieBanner = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [settings, setSettings] = useState<CookieBannerSettings>({
    enabled: true,
    text: "Nous utilisons des cookies pour améliorer votre expérience et analyser le trafic de notre site. En continuant à naviguer, vous acceptez notre utilisation des cookies.",
    backgroundColor: '#22c55e',
    textColor: '#ffffff',
    buttonColor: '#16a34a',
    buttonTextColor: '#ffffff',
  });

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const { data } = await supabase
          .from("site_settings")
          .select("value")
          .eq("key", "cookie_banner")
          .maybeSingle();

        if (data?.value) {
          const value = data.value as any;
          setSettings({
            enabled: value.enabled ?? true,
            text: value.text || settings.text,
            backgroundColor: value.backgroundColor || settings.backgroundColor,
            textColor: value.textColor || settings.textColor,
            buttonColor: value.buttonColor || settings.buttonColor,
            buttonTextColor: value.buttonTextColor || settings.buttonTextColor,
          });
        }
      } catch (error) {
        console.error("Error loading cookie banner settings:", error);
      }
    };

    loadSettings();
  }, []);

  useEffect(() => {
    // Check if user has already accepted cookies
    const cookiesAccepted = localStorage.getItem("cookies_accepted");
    if (!cookiesAccepted && settings.enabled) {
      setIsVisible(true);
    }
  }, [settings.enabled]);

  const handleAccept = () => {
    localStorage.setItem("cookies_accepted", "true");
    setIsVisible(false);
  };

  const handleClose = () => {
    setIsVisible(false);
  };

  if (!isVisible || !settings.enabled) {
    return null;
  }

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 shadow-2xl border-t animate-in slide-in-from-bottom duration-500"
      style={{
        backgroundColor: settings.backgroundColor,
        color: settings.textColor,
      }}
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-sm flex-1 leading-relaxed">
            {settings.text}
          </p>
          
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={handleAccept}
              className="px-6 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-90 hover:scale-105 active:scale-95 shadow-md"
              style={{
                backgroundColor: settings.buttonColor,
                color: settings.buttonTextColor,
              }}
            >
              J'accepte
            </button>
            
            <button
              onClick={handleClose}
              className="p-2 rounded-lg transition-colors hover:bg-black/10"
              aria-label="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieBanner;
