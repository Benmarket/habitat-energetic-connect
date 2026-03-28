// ArticleGenerationWizard v2 - Timer + Regions + Images fix
import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Sparkles, ArrowLeft, ArrowRight, Check, Target, Lightbulb, FileText, X, MapPin, Clock } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";

export interface GenerationInput {
  product: string;
  subject: string;
  theme: string;
  objective: string;
  keywords: string[];
  freePrompt: string;
  targetRegions: string[];
}

export interface EditorialAngle {
  id: number;
  type: string;
  title: string;
  intention: string;
}

interface Region {
  id: string;
  code: string;
  name: string;
  image_url: string | null;
}

interface ArticleGenerationWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contentType: string;
  onGenerateAngles: (input: GenerationInput) => Promise<void>;
  loadingAngles: boolean;
  angles: EditorialAngle[] | null;
  onSelectAngle: (angle: EditorialAngle, input: GenerationInput) => Promise<void>;
  loadingArticle: boolean;
  generatedArticle: any | null;
  onSelectArticle: (article: any) => void;
  initialKeywords?: string[];
  initialRegions?: string[];
}

const THEMES = [
  "Rentabilité & économies",
  "Fonctionnement & technique",
  "Aides & subventions",
  "Comparatif & alternatives",
  "Problèmes fréquents & solutions",
  "Installation & démarches",
  "Témoignages & retours d'expérience",
  "Réglementation & normes",
];

const OBJECTIVES = [
  { value: "lead", label: "Génération de leads", icon: "🎯" },
  { value: "reassure", label: "Rassurer le prospect", icon: "🛡️" },
  { value: "educate", label: "Éduquer & informer", icon: "📚" },
  { value: "prequalify", label: "Pré-qualification", icon: "✅" },
  { value: "convert", label: "Conversion directe", icon: "💰" },
];

export const ArticleGenerationWizard = ({
  open,
  onOpenChange,
  contentType,
  onGenerateAngles,
  loadingAngles,
  angles,
  onSelectAngle,
  loadingArticle,
  generatedArticle,
  onSelectArticle,
  initialKeywords = [],
  initialRegions = ["fr"],
}: ArticleGenerationWizardProps) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [input, setInput] = useState<GenerationInput>({
    product: "",
    subject: "",
    theme: "",
    objective: "lead",
    keywords: initialKeywords,
    freePrompt: "",
    targetRegions: initialRegions,
  });
  const [keywordInput, setKeywordInput] = useState("");
  const [selectedAngle, setSelectedAngle] = useState<EditorialAngle | null>(null);
  const [regions, setRegions] = useState<Region[]>([]);

  // Timer
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch regions from DB
  useEffect(() => {
    if (open) {
      supabase.from('regions').select('id, code, name, image_url').eq('is_active', true).order('display_order')
        .then(({ data }) => { if (data) setRegions(data); });
    }
  }, [open]);

  // Timer logic
  useEffect(() => {
    const isLoading = loadingAngles || loadingArticle;
    if (isLoading) {
      setElapsedSeconds(0);
      timerRef.current = setInterval(() => setElapsedSeconds(s => s + 1), 1000);
    } else {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [loadingAngles, loadingArticle]);

  const resetWizard = () => {
    setStep(1);
    setInput({ product: "", subject: "", theme: "", objective: "lead", keywords: initialKeywords, freePrompt: "", targetRegions: initialRegions });
    setKeywordInput("");
    setSelectedAngle(null);
    setElapsedSeconds(0);
  };

  const handleClose = (val: boolean) => {
    if (!val) resetWizard();
    onOpenChange(val);
  };

  const handleStep1Submit = async () => {
    await onGenerateAngles(input);
    setStep(2);
  };

  const handleAngleSelect = async (angle: EditorialAngle) => {
    setSelectedAngle(angle);
    setStep(3);
    await onSelectAngle(angle, input);
  };

  const addKeyword = (kw: string) => {
    const trimmed = kw.trim();
    if (trimmed && !input.keywords.includes(trimmed)) {
      setInput(prev => ({ ...prev, keywords: [...prev.keywords, trimmed] }));
      setKeywordInput("");
    }
  };

  const removeKeyword = (index: number) => {
    setInput(prev => ({ ...prev, keywords: prev.keywords.filter((_, i) => i !== index) }));
  };

  const toggleRegion = (code: string) => {
    setInput(prev => {
      const current = prev.targetRegions;
      if (current.includes(code)) {
        if (current.length === 1) return prev; // at least 1
        return { ...prev, targetRegions: current.filter(r => r !== code) };
      }
      return { ...prev, targetRegions: [...current, code] };
    });
  };

  const selectAllRegions = () => {
    setInput(prev => ({ ...prev, targetRegions: regions.map(r => r.code) }));
  };

  const isStep1Valid = input.product.trim().length > 0 && input.theme.trim().length > 0 && input.objective.trim().length > 0 && input.targetRegions.length > 0;

  const contentLabel = contentType === 'guide' ? 'guide' : contentType === 'aide' ? 'article aide' : 'article';

  const formatTimer = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return mins > 0 ? `${mins}m ${secs.toString().padStart(2, '0')}s` : `${secs}s`;
  };

  const TimerDisplay = () => (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Clock className="w-4 h-4 animate-pulse" />
      <span>{formatTimer(elapsedSeconds)}</span>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-[min(42rem,calc(100vw-2rem))] h-[90vh] max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Générer un {contentLabel} — Étape {step}/3
          </DialogTitle>
          <DialogDescription>
            {step === 1 && "Définissez votre sujet, thème, objectif et régions cibles."}
            {step === 2 && "Choisissez l'angle éditorial qui correspond le mieux à votre stratégie."}
            {step === 3 && "Génération de l'article en cours..."}
          </DialogDescription>
        </DialogHeader>

        {/* Progress bar */}
        <div className="flex gap-1 mb-2">
          {[1, 2, 3].map(s => (
            <div key={s} className={`h-1.5 flex-1 rounded-full transition-colors ${s <= step ? 'bg-primary' : 'bg-muted'}`} />
          ))}
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto pr-2">
          {/* STEP 1 */}
          {step === 1 && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-primary" />
                    Produit à mettre en avant <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    placeholder="Ex : panneaux solaires, pompe à chaleur…"
                    value={input.product}
                    onChange={e => setInput(prev => ({ ...prev, product: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">Le produit ou service que l'article doit promouvoir.</p>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-primary" />
                    Sujet / Trame <span className="text-xs text-muted-foreground">(optionnel)</span>
                  </Label>
                  <Input
                    placeholder="Ex : hausse du prix de l'électricité, bilan carbone…"
                    value={input.subject}
                    onChange={e => setInput(prev => ({ ...prev, subject: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">Le fil conducteur ou l'actualité autour de laquelle l'article est construit.</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-primary" />
                  Thème de l'article <span className="text-destructive">*</span>
                </Label>
                <Select value={input.theme} onValueChange={v => setInput(prev => ({ ...prev, theme: v }))}>
                  <SelectTrigger><SelectValue placeholder="Sélectionnez un thème" /></SelectTrigger>
                  <SelectContent>
                    {THEMES.map(t => (<SelectItem key={t} value={t}>{t}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  Objectif <span className="text-destructive">*</span>
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {OBJECTIVES.map(obj => (
                    <button key={obj.value} type="button"
                      onClick={() => setInput(prev => ({ ...prev, objective: obj.value }))}
                      className={`flex items-center gap-2 p-3 rounded-lg border text-left transition-colors text-sm ${
                        input.objective === obj.value ? 'border-primary bg-primary/10 text-primary font-medium' : 'border-border hover:border-primary/50'
                      }`}>
                      <span className="text-lg">{obj.icon}</span>{obj.label}
                    </button>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Region selection */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    Régions cibles <span className="text-destructive">*</span>
                  </Label>
                  <Button type="button" variant="ghost" size="sm" onClick={selectAllRegions} className="text-xs h-7">
                    Toutes
                  </Button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {regions.map(region => (
                    <label key={region.code}
                      className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-colors text-sm ${
                        input.targetRegions.includes(region.code) ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/30'
                      }`}>
                      <Checkbox
                        checked={input.targetRegions.includes(region.code)}
                        onCheckedChange={() => toggleRegion(region.code)}
                      />
                      {region.image_url && (
                        <img src={region.image_url} alt={region.name} className="w-6 h-6 object-contain" />
                      )}
                      <span className="font-medium">{region.name}</span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  L'article sera optimisé SEO pour les régions sélectionnées.
                </p>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Mots-clés SEO <span className="text-muted-foreground text-xs">(optionnel)</span></Label>
                <Input placeholder="Tapez un mot-clé et appuyez sur Entrée" value={keywordInput}
                  onChange={e => setKeywordInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addKeyword(keywordInput); } }} />
                {input.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {input.keywords.map((kw, i) => (
                      <Badge key={i} variant="secondary" className="gap-1 pr-1">
                        {kw}
                        <button type="button" onClick={() => removeKeyword(i)} className="ml-1 hover:bg-muted rounded-full p-0.5">
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Prompt libre <span className="text-muted-foreground text-xs">(optionnel)</span></Label>
                <Textarea placeholder="Angle spécifique, contraintes…" value={input.freePrompt}
                  onChange={e => setInput(prev => ({ ...prev, freePrompt: e.target.value }))} rows={3} />
              </div>

              <div className="flex justify-end pt-2">
                <Button onClick={handleStep1Submit} disabled={!isStep1Valid || loadingAngles} className="gap-2">
                  {loadingAngles ? <><Loader2 className="w-4 h-4 animate-spin" /><TimerDisplay /></> : <><ArrowRight className="w-4 h-4" />Proposer 5 angles</>}
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="space-y-4 py-2">
              {loadingAngles && !angles ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <TimerDisplay />
                  <p className="text-muted-foreground">Analyse et proposition d'angles…</p>
                </div>
              ) : angles && angles.length > 0 ? (
                <>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Sélectionnez l'angle pour <strong>{input.product}</strong>
                      {input.targetRegions.length < regions.length && (
                        <span className="ml-1">
                          ({input.targetRegions.map(r => regions.find(rr => rr.code === r)?.name).filter(Boolean).join(', ')})
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="space-y-3">
                    {angles.map(angle => (
                      <Card key={angle.id} className="cursor-pointer transition-all hover:border-primary/50 hover:shadow-md"
                        onClick={() => handleAngleSelect(angle)}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <Badge variant="outline" className="text-xs mb-1">{angle.type}</Badge>
                              <h4 className="font-semibold text-base">{angle.title}</h4>
                              <p className="text-sm text-muted-foreground mt-1">→ {angle.intention}</p>
                            </div>
                            <Button size="sm" variant="ghost" className="shrink-0 gap-1">
                              <Check className="w-4 h-4" /> Choisir
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  <div className="flex justify-start pt-2">
                    <Button variant="ghost" onClick={() => setStep(1)} className="gap-2">
                      <ArrowLeft className="w-4 h-4" /> Modifier les paramètres
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-destructive">Aucun angle généré. Réessayez.</p>
                  <Button variant="outline" onClick={() => setStep(1)} className="mt-4 gap-2">
                    <ArrowLeft className="w-4 h-4" /> Retour
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="space-y-4 py-2">
              {loadingArticle && !generatedArticle ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <TimerDisplay />
                  <p className="text-muted-foreground">
                    Rédaction : <strong>{selectedAngle?.type}</strong>
                  </p>
                  <p className="text-xs text-muted-foreground">Génération du contenu + images…</p>
                </div>
              ) : generatedArticle ? (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="default" className="gap-1">
                      <Check className="w-3 h-3" /> Généré en {formatTimer(elapsedSeconds)}
                    </Badge>
                    <Badge variant="outline">{selectedAngle?.type}</Badge>
                  </div>

                  <Card>
                    <CardContent className="p-4">
                      {generatedArticle.featuredImageUrl && (
                        <img src={generatedArticle.featuredImageUrl} alt="Image principale"
                          className="w-full h-48 object-cover rounded-lg mb-4" />
                      )}
                      <h3 className="text-lg font-bold mb-2">{generatedArticle.title}</h3>
                      <p className="text-sm text-muted-foreground mb-3">{generatedArticle.excerpt}</p>
                      <Separator className="my-3" />
                      <div className="prose prose-sm max-w-none max-h-[300px] overflow-y-auto"
                        dangerouslySetInnerHTML={{ __html: generatedArticle.content?.slice(0, 3000) + '...' }} />
                    </CardContent>
                  </Card>

                  <div className="flex justify-between pt-2">
                    <Button variant="ghost" onClick={() => setStep(2)} className="gap-2">
                      <ArrowLeft className="w-4 h-4" /> Autre angle
                    </Button>
                    <Button onClick={() => { onSelectArticle(generatedArticle); handleClose(false); }} className="gap-2">
                      <Check className="w-4 h-4" /> Utiliser cet article
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-destructive">Erreur lors de la génération.</p>
                  <Button variant="outline" onClick={() => setStep(2)} className="mt-4 gap-2">
                    <ArrowLeft className="w-4 h-4" /> Retour
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
