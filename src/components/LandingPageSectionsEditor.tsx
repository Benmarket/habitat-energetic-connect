import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Save, Plus, Trash2, ImageIcon, Eye, GripVertical, Upload,
  Loader2, CheckCircle, ArrowLeft, Globe, MapPin, Layers,
  Sun, Quote, Shield, HelpCircle, Megaphone, ChevronRight,
  X, ExternalLink, Copy, AlertCircle, Crop
} from "lucide-react";
import ImageCropModal from "@/components/ImageCropModal";
import type { RegionalContent } from "@/hooks/useRegionalContent";
import { defaultHeroSlides } from "@/components/landing/SolarHeroVisual";

interface LandingPageSectionsEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  landingPage: {
    id: string;
    slug: string;
    title: string;
    path: string;
    level: string;
    region_code: string | null;
    regional_content: RegionalContent | null;
    parent_id: string | null;
  };
  parentContent?: RegionalContent | null;
  onSaved: () => void;
}

interface HeroSlide {
  src: string;
  alt: string;
  caption?: string;
}

// Section definitions for the LP
const LP_SECTIONS = [
  { id: "hero", label: "Hero", icon: Sun, color: "text-amber-600", bgColor: "bg-amber-50", description: "Bandeau principal avec diapo d'images et formulaire" },
  { id: "testimonials", label: "Témoignages", icon: Quote, color: "text-blue-600", bgColor: "bg-blue-50", description: "Avis clients avec carrousel" },
  { id: "eligibility", label: "Éligibilité", icon: Shield, color: "text-green-600", bgColor: "bg-green-50", description: "Critères d'éligibilité au programme" },
  { id: "faq", label: "FAQ", icon: HelpCircle, color: "text-purple-600", bgColor: "bg-purple-50", description: "Questions fréquentes" },
  { id: "cta", label: "CTA Final", icon: Megaphone, color: "text-red-600", bgColor: "bg-red-50", description: "Appel à l'action en bas de page" },
];

const LandingPageSectionsEditor = ({
  open,
  onOpenChange,
  landingPage,
  parentContent,
  onSaved,
}: LandingPageSectionsEditorProps) => {
  const [activeSection, setActiveSection] = useState("hero");
  const [content, setContent] = useState<RegionalContent>(landingPage.regional_content || {});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newSlideUrl, setNewSlideUrl] = useState("");
  const [newSlideAlt, setNewSlideAlt] = useState("");
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropSlideIndex, setCropSlideIndex] = useState<number | null>(null);
  const [cropImageSrc, setCropImageSrc] = useState("");

  const isProduct = landingPage.level === "product";
  const isRegional = landingPage.level === "region";
  const regionLabel = landingPage.region_code
    ? { fr: "France", corse: "Corse", reunion: "La Réunion", martinique: "Martinique", guadeloupe: "Guadeloupe", guyane: "Guyane" }[landingPage.region_code] || landingPage.region_code
    : "National";

  // Resolve hero slides: this page's content > parent > defaults
  const currentSlides: HeroSlide[] = content.hero_slides && content.hero_slides.length > 0
    ? content.hero_slides
    : [];

  const inheritedSlides: HeroSlide[] = parentContent?.hero_slides && parentContent.hero_slides.length > 0
    ? parentContent.hero_slides
    : defaultHeroSlides;

  const effectiveSlides = currentSlides.length > 0 ? currentSlides : inheritedSlides;
  const isUsingCustomSlides = currentSlides.length > 0;

  useEffect(() => {
    setContent(landingPage.regional_content || {});
  }, [landingPage.id]);

  const updateContent = useCallback((updates: Partial<RegionalContent>) => {
    setContent(prev => ({ ...prev, ...updates }));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("landing_pages")
        .update({ regional_content: content as any, updated_at: new Date().toISOString() })
        .eq("id", landingPage.id);

      if (error) throw error;
      toast.success("Modifications enregistrées !");
      onSaved();
    } catch (err) {
      toast.error("Erreur lors de la sauvegarde");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // ─── Hero Slides Management ───
  const addSlideFromUrl = () => {
    if (!newSlideUrl.trim()) return;
    const slides = [...(content.hero_slides || []), { src: newSlideUrl.trim(), alt: newSlideAlt.trim() || "Installation solaire" }];
    updateContent({ hero_slides: slides });
    setNewSlideUrl("");
    setNewSlideAlt("");
  };

  const removeSlide = (index: number) => {
    // If not yet using custom slides, copy effective slides first then remove
    const baseSlides = isUsingCustomSlides ? [...(content.hero_slides || [])] : [...effectiveSlides];
    baseSlides.splice(index, 1);
    updateContent({ hero_slides: baseSlides });
  };

  const updateSlideAlt = (index: number, alt: string) => {
    const slides = [...(content.hero_slides || [])];
    slides[index] = { ...slides[index], alt };
    updateContent({ hero_slides: slides });
  };

  const updateSlideCaption = (index: number, caption: string) => {
    const baseSlides = isUsingCustomSlides ? [...(content.hero_slides || [])] : [...effectiveSlides];
    baseSlides[index] = { ...baseSlides[index], caption: caption || undefined };
    updateContent({ hero_slides: baseSlides });
  };

  const moveSlide = (from: number, to: number) => {
    const slides = [...(content.hero_slides || [])];
    const [moved] = slides.splice(from, 1);
    slides.splice(to, 0, moved);
    updateContent({ hero_slides: slides });
  };

  const handleDragStart = (index: number) => setDraggedIndex(index);
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      moveSlide(draggedIndex, index);
      setDraggedIndex(index);
    }
  };
  const handleDragEnd = () => setDraggedIndex(null);

  const handleUploadSlide = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Seules les images sont acceptées");
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const filePath = `hero-slides/${landingPage.slug}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("media")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("media").getPublicUrl(filePath);

      const slides = [...(content.hero_slides || []), {
        src: urlData.publicUrl,
        alt: file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "),
      }];
      updateContent({ hero_slides: slides });
      toast.success("Image uploadée !");
    } catch (err) {
      toast.error("Erreur lors de l'upload");
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const copyFromDefaults = () => {
    updateContent({ hero_slides: [...defaultHeroSlides] });
    toast.success("Images par défaut copiées — vous pouvez maintenant les personnaliser");
  };

  const copyFromParent = () => {
    if (parentContent?.hero_slides?.length) {
      updateContent({ hero_slides: [...parentContent.hero_slides] });
      toast.success("Images nationales copiées");
    }
  };

  const clearCustomSlides = () => {
    updateContent({ hero_slides: [] });
    toast.success("Slides personnalisés supprimés — retour aux images héritées");
  };

  // ─── Slide Preview Grid ───
  const renderSlideGrid = (slides: HeroSlide[], editable: boolean) => (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {slides.map((slide, index) => (
        <div
          key={`${slide.src}-${index}`}
          draggable={editable}
          onDragStart={() => editable && handleDragStart(index)}
          onDragOver={(e) => editable && handleDragOver(e, index)}
          onDragEnd={handleDragEnd}
          className={`group relative rounded-lg border-2 overflow-hidden transition-all ${
            editable ? "border-border hover:border-primary cursor-grab active:cursor-grabbing" : "border-border/50"
          } ${draggedIndex === index ? "ring-2 ring-primary opacity-60" : ""}`}
        >
          <div className="aspect-[4/3] bg-muted">
            <img
              src={slide.src}
              alt={slide.alt}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='150' fill='%23ddd'%3E%3Crect width='200' height='150'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23999' font-size='14'%3EImage manquante%3C/text%3E%3C/svg%3E";
              }}
            />
          </div>

          {/* Overlay info */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="absolute bottom-0 left-0 right-0 p-2">
              {slide.caption && (
                <p className="text-amber-300 text-[10px] font-semibold leading-tight truncate">📍 {slide.caption}</p>
              )}
              <p className="text-white text-[10px] leading-tight truncate">{slide.alt}</p>
              <p className="text-white/60 text-[9px] mt-0.5">#{index + 1}</p>
            </div>
          </div>

          {/* Caption edit input on hover */}
          <div className="absolute bottom-0 left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity z-20" onClick={(e) => e.stopPropagation()}>
            <input
              type="text"
              placeholder="Note (ex: La Réunion 974)"
              value={slide.caption || ""}
              onChange={(e) => updateSlideCaption(index, e.target.value)}
              className="w-full text-[10px] px-2 py-1 bg-black/80 text-white placeholder:text-white/40 border-0 outline-none focus:ring-1 focus:ring-amber-400"
            />
          </div>

          {/* Edit controls */}
          {editable && (
            <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="p-1 bg-white/90 rounded shadow-sm">
                <GripVertical className="w-3 h-3 text-muted-foreground" />
              </div>
            </div>
          )}
          {/* Remove button always visible on hover */}
          <button
            onClick={() => removeSlide(index)}
            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
            title="Retirer cette image"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0 gap-0">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b bg-muted/30 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isRegional ? "bg-primary/10" : "bg-amber-100"}`}>
                {isRegional ? <MapPin className="w-5 h-5 text-primary" /> : <Globe className="w-5 h-5 text-amber-600" />}
              </div>
              <div>
                <DialogTitle className="text-lg flex items-center gap-2">
                  Éditeur de Landing Page
                  <Badge variant="outline" className="text-xs">
                    {regionLabel}
                  </Badge>
                </DialogTitle>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {landingPage.title} — <code className="text-xs">{landingPage.path}</code>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" asChild>
                <a href={landingPage.path} target="_blank" rel="noopener noreferrer" className="gap-1.5">
                  <Eye className="w-3.5 h-3.5" />
                  Prévisualiser
                </a>
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1.5">
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Enregistrer
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Body */}
        <div className="flex flex-1 min-h-0">
          {/* Sidebar - Sections */}
          <div className="w-56 border-r bg-muted/20 p-3 space-y-1 overflow-y-auto flex-shrink-0">
            <p className="text-[10px] font-semibold uppercase text-muted-foreground px-2 mb-2">Sections</p>
            {LP_SECTIONS.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left text-sm transition-all ${
                    isActive
                      ? "bg-background shadow-sm border border-border font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-background/60"
                  }`}
                >
                  <div className={`w-7 h-7 rounded flex items-center justify-center flex-shrink-0 ${isActive ? section.bgColor : "bg-transparent"}`}>
                    <Icon className={`w-3.5 h-3.5 ${isActive ? section.color : ""}`} />
                  </div>
                  <span className="truncate">{section.label}</span>
                </button>
              );
            })}
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeSection === "hero" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <Sun className="w-5 h-5 text-amber-600" />
                    Section Hero — Diapo d'images
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Gérez les images qui défilent dans le bandeau hero de la landing page.
                    {isRegional && " Si aucune image personnalisée n'est définie, les images nationales (ou par défaut) seront utilisées."}
                  </p>
                </div>

                {/* Status banner */}
                <Card className={`border-2 ${isUsingCustomSlides ? "border-primary/30 bg-primary/5" : "border-amber-200 bg-amber-50"}`}>
                  <CardContent className="py-3 px-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {isUsingCustomSlides ? (
                        <>
                          <CheckCircle className="w-5 h-5 text-primary" />
                          <div>
                            <p className="text-sm font-semibold">{currentSlides.length} image{currentSlides.length > 1 ? "s" : ""} personnalisée{currentSlides.length > 1 ? "s" : ""}</p>
                            <p className="text-xs text-muted-foreground">Images spécifiques à cette page</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-5 h-5 text-amber-600" />
                          <div>
                            <p className="text-sm font-semibold text-amber-800">
                              {isRegional ? "Images héritées" : "Images par défaut"}
                            </p>
                            <p className="text-xs text-amber-600">
                              {inheritedSlides.length} images {isRegional ? "de la version nationale" : "intégrées au code"}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                    {isUsingCustomSlides ? (
                      <Button variant="outline" size="sm" onClick={clearCustomSlides} className="text-xs gap-1">
                        <Trash2 className="w-3 h-3" />
                        Supprimer les personnalisations
                      </Button>
                    ) : (
                      <div className="flex items-center gap-2">
                        {isRegional && parentContent?.hero_slides?.length ? (
                          <Button variant="outline" size="sm" onClick={copyFromParent} className="text-xs gap-1">
                            <Copy className="w-3 h-3" />
                            Copier les nationales
                          </Button>
                        ) : null}
                        <Button variant="outline" size="sm" onClick={copyFromDefaults} className="text-xs gap-1">
                          <Copy className="w-3 h-3" />
                          Copier les défauts
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Current/Effective Slides */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-sm">
                      {isUsingCustomSlides ? "Images personnalisées" : "Images actuellement affichées"}
                      <Badge variant="secondary" className="ml-2 text-xs">{effectiveSlides.length}</Badge>
                    </h4>
                  </div>
                  {renderSlideGrid(effectiveSlides, isUsingCustomSlides)}
                </div>

                {/* Add new slide */}
                {isUsingCustomSlides && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        Ajouter une image
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Upload */}
                      <div className="flex items-center gap-3">
                        <label className="flex-1">
                          <div className="flex items-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors">
                            {uploading ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Upload className="w-4 h-4 text-muted-foreground" />
                            )}
                            <span className="text-sm text-muted-foreground">
                              {uploading ? "Upload en cours..." : "Uploader une image"}
                            </span>
                          </div>
                          <input type="file" accept="image/*" className="hidden" onChange={handleUploadSlide} disabled={uploading} />
                        </label>
                      </div>

                      {/* Or URL */}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <div className="flex-1 h-px bg-border" />
                        <span>ou ajouter par URL</span>
                        <div className="flex-1 h-px bg-border" />
                      </div>

                      <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
                        <div>
                          <Label className="text-xs">URL de l'image</Label>
                          <Input
                            value={newSlideUrl}
                            onChange={(e) => setNewSlideUrl(e.target.value)}
                            placeholder="https://..."
                            className="h-9 text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Texte alternatif</Label>
                          <Input
                            value={newSlideAlt}
                            onChange={(e) => setNewSlideAlt(e.target.value)}
                            placeholder="Description de l'image"
                            className="h-9 text-sm"
                          />
                        </div>
                        <div className="flex items-end">
                          <Button size="sm" onClick={addSlideFromUrl} disabled={!newSlideUrl.trim()} className="h-9">
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Alt text editor for custom slides */}
                {isUsingCustomSlides && currentSlides.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <ImageIcon className="w-4 h-4" />
                        Textes alternatifs (SEO)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {currentSlides.map((slide, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <img src={slide.src} alt="" className="w-12 h-9 object-cover rounded border" />
                          <span className="text-xs text-muted-foreground w-6 text-center">#{index + 1}</span>
                          <Input
                            value={slide.alt}
                            onChange={(e) => updateSlideAlt(index, e.target.value)}
                            placeholder="Texte alternatif"
                            className="h-8 text-xs flex-1"
                          />
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {activeSection === "testimonials" && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Quote className="w-5 h-5 text-blue-600" />
                  Section Témoignages
                </h3>
                <p className="text-sm text-muted-foreground">
                  Les témoignages sont gérés via l'éditeur régional existant (onglet Témoignages).
                  Pour cette page, utilisez le crayon ✏️ dans la liste des landing pages.
                </p>
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Fermer et utiliser l'éditeur régional
                </Button>
              </div>
            )}

            {["eligibility", "faq", "cta"].includes(activeSection) && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  {LP_SECTIONS.find(s => s.id === activeSection)?.label}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Cette section est identique sur toutes les landing pages solaires (nationale et régionales).
                  Son contenu est défini dans le code source pour garantir la cohérence du message.
                </p>
                <Badge variant="secondary">Contenu unifié — non modifiable ici</Badge>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LandingPageSectionsEditor;
