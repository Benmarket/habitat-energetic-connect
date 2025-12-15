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
  refuseButtonText: string;
  refuseButtonBgColor: string;
  refuseButtonTextColor: string;
  refuseButtonBorderColor: string;
  refuseBanner: {
    enabled: boolean;
    text: string;
    backgroundColor: string;
    textColor: string;
    buttonColor: string;
    buttonTextColor: string;
  };
}

const CookieBanner = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [showRefuseBanner, setShowRefuseBanner] = useState(false);
  const [settings, setSettings] = useState<CookieBannerSettings>({
    enabled: true,
    text: "Nous utilisons des cookies pour améliorer votre expérience et analyser le trafic de notre site. En continuant à naviguer, vous acceptez notre utilisation des cookies.",
    backgroundColor: '#22c55e',
    textColor: '#ffffff',
    buttonColor: '#16a34a',
    buttonTextColor: '#ffffff',
    refuseButtonText: 'Je refuse',
    refuseButtonBgColor: '#ffffff',
    refuseButtonTextColor: '#000000',
    refuseButtonBorderColor: '#ffffff',
    refuseBanner: {
      enabled: true,
      text: "Nous respectons votre choix, mais sans cookies, certaines fonctionnalités du site seront limitées. Vous ne pourrez pas bénéficier d'une expérience personnalisée ni accéder à tous nos services.",
      backgroundColor: '#ef4444',
      textColor: '#ffffff',
      buttonColor: '#dc2626',
      buttonTextColor: '#ffffff',
    },
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
            refuseButtonText: value.refuseButtonText || settings.refuseButtonText,
            refuseButtonBgColor: value.refuseButtonBgColor || settings.refuseButtonBgColor,
            refuseButtonTextColor: value.refuseButtonTextColor || settings.refuseButtonTextColor,
            refuseButtonBorderColor: value.refuseButtonBorderColor || settings.refuseButtonBorderColor,
            refuseBanner: {
              enabled: value.refuseBanner?.enabled ?? true,
              text: value.refuseBanner?.text || settings.refuseBanner.text,
              backgroundColor: value.refuseBanner?.backgroundColor || settings.refuseBanner.backgroundColor,
              textColor: value.refuseBanner?.textColor || settings.refuseBanner.textColor,
              buttonColor: value.refuseBanner?.buttonColor || settings.refuseBanner.buttonColor,
              buttonTextColor: value.refuseBanner?.buttonTextColor || settings.refuseBanner.buttonTextColor,
            },
          });
        }
      } catch (error) {
        console.error("Error loading cookie banner settings:", error);
      }
    };

    loadSettings();
  }, []);

  useEffect(() => {
    // Check if user has already accepted or refused cookies
    const cookiesAccepted = localStorage.getItem("cookies_accepted");
    const cookiesRefused = localStorage.getItem("cookies_refused");
    
    if (!cookiesAccepted && !cookiesRefused && settings.enabled) {
      setIsVisible(true);
    } else if (cookiesRefused === "true" && settings.refuseBanner.enabled) {
      setShowRefuseBanner(true);
    }
  }, [settings.enabled, settings.refuseBanner.enabled]);

  const handleAccept = () => {
    localStorage.setItem("cookies_accepted", "true");
    localStorage.removeItem("cookies_refused");
    setIsVisible(false);
    setShowRefuseBanner(false);
  };

  const handleRefuse = () => {
    localStorage.setItem("cookies_refused", "true");
    setIsVisible(false);
    if (settings.refuseBanner.enabled) {
      setShowRefuseBanner(true);
    }
  };

  const handleClose = () => {
    setIsVisible(false);
  };

  // Show refuse banner if user refused and it's enabled
  if (showRefuseBanner && settings.refuseBanner.enabled) {
    return (
      <div
        className="fixed bottom-0 left-0 right-0 z-50 shadow-2xl border-t animate-in slide-in-from-bottom duration-500"
        style={{
          backgroundColor: settings.refuseBanner.backgroundColor,
          color: settings.refuseBanner.textColor,
        }}
      >
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col items-center justify-center gap-4 text-center">
            <p className="text-base font-medium leading-relaxed max-w-3xl">
              {settings.refuseBanner.text}
            </p>
            
            <button
              onClick={handleAccept}
              className="px-8 py-3 rounded-lg text-base font-semibold transition-all hover:opacity-90 hover:scale-105 active:scale-95 shadow-lg"
              style={{
                backgroundColor: settings.refuseBanner.buttonColor,
                color: settings.refuseBanner.buttonTextColor,
              }}
            >
              J'accepte finalement
            </button>
          </div>
        </div>
      </div>
    );
  }

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
        <div className="flex flex-col items-center justify-center gap-4 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
          <p className="text-sm sm:flex-1 leading-relaxed max-w-2xl">
            {settings.text}
          </p>
          
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto sm:flex-shrink-0">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={handleAccept}
                className="flex-1 sm:flex-none px-6 py-2.5 rounded-lg text-sm font-medium transition-all hover:opacity-90 hover:scale-105 active:scale-95 shadow-md whitespace-nowrap"
                style={{
                  backgroundColor: settings.buttonColor,
                  color: settings.buttonTextColor,
                }}
              >
                J'accepte
              </button>
              
              <button
                onClick={handleRefuse}
                className="flex-1 sm:flex-none px-6 py-2.5 rounded-lg text-sm font-medium transition-all hover:opacity-90 hover:scale-105 active:scale-95 shadow-md border-2 whitespace-nowrap"
                style={{
                  backgroundColor: settings.refuseButtonBgColor,
                  color: settings.refuseButtonTextColor,
                  borderColor: settings.refuseButtonBorderColor,
                }}
              >
                {settings.refuseButtonText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieBanner;
