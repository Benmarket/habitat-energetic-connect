import { useState, useMemo, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, AlertTriangle, ArrowLeft, CheckCircle2, ImageIcon, Wand2, Library, Loader2, MessageSquarePlus, Plus, Minus } from "lucide-react";
import DOMPurify from "dompurify";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MediaLibrary } from "@/components/MediaLibrary";
import { ImageRegenerateModal } from "@/components/ImageRegenerateModal";

type FieldKey =
  | "title" | "excerpt" | "content" | "featured_image"
  | "meta_title" | "meta_description" | "tldr" | "faq" | "focus_keywords";

interface CurrentData {
  title: string;
  excerpt: string;
  content: string;
  featured_image: string;
  meta_title: string;
  meta_description: string;
  tldr: string;
  faq: any[];
  focus_keywords: string[];
}

interface PendingData {
  title?: string;
  excerpt?: string;
  content?: string;
  featuredImageUrl?: string;
  metaTitle?: string;
  metaDescription?: string;
  tldr?: string;
  faq?: any[];
  focusKeywords?: string[];
  generationCost?: number;
  generatedImagesCount?: number;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  current: CurrentData;
  pending: PendingData | null;
  onApply: (selection: Record<FieldKey, boolean>) => void;
  onDiscard: () => void;
  onUpdatePending?: (patch: Partial<PendingData>) => void;
  onAddImages?: (count: number, instruction: string) => Promise<void> | void;
  guideTemplate?: string;
}

const TEMPLATE_PROFILES: Record<string, { label: string; words: string; images: string; imagesMin: number; imagesMax: number }> = {
  premium:   { label: 'Premium',   words: '4500-6000 mots', images: '6 à 8 images', imagesMin: 6, imagesMax: 8 },
  expert:    { label: 'Expert',    words: '5000-7000 mots', images: '5 à 7 images', imagesMin: 5, imagesMax: 7 },
  classique: { label: 'Classique', words: '3000-4200 mots', images: '4 à 6 images', imagesMin: 4, imagesMax: 6 },
  vibrant:   { label: 'Vibrant',   words: '2800-4000 mots', images: '5 à 7 images', imagesMin: 5, imagesMax: 7 },
  sombre:    { label: 'Sombre',    words: '3000-4200 mots', images: '5 à 7 images', imagesMin: 5, imagesMax: 7 },
  epure:     { label: 'Épuré',     words: '2200-3000 mots', images: '3 à 5 images', imagesMin: 3, imagesMax: 5 },
};

const FIELDS: { key: FieldKey; label: string; description: string; defaultChecked: boolean }[] = [
  { key: "title",            label: "Titre",                 description: "H1 du guide", defaultChecked: false },
  { key: "excerpt",          label: "Résumé / extrait",      description: "Excerpt court", defaultChecked: false },
  { key: "content",          label: "Contenu HTML complet",  description: "Le cœur du guide (4-6k mots, tableaux, checklists, étapes, sources)", defaultChecked: true },
  { key: "featured_image",   label: "Image principale",      description: "Image de couverture", defaultChecked: true },
  { key: "tldr",             label: "TL;DR (En résumé)",     description: "Bloc résumé en haut du guide", defaultChecked: true },
  { key: "faq",              label: "FAQ",                   description: "Questions fréquentes (accordéon)", defaultChecked: true },
  { key: "meta_title",       label: "Meta titre SEO",        description: "Balise <title> (60 chars)", defaultChecked: false },
  { key: "meta_description", label: "Meta description SEO",  description: "Balise meta description (160 chars)", defaultChecked: false },
  { key: "focus_keywords",   label: "Mots-clés focus",       description: "Mots-clés SEO ciblés", defaultChecked: false },
];

const stripHtml = (html: string) =>
  (html || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

const wordCount = (html: string) => {
  const txt = stripHtml(html);
  return txt ? txt.split(/\s+/).length : 0;
};

const sanitize = (html: string) => DOMPurify.sanitize(html || "", {
  ALLOWED_TAGS: false as any,
  USE_PROFILES: { html: true },
});

// Replace an image URL in HTML (matches src attribute)
const replaceImageInHtml = (html: string, oldUrl: string, newUrl: string): string => {
  if (!oldUrl || !newUrl || oldUrl === newUrl) return html;
  const escaped = oldUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return html.replace(new RegExp(escaped, "g"), newUrl);
};

export const GuideRegenerateCompareModal = ({
  open, onOpenChange, current, pending, onApply, onDiscard, onUpdatePending,
  onAddImages, guideTemplate,
}: Props) => {
  const profile = TEMPLATE_PROFILES[guideTemplate || 'premium'] || TEMPLATE_PROFILES.premium;

  const [selection, setSelection] = useState<Record<FieldKey, boolean>>(() =>
    FIELDS.reduce((acc, f) => ({ ...acc, [f.key]: f.defaultChecked }), {} as Record<FieldKey, boolean>)
  );
  const [confirmStep, setConfirmStep] = useState(false);
  const [side, setSide] = useState<"current" | "new">("new");

  // Image actions state
  const [activeImageUrl, setActiveImageUrl] = useState<string | null>(null);
  const [activeImageContext, setActiveImageContext] = useState<"featured" | "inline">("inline");
  const [mediaLibOpen, setMediaLibOpen] = useState(false);
  const [imgRegenOpen, setImgRegenOpen] = useState(false);

  // AI edit console state
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  // Add-images console state
  const [addCount, setAddCount] = useState(2);
  const [addInstruction, setAddInstruction] = useState("");
  const [addLoading, setAddLoading] = useState(false);

  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setSelection(FIELDS.reduce((acc, f) => ({ ...acc, [f.key]: f.defaultChecked }), {} as Record<FieldKey, boolean>));
      setConfirmStep(false);
      setSide("new");
      setAiPrompt("");
      setAddCount(2);
      setAddInstruction("");
    }
  }, [open]);

  const stats = useMemo(() => {
    if (!pending) return null;
    return {
      currentWords: wordCount(current.content),
      newWords: wordCount(pending.content || ""),
      newImages: pending.generatedImagesCount || 0,
      cost: pending.generationCost || 0,
    };
  }, [current, pending]);

  const toggle = (key: FieldKey) =>
    setSelection(prev => ({ ...prev, [key]: !prev[key] }));

  const allChecked = FIELDS.every(f => selection[f.key]);
  const noneChecked = FIELDS.every(f => !selection[f.key]);
  const checkedCount = FIELDS.filter(f => selection[f.key]).length;

  const setAll = (val: boolean) =>
    setSelection(FIELDS.reduce((acc, f) => ({ ...acc, [f.key]: val }), {} as Record<FieldKey, boolean>));

  // Open actions for an image (called from overlay buttons)
  const handleImageAction = (url: string, action: "library" | "regen", context: "featured" | "inline" = "inline") => {
    setActiveImageUrl(url);
    setActiveImageContext(context);
    if (action === "library") setMediaLibOpen(true);
    else setImgRegenOpen(true);
  };

  const replaceActiveImage = (newUrl: string) => {
    if (!activeImageUrl || !pending || !onUpdatePending) return;
    if (activeImageContext === "featured") {
      onUpdatePending({ featuredImageUrl: newUrl });
    } else {
      const updated = replaceImageInHtml(pending.content || "", activeImageUrl, newUrl);
      onUpdatePending({ content: updated });
    }
    setActiveImageUrl(null);
    toast.success("Image remplacée");
  };

  // AI edit console
  const handleAiEdit = async () => {
    if (!pending || !onUpdatePending) return;
    if (!aiPrompt.trim()) { toast.error("Décrivez ce que vous voulez modifier"); return; }
    setAiLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) { toast.error("Vous devez être connecté"); return; }

      const { data, error } = await supabase.functions.invoke("generate-article", {
        body: {
          mode: "edit_pending_guide",
          content: pending.content || "",
          title: pending.title || "",
          userInstruction: aiPrompt,
        },
        headers: { Authorization: `Bearer ${token}` },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Erreur de modification");

      const newContent = data.editedContent || pending.content;
      const addedCost = data.editCost || 0;
      onUpdatePending({
        content: newContent,
        generationCost: (pending.generationCost || 0) + addedCost,
      });
      setAiPrompt("");
      toast.success("Modifications appliquées au nouveau guide");
    } catch (e: any) {
      toast.error(e.message || "Erreur lors de l'édition IA");
    } finally {
      setAiLoading(false);
    }
  };

  // Attach hover overlays to images in the new-side preview
  useEffect(() => {
    if (side !== "new" || !previewRef.current || !pending) return;
    const root = previewRef.current;
    const imgs = Array.from(root.querySelectorAll("img")) as HTMLImageElement[];

    const cleanups: (() => void)[] = [];
    imgs.forEach((img) => {
      // Wrap each image with a positioned container holding overlay buttons
      if (img.dataset.overlayWrapped === "1") return;
      img.dataset.overlayWrapped = "1";
      const wrap = document.createElement("div");
      wrap.style.position = "relative";
      wrap.style.display = "inline-block";
      wrap.style.maxWidth = "100%";
      wrap.className = "group/img";
      img.parentNode?.insertBefore(wrap, img);
      wrap.appendChild(img);

      const overlay = document.createElement("div");
      overlay.style.cssText = "position:absolute;inset:0;display:flex;align-items:center;justify-content:center;gap:8px;background:rgba(0,0,0,0.55);opacity:0;transition:opacity .15s;border-radius:12px;pointer-events:none;";
      overlay.className = "group-hover/img:opacity-100 group-hover/img:!pointer-events-auto";

      const mkBtn = (label: string, action: "library" | "regen") => {
        const b = document.createElement("button");
        b.type = "button";
        b.textContent = label;
        b.style.cssText = "background:white;color:#111;border-radius:8px;padding:8px 12px;font-size:12px;font-weight:600;box-shadow:0 4px 12px rgba(0,0,0,0.2);cursor:pointer;border:none;";
        b.onclick = (e) => { e.preventDefault(); e.stopPropagation(); handleImageAction(img.src, action, "inline"); };
        return b;
      };
      overlay.appendChild(mkBtn("📁 Médiathèque", "library"));
      overlay.appendChild(mkBtn("✨ Régénérer", "regen"));
      wrap.appendChild(overlay);

      // CSS hover via mouseenter (works without group-hover compile)
      const onEnter = () => { overlay.style.opacity = "1"; overlay.style.pointerEvents = "auto"; };
      const onLeave = () => { overlay.style.opacity = "0"; overlay.style.pointerEvents = "none"; };
      wrap.addEventListener("mouseenter", onEnter);
      wrap.addEventListener("mouseleave", onLeave);
      cleanups.push(() => { wrap.removeEventListener("mouseenter", onEnter); wrap.removeEventListener("mouseleave", onLeave); });
    });
    return () => { cleanups.forEach(fn => fn()); };
  }, [side, pending?.content, pending?.featuredImageUrl, open]);

  if (!pending) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => { if (!o) onDiscard(); onOpenChange(o); }}>
        <DialogContent className="max-w-6xl max-h-[92vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 flex-wrap">
              <Sparkles className="w-5 h-5 text-primary" />
              Comparer & appliquer la régénération du guide
              <Badge className="ml-2 bg-primary/10 text-primary border-primary/30 hover:bg-primary/15">
                Template : {profile.label}
              </Badge>
            </DialogTitle>
            <DialogDescription>
              Profil <strong>{profile.label}</strong> — cible : {profile.words}, {profile.images}.
              Survolez une image pour la remplacer, ajoutez-en plus avec le compteur, ou utilisez la console IA pour ajuster le contenu.
            </DialogDescription>
          </DialogHeader>

          {stats && (() => {
            const imgOk = stats.newImages >= profile.imagesMin;
            return (
              <div className="grid grid-cols-4 gap-3 py-2">
                <div className="text-center p-2 rounded-lg border bg-muted/30">
                  <p className="text-xs text-muted-foreground">Actuel</p>
                  <p className="font-semibold">{stats.currentWords} mots</p>
                </div>
                <div className="text-center p-2 rounded-lg border-2 border-primary/30 bg-primary/5">
                  <p className="text-xs text-primary">Nouveau ({profile.label.toLowerCase()})</p>
                  <p className="font-semibold text-primary">{stats.newWords} mots</p>
                </div>
                <div className={`text-center p-2 rounded-lg border ${imgOk ? 'bg-muted/30' : 'border-amber-400 bg-amber-50 dark:bg-amber-950/30'}`}>
                  <p className={`text-xs ${imgOk ? 'text-muted-foreground' : 'text-amber-700 dark:text-amber-300'}`}>
                    Images {imgOk ? '✓' : `(cible ${profile.imagesMin}-${profile.imagesMax})`}
                  </p>
                  <p className={`font-semibold ${imgOk ? '' : 'text-amber-700 dark:text-amber-300'}`}>{stats.newImages}</p>
                </div>
                <div className="text-center p-2 rounded-lg border bg-muted/30">
                  <p className="text-xs text-muted-foreground">Coût IA</p>
                  <p className="font-semibold">+{stats.cost.toFixed(4)} €</p>
                </div>
              </div>
            );
          })()}

          <Separator />

          <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4 min-h-0">
            {/* LEFT: field selection */}
            <div className="flex flex-col min-h-0 border rounded-lg p-3 bg-muted/20">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-sm">À remplacer ({checkedCount}/{FIELDS.length})</h3>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => setAll(true)} disabled={allChecked}>Tout</Button>
                  <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => setAll(false)} disabled={noneChecked}>Aucun</Button>
                </div>
              </div>
              <ScrollArea className="flex-1 pr-2">
                <div className="space-y-2">
                  {FIELDS.map(f => (
                    <label
                      key={f.key}
                      className="flex items-start gap-2 p-2 rounded-md border bg-background hover:bg-muted/50 cursor-pointer transition-colors"
                    >
                      <Checkbox
                        checked={selection[f.key]}
                        onCheckedChange={() => toggle(f.key)}
                        className="mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-tight">{f.label}</p>
                        <p className="text-xs text-muted-foreground leading-tight mt-0.5">{f.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* RIGHT: comparison preview */}
            <div className="flex flex-col min-h-0 border rounded-lg overflow-hidden">
              <div className="flex border-b bg-muted/30">
                <button
                  onClick={() => setSide("current")}
                  className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${side === "current" ? "bg-background border-b-2 border-primary" : "text-muted-foreground hover:bg-muted"}`}
                >
                  Actuel ({stats?.currentWords ?? 0} mots)
                </button>
                <button
                  onClick={() => setSide("new")}
                  className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${side === "new" ? "bg-background border-b-2 border-primary text-primary" : "text-muted-foreground hover:bg-muted"}`}
                >
                  ✨ Nouveau ({stats?.newWords ?? 0} mots)
                </button>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-4 space-y-4" ref={previewRef}>
                  {side === "current" ? (
                    <>
                      {current.featured_image && (
                        <img src={current.featured_image} alt="" className="w-full max-h-48 object-cover rounded-md" />
                      )}
                      <h2 className="text-xl font-bold">{current.title || <em className="text-muted-foreground">(pas de titre)</em>}</h2>
                      {current.excerpt && <p className="text-sm text-muted-foreground italic">{current.excerpt}</p>}
                      <div
                        className="prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: sanitize(current.content) }}
                      />
                    </>
                  ) : (
                    <>
                      {pending.featuredImageUrl && (
                        <div className="relative inline-block w-full group/feat">
                          <img src={pending.featuredImageUrl} alt="" className="w-full max-h-56 object-cover rounded-md" />
                          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/55 opacity-0 group-hover/feat:opacity-100 transition-opacity rounded-md">
                            <Button size="sm" variant="secondary" className="gap-1" onClick={() => handleImageAction(pending.featuredImageUrl!, "library", "featured")}>
                              <Library className="w-4 h-4" /> Médiathèque
                            </Button>
                            <Button size="sm" className="gap-1" onClick={() => handleImageAction(pending.featuredImageUrl!, "regen", "featured")}>
                              <Wand2 className="w-4 h-4" /> Régénérer
                            </Button>
                          </div>
                        </div>
                      )}
                      <h2 className="text-xl font-bold">{pending.title}</h2>
                      {pending.excerpt && <p className="text-sm text-muted-foreground italic">{pending.excerpt}</p>}
                      {pending.focusKeywords && pending.focusKeywords.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {pending.focusKeywords.map((k, i) => <Badge key={i} variant="secondary">{k}</Badge>)}
                        </div>
                      )}
                      <div
                        className="prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: sanitize(pending.content || "") }}
                      />
                    </>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>

          {/* AI edit console — only meaningful for the new side */}
          {side === "new" && (
            <div className="border-2 border-dashed border-primary/30 bg-primary/5 rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2">
                <MessageSquarePlus className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold">Console IA — modifier ce nouveau guide</h3>
                <Badge variant="outline" className="text-[10px]">expérimental</Badge>
              </div>
              <div className="flex gap-2">
                <Textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder='Ex: "Mets le CTA du bas aux couleurs dégradé du DPE (vert→rouge), et en haut ajoute un H2 mettant en avant : Jusqu’à 63 000 € d’aides d’État pour rénover et gagner en classe énergétique."'
                  rows={2}
                  className="flex-1 text-sm resize-none"
                  disabled={aiLoading}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); handleAiEdit(); }
                  }}
                />
                <Button onClick={handleAiEdit} disabled={aiLoading || !aiPrompt.trim()} className="gap-2 self-stretch">
                  {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {aiLoading ? "Modification…" : "Appliquer"}
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Astuce : ⌘/Ctrl + Entrée pour envoyer. La modification touche uniquement le nouveau guide ; vous pourrez ensuite cocher ce que vous gardez.
              </p>
            </div>
          )}

          {/* Add-images console */}
          {side === "new" && onAddImages && (
            <div className="border-2 border-dashed border-emerald-400/40 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <ImageIcon className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                <h3 className="text-sm font-semibold">Ajouter des images au guide</h3>
                <Badge variant="outline" className="text-[10px]">
                  {stats?.newImages ?? 0} / cible {profile.imagesMin}-{profile.imagesMax}
                </Badge>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex items-center gap-1 shrink-0">
                  <Button type="button" size="icon" variant="outline" className="h-9 w-9"
                    onClick={() => setAddCount(c => Math.max(1, c - 1))}
                    disabled={addLoading || addCount <= 1}>
                    <Minus className="w-4 h-4" />
                  </Button>
                  <div className="w-12 text-center font-semibold tabular-nums">{addCount}</div>
                  <Button type="button" size="icon" variant="outline" className="h-9 w-9"
                    onClick={() => setAddCount(c => Math.min(10, c + 1))}
                    disabled={addLoading || addCount >= 10}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <Textarea
                  value={addInstruction}
                  onChange={(e) => setAddInstruction(e.target.value)}
                  placeholder='Optionnel — ex: "Renforcer les sections coûts et étapes pas à pas, ajouter une infographie dans la FAQ."'
                  rows={2}
                  className="flex-1 text-sm resize-none"
                  disabled={addLoading}
                />
                <Button
                  onClick={async () => {
                    setAddLoading(true);
                    try { await onAddImages(addCount, addInstruction); setAddInstruction(""); }
                    finally { setAddLoading(false); }
                  }}
                  disabled={addLoading}
                  className="gap-2 self-stretch bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {addLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  {addLoading ? "Génération…" : `Générer ${addCount} image${addCount > 1 ? 's' : ''}`}
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                L'IA insère {addCount} placeholder(s) image dans les sections les plus pertinentes (ou suit votre consigne), puis génère les visuels. Le reste du contenu n'est pas touché.
              </p>
            </div>
          )}

          <Separator />

          {!confirmStep ? (
            <div className="flex items-center justify-between gap-3 pt-2">
              <Button variant="ghost" onClick={onDiscard} className="gap-2">
                <ArrowLeft className="w-4 h-4" /> Abandonner le nouveau guide
              </Button>
              <Button
                onClick={() => setConfirmStep(true)}
                disabled={noneChecked}
                className="gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Continuer ({checkedCount} élément{checkedCount > 1 ? "s" : ""})
              </Button>
            </div>
          ) : (
            <div className="space-y-3 pt-2">
              <div className="rounded-lg border-2 border-orange-300 bg-orange-50 dark:bg-orange-950/30 dark:border-orange-900 p-3 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-orange-900 dark:text-orange-200">Confirmation requise</p>
                  <p className="text-orange-800 dark:text-orange-300">
                    Vous allez écraser <strong>{checkedCount} élément{checkedCount > 1 ? "s" : ""}</strong> du guide actuel : {FIELDS.filter(f => selection[f.key]).map(f => f.label).join(", ")}.
                    Cette action n'est pas réversible (sauf en n'enregistrant pas le guide).
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between gap-3">
                <Button variant="outline" onClick={() => setConfirmStep(false)}>
                  Revenir à la sélection
                </Button>
                <Button
                  onClick={() => onApply(selection)}
                  className="gap-2 bg-gradient-to-r from-primary to-emerald-600 hover:from-primary/90 hover:to-emerald-700"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Confirmer et appliquer
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Media library picker */}
      <MediaLibrary
        open={mediaLibOpen}
        onOpenChange={setMediaLibOpen}
        onSelect={(url) => { replaceActiveImage(url); setMediaLibOpen(false); }}
      />

      {/* AI image regenerator */}
      <ImageRegenerateModal
        open={imgRegenOpen}
        onOpenChange={setImgRegenOpen}
        contextLabel={activeImageContext === "featured" ? "image à la une" : "image de section"}
        context={pending.title || pending.excerpt || ""}
        onImageGenerated={(url) => { replaceActiveImage(url); setImgRegenOpen(false); }}
      />
    </>
  );
};
