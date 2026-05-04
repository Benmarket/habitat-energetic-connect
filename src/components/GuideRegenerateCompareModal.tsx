import { useState, useMemo, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Sparkles, AlertTriangle, ArrowLeft, CheckCircle2 } from "lucide-react";
import DOMPurify from "dompurify";

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
}

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

export const GuideRegenerateCompareModal = ({
  open, onOpenChange, current, pending, onApply, onDiscard,
}: Props) => {
  const [selection, setSelection] = useState<Record<FieldKey, boolean>>(() =>
    FIELDS.reduce((acc, f) => ({ ...acc, [f.key]: f.defaultChecked }), {} as Record<FieldKey, boolean>)
  );
  const [confirmStep, setConfirmStep] = useState(false);
  const [side, setSide] = useState<"current" | "new">("new");

  useEffect(() => {
    if (open) {
      setSelection(FIELDS.reduce((acc, f) => ({ ...acc, [f.key]: f.defaultChecked }), {} as Record<FieldKey, boolean>));
      setConfirmStep(false);
      setSide("new");
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

  if (!pending) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onDiscard(); onOpenChange(o); }}>
      <DialogContent className="max-w-6xl max-h-[92vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Comparer & appliquer la régénération du guide
          </DialogTitle>
          <DialogDescription>
            Le nouveau guide a été généré en mode <strong>Premium</strong>. Comparez ci-dessous, cochez ce que vous voulez garder, et confirmez.
          </DialogDescription>
        </DialogHeader>

        {/* Stats banner */}
        {stats && (
          <div className="grid grid-cols-4 gap-3 py-2">
            <div className="text-center p-2 rounded-lg border bg-muted/30">
              <p className="text-xs text-muted-foreground">Actuel</p>
              <p className="font-semibold">{stats.currentWords} mots</p>
            </div>
            <div className="text-center p-2 rounded-lg border-2 border-primary/30 bg-primary/5">
              <p className="text-xs text-primary">Nouveau (premium)</p>
              <p className="font-semibold text-primary">{stats.newWords} mots</p>
            </div>
            <div className="text-center p-2 rounded-lg border bg-muted/30">
              <p className="text-xs text-muted-foreground">Images générées</p>
              <p className="font-semibold">{stats.newImages}</p>
            </div>
            <div className="text-center p-2 rounded-lg border bg-muted/30">
              <p className="text-xs text-muted-foreground">Coût IA</p>
              <p className="font-semibold">+{stats.cost.toFixed(4)} €</p>
            </div>
          </div>
        )}

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
              <div className="p-4 space-y-4">
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
                      <img src={pending.featuredImageUrl} alt="" className="w-full max-h-48 object-cover rounded-md" />
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

        <Separator />

        {/* Footer actions */}
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
  );
};
