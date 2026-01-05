import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, ArrowLeft, Upload, X, Image as ImageIcon, GripVertical, Eye, EyeOff, LayoutList, Sun, Zap, Home, Newspaper, HelpCircle, BookOpen, FileText, Calculator, MapPin, Gift, Handshake, MessageSquare, Star, Phone, Smartphone, Search } from "lucide-react";
import SectionPreviewModal from "@/components/SectionPreviewModal";
import { supabase } from "@/integrations/supabase/client";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface HomepageSection {
  id: string;
  name: string;
  anchor: string;
  visible: boolean;
  order: number;
  description: string;
  icon: string;
  color: string;
}

const DEFAULT_HOMEPAGE_SECTIONS: HomepageSection[] = [
  { id: 'solar-banner', name: 'Bannière Solaire', anchor: '#solaire', visible: true, order: 0, description: 'Bandeau promotionnel panneaux solaires avec garantie 25 ans', icon: 'sun', color: '#f59e0b' },
  { id: 'why-solar', name: 'Pourquoi le Solaire', anchor: '#pourquoi-solaire', visible: true, order: 1, description: '3 avantages du solaire avec visuels (facture, app, écologie)', icon: 'zap', color: '#eab308' },
  { id: 'renovation', name: 'Programme Rénovation', anchor: '#renovation', visible: true, order: 2, description: 'Section rénovation d\'ampleur avec image maison', icon: 'home', color: '#22c55e' },
  { id: 'news', name: 'Actualités', anchor: '#actualites', visible: true, order: 3, description: 'Carrousel des dernières actualités du site', icon: 'newspaper', color: '#3b82f6' },
  { id: 'aides', name: 'Aides disponibles', anchor: '#aides', visible: true, order: 4, description: 'Section des aides financières disponibles', icon: 'help', color: '#8b5cf6' },
  { id: 'guides', name: 'Guides par projet', anchor: '#guides', visible: true, order: 5, description: 'Grille des guides pratiques par thématique', icon: 'book', color: '#06b6d4' },
  { id: 'eligibility', name: 'Étude gratuite', anchor: '#etude', visible: true, order: 6, description: 'Formulaire principal de demande d\'étude énergétique', icon: 'file', color: '#10b981' },
  { id: 'simulators', name: 'Simulateurs', anchor: '#simulateurs', visible: true, order: 7, description: 'Grille des simulateurs (économies, aides, etc.)', icon: 'calculator', color: '#f97316' },
  { id: 'installers', name: 'Trouver un installateur', anchor: '#installateurs', visible: true, order: 8, description: 'Carte de France interactive des régions', icon: 'map', color: '#ec4899' },
  { id: 'partner-offers', name: 'Offres partenaires', anchor: '#offres', visible: true, order: 9, description: 'Carrousel des offres promotionnelles partenaires', icon: 'gift', color: '#ef4444' },
  { id: 'cta-partner', name: 'Devenir partenaire', anchor: '#devenir-partenaire', visible: true, order: 10, description: 'Appel à l\'action pour les professionnels', icon: 'handshake', color: '#14b8a6' },
  { id: 'faq', name: 'FAQ', anchor: '#faq', visible: true, order: 11, description: 'Questions fréquentes en accordéon', icon: 'message', color: '#6366f1' },
  { id: 'reviews', name: 'Avis clients', anchor: '#avis', visible: true, order: 12, description: 'Carrousel des témoignages clients avec photos', icon: 'star', color: '#fbbf24' },
  { id: 'contact', name: 'Contact', anchor: '#contact', visible: true, order: 13, description: 'Formulaire de contact et coordonnées', icon: 'phone', color: '#64748b' },
  { id: 'app-download', name: 'Télécharger l\'app', anchor: '#app', visible: true, order: 14, description: 'Section téléchargement application mobile', icon: 'smartphone', color: '#0ea5e9' },
];

const SECTION_ICONS: Record<string, React.ReactNode> = {
  'sun': <Sun className="w-5 h-5" />,
  'zap': <Zap className="w-5 h-5" />,
  'home': <Home className="w-5 h-5" />,
  'newspaper': <Newspaper className="w-5 h-5" />,
  'help': <HelpCircle className="w-5 h-5" />,
  'book': <BookOpen className="w-5 h-5" />,
  'file': <FileText className="w-5 h-5" />,
  'calculator': <Calculator className="w-5 h-5" />,
  'map': <MapPin className="w-5 h-5" />,
  'gift': <Gift className="w-5 h-5" />,
  'handshake': <Handshake className="w-5 h-5" />,
  'message': <MessageSquare className="w-5 h-5" />,
  'star': <Star className="w-5 h-5" />,
  'phone': <Phone className="w-5 h-5" />,
  'smartphone': <Smartphone className="w-5 h-5" />,
};

interface SortableSectionItemProps {
  section: HomepageSection;
  onToggleVisibility: (id: string) => void;
  onPreview: (section: HomepageSection) => void;
}

const SortableSectionItem = ({ section, onToggleVisibility, onPreview }: SortableSectionItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-4 p-4 rounded-lg border ${
        section.visible 
          ? 'border-border bg-background hover:bg-muted/50' 
          : 'border-muted bg-muted/30 opacity-60'
      } transition-colors`}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing flex-shrink-0"
      >
        <GripVertical className="w-5 h-5 text-muted-foreground" />
      </div>
      
      {/* Icon preview */}
      <div 
        className="flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center text-white"
        style={{ backgroundColor: section.color }}
      >
        {SECTION_ICONS[section.icon] || <LayoutList className="w-5 h-5" />}
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{section.name}</p>
        <p className="text-xs text-muted-foreground line-clamp-1">{section.description}</p>
        <p className="text-xs text-primary/60 mt-0.5">{section.anchor}</p>
      </div>
      
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => onPreview(section)}
        className="flex-shrink-0"
        title="Voir l'aperçu"
      >
        <Eye className="w-4 h-4" />
      </Button>
      
      <Button
        type="button"
        variant={section.visible ? "outline" : "secondary"}
        size="sm"
        onClick={() => onToggleVisibility(section.id)}
        className="flex-shrink-0"
      >
        {section.visible ? (
          <>
            <Eye className="w-4 h-4 mr-1" />
            Visible
          </>
        ) : (
          <>
            <EyeOff className="w-4 h-4 mr-1" />
            Masqué
          </>
        )}
      </Button>
    </div>
  );
};

interface SortableImageItemProps {
  id: string;
  image: string;
  index: number;
  onRemove: (index: number) => void;
}

const SortableImageItem = ({ id, image, index, onRemove }: SortableImageItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background hover:bg-muted/50 transition-colors"
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing flex-shrink-0"
      >
        <GripVertical className="w-5 h-5 text-muted-foreground" />
      </div>
      
      <div className="flex-shrink-0 w-24 h-16 rounded overflow-hidden border border-border">
        <img
          src={image}
          alt={`Hero ${index + 1}`}
          className="w-full h-full object-cover"
        />
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">Image #{index + 1}</p>
        <p className="text-xs text-muted-foreground truncate">{image}</p>
      </div>
      
      <Button
        variant="destructive"
        size="icon"
        onClick={() => onRemove(index)}
        className="flex-shrink-0"
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
};

const AdminSettings = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  
  const [settings, setSettings] = useState({
    siteName: "Prime Énergies",
    siteDescription: "Réduisez vos factures énergétiques jusqu'à 80%",
    contactEmail: "contact@prime-energies.fr",
    contactPhone: "01 23 45 67 89",
    address: "123 Rue de l'Énergie, 75001 Paris",
    metaDescription: "Bénéficiez d'une étude énergétique gratuite et découvrez les travaux subventionnés adaptés à votre logement.",
    maintenanceMode: false,
    maintenanceMessage: "Site en maintenance. Nous reviendrons bientôt!",
    aiApiUrl: "https://api.openai.com/v1/chat/completions",
    aiModel: "gpt-4o-mini",
    aiEnabled: true,
    aiCustomInstructions: "",
  });

  const [headerFooterSettings, setHeaderFooterSettings] = useState({
    showPhone: true,
    phoneNumber: "0 800 123 456",
    showWhatsapp: true,
    whatsappLink: "",
    showMemberSpace: true,
    showInstallerButton: true,
    installerButtonText: "Trouver un installateur",
    installerButtonColor: "#22c55e",
    installerButtonTextColor: "#ffffff",
    installerButtonLink: "/#etude",
    showRegionSubHeader: true,
  });

  const [heroSlider, setHeroSlider] = useState({
    enabled: false,
    duration: 5,
    images: [] as string[],
    overlayColor: '#000000',
    overlayIntensity: 50,
  });

  const [cookieBanner, setCookieBanner] = useState({
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

  const [uploadingImage, setUploadingImage] = useState(false);
  
  const [homepageSections, setHomepageSections] = useState<HomepageSection[]>(DEFAULT_HOMEPAGE_SECTIONS);
  const [previewSection, setPreviewSection] = useState<HomepageSection | null>(null);

  useEffect(() => {
    if (user) {
      loadGeneralSettings();
      loadMaintenanceSettings();
      loadAiSettings();
      loadHeroSliderSettings();
      loadCookieBannerSettings();
      loadHeaderFooterSettings();
      loadHomepageSections();
    }
  }, [user]);

  const loadHomepageSections = async () => {
    try {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "homepage_sections")
        .maybeSingle();

      if (data?.value) {
        const savedSections = data.value as unknown as HomepageSection[];
        // Merge saved sections with defaults to ensure new sections are included
        const mergedSections = DEFAULT_HOMEPAGE_SECTIONS.map(defaultSection => {
          const savedSection = savedSections.find(s => s.id === defaultSection.id);
          return savedSection || defaultSection;
        }).sort((a, b) => a.order - b.order);
        setHomepageSections(mergedSections);
      }
    } catch (error) {
      console.error("Error loading homepage sections:", error);
    }
  };

  const handleSectionDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setHomepageSections((prev) => {
        const oldIndex = prev.findIndex(s => s.id === active.id);
        const newIndex = prev.findIndex(s => s.id === over.id);
        const newSections = arrayMove(prev, oldIndex, newIndex);
        // Update order values
        newSections.forEach((section, idx) => {
          section.order = idx;
        });
        return newSections;
      });
    }
  };

  const toggleSectionVisibility = (id: string) => {
    setHomepageSections(prev => 
      prev.map(section => 
        section.id === id ? { ...section, visible: !section.visible } : section
      )
    );
  };

  const saveHomepageSections = async () => {
    try {
      const { data: existing } = await supabase
        .from("site_settings")
        .select("id")
        .eq("key", "homepage_sections")
        .maybeSingle();

      let error;
      if (existing) {
        const result = await supabase
          .from("site_settings")
          .update({
            value: JSON.parse(JSON.stringify(homepageSections)),
            updated_by: user?.id,
            updated_at: new Date().toISOString(),
          })
          .eq("key", "homepage_sections");
        error = result.error;
      } else {
        const result = await supabase
          .from("site_settings")
          .insert([{
            key: "homepage_sections",
            value: JSON.parse(JSON.stringify(homepageSections)),
            updated_by: user?.id,
          }]);
        error = result.error;
      }

      if (error) throw error;

      toast({
        title: "Bandes sauvegardées",
        description: "L'ordre et la visibilité des bandes ont été enregistrés",
      });
    } catch (error: any) {
      console.error("Error saving homepage sections:", error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de sauvegarder les bandes",
        variant: "destructive",
      });
    }
  };

  const loadHeaderFooterSettings = async () => {
    try {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "header_footer")
        .maybeSingle();

      if (data?.value) {
        const value = data.value as any;
        setHeaderFooterSettings({
          showPhone: value.showPhone ?? true,
          phoneNumber: value.phoneNumber || "0 800 123 456",
          showWhatsapp: value.showWhatsapp ?? true,
          whatsappLink: value.whatsappLink || "",
          showMemberSpace: value.showMemberSpace ?? true,
          showInstallerButton: value.showInstallerButton ?? true,
          installerButtonText: value.installerButtonText || "Trouver un installateur",
          installerButtonColor: value.installerButtonColor || "#22c55e",
          installerButtonTextColor: value.installerButtonTextColor || "#ffffff",
          installerButtonLink: value.installerButtonLink || "/#etude",
          showRegionSubHeader: value.showRegionSubHeader ?? true,
        });
      }
    } catch (error) {
      console.error("Error loading header/footer settings:", error);
    }
  };

  const loadGeneralSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("site_settings")
        .select("key, value")
        .in("key", ["site_title", "site_description", "meta_description", "contact_email", "contact_phone", "address"]);

      if (error) throw error;

      if (data) {
        const siteTitle = data.find(s => s.key === "site_title");
        const siteDescription = data.find(s => s.key === "site_description");
        const metaDescription = data.find(s => s.key === "meta_description");
        const contactEmail = data.find(s => s.key === "contact_email");
        const contactPhone = data.find(s => s.key === "contact_phone");
        const address = data.find(s => s.key === "address");

        setSettings(prev => ({
          ...prev,
          siteName: siteTitle?.value as string || "Prime Énergies",
          siteDescription: siteDescription?.value as string || "Réduisez vos factures énergétiques jusqu'à 80%",
          metaDescription: metaDescription?.value as string || "Bénéficiez d'une étude énergétique gratuite et découvrez les travaux subventionnés adaptés à votre logement.",
          contactEmail: contactEmail?.value as string || "contact@prime-energies.fr",
          contactPhone: contactPhone?.value as string || "01 23 45 67 89",
          address: address?.value as string || "123 Rue de l'Énergie, 75001 Paris",
        }));
      }
    } catch (error) {
      console.error("Error loading general settings:", error);
    }
  };

  const loadMaintenanceSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "maintenance_mode")
        .single();

      if (error) throw error;

      if (data) {
        const value = data.value as { enabled: boolean; message: string };
        setSettings(prev => ({
          ...prev,
          maintenanceMode: value.enabled,
          maintenanceMessage: value.message,
        }));
      }
    } catch (error) {
      console.error("Error loading maintenance settings:", error);
    }
  };

  const loadAiSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("site_settings")
        .select("key, value")
        .in("key", ["ai_generation_api_url", "ai_generation_model", "ai_generation_enabled", "ai_custom_instructions"]);

      if (error) throw error;

      if (data) {
        const aiUrl = data.find(s => s.key === "ai_generation_api_url");
        const aiModel = data.find(s => s.key === "ai_generation_model");
        const aiEnabled = data.find(s => s.key === "ai_generation_enabled");
        const aiInstructions = data.find(s => s.key === "ai_custom_instructions");

        setSettings(prev => ({
          ...prev,
          aiApiUrl: aiUrl?.value as string || "https://api.openai.com/v1/chat/completions",
          aiModel: aiModel?.value as string || "gpt-4o-mini",
          aiEnabled: aiEnabled?.value as boolean ?? true,
          aiCustomInstructions: aiInstructions?.value as string || "",
        }));
      }
    } catch (error) {
      console.error("Error loading AI settings:", error);
    }
  };

  const loadHeroSliderSettings = async () => {
    try {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "hero_slider")
        .maybeSingle();

      if (data?.value) {
        const value = data.value as any;
        setHeroSlider({
          enabled: value.enabled || false,
          duration: value.duration || 5,
          images: Array.isArray(value.images) ? value.images : [],
          overlayColor: value.overlayColor || '#000000',
          overlayIntensity: value.overlayIntensity || 50,
        });
      }
    } catch (error) {
      console.error("Error loading hero slider settings:", error);
    }
  };

  const loadCookieBannerSettings = async () => {
    try {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "cookie_banner")
        .maybeSingle();

      if (data?.value) {
        const value = data.value as any;
        setCookieBanner({
          enabled: value.enabled ?? true,
          text: value.text || "Nous utilisons des cookies pour améliorer votre expérience et analyser le trafic de notre site. En continuant à naviguer, vous acceptez notre utilisation des cookies.",
          backgroundColor: value.backgroundColor || '#22c55e',
          textColor: value.textColor || '#ffffff',
          buttonColor: value.buttonColor || '#16a34a',
          buttonTextColor: value.buttonTextColor || '#ffffff',
          refuseButtonText: value.refuseButtonText || 'Je refuse',
          refuseButtonBgColor: value.refuseButtonBgColor || '#ffffff',
          refuseButtonTextColor: value.refuseButtonTextColor || '#000000',
          refuseButtonBorderColor: value.refuseButtonBorderColor || '#ffffff',
          refuseBanner: {
            enabled: value.refuseBanner?.enabled ?? true,
            text: value.refuseBanner?.text || "Nous respectons votre choix, mais sans cookies, certaines fonctionnalités du site seront limitées. Vous ne pourrez pas bénéficier d'une expérience personnalisée ni accéder à tous nos services.",
            backgroundColor: value.refuseBanner?.backgroundColor || '#ef4444',
            textColor: value.refuseBanner?.textColor || '#ffffff',
            buttonColor: value.refuseBanner?.buttonColor || '#dc2626',
            buttonTextColor: value.refuseBanner?.buttonTextColor || '#ffffff',
          },
        });
      }
    } catch (error) {
      console.error("Error loading cookie banner settings:", error);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner une image",
        variant: "destructive",
      });
      return;
    }

    setUploadingImage(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `hero-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('media')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('media')
        .getPublicUrl(filePath);

      setHeroSlider(prev => ({
        ...prev,
        images: [...prev.images, publicUrlData.publicUrl],
      }));

      toast({
        title: "Image ajoutée",
        description: "L'image a été uploadée avec succès",
      });
    } catch (error: any) {
      console.error("Error uploading image:", error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'uploader l'image",
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const removeImage = (index: number) => {
    setHeroSlider(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setHeroSlider((prev) => {
        const oldIndex = prev.images.findIndex((_, i) => `image-${i}` === active.id);
        const newIndex = prev.images.findIndex((_, i) => `image-${i}` === over.id);
        
        return {
          ...prev,
          images: arrayMove(prev.images, oldIndex, newIndex),
        };
      });
    }
  };

  const saveHeroSlider = async () => {
    try {
      // Vérifier si l'entrée existe
      const { data: existing } = await supabase
        .from("site_settings")
        .select("id")
        .eq("key", "hero_slider")
        .maybeSingle();

      let error;
      if (existing) {
        // Mettre à jour l'entrée existante
        const result = await supabase
          .from("site_settings")
          .update({
            value: heroSlider,
            updated_by: user?.id,
            updated_at: new Date().toISOString(),
          })
          .eq("key", "hero_slider");
        error = result.error;
      } else {
        // Créer une nouvelle entrée
        const result = await supabase
          .from("site_settings")
          .insert({
            key: "hero_slider",
            value: heroSlider,
            updated_by: user?.id,
          });
        error = result.error;
      }

      if (error) throw error;

      toast({
        title: "Slider sauvegardé",
        description: "Les paramètres du slider ont été enregistrés",
      });
    } catch (error: any) {
      console.error("Error saving hero slider:", error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de sauvegarder le slider",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/connexion");
    }
  }, [user, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Sauvegarder le mode maintenance avec timestamp d'activation
      const { data: currentMaintenanceData } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "maintenance_mode")
        .maybeSingle();
      
      const currentValue = currentMaintenanceData?.value as { enabled: boolean; activatedAt?: string } | null;
      const wasEnabled = currentValue?.enabled || false;
      
      // Si on active le mode maintenance et qu'il n'était pas actif, on ajoute le timestamp
      const maintenanceValue: { enabled: boolean; message: string; activatedAt?: string } = {
        enabled: settings.maintenanceMode,
        message: settings.maintenanceMessage,
      };
      
      if (settings.maintenanceMode && !wasEnabled) {
        // On active le mode maintenance, on ajoute le timestamp
        maintenanceValue.activatedAt = new Date().toISOString();
      } else if (settings.maintenanceMode && wasEnabled && currentValue?.activatedAt) {
        // Le mode était déjà activé, on garde le timestamp existant
        maintenanceValue.activatedAt = currentValue.activatedAt;
      }
      // Si on désactive, on ne met pas de timestamp (sera ignoré de toute façon)

      const maintenanceUpdate = supabase
        .from("site_settings")
        .update({
          value: maintenanceValue
        })
        .eq("key", "maintenance_mode");

      // Sauvegarder les paramètres IA
      const aiUrlUpdate = supabase
        .from("site_settings")
        .update({ value: settings.aiApiUrl })
        .eq("key", "ai_generation_api_url");

      const aiModelUpdate = supabase
        .from("site_settings")
        .update({ value: settings.aiModel })
        .eq("key", "ai_generation_model");

      const aiEnabledUpdate = supabase
        .from("site_settings")
        .update({ value: settings.aiEnabled })
        .eq("key", "ai_generation_enabled");

      const aiInstructionsUpdate = supabase
        .from("site_settings")
        .upsert({
          key: "ai_custom_instructions",
          value: settings.aiCustomInstructions
        }, {
          onConflict: "key"
        });

      const cookieBannerUpdate = supabase
        .from("site_settings")
        .upsert({
          key: "cookie_banner",
          value: cookieBanner,
          updated_by: user.id,
        }, {
          onConflict: "key"
        });

      const headerFooterUpdate = supabase
        .from("site_settings")
        .upsert({
          key: "header_footer",
          value: headerFooterSettings,
          updated_by: user.id,
        }, {
          onConflict: "key"
        });

      // Sauvegarder les paramètres généraux
      const generalSettingsUpdates = [
        supabase.from("site_settings").upsert({ key: "site_title", value: settings.siteName, updated_by: user.id }, { onConflict: "key" }),
        supabase.from("site_settings").upsert({ key: "site_description", value: settings.siteDescription, updated_by: user.id }, { onConflict: "key" }),
        supabase.from("site_settings").upsert({ key: "meta_description", value: settings.metaDescription, updated_by: user.id }, { onConflict: "key" }),
        supabase.from("site_settings").upsert({ key: "contact_email", value: settings.contactEmail, updated_by: user.id }, { onConflict: "key" }),
        supabase.from("site_settings").upsert({ key: "contact_phone", value: settings.contactPhone, updated_by: user.id }, { onConflict: "key" }),
        supabase.from("site_settings").upsert({ key: "address", value: settings.address, updated_by: user.id }, { onConflict: "key" }),
      ];

      const [maintenanceResult, urlResult, modelResult, enabledResult, instructionsResult, cookieBannerResult, headerFooterResult, ...generalResults] = await Promise.all([
        maintenanceUpdate,
        aiUrlUpdate,
        aiModelUpdate,
        aiEnabledUpdate,
        aiInstructionsUpdate,
        cookieBannerUpdate,
        headerFooterUpdate,
        ...generalSettingsUpdates
      ]);

      if (maintenanceResult.error) throw maintenanceResult.error;
      if (urlResult.error) throw urlResult.error;
      if (modelResult.error) throw modelResult.error;
      if (enabledResult.error) throw enabledResult.error;
      if (instructionsResult.error) throw instructionsResult.error;
      if (cookieBannerResult.error) throw cookieBannerResult.error;
      if (headerFooterResult.error) throw headerFooterResult.error;
      
      // Vérifier les erreurs des paramètres généraux
      generalResults.forEach((result, index) => {
        if (result.error) throw result.error;
      });

      toast({
        title: "Paramètres sauvegardés",
        description: "Les modifications ont été enregistrées avec succès",
      });
    } catch (error: any) {
      console.error("Error saving settings:", error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de sauvegarder les paramètres",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Paramètres généraux | Administration</title>
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="pt-20">
          <div className="container mx-auto px-4 py-8 max-w-4xl">
            <Link 
              to="/administration"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour à l'administration
            </Link>

            <h1 className="text-3xl font-bold mb-2">Paramètres généraux</h1>
            <p className="text-muted-foreground mb-8">
              Configurez les informations globales de votre site
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Header / Footer Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Header / Footer</CardTitle>
                  <CardDescription>
                    Configurez les éléments affichés dans l'en-tête et le pied de page
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Phone settings */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="showPhone" className="text-base">
                          Afficher le numéro de téléphone
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Visible dans le header et le footer
                        </p>
                      </div>
                      <Switch
                        id="showPhone"
                        checked={headerFooterSettings.showPhone}
                        onCheckedChange={(checked) => 
                          setHeaderFooterSettings({ ...headerFooterSettings, showPhone: checked })
                        }
                      />
                    </div>
                    
                    {headerFooterSettings.showPhone && (
                      <div>
                        <Label htmlFor="phoneNumber">Numéro de téléphone</Label>
                        <Input
                          id="phoneNumber"
                          value={headerFooterSettings.phoneNumber}
                          onChange={(e) => 
                            setHeaderFooterSettings({ ...headerFooterSettings, phoneNumber: e.target.value })
                          }
                          placeholder="0 800 123 456"
                          className="max-w-xs"
                        />
                      </div>
                    )}
                  </div>

                  {/* WhatsApp settings */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="showWhatsapp" className="text-base">
                          Afficher WhatsApp
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Icône WhatsApp visible dans le header et le footer
                        </p>
                      </div>
                      <Switch
                        id="showWhatsapp"
                        checked={headerFooterSettings.showWhatsapp}
                        onCheckedChange={(checked) => 
                          setHeaderFooterSettings({ ...headerFooterSettings, showWhatsapp: checked })
                        }
                      />
                    </div>
                    
                    {headerFooterSettings.showWhatsapp && (
                      <div>
                        <Label htmlFor="whatsappLink">Lien ou numéro WhatsApp</Label>
                        <Input
                          id="whatsappLink"
                          value={headerFooterSettings.whatsappLink}
                          onChange={(e) => 
                            setHeaderFooterSettings({ ...headerFooterSettings, whatsappLink: e.target.value })
                          }
                          placeholder="https://wa.me/33612345678 ou 33612345678"
                          className="mt-1"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Entrez un lien complet (https://wa.me/...) ou juste le numéro avec indicatif pays sans + (ex: 33612345678)
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Member space settings */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="showMemberSpace" className="text-base">
                        Activer l'espace membre
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Si désactivé, les connexions non-admin seront bloquées et le bouton "Espace Perso" sera masqué
                      </p>
                    </div>
                    <Switch
                      id="showMemberSpace"
                      checked={headerFooterSettings.showMemberSpace}
                      onCheckedChange={(checked) => 
                        setHeaderFooterSettings({ ...headerFooterSettings, showMemberSpace: checked })
                      }
                    />
                  </div>

                  {/* Region sub-header toggle */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="showRegionSubHeader" className="text-base">
                        Afficher le sous-header régions
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Barre de sélection des régions sous le header (page d'accueil uniquement)
                      </p>
                    </div>
                    <Switch
                      id="showRegionSubHeader"
                      checked={headerFooterSettings.showRegionSubHeader}
                      onCheckedChange={(checked) => 
                        setHeaderFooterSettings({ ...headerFooterSettings, showRegionSubHeader: checked })
                      }
                    />
                  </div>

                  {/* Installer button settings */}
                  <div className="space-y-4 pt-4 border-t border-border">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="showInstallerButton" className="text-base">
                          Afficher le bouton "Trouver un installateur"
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Bouton visible dans le header (desktop uniquement)
                        </p>
                      </div>
                      <Switch
                        id="showInstallerButton"
                        checked={headerFooterSettings.showInstallerButton}
                        onCheckedChange={(checked) => 
                          setHeaderFooterSettings({ ...headerFooterSettings, showInstallerButton: checked })
                        }
                      />
                    </div>
                    
                    {headerFooterSettings.showInstallerButton && (
                      <div className="space-y-4 pl-4 border-l-2 border-primary/20">
                        <div>
                          <Label htmlFor="installerButtonText">Texte du bouton</Label>
                          <Input
                            id="installerButtonText"
                            value={headerFooterSettings.installerButtonText}
                            onChange={(e) => 
                              setHeaderFooterSettings({ ...headerFooterSettings, installerButtonText: e.target.value })
                            }
                            placeholder="Trouver un installateur"
                            className="max-w-xs"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="installerButtonColor">Couleur de fond</Label>
                            <div className="flex gap-2 items-center mt-1">
                              <Input
                                id="installerButtonColor"
                                type="color"
                                value={headerFooterSettings.installerButtonColor}
                                onChange={(e) => 
                                  setHeaderFooterSettings({ ...headerFooterSettings, installerButtonColor: e.target.value })
                                }
                                className="w-16 h-10 cursor-pointer p-1"
                              />
                              <Input
                                type="text"
                                value={headerFooterSettings.installerButtonColor}
                                onChange={(e) => 
                                  setHeaderFooterSettings({ ...headerFooterSettings, installerButtonColor: e.target.value })
                                }
                                className="flex-1"
                                placeholder="#22c55e"
                              />
                            </div>
                          </div>

                          <div>
                            <Label htmlFor="installerButtonTextColor">Couleur du texte</Label>
                            <div className="flex gap-2 items-center mt-1">
                              <Input
                                id="installerButtonTextColor"
                                type="color"
                                value={headerFooterSettings.installerButtonTextColor}
                                onChange={(e) => 
                                  setHeaderFooterSettings({ ...headerFooterSettings, installerButtonTextColor: e.target.value })
                                }
                                className="w-16 h-10 cursor-pointer p-1"
                              />
                              <Input
                                type="text"
                                value={headerFooterSettings.installerButtonTextColor}
                                onChange={(e) => 
                                  setHeaderFooterSettings({ ...headerFooterSettings, installerButtonTextColor: e.target.value })
                                }
                                className="flex-1"
                                placeholder="#ffffff"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Aperçu du bouton */}
                        <div>
                          <Label className="mb-2 block">Aperçu du bouton</Label>
                          <div className="bg-muted/30 rounded-lg p-4 border border-border">
                            <button
                              type="button"
                              className="px-4 py-2 rounded-md font-medium transition-all hover:opacity-90"
                              style={{
                                backgroundColor: headerFooterSettings.installerButtonColor,
                                color: headerFooterSettings.installerButtonTextColor,
                              }}
                            >
                              {headerFooterSettings.installerButtonText || "Trouver un installateur"}
                            </button>
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="installerButtonLink">Lien du bouton</Label>
                          <select
                            id="installerButtonLink"
                            value={headerFooterSettings.installerButtonLink}
                            onChange={(e) => 
                              setHeaderFooterSettings({ ...headerFooterSettings, installerButtonLink: e.target.value })
                            }
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 mt-1"
                          >
                            <optgroup label="Ancres de la page d'accueil">
                              <option value="/#hero">Section Héro (haut de page)</option>
                              <option value="/#solaire">Solaire - Bannière</option>
                              <option value="/#pourquoi-solaire">Pourquoi le Solaire</option>
                              <option value="/#renovation">Programme Rénovation</option>
                              <option value="/#actualites">Actualités</option>
                              <option value="/#aides">Aides disponibles</option>
                              <option value="/#guides">Guides par projet</option>
                              <option value="/#etude">Étude gratuite (formulaire)</option>
                              <option value="/#simulateurs">Simulateurs</option>
                              <option value="/#installateurs">Trouver un installateur</option>
                              <option value="/#offres">Offres partenaires</option>
                              <option value="/#devenir-partenaire">Devenir partenaire</option>
                              <option value="/#faq">FAQ</option>
                              <option value="/#avis">Avis clients</option>
                              <option value="/#contact">Contact</option>
                              <option value="/#app">Télécharger l'app</option>
                            </optgroup>
                            <optgroup label="Landing Pages">
                              <option value="/solaire#etude">Solaire - Formulaire</option>
                              <option value="/pompe-a-chaleur#etude">Pompe à chaleur - Formulaire</option>
                              <option value="/isolation#etude">Isolation - Formulaire</option>
                              <option value="/renovation-globale#etude">Rénovation globale - Formulaire</option>
                            </optgroup>
                            <optgroup label="Pages">
                              <option value="/guides">Tous les guides</option>
                              <option value="/actualites">Actualités</option>
                              <option value="/aides">Aides</option>
                              <option value="/forum">Forum</option>
                            </optgroup>
                          </select>
                          <p className="text-xs text-muted-foreground mt-1">
                            Choisissez vers quelle section ou page le bouton redirigera l'utilisateur
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Banner/Hero Slider */}
              <Card>
                <CardHeader>
                  <CardTitle>Slider du banner principal</CardTitle>
                  <CardDescription>
                    Gérez les images de fond du banner d'accueil avec transitions automatiques
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="sliderEnabled" className="text-base">
                        Activer le slider automatique
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Les images défileront automatiquement selon la durée définie
                      </p>
                    </div>
                    <Switch
                      id="sliderEnabled"
                      checked={heroSlider.enabled}
                      onCheckedChange={(checked) => 
                        setHeroSlider({ ...heroSlider, enabled: checked })
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="sliderDuration">
                      Durée d&apos;affichage par image (secondes)
                    </Label>
                    <Input
                      id="sliderDuration"
                      type="number"
                      min="2"
                      max="30"
                      value={heroSlider.duration}
                      onChange={(e) => 
                        setHeroSlider({ ...heroSlider, duration: parseInt(e.target.value) || 5 })
                      }
                      className="max-w-xs"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Recommandé : entre 5 et 10 secondes
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="overlayColor">
                        Couleur de superposition
                      </Label>
                      <div className="flex gap-2 items-center">
                        <Input
                          id="overlayColor"
                          type="color"
                          value={heroSlider.overlayColor}
                          onChange={(e) => 
                            setHeroSlider({ ...heroSlider, overlayColor: e.target.value })
                          }
                          className="w-20 h-10 cursor-pointer"
                        />
                        <Input
                          type="text"
                          value={heroSlider.overlayColor}
                          onChange={(e) => 
                            setHeroSlider({ ...heroSlider, overlayColor: e.target.value })
                          }
                          className="flex-1"
                          placeholder="#000000"
                        />
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Choisissez la couleur du filtre appliqué sur les images
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="overlayIntensity">
                        Intensité : {heroSlider.overlayIntensity}%
                      </Label>
                      <Input
                        id="overlayIntensity"
                        type="range"
                        min="0"
                        max="100"
                        value={heroSlider.overlayIntensity}
                        onChange={(e) => 
                          setHeroSlider({ ...heroSlider, overlayIntensity: parseInt(e.target.value) })
                        }
                        className="w-full h-10"
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        Réglez l&apos;opacité du filtre (0% = transparent, 100% = opaque)
                      </p>
                    </div>
                  </div>

                  {/* Prévisualisation de la superposition */}
                  <div className="bg-muted/30 rounded-lg p-4 border border-border">
                    <Label className="mb-2 block">Aperçu de la superposition</Label>
                    <div 
                      className="w-full h-24 rounded-lg relative overflow-hidden"
                      style={{
                        backgroundImage: 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)',
                        backgroundSize: '20px 20px',
                        backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
                      }}
                    >
                      <div 
                        className="absolute inset-0"
                        style={{
                          backgroundColor: heroSlider.overlayColor,
                          opacity: heroSlider.overlayIntensity / 100
                        }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <p className="text-white font-bold text-lg drop-shadow-lg">
                          Texte sur l&apos;image
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label>Images du slider ({heroSlider.images.length})</Label>
                    <p className="text-sm text-muted-foreground mb-3">
                      Ajoutez des images de haute qualité (1920x1080 recommandé)
                    </p>

                    {/* Liste d'images avec drag and drop */}
                    {heroSlider.images.length > 0 && (
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                      >
                        <SortableContext
                          items={heroSlider.images.map((_, i) => `image-${i}`)}
                          strategy={verticalListSortingStrategy}
                        >
                          <div className="space-y-3 mb-4">
                            {heroSlider.images.map((image, index) => (
                              <SortableImageItem
                                key={`image-${index}`}
                                id={`image-${index}`}
                                image={image}
                                index={index}
                                onRemove={removeImage}
                              />
                            ))}
                          </div>
                        </SortableContext>
                      </DndContext>
                    )}

                    {/* Bouton upload */}
                    <div>
                      <input
                        type="file"
                        id="heroImageUpload"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('heroImageUpload')?.click()}
                        disabled={uploadingImage}
                        className="w-full"
                      >
                        {uploadingImage ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Upload en cours...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 mr-2" />
                            Ajouter une image
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t">
                    <Button
                      type="button"
                      onClick={saveHeroSlider}
                      variant="default"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Enregistrer le slider
                    </Button>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <p className="text-sm text-blue-900 dark:text-blue-100">
                      <strong>💡 Astuce :</strong> Les transitions entre images sont fluides (fondu enchaîné). Les visiteurs ne peuvent pas contrôler le slider manuellement.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Bandes Accueil */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LayoutList className="w-5 h-5" />
                    Bandes accueil
                  </CardTitle>
                  <CardDescription>
                    Gérez l'ordre et la visibilité des sections de la page d'accueil
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleSectionDragEnd}
                  >
                    <SortableContext
                      items={homepageSections.map(s => s.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-2">
                        {homepageSections.map((section) => (
                          <SortableSectionItem
                            key={section.id}
                            section={section}
                            onToggleVisibility={toggleSectionVisibility}
                            onPreview={(s) => setPreviewSection(s)}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>

                  <div className="flex justify-end pt-4 border-t">
                    <Button
                      type="button"
                      onClick={saveHomepageSections}
                      variant="default"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Enregistrer les bandes
                    </Button>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <p className="text-sm text-blue-900 dark:text-blue-100">
                      <strong>💡 Astuce :</strong> Glissez-déposez les bandes pour les réordonner. Les sections masquées ne seront pas affichées sur la page d'accueil.
                    </p>
                  </div>

                  <SectionPreviewModal
                    open={!!previewSection}
                    onOpenChange={(open) => !open && setPreviewSection(null)}
                    sectionId={previewSection?.id || null}
                    sectionName={previewSection?.name || ""}
                  />
                </CardContent>
              </Card>

              {/* Informations du site */}
              <Card>
                <CardHeader>
                  <CardTitle>Informations du site</CardTitle>
                  <CardDescription>
                    Les informations générales de votre site web
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="siteName">Nom du site</Label>
                    <Input
                      id="siteName"
                      value={settings.siteName}
                      onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                      placeholder="Prime Énergies"
                    />
                  </div>

                  <div>
                    <Label htmlFor="siteDescription">Slogan / Description courte</Label>
                    <Input
                      id="siteDescription"
                      value={settings.siteDescription}
                      onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
                      placeholder="Réduisez vos factures énergétiques jusqu'à 80%"
                    />
                  </div>

                  <div>
                    <Label htmlFor="metaDescription">Meta description (SEO)</Label>
                    <Textarea
                      id="metaDescription"
                      value={settings.metaDescription}
                      onChange={(e) => setSettings({ ...settings, metaDescription: e.target.value })}
                      placeholder="Description pour les moteurs de recherche"
                      rows={3}
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Maximum 160 caractères recommandés
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Coordonnées */}
              <Card>
                <CardHeader>
                  <CardTitle>Coordonnées</CardTitle>
                  <CardDescription>
                    Les informations de contact affichées sur le site
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="contactEmail">Email de contact</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      value={settings.contactEmail}
                      onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                      placeholder="contact@prime-energies.fr"
                    />
                  </div>

                  <div>
                    <Label htmlFor="contactPhone">Téléphone</Label>
                    <Input
                      id="contactPhone"
                      type="tel"
                      value={settings.contactPhone}
                      onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
                      placeholder="01 23 45 67 89"
                    />
                  </div>

                  <div>
                    <Label htmlFor="address">Adresse</Label>
                    <Textarea
                      id="address"
                      value={settings.address}
                      onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                      placeholder="123 Rue de l'Énergie, 75001 Paris"
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Génération IA */}
              <Card>
                <CardHeader>
                  <CardTitle>Génération d'articles par IA</CardTitle>
                  <CardDescription>
                    Configurez l'API d'intelligence artificielle pour la génération automatique d'articles
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="aiEnabled" className="text-base">
                        Activer la génération IA
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Permet aux rédacteurs de générer des articles avec l'IA
                      </p>
                    </div>
                    <Switch
                      id="aiEnabled"
                      checked={settings.aiEnabled}
                      onCheckedChange={(checked) => 
                        setSettings({ ...settings, aiEnabled: checked })
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="aiApiUrl">URL de l'API</Label>
                    <Input
                      id="aiApiUrl"
                      type="url"
                      value={settings.aiApiUrl}
                      onChange={(e) => setSettings({ ...settings, aiApiUrl: e.target.value })}
                      placeholder="https://api.openai.com/v1/chat/completions"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      🔒 Cette URL est sécurisée et ne sera pas visible côté client
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="aiModel">Modèle IA</Label>
                    <Input
                      id="aiModel"
                      value={settings.aiModel}
                      onChange={(e) => setSettings({ ...settings, aiModel: e.target.value })}
                      placeholder="gpt-4o-mini"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Modèle utilisé pour la génération (gpt-4o-mini, gpt-5, etc.)
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="aiCustomInstructions">Instructions personnalisées</Label>
                    <Textarea
                      id="aiCustomInstructions"
                      value={settings.aiCustomInstructions}
                      onChange={(e) => setSettings({ ...settings, aiCustomInstructions: e.target.value })}
                      placeholder="Préférences supplémentaires en matière de comportement, de style et de ton&#10;&#10;Exemple:&#10;- Adopte un ton professionnel et technique&#10;- Utilise des exemples concrets et chiffrés&#10;- Structure l'article avec des sous-titres clairs"
                      rows={6}
                      className="font-mono text-sm"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Ces instructions seront ajoutées à tous les prompts de génération d'articles. Elles peuvent être modifiées temporairement lors de la création d'un article.
                    </p>
                  </div>

                  <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                    <p className="text-sm text-amber-900 dark:text-amber-100">
                      <strong>Note importante :</strong> La clé API est stockée de manière sécurisée dans les secrets du serveur. 
                      Elle n'est jamais exposée côté client, même en inspectant les éléments de la page.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Bannière cookies */}
              <Card>
                <CardHeader>
                  <CardTitle>Bannière de cookies (Consent Mode)</CardTitle>
                  <CardDescription>
                    Configurez la bannière de consentement des cookies conforme RGPD
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="cookieBannerEnabled" className="text-base">
                        Activer la bannière de cookies
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Afficher la bannière de consentement aux visiteurs
                      </p>
                    </div>
                    <Switch
                      id="cookieBannerEnabled"
                      checked={cookieBanner.enabled}
                      onCheckedChange={(checked) => 
                        setCookieBanner({ ...cookieBanner, enabled: checked })
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="cookieBannerText">Texte de la bannière</Label>
                    <Textarea
                      id="cookieBannerText"
                      value={cookieBanner.text}
                      onChange={(e) => setCookieBanner({ ...cookieBanner, text: e.target.value })}
                      placeholder="Nous utilisons des cookies pour améliorer votre expérience..."
                      rows={3}
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Message affiché aux visiteurs concernant l'utilisation des cookies
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="cookieBgColor">Couleur de fond</Label>
                      <div className="flex gap-2">
                        <Input
                          id="cookieBgColor"
                          type="color"
                          value={cookieBanner.backgroundColor}
                          onChange={(e) => setCookieBanner({ ...cookieBanner, backgroundColor: e.target.value })}
                          className="w-20 h-10"
                        />
                        <Input
                          type="text"
                          value={cookieBanner.backgroundColor}
                          onChange={(e) => setCookieBanner({ ...cookieBanner, backgroundColor: e.target.value })}
                          placeholder="#22c55e"
                          className="flex-1"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="cookieTextColor">Couleur du texte</Label>
                      <div className="flex gap-2">
                        <Input
                          id="cookieTextColor"
                          type="color"
                          value={cookieBanner.textColor}
                          onChange={(e) => setCookieBanner({ ...cookieBanner, textColor: e.target.value })}
                          className="w-20 h-10"
                        />
                        <Input
                          type="text"
                          value={cookieBanner.textColor}
                          onChange={(e) => setCookieBanner({ ...cookieBanner, textColor: e.target.value })}
                          placeholder="#ffffff"
                          className="flex-1"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="cookieButtonColor">Couleur du bouton</Label>
                      <div className="flex gap-2">
                        <Input
                          id="cookieButtonColor"
                          type="color"
                          value={cookieBanner.buttonColor}
                          onChange={(e) => setCookieBanner({ ...cookieBanner, buttonColor: e.target.value })}
                          className="w-20 h-10"
                        />
                        <Input
                          type="text"
                          value={cookieBanner.buttonColor}
                          onChange={(e) => setCookieBanner({ ...cookieBanner, buttonColor: e.target.value })}
                          placeholder="#16a34a"
                          className="flex-1"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="cookieButtonTextColor">Couleur texte bouton</Label>
                      <div className="flex gap-2">
                        <Input
                          id="cookieButtonTextColor"
                          type="color"
                          value={cookieBanner.buttonTextColor}
                          onChange={(e) => setCookieBanner({ ...cookieBanner, buttonTextColor: e.target.value })}
                          className="w-20 h-10"
                        />
                        <Input
                          type="text"
                          value={cookieBanner.buttonTextColor}
                          onChange={(e) => setCookieBanner({ ...cookieBanner, buttonTextColor: e.target.value })}
                          placeholder="#ffffff"
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t">
                    <h4 className="font-medium">Bouton "Je refuse"</h4>
                    
                    <div>
                      <Label htmlFor="refuseButtonText">Texte du bouton refus</Label>
                      <Input
                        id="refuseButtonText"
                        value={cookieBanner.refuseButtonText}
                        onChange={(e) => setCookieBanner({ ...cookieBanner, refuseButtonText: e.target.value })}
                        placeholder="Je refuse"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="refuseButtonBgColor">Couleur de fond</Label>
                        <div className="flex gap-2">
                          <Input
                            id="refuseButtonBgColor"
                            type="color"
                            value={cookieBanner.refuseButtonBgColor === 'transparent' ? '#ffffff' : cookieBanner.refuseButtonBgColor}
                            onChange={(e) => setCookieBanner({ ...cookieBanner, refuseButtonBgColor: e.target.value })}
                            className="w-20 h-10"
                          />
                          <Input
                            type="text"
                            value={cookieBanner.refuseButtonBgColor}
                            onChange={(e) => setCookieBanner({ ...cookieBanner, refuseButtonBgColor: e.target.value })}
                            placeholder="transparent"
                            className="flex-1"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="refuseButtonTextColor">Couleur du texte</Label>
                        <div className="flex gap-2">
                          <Input
                            id="refuseButtonTextColor"
                            type="color"
                            value={cookieBanner.refuseButtonTextColor}
                            onChange={(e) => setCookieBanner({ ...cookieBanner, refuseButtonTextColor: e.target.value })}
                            className="w-20 h-10"
                          />
                          <Input
                            type="text"
                            value={cookieBanner.refuseButtonTextColor}
                            onChange={(e) => setCookieBanner({ ...cookieBanner, refuseButtonTextColor: e.target.value })}
                            placeholder="#ffffff"
                            className="flex-1"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="refuseButtonBorderColor">Couleur bordure</Label>
                        <div className="flex gap-2">
                          <Input
                            id="refuseButtonBorderColor"
                            type="color"
                            value={cookieBanner.refuseButtonBorderColor}
                            onChange={(e) => setCookieBanner({ ...cookieBanner, refuseButtonBorderColor: e.target.value })}
                            className="w-20 h-10"
                          />
                          <Input
                            type="text"
                            value={cookieBanner.refuseButtonBorderColor}
                            onChange={(e) => setCookieBanner({ ...cookieBanner, refuseButtonBorderColor: e.target.value })}
                            placeholder="#ffffff"
                            className="flex-1"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div
                    className="mt-6 p-4 rounded-lg shadow-lg border"
                    style={{ 
                      backgroundColor: cookieBanner.backgroundColor,
                      color: cookieBanner.textColor 
                    }}
                  >
                    <p className="text-sm mb-3">{cookieBanner.text}</p>
                    <div className="flex gap-2">
                      <button
                        className="px-4 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-90"
                        style={{
                          backgroundColor: cookieBanner.buttonColor,
                          color: cookieBanner.buttonTextColor
                        }}
                      >
                        J'accepte
                      </button>
                      <button
                        className="px-4 py-2 rounded-lg text-sm font-medium border-2 transition-opacity hover:opacity-90"
                        style={{
                          backgroundColor: cookieBanner.refuseButtonBgColor,
                          color: cookieBanner.refuseButtonTextColor,
                          borderColor: cookieBanner.refuseButtonBorderColor
                        }}
                      >
                        {cookieBanner.refuseButtonText}
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Bannière de refus des cookies */}
              <Card>
                <CardHeader>
                  <CardTitle>Bannière de refus des cookies</CardTitle>
                  <CardDescription>
                    Configurez la bannière affichée quand l'utilisateur refuse les cookies
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="refuseBannerEnabled" className="text-base">
                        Activer la bannière de refus
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Afficher une bannière explicative quand l'utilisateur refuse les cookies
                      </p>
                    </div>
                    <Switch
                      id="refuseBannerEnabled"
                      checked={cookieBanner.refuseBanner.enabled}
                      onCheckedChange={(checked) => 
                        setCookieBanner({ 
                          ...cookieBanner, 
                          refuseBanner: { ...cookieBanner.refuseBanner, enabled: checked }
                        })
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="refuseBannerText">Texte de la bannière de refus</Label>
                    <Textarea
                      id="refuseBannerText"
                      value={cookieBanner.refuseBanner.text}
                      onChange={(e) => setCookieBanner({ 
                        ...cookieBanner, 
                        refuseBanner: { ...cookieBanner.refuseBanner, text: e.target.value }
                      })}
                      placeholder="Nous respectons votre choix, mais sans cookies..."
                      rows={3}
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Message expliquant les limitations sans cookies
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="refuseBgColor">Couleur de fond</Label>
                      <div className="flex gap-2">
                        <Input
                          id="refuseBgColor"
                          type="color"
                          value={cookieBanner.refuseBanner.backgroundColor}
                          onChange={(e) => setCookieBanner({ 
                            ...cookieBanner, 
                            refuseBanner: { ...cookieBanner.refuseBanner, backgroundColor: e.target.value }
                          })}
                          className="w-20 h-10"
                        />
                        <Input
                          type="text"
                          value={cookieBanner.refuseBanner.backgroundColor}
                          onChange={(e) => setCookieBanner({ 
                            ...cookieBanner, 
                            refuseBanner: { ...cookieBanner.refuseBanner, backgroundColor: e.target.value }
                          })}
                          placeholder="#ef4444"
                          className="flex-1"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="refuseTextColor">Couleur du texte</Label>
                      <div className="flex gap-2">
                        <Input
                          id="refuseTextColor"
                          type="color"
                          value={cookieBanner.refuseBanner.textColor}
                          onChange={(e) => setCookieBanner({ 
                            ...cookieBanner, 
                            refuseBanner: { ...cookieBanner.refuseBanner, textColor: e.target.value }
                          })}
                          className="w-20 h-10"
                        />
                        <Input
                          type="text"
                          value={cookieBanner.refuseBanner.textColor}
                          onChange={(e) => setCookieBanner({ 
                            ...cookieBanner, 
                            refuseBanner: { ...cookieBanner.refuseBanner, textColor: e.target.value }
                          })}
                          placeholder="#ffffff"
                          className="flex-1"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="refuseButtonColor">Couleur du bouton</Label>
                      <div className="flex gap-2">
                        <Input
                          id="refuseButtonColor"
                          type="color"
                          value={cookieBanner.refuseBanner.buttonColor}
                          onChange={(e) => setCookieBanner({ 
                            ...cookieBanner, 
                            refuseBanner: { ...cookieBanner.refuseBanner, buttonColor: e.target.value }
                          })}
                          className="w-20 h-10"
                        />
                        <Input
                          type="text"
                          value={cookieBanner.refuseBanner.buttonColor}
                          onChange={(e) => setCookieBanner({ 
                            ...cookieBanner, 
                            refuseBanner: { ...cookieBanner.refuseBanner, buttonColor: e.target.value }
                          })}
                          placeholder="#dc2626"
                          className="flex-1"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="refuseButtonTextColor">Couleur texte bouton</Label>
                      <div className="flex gap-2">
                        <Input
                          id="refuseButtonTextColor"
                          type="color"
                          value={cookieBanner.refuseBanner.buttonTextColor}
                          onChange={(e) => setCookieBanner({ 
                            ...cookieBanner, 
                            refuseBanner: { ...cookieBanner.refuseBanner, buttonTextColor: e.target.value }
                          })}
                          className="w-20 h-10"
                        />
                        <Input
                          type="text"
                          value={cookieBanner.refuseBanner.buttonTextColor}
                          onChange={(e) => setCookieBanner({ 
                            ...cookieBanner, 
                            refuseBanner: { ...cookieBanner.refuseBanner, buttonTextColor: e.target.value }
                          })}
                          placeholder="#ffffff"
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>

                  <div 
                    className="mt-6 p-6 rounded-lg shadow-lg border text-center"
                    style={{ 
                      backgroundColor: cookieBanner.refuseBanner.backgroundColor,
                      color: cookieBanner.refuseBanner.textColor 
                    }}
                  >
                    <p className="text-base font-medium mb-4">{cookieBanner.refuseBanner.text}</p>
                    <button
                      className="px-6 py-2 rounded-lg text-base font-semibold transition-opacity hover:opacity-90"
                      style={{
                        backgroundColor: cookieBanner.refuseBanner.buttonColor,
                        color: cookieBanner.refuseBanner.buttonTextColor
                      }}
                    >
                      J'accepte finalement
                    </button>
                  </div>
                </CardContent>
              </Card>

              {/* Mode Maintenance */}
              <Card>
                <CardHeader>
                  <CardTitle>Mode maintenance</CardTitle>
                  <CardDescription>
                    Activer le mode maintenance pour mettre le site hors ligne temporairement
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="maintenanceMode" className="text-base">
                        Activer le mode maintenance
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Le site sera inaccessible pour tous les visiteurs (sauf administrateurs)
                      </p>
                    </div>
                    <Switch
                      id="maintenanceMode"
                      checked={settings.maintenanceMode}
                      onCheckedChange={(checked) => 
                        setSettings({ ...settings, maintenanceMode: checked })
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="maintenanceMessage">Message de maintenance</Label>
                    <Textarea
                      id="maintenanceMessage"
                      value={settings.maintenanceMessage}
                      onChange={(e) => setSettings({ ...settings, maintenanceMessage: e.target.value })}
                      placeholder="Site en maintenance. Nous reviendrons bientôt!"
                      rows={3}
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Ce message sera affiché aux visiteurs pendant la maintenance
                    </p>
                  </div>
                </CardContent>
              </Card>

              <div className="sticky bottom-4 z-50 flex justify-end pt-4">
                <Button type="submit" disabled={saving} className="shadow-lg">
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Enregistrer les modifications
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default AdminSettings;
