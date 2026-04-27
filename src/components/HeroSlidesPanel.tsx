import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Plus, Trash2, ImageIcon, GripVertical, Upload,
  Loader2, CheckCircle, Copy, AlertCircle, Crop, X,
} from "lucide-react";
import ImageCropModal from "@/components/ImageCropModal";
import { MediaLibrary } from "@/components/MediaLibrary";
import type { RegionalContent } from "@/hooks/useRegionalContent";
import { defaultHeroSlides } from "@/components/landing/SolarHeroVisual";
import { normalizeHeroSlides, type HeroSlideData, HERO_BAND_ASPECT_RATIO } from "@/utils/heroSlides";

interface HeroSlidesPanelProps {
  /** Page slug (used to namespace storage paths) */
  pageSlug: string;
  /** Whether this page is a regional landing (changes "héritées" labels) */
  isRegional: boolean;
  /** National parent content for fallback slides (optional) */
  parentContent?: RegionalContent | null;
  /** Whether to use solar default slides as ultimate fallback */
  useSolarDefaults?: boolean;
  /** Current page hero_slides */
  slides: HeroSlideData[] | undefined;
  /** Callback to update hero_slides */
  onChange: (slides: HeroSlideData[]) => void;
}

const HeroSlidesPanel = ({
  pageSlug,
  isRegional,
  parentContent,
  useSolarDefaults = true,
  slides,
  onChange,
}: HeroSlidesPanelProps) => {
  const [uploading, setUploading] = useState(false);
  const [newSlideUrl, setNewSlideUrl] = useState("");
  const [newSlideAlt, setNewSlideAlt] = useState("");
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropSlideIndex, setCropSlideIndex] = useState<number | null>(null);
  const [cropImageSrc, setCropImageSrc] = useState("");
  const [cropOriginalImageSrc, setCropOriginalImageSrc] = useState<string | undefined>(undefined);
  const [mediaLibraryOpen, setMediaLibraryOpen] = useState(false);

  const currentSlides: HeroSlideData[] = slides && slides.length > 0
    ? normalizeHeroSlides(slides)
    : [];

  const inheritedSlides: HeroSlideData[] = parentContent?.hero_slides && parentContent.hero_slides.length > 0
    ? normalizeHeroSlides(parentContent.hero_slides)
    : useSolarDefaults
      ? normalizeHeroSlides(defaultHeroSlides)
      : [];

  const effectiveSlides = currentSlides.length > 0 ? currentSlides : inheritedSlides;
  const isUsingCustomSlides = currentSlides.length > 0;

  const updateSlides = (next: HeroSlideData[]) => onChange(next);

  // ─── Slide Management ───
  const addSlideFromUrl = () => {
    if (!newSlideUrl.trim()) return;
    const next = [...(slides || []), { src: newSlideUrl.trim(), alt: newSlideAlt.trim() || "Installation solaire" }];
    updateSlides(next);
    setNewSlideUrl("");
    setNewSlideAlt("");
  };

  const removeSlide = (index: number) => {
    const baseSlides = isUsingCustomSlides ? [...(slides || [])] : [...effectiveSlides];
    baseSlides.splice(index, 1);
    updateSlides(baseSlides);
  };

  const updateSlideAlt = (index: number, alt: string) => {
    const next = [...(slides || [])];
    next[index] = { ...next[index], alt };
    updateSlides(next);
  };

  const updateSlideCaption = (index: number, caption: string) => {
    const baseSlides = isUsingCustomSlides ? [...(slides || [])] : [...effectiveSlides];
    baseSlides[index] = { ...baseSlides[index], caption: caption || undefined };
    updateSlides(baseSlides);
  };

  const moveSlide = (from: number, to: number) => {
    const next = [...(slides || [])];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    updateSlides(next);
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
      const filePath = `hero-slides/${pageSlug}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("media")
        .upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("media").getPublicUrl(filePath);
      const next = [...(slides || []), {
        src: urlData.publicUrl,
        alt: file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "),
      }];
      updateSlides(next);
      toast.success("Image uploadée !");
    } catch (err) {
      toast.error("Erreur lors de l'upload");
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const copyFromDefaults = () => {
    updateSlides([...defaultHeroSlides]);
    toast.success("Images par défaut copiées — vous pouvez maintenant les personnaliser");
  };

  const copyFromParent = () => {
    if (parentContent?.hero_slides?.length) {
      updateSlides([...parentContent.hero_slides]);
      toast.success("Images nationales copiées");
    }
  };

  const clearCustomSlides = () => {
    updateSlides([]);
    toast.success("Slides personnalisés supprimés — retour aux images héritées");
  };

  const openCropModal = (index: number) => {
    const slide = effectiveSlides[index];
    setCropSlideIndex(index);
    setCropImageSrc(slide.src);
    setCropOriginalImageSrc(slide.originalSrc && slide.originalSrc !== slide.src ? slide.originalSrc : undefined);
    setCropModalOpen(true);
  };

  const handleCropComplete = async (croppedDataUrl: string) => {
    if (cropSlideIndex === null) return;
    try {
      const blob = await (await fetch(croppedDataUrl)).blob();
      const filePath = `hero-slides/${pageSlug}/crop-${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from("media")
        .upload(filePath, blob, { upsert: true, contentType: "image/jpeg" });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("media").getPublicUrl(filePath);
      const baseSlides = normalizeHeroSlides(isUsingCustomSlides ? [...(slides || [])] : [...effectiveSlides]);
      const currentSlide = baseSlides[cropSlideIndex];
      baseSlides[cropSlideIndex] = {
        ...currentSlide,
        src: urlData.publicUrl,
        originalSrc: currentSlide.originalSrc || currentSlide.src,
      };
      updateSlides(baseSlides);
      toast.success("Image recadrée !");
    } catch (err) {
      toast.error("Erreur lors du recadrage");
      console.error(err);
    }
  };

  const restoreOriginal = () => {
    if (cropSlideIndex === null) return;
    const baseSlides = normalizeHeroSlides(isUsingCustomSlides ? [...(slides || [])] : [...effectiveSlides]);
    const slide = baseSlides[cropSlideIndex];
    if (!slide?.originalSrc) return;
    baseSlides[cropSlideIndex] = { ...slide, src: slide.originalSrc, originalSrc: undefined };
    updateSlides(baseSlides);
    setCropModalOpen(false);
    toast.success("Image originale restaurée");
  };

  const renderSlideGrid = (slidesList: HeroSlideData[], editable: boolean) => (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {slidesList.map((slide, index) => (
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

          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <div className="absolute bottom-0 left-0 right-0 p-2 pb-[52px]">
              {slide.caption && (
                <p className="text-amber-300 text-[10px] font-semibold leading-tight truncate">📍 {slide.caption}</p>
              )}
              <p className="text-white/60 text-[9px] mt-0.5">#{index + 1}</p>
            </div>
          </div>

          {editable && (
            <div className="absolute bottom-0 left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity z-20" onClick={(e) => e.stopPropagation()}>
              <input
                type="text"
                placeholder="Nom / texte alternatif"
                value={slide.alt}
                onChange={(e) => {
                  const baseSlides = isUsingCustomSlides ? [...(slides || [])] : [...effectiveSlides];
                  baseSlides[index] = { ...baseSlides[index], alt: e.target.value };
                  updateSlides(baseSlides);
                }}
                className="w-full text-[10px] px-2 py-1 bg-black/90 text-white placeholder:text-white/40 border-0 outline-none focus:ring-1 focus:ring-primary"
              />
              <input
                type="text"
                placeholder="Note (ex: La Réunion 974)"
                value={slide.caption || ""}
                onChange={(e) => updateSlideCaption(index, e.target.value)}
                className="w-full text-[10px] px-2 py-1 bg-black/80 text-white/80 placeholder:text-white/40 border-0 border-t border-white/10 outline-none focus:ring-1 focus:ring-amber-400"
              />
            </div>
          )}

          {editable && (
            <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="p-1 bg-white/90 rounded shadow-sm">
                <GripVertical className="w-3 h-3 text-muted-foreground" />
              </div>
            </div>
          )}
          {editable && (
            <button
              onClick={() => openCropModal(index)}
              className="absolute top-1 right-8 p-1 bg-blue-500 text-white rounded shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-blue-600"
              title="Recadrer cette image"
            >
              <Crop className="w-3 h-3" />
            </button>
          )}
          {editable && (
            <button
              onClick={() => removeSlide(index)}
              className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
              title="Retirer cette image"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Status banner */}
      <Card className={isUsingCustomSlides ? "border-primary/30 bg-primary/5" : "border-amber-200 bg-amber-50/50"}>
        <CardContent className="py-3 px-4 flex items-center justify-between flex-wrap gap-3">
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

      {/* Slide grid */}
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

      {/* Alt text editor */}
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

      {/* Crop modal */}
      <ImageCropModal
        open={cropModalOpen}
        onOpenChange={setCropModalOpen}
        imageSrc={cropImageSrc}
        originalImageSrc={cropOriginalImageSrc}
        aspectRatio={HERO_BAND_ASPECT_RATIO}
        onCropComplete={handleCropComplete}
        onRestoreOriginal={cropOriginalImageSrc ? restoreOriginal : undefined}
      />
    </div>
  );
};

export default HeroSlidesPanel;
