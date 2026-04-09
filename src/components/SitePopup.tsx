import { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { X, Mail, Sparkles, CheckCircle2, FileText } from "lucide-react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

type Popup = {
  id: string;
  name: string;
  is_active: boolean;
  target_page: string;
  target_categories: string[] | null;
  form_id: string | null;
  delay_seconds: number;
  frequency: string;
  template: string;
  title: string | null;
  subtitle: string | null;
  background_image: string | null;
  background_color: string;
  text_color: string;
  accent_color: string;
  overlay_opacity: number;
  size: string;
  position: string;
  animation: string;
  badge_text: string | null;
  badge_color: string;
  show_close_button: boolean;
  close_button_style: string;
  trigger_type: string;
  trigger_id: string | null;
};

type FormConfig = {
  id: string;
  name: string;
  form_identifier: string;
  fields_schema: any;
};

export default function SitePopup() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [activePopup, setActivePopup] = useState<Popup | null>(null);
  const [parcoursStep, setParcoursStep] = useState<"main" | "contact-choice">("main");

  // Check if we're on an article detail page
  const isArticlePage = location.pathname.startsWith("/actualites/") && location.pathname.split("/").length > 2;
  const articleSlug = isArticlePage ? location.pathname.split("/").pop() : null;
  const categorySlug = isArticlePage ? location.pathname.split("/")[2] : null;

  // Fetch article category if on article page
  const { data: articleCategory } = useQuery({
    queryKey: ["article-category", articleSlug],
    queryFn: async () => {
      if (!articleSlug) return null;
      
      const { data: article, error } = await supabase
        .from("posts")
        .select(`
          id,
          post_categories!inner(
            category:categories(slug)
          )
        `)
        .eq("slug", articleSlug)
        .eq("content_type", "actualite")
        .maybeSingle();
      
      if (error || !article) return categorySlug;
      
      const categories = article.post_categories as any[];
      return categories?.[0]?.category?.slug || categorySlug;
    },
    enabled: isArticlePage,
  });

  // Fetch AUTO popup for current page (existing behavior)
  const { data: autoPopup } = useQuery({
    queryKey: ["active-auto-popup", location.pathname, isArticlePage, articleCategory, categorySlug],
    queryFn: async () => {
      if (isArticlePage) {
        const { data, error } = await supabase
          .from("popups")
          .select("*")
          .eq("target_page", "/actualites")
          .eq("is_active", true)
          .eq("trigger_type", "auto")
          .maybeSingle();
        
        if (error) throw error;
        if (!data) return null;
        
        const popupData = data as Popup;
        const currentCategory = articleCategory || categorySlug;
        
        if (popupData.target_categories && popupData.target_categories.length > 0) {
          if (!currentCategory || !popupData.target_categories.includes(currentCategory)) {
            return null;
          }
        }
        
        return popupData;
      }
      
      const { data, error } = await supabase
        .from("popups")
        .select("*")
        .eq("target_page", location.pathname)
        .eq("is_active", true)
        .eq("trigger_type", "auto")
        .maybeSingle();
      
      if (error) throw error;
      return data as Popup | null;
    },
  });

  // Fetch all CLICK popups (globally available)
  const { data: clickPopups } = useQuery({
    queryKey: ["click-popups"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("popups")
        .select("*")
        .eq("is_active", true)
        .eq("trigger_type", "click")
        .not("trigger_id", "is", null);
      
      if (error) throw error;
      return data as Popup[];
    },
  });

  // Fetch form if active popup has one
  const { data: form } = useQuery({
    queryKey: ["popup-form", activePopup?.form_id],
    queryFn: async () => {
      if (!activePopup?.form_id) return null;
      const { data, error } = await supabase
        .from("form_configurations")
        .select("*")
        .eq("id", activePopup.form_id)
        .maybeSingle();
      
      if (error) throw error;
      return data as FormConfig | null;
    },
    enabled: !!activePopup?.form_id,
  });

  // Function to show a popup
  const showPopup = useCallback((popup: Popup) => {
    const storageKey = `popup_${popup.id}_shown`;
    
    if (popup.frequency === "once") {
      const wasShown = localStorage.getItem(storageKey);
      if (wasShown) return;
    } else if (popup.frequency === "session") {
      const wasShown = sessionStorage.getItem(storageKey);
      if (wasShown) return;
    }

    setActivePopup(popup);
    setIsAnimating(true);
    setIsVisible(true);
    
    if (popup.frequency === "once") {
      localStorage.setItem(storageKey, "true");
    } else if (popup.frequency === "session") {
      sessionStorage.setItem(storageKey, "true");
    }
  }, []);

  // Handle AUTO popups (with delay)
  useEffect(() => {
    if (!autoPopup) {
      return;
    }

    const timer = setTimeout(() => {
      showPopup(autoPopup);
    }, autoPopup.delay_seconds * 1000);

    return () => clearTimeout(timer);
  }, [autoPopup, showPopup]);

  // Handle CLICK popups (listen for custom events)
  useEffect(() => {
    const handleTriggerPopup = (event: CustomEvent<{ triggerId: string }>) => {
      const { triggerId } = event.detail;
      
      if (!clickPopups) {
        return;
      }
      
      const matchingPopup = clickPopups.find(p => p.trigger_id === triggerId);
      if (matchingPopup) {
        showPopup(matchingPopup);
      }
    };

    // Handler pour les bandeaux CTA avec popupId (ouvre par ID de popup)
    const handleOpenPopup = (event: CustomEvent<{ popupId: string }>) => {
      const { popupId } = event.detail;
      
      if (!popupId) return;
      
      // Chercher le popup par son ID directement
      supabase
        .from("popups")
        .select("*")
        .eq("id", popupId)
        .eq("is_active", true)
        .maybeSingle()
        .then(({ data, error }) => {
          if (error) {
            console.error("Error fetching popup:", error);
            return;
          }
          if (data) {
            showPopup(data as Popup);
          }
        });
    };

    window.addEventListener("trigger-popup", handleTriggerPopup as EventListener);
    window.addEventListener("open-popup", handleOpenPopup as EventListener);
    
    return () => {
      window.removeEventListener("trigger-popup", handleTriggerPopup as EventListener);
      window.removeEventListener("open-popup", handleOpenPopup as EventListener);
    };
  }, [clickPopups, showPopup]);

  // Écouter les clics sur les éléments avec data-popup-trigger dans le DOM
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const popupTrigger = target.closest('[data-popup-trigger]');
      
      if (popupTrigger) {
        const popupId = popupTrigger.getAttribute('data-popup-trigger');
        if (popupId) {
          e.preventDefault();
          e.stopPropagation();
          window.dispatchEvent(new CustomEvent('open-popup', { 
            detail: { popupId } 
          }));
        }
      }
    };

    document.addEventListener('click', handleDocumentClick);
    return () => {
      document.removeEventListener('click', handleDocumentClick);
    };
  }, []);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      setIsVisible(false);
      setIsSuccess(false);
      setFormData({});
      setActivePopup(null);
      setParcoursStep("main"); // Reset parcours step
    }, 300);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;

    // Validate that all required fields are filled
    const fields = Array.isArray(form.fields_schema) ? form.fields_schema : [];
    const missingFields = fields
      .filter((f: any) => f.required && (!formData[f.name] || formData[f.name].trim() === ""))
      .map((f: any) => f.label || f.name);
    
    if (missingFields.length > 0) {
      toast.error(`Veuillez remplir : ${missingFields.join(", ")}`);
      return;
    }

    setIsSubmitting(true);
    try {
      if (form.form_identifier === "newsletter") {
        const email = formData.email;
        if (!email || !email.includes("@")) {
          toast.error("Veuillez entrer une adresse email valide");
          setIsSubmitting(false);
          return;
        }

        const { data: existing } = await supabase
          .from("newsletter_subscribers")
          .select("email, status")
          .eq("email", email)
          .maybeSingle();

        if (existing) {
          if (existing.status === "active") {
            toast.info("Vous êtes déjà inscrit à notre newsletter !");
          } else {
            toast.info("Cette adresse était désinscrite.");
          }
          handleClose();
          return;
        }

        const { error } = await supabase
          .from("newsletter_subscribers")
          .insert({
            email,
            source: "popup",
            status: "active"
          });

        if (error) throw error;
        
        setIsSuccess(true);
        toast.success("Inscription réussie !");
        setTimeout(handleClose, 2000);
      } else {
        const { error } = await supabase
          .from("form_submissions")
          .insert([{
            form_id: form.id,
            data: formData,
          }]);

        if (error) throw error;
        
        handleClose();
        
        // Récupérer le nom depuis le formData (fullName, nom, ou name)
        const userName = formData.fullName || formData.nom || formData.name || "";
        const params = new URLSearchParams();
        if (userName) params.set("name", userName);
        navigate(`/merci${params.toString() ? `?${params.toString()}` : ""}`);
      }
    } catch (error) {
      toast.error("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isVisible || !activePopup) return null;

  const getSizeClasses = () => {
    // For aide-dossier form, use a wider but shorter layout
    const isAideDossier = form?.form_identifier === "aide-dossier";
    if (isAideDossier) {
      return "max-w-4xl";
    }
    
    switch (activePopup.size) {
      case "small":
        return "max-w-sm";
      case "medium":
        return "max-w-md";
      case "large":
        return "max-w-2xl";
      case "fullscreen":
        return "w-full h-full max-w-none rounded-none";
      default:
        return "max-w-md";
    }
  };

  const getContainerAlignClasses = () => {
    if (activePopup.size === "fullscreen") return "";
    
    switch (activePopup.position) {
      case "bottom-right":
        return "items-end justify-end p-4";
      case "bottom-left":
        return "items-end justify-start p-4";
      case "top-right":
        return "items-start justify-end p-4";
      case "top-left":
        return "items-start justify-start p-4";
      case "center":
      default:
        return "items-center justify-center p-4";
    }
  };

  const getAnimationClasses = () => {
    if (!isAnimating) return "opacity-0 scale-95";
    
    switch (activePopup.animation) {
      case "fade":
        return "animate-fade-in";
      case "slide-up":
        return "animate-[slideUp_0.3s_ease-out_forwards]";
      case "slide-down":
        return "animate-[slideDown_0.3s_ease-out_forwards]";
      case "scale":
        return "animate-scale-in";
      default:
        return "animate-fade-in";
    }
  };

  const renderFormFields = () => {
    if (!form?.fields_schema) return null;
    
    const fields = Array.isArray(form.fields_schema) ? form.fields_schema : [];
    
    return fields.map((field: any, index: number) => {
      // Handle select fields
      if (field.type === "select" && field.options) {
        return (
          <div key={index} className="space-y-2">
            <Label className="text-sm font-medium" style={{ color: activePopup.text_color }}>
              {field.label}
            </Label>
            <Select
              value={formData[field.name] || ""}
              onValueChange={(value) => setFormData(prev => ({ ...prev, [field.name]: value }))}
              required={field.required}
            >
              <SelectTrigger className="h-12 bg-white border-2 border-gray-200 focus:border-primary rounded-lg text-base">
                <SelectValue placeholder={field.placeholder || `Sélectionnez ${field.label.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                {field.options.map((option: any, optIndex: number) => (
                  <SelectItem key={optIndex} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
      }
      
      // Handle radio fields
      if (field.type === "radio" && field.options) {
        return (
          <div key={index} className="space-y-3">
            <Label className="text-sm font-medium" style={{ color: activePopup.text_color }}>
              {field.label}
            </Label>
            <RadioGroup
              value={formData[field.name] || ""}
              onValueChange={(value) => setFormData(prev => ({ ...prev, [field.name]: value }))}
              className="flex flex-wrap gap-4"
            >
              {field.options.map((option: any, optIndex: number) => (
                <div key={optIndex} className="flex items-center space-x-2">
                  <RadioGroupItem 
                    value={option.value} 
                    id={`${field.name}-${option.value}`}
                    className="border-2 border-gray-300"
                  />
                  <Label 
                    htmlFor={`${field.name}-${option.value}`}
                    className="text-sm cursor-pointer"
                    style={{ color: activePopup.text_color }}
                  >
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        );
      }
      
      // Default: text/email/tel input
      return (
        <div key={index} className="space-y-2">
          <Label className="text-sm font-medium" style={{ color: activePopup.text_color }}>
            {field.label}
          </Label>
          <Input
            placeholder={field.placeholder || field.label || field.name}
            type={field.type || "text"}
            required={field.required}
            value={formData[field.name] || ""}
            onChange={(e) => setFormData(prev => ({ ...prev, [field.name]: e.target.value }))}
            className="h-12 bg-white border-2 border-gray-200 focus:border-primary rounded-lg text-base"
          />
        </div>
      );
    });
  };

  // Get appropriate success message based on form type
  const getSuccessContent = () => {
    if (form?.form_identifier === "aide-dossier") {
      return {
        icon: FileText,
        title: "Demande envoyée avec succès !",
        subtitle: "Un conseiller vous contactera dans les plus brefs délais pour vous accompagner dans la constitution de votre dossier d'aides."
      };
    }
    if (form?.form_identifier === "newsletter") {
      return {
        icon: CheckCircle2,
        title: "Merci pour votre inscription !",
        subtitle: "Vous recevrez bientôt nos actualités."
      };
    }
    return {
      icon: CheckCircle2,
      title: "Merci !",
      subtitle: "Votre demande a bien été envoyée. Nous vous répondrons rapidement."
    };
  };

  const renderContent = () => {
    if (isSuccess) {
      const successContent = getSuccessContent();
      const SuccessIcon = successContent.icon;
      
      return (
        <div className="flex flex-col items-center justify-center py-8 space-y-4">
          <div 
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${activePopup.accent_color}20` }}
          >
            <SuccessIcon className="w-10 h-10" style={{ color: activePopup.accent_color }} />
          </div>
          <h2 className="text-2xl font-bold text-center" style={{ color: activePopup.text_color }}>
            {successContent.title}
          </h2>
          <p className="text-center opacity-70 px-4" style={{ color: activePopup.text_color }}>
            {successContent.subtitle}
          </p>
        </div>
      );
    }

    switch (activePopup.template) {
      case "lead_capture":
        // Determine icon and button text based on form type
        const isAideDossier = form?.form_identifier === "aide-dossier";
        const FormIcon = isAideDossier ? FileText : Mail;
        const submitButtonText = isAideDossier ? "Envoyer ma demande" : "S'inscrire maintenant";
        const loadingText = isAideDossier ? "Envoi..." : "Inscription...";
        const footerText = isAideDossier 
          ? "Vos données sont utilisées uniquement pour traiter votre demande."
          : "En vous inscrivant, vous acceptez de recevoir nos communications.";
        
        // Check if this is aide-dossier form for 2-column layout
        const isAideDossierForm = form?.form_identifier === "aide-dossier";
        
        if (isAideDossierForm) {
          // 2-column layout for aide-dossier (more compact/horizontal)
          return (
            <form onSubmit={handleSubmit} className="flex gap-8">
              {/* Left column - Header */}
              <div className="flex-1 flex flex-col justify-center items-center text-center border-r border-gray-200 pr-8">
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg mb-4"
                  style={{ 
                    background: `linear-gradient(135deg, ${activePopup.accent_color}, ${activePopup.accent_color}dd)` 
                  }}
                >
                  <FormIcon className="w-8 h-8 text-white" />
                </div>
                
                {activePopup.badge_text && (
                  <Badge 
                    className="text-white font-medium px-3 py-1 text-xs mb-4"
                    style={{ backgroundColor: activePopup.accent_color }}
                  >
                    <Sparkles className="w-3 h-3 mr-1" />
                    {activePopup.badge_text}
                  </Badge>
                )}
                
                {activePopup.title && (
                  <h2 
                    className="text-xl font-bold leading-tight mb-3" 
                    style={{ color: activePopup.text_color }}
                  >
                    {activePopup.title}
                  </h2>
                )}
                
                {activePopup.subtitle && (
                  <p 
                    className="text-sm opacity-70 leading-relaxed" 
                    style={{ color: activePopup.text_color }}
                  >
                    {activePopup.subtitle}
                  </p>
                )}
              </div>
              
              {/* Right column - Form fields */}
              <div className="flex-1 space-y-3">
                {renderFormFields()}
                
                <Button 
                  type="submit"
                  className="w-full h-11 font-semibold text-white text-base rounded-lg shadow-md hover:shadow-lg transition-all mt-4"
                  style={{ 
                    backgroundColor: activePopup.accent_color,
                    boxShadow: `0 4px 14px ${activePopup.accent_color}40`
                  }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {loadingText}
                    </span>
                  ) : (
                    submitButtonText
                  )}
                </Button>
                
                <p 
                  className="text-xs text-center opacity-50" 
                  style={{ color: activePopup.text_color }}
                >
                  {footerText}
                </p>
              </div>
            </form>
          );
        }
        
        // Default single column layout for other forms
        return (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex justify-center mb-2">
              <div 
                className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg"
                style={{ 
                  background: `linear-gradient(135deg, ${activePopup.accent_color}, ${activePopup.accent_color}dd)` 
                }}
              >
                <FormIcon className="w-7 h-7 text-white" />
              </div>
            </div>

            {activePopup.badge_text && (
              <div className="flex justify-center">
                <Badge 
                  className="text-white font-medium px-3 py-1 text-xs"
                  style={{ backgroundColor: activePopup.accent_color }}
                >
                  <Sparkles className="w-3 h-3 mr-1" />
                  {activePopup.badge_text}
                </Badge>
              </div>
            )}

            {activePopup.title && (
              <h2 
                className="text-2xl font-bold text-center leading-tight" 
                style={{ color: activePopup.text_color }}
              >
                {activePopup.title}
              </h2>
            )}
            
            {activePopup.subtitle && (
              <p 
                className="text-sm text-center opacity-70 leading-relaxed px-2" 
                style={{ color: activePopup.text_color }}
              >
                {activePopup.subtitle}
              </p>
            )}
            
            <div className="space-y-4 pt-2">
              {form ? renderFormFields() : (
                <Input 
                  placeholder="Votre adresse email" 
                  type="email"
                  required
                  className="h-12 bg-white border-2 border-gray-200 focus:border-primary rounded-lg text-base"
                  value={formData.email || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                />
              )}
              <Button 
                type="submit"
                className="w-full h-12 font-semibold text-white text-base rounded-lg shadow-md hover:shadow-lg transition-all"
                style={{ 
                  backgroundColor: activePopup.accent_color,
                  boxShadow: `0 4px 14px ${activePopup.accent_color}40`
                }}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {loadingText}
                  </span>
                ) : (
                  submitButtonText
                )}
              </Button>
            </div>

            <p 
              className="text-xs text-center opacity-50 pt-1" 
              style={{ color: activePopup.text_color }}
            >
              {footerText}
            </p>
          </form>
        );
      
      case "promotion":
        return (
          <div className="space-y-4 text-center">
            {activePopup.badge_text && (
              <Badge 
                className="text-white font-bold px-4 py-1"
                style={{ backgroundColor: activePopup.badge_color }}
              >
                {activePopup.badge_text}
              </Badge>
            )}
            {activePopup.title && (
              <h2 className="text-3xl font-bold" style={{ color: activePopup.text_color }}>
                {activePopup.title}
              </h2>
            )}
            {activePopup.subtitle && (
              <p className="text-lg" style={{ color: activePopup.text_color }}>
                {activePopup.subtitle}
              </p>
            )}
            <Button 
              size="lg"
              className="font-semibold mt-4 text-white"
              style={{ backgroundColor: activePopup.accent_color }}
              onClick={handleClose}
            >
              Profiter de l'offre
            </Button>
          </div>
        );
      
      case "information":
        return (
          <div className="space-y-4">
            {activePopup.title && (
              <h2 className="text-xl font-bold" style={{ color: activePopup.text_color }}>
                {activePopup.title}
              </h2>
            )}
            {activePopup.subtitle && (
              <p style={{ color: activePopup.text_color }}>
                {activePopup.subtitle}
              </p>
            )}
            <Button 
              variant="outline"
              className="font-medium"
              style={{ 
                borderColor: activePopup.accent_color, 
                color: activePopup.accent_color 
              }}
              onClick={handleClose}
            >
              Compris
            </Button>
          </div>
        );
      
      case "fullscreen":
        return (
          <div className="flex flex-col items-center justify-center h-full space-y-6 text-center p-8">
            {activePopup.badge_text && (
              <Badge 
                className="text-white font-bold px-6 py-2 text-lg"
                style={{ backgroundColor: activePopup.badge_color }}
              >
                {activePopup.badge_text}
              </Badge>
            )}
            {activePopup.title && (
              <h2 className="text-4xl md:text-6xl font-bold" style={{ color: activePopup.text_color }}>
                {activePopup.title}
              </h2>
            )}
            {activePopup.subtitle && (
              <p className="text-xl md:text-2xl max-w-2xl" style={{ color: activePopup.text_color }}>
                {activePopup.subtitle}
              </p>
            )}
            <div className="flex gap-4 mt-8">
              <Button 
                size="lg"
                className="font-semibold px-8 text-white"
                style={{ backgroundColor: activePopup.accent_color }}
              >
                Découvrir
              </Button>
              <Button 
                size="lg"
                variant="outline"
                className="font-semibold px-8"
                style={{ 
                  borderColor: activePopup.text_color, 
                  color: activePopup.text_color 
                }}
                onClick={handleClose}
              >
                Plus tard
              </Button>
            </div>
          </div>
        );
      
      case "parcours_projet":
        // Handle contact type selection
        const handleContactChoice = (type: "particulier" | "professionnel") => {
          handleClose();
          // Dispatch event to preselect account type in contact form
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('contact-preselect', { 
              detail: { accountType: type, subject: "" } 
            }));
            // Navigate to contact section
            const contactElement = document.getElementById('contact');
            if (contactElement) {
              contactElement.scrollIntoView({ behavior: 'smooth' });
            } else {
              navigate("/#contact");
            }
          }, 100);
        };

        // Sub-step: Contact choice (Particulier / Professionnel)
        if (parcoursStep === "contact-choice") {
          return (
            <div className="space-y-4 sm:space-y-6">
              {/* Back button */}
              <button
                onClick={() => setParcoursStep("main")}
                className="flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors text-xs sm:text-sm"
              >
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Retour
              </button>

              {/* Header */}
              <div className="text-center space-y-1.5 sm:space-y-2">
                <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25 mb-3 sm:mb-4">
                  <Mail className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-800">
                  Vous êtes...
                </h2>
                <p className="text-xs sm:text-sm text-slate-500">
                  Sélectionnez votre profil pour être recontacté
                </p>
              </div>

              {/* Two choices */}
              <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
                <button
                  onClick={() => handleContactChoice("particulier")}
                  className="group p-4 sm:p-6 rounded-lg sm:rounded-xl border-2 border-slate-200 hover:border-blue-400 bg-gradient-to-br from-white to-slate-50 hover:from-blue-50 hover:to-white transition-all duration-300 text-center"
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto rounded-full bg-blue-100 flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-110 transition-transform">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-slate-800 group-hover:text-blue-700 text-sm sm:text-base">Particulier</h3>
                  <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 sm:mt-1">Pour mon logement</p>
                </button>

                <button
                  onClick={() => handleContactChoice("professionnel")}
                  className="group p-4 sm:p-6 rounded-lg sm:rounded-xl border-2 border-slate-200 hover:border-emerald-400 bg-gradient-to-br from-white to-slate-50 hover:from-emerald-50 hover:to-white transition-all duration-300 text-center"
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto rounded-full bg-emerald-100 flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-110 transition-transform">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-slate-800 group-hover:text-emerald-700 text-sm sm:text-base">Professionnel</h3>
                  <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 sm:mt-1">Pour mon entreprise</p>
                </button>
              </div>

              <p className="text-[10px] sm:text-xs text-center text-blue-600 font-medium flex items-center justify-center gap-1">
                <CheckCircle2 className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                Rappel sous 24-48h
              </p>
            </div>
          );
        }

        // Main step: 4 options
        return (
          <div className="space-y-4 sm:space-y-6">
            {/* Header */}
            <div className="text-center space-y-1.5 sm:space-y-2">
              {activePopup.badge_text && (
                <Badge 
                  className="text-white font-medium px-2.5 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-xs"
                  style={{ backgroundColor: activePopup.accent_color }}
                >
                  <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1" />
                  {activePopup.badge_text}
                </Badge>
              )}
              {activePopup.title && (
                <h2 
                  className="text-lg sm:text-xl md:text-2xl font-bold leading-tight" 
                  style={{ color: activePopup.text_color }}
                >
                  {activePopup.title}
                </h2>
              )}
              {activePopup.subtitle && (
                <p 
                  className="text-xs sm:text-sm opacity-70" 
                  style={{ color: activePopup.text_color }}
                >
                  {activePopup.subtitle}
                </p>
              )}
            </div>

            {/* 4 Options Grid - Always 2 columns */}
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
              {/* Option 1: Demande de contact */}
              <button
                onClick={() => setParcoursStep("contact-choice")}
                className="group p-3 sm:p-4 rounded-xl border-2 border-slate-200 hover:border-blue-400 bg-white hover:bg-blue-50/50 transition-all duration-200 text-center"
              >
                <div className="w-11 h-11 sm:w-12 sm:h-12 mx-auto rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md mb-2 group-hover:scale-105 transition-transform">
                  <Mail className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <h3 className="font-semibold text-slate-800 text-sm sm:text-base leading-tight mb-1">
                  Contact
                </h3>
                <p className="text-[11px] sm:text-xs text-blue-600 font-medium">
                  Rappel 24-48h
                </p>
              </button>

              {/* Option 2: Simulation en ligne */}
              <button
                onClick={() => {
                  handleClose();
                  navigate("/#simulateurs");
                  setTimeout(() => {
                    const element = document.getElementById("simulateurs");
                    if (element) element.scrollIntoView({ behavior: "smooth" });
                  }, 100);
                }}
                className="group p-3 sm:p-4 rounded-xl border-2 border-slate-200 hover:border-emerald-400 bg-white hover:bg-emerald-50/50 transition-all duration-200 text-center"
              >
                <div className="w-11 h-11 sm:w-12 sm:h-12 mx-auto rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-md mb-2 group-hover:scale-105 transition-transform">
                  <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <h3 className="font-semibold text-slate-800 text-sm sm:text-base leading-tight mb-1">
                  Simulation
                </h3>
                <p className="text-[11px] sm:text-xs text-emerald-600 font-medium">
                  Estimer mes aides
                </p>
              </button>

              {/* Option 3: Lire les guides */}
              <button
                onClick={() => {
                  handleClose();
                  navigate("/guides");
                }}
                className="group p-3 sm:p-4 rounded-xl border-2 border-slate-200 hover:border-violet-400 bg-white hover:bg-violet-50/50 transition-all duration-200 text-center"
              >
                <div className="w-11 h-11 sm:w-12 sm:h-12 mx-auto rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center shadow-md mb-2 group-hover:scale-105 transition-transform">
                  <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <h3 className="font-semibold text-slate-800 text-sm sm:text-base leading-tight mb-1">
                  Guides
                </h3>
                <p className="text-[11px] sm:text-xs text-violet-600 font-medium">
                  Mieux comprendre
                </p>
              </button>

              {/* Option 4: Offres Partenaires */}
              <button
                onClick={() => {
                  handleClose();
                  setTimeout(() => {
                    const el = document.getElementById('offres-partenaires');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                    else navigate("/#offres-partenaires");
                  }, 100);
                }}
                className="group p-3 sm:p-4 rounded-xl border-2 border-slate-200 hover:border-amber-400 bg-white hover:bg-amber-50/50 transition-all duration-200 text-center"
              >
                <div className="w-11 h-11 sm:w-12 sm:h-12 mx-auto rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-md mb-2 group-hover:scale-105 transition-transform">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-slate-800 text-sm sm:text-base leading-tight mb-1">
                  Offres Partenaires
                </h3>
                <p className="text-[11px] sm:text-xs text-amber-600 font-medium">
                  Près de chez moi
                </p>
              </button>
            </div>
          </div>
        );
      
      case "newsletter_success":
        return (
          <div className="relative overflow-hidden">
            {/* Confetti animation */}
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="absolute animate-[confetti_3s_ease-out_forwards]"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: '-10px',
                    animationDelay: `${Math.random() * 0.5}s`,
                    transform: `rotate(${Math.random() * 360}deg)`,
                  }}
                >
                  <div
                    className="w-2 h-3 rounded-sm"
                    style={{
                      backgroundColor: ['#22c55e', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6'][Math.floor(Math.random() * 5)],
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Content */}
            <div className="relative z-10 text-center space-y-5 py-4">
              {/* Animated checkmark icon */}
              <div className="relative mx-auto w-20 h-20">
                {/* Outer ring animation */}
                <div 
                  className="absolute inset-0 rounded-full animate-[ping_1s_ease-out]"
                  style={{ backgroundColor: `${activePopup.accent_color}20` }}
                />
                {/* Inner circle with checkmark */}
                <div 
                  className="relative w-20 h-20 rounded-full flex items-center justify-center animate-[bounceIn_0.6s_ease-out]"
                  style={{ 
                    background: `linear-gradient(135deg, ${activePopup.accent_color}, ${activePopup.accent_color}dd)`,
                    boxShadow: `0 10px 40px ${activePopup.accent_color}40`
                  }}
                >
                  <svg 
                    className="w-10 h-10 text-white animate-[checkmark_0.4s_ease-out_0.3s_forwards]" 
                    style={{ strokeDasharray: 50, strokeDashoffset: 50 }}
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor" 
                    strokeWidth={3}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>

              {/* Title with gradient */}
              <div className="space-y-2">
                <h2 
                  className="text-2xl font-bold leading-tight"
                  style={{ color: activePopup.text_color }}
                >
                  {activePopup.title || "Bienvenue dans la communauté !"}
                </h2>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-2xl">🎉</span>
                  <span 
                    className="text-sm font-medium px-3 py-1 rounded-full"
                    style={{ 
                      backgroundColor: `${activePopup.accent_color}15`,
                      color: activePopup.accent_color 
                    }}
                  >
                    Inscription confirmée
                  </span>
                  <span className="text-2xl">🎉</span>
                </div>
              </div>

              {/* Description */}
              <p 
                className="text-sm leading-relaxed max-w-sm mx-auto opacity-80"
                style={{ color: activePopup.text_color }}
              >
                {activePopup.subtitle || "Vous êtes maintenant inscrit à notre newsletter. Préparez-vous à recevoir les meilleures actualités et offres exclusives en énergies renouvelables."}
              </p>

              {/* Benefits list */}
              <div className="flex flex-wrap justify-center gap-3 pt-2">
                {["Actualités", "Offres exclusives", "Guides pratiques"].map((item, idx) => (
                  <div 
                    key={idx}
                    className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-slate-100 text-slate-700"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    {item}
                  </div>
                ))}
              </div>

              {/* CTA Button */}
              <button
                onClick={handleClose}
                className="mt-4 px-8 py-3 rounded-full font-semibold text-white transition-all duration-300 hover:scale-105 hover:shadow-lg"
                style={{ 
                  background: `linear-gradient(135deg, ${activePopup.accent_color}, ${activePopup.accent_color}cc)`,
                  boxShadow: `0 4px 20px ${activePopup.accent_color}30`
                }}
              >
                C'est parti ! 🚀
              </button>
            </div>

            {/* CSS for animations */}
            <style>{`
              @keyframes confetti {
                0% {
                  opacity: 1;
                  transform: translateY(0) rotate(0deg);
                }
                100% {
                  opacity: 0;
                  transform: translateY(400px) rotate(720deg);
                }
              }
              @keyframes bounceIn {
                0% {
                  opacity: 0;
                  transform: scale(0.3);
                }
                50% {
                  transform: scale(1.1);
                }
                70% {
                  transform: scale(0.9);
                }
                100% {
                  opacity: 1;
                  transform: scale(1);
                }
              }
              @keyframes checkmark {
                to {
                  stroke-dashoffset: 0;
                }
              }
            `}</style>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className={`fixed inset-0 z-[100] flex ${getContainerAlignClasses()}`}>
      {/* Overlay */}
      <div 
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isAnimating ? "opacity-100" : "opacity-0"}`}
        style={{ opacity: isAnimating ? activePopup.overlay_opacity / 100 : 0 }}
        onClick={handleClose}
      />

      {/* Popup */}
      <div
        className={`relative w-full ${getSizeClasses()} ${getAnimationClasses()} 
          ${
            activePopup.size !== "fullscreen"
              ? "rounded-xl sm:rounded-2xl shadow-2xl p-4 sm:p-6 md:p-8 mx-4 sm:mx-6 max-h-[90vh] overflow-hidden overflow-y-auto"
              : "overflow-hidden"
          } transition-all duration-300`}
        style={{
          backgroundColor: activePopup.background_color,
          backgroundImage: activePopup.background_image ? `url(${activePopup.background_image})` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
          ...(activePopup.size === "fullscreen" ? { position: 'fixed' as const, inset: 0 } : {}),
        }}
      >
        {/* Decorative gradient overlay */}
        {!activePopup.background_image && activePopup.size !== "fullscreen" && (
          <div 
            className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20 -mr-10 -mt-10"
            style={{ backgroundColor: activePopup.accent_color }}
          />
        )}

        {/* Close button */}
        {activePopup.show_close_button && (
          <button
            onClick={handleClose}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 rounded-full bg-black/5 hover:bg-black/10 transition-colors z-10"
            style={{ color: activePopup.text_color }}
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Content */}
        <div
          className={
            `relative ${activePopup.size === "fullscreen" ? "h-full" : ""} ` +
            (activePopup.show_close_button && activePopup.size !== "fullscreen" ? "pt-8 sm:pt-0" : "")
          }
        >
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
