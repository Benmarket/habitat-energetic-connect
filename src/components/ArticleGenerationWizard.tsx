// ArticleGenerationWizard - Multi-step article generation
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Sparkles, ArrowLeft, ArrowRight, Check, Target, Lightbulb, FileText, X } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export interface GenerationInput {
  product: string;
  theme: string;
  objective: string;
  keywords: string[];
  freePrompt: string;
}

export interface EditorialAngle {
  id: number;
  type: string;
  title: string;
  intention: string;
}

interface ArticleGenerationWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contentType: string;
  // Step 1 → 2
  onGenerateAngles: (input: GenerationInput) => Promise<void>;
  loadingAngles: boolean;
  angles: EditorialAngle[] | null;
  // Step 3 → 4
  onSelectAngle: (angle: EditorialAngle, input: GenerationInput) => Promise<void>;
  loadingArticle: boolean;
  generatedArticle: any | null;
  onSelectArticle: (article: any) => void;
  // Pre-filled keywords
  initialKeywords?: string[];
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
}: ArticleGenerationWizardProps) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [input, setInput] = useState<GenerationInput>({
    product: "",
    theme: "",
    objective: "lead",
    keywords: initialKeywords,
    freePrompt: "",
  });
  const [keywordInput, setKeywordInput] = useState("");
  const [selectedAngle, setSelectedAngle] = useState<EditorialAngle | null>(null);

  const resetWizard = () => {
    setStep(1);
    setInput({ product: "", theme: "", objective: "lead", keywords: initialKeywords, freePrompt: "" });
    setKeywordInput("");
    setSelectedAngle(null);
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

  const isStep1Valid = input.product.trim().length > 0 && input.theme.trim().length > 0 && input.objective.trim().length > 0;

  const contentLabel = contentType === 'guide' ? 'guide' : contentType === 'aide' ? 'article aide' : 'article';

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Générer un {contentLabel} — Étape {step}/3
          </DialogTitle>
          <DialogDescription>
            {step === 1 && "Définissez votre sujet, thème et objectif pour une génération ciblée."}
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

        <ScrollArea className="flex-1 pr-2">
          {/* STEP 1: Structured Input */}
          {step === 1 && (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-primary" />
                  Produit / Sujet principal <span className="text-destructive">*</span>
                </Label>
                <Input
                  placeholder="Ex : panneaux photovoltaïques, isolation combles, mutuelle senior…"
                  value={input.product}
                  onChange={e => setInput(prev => ({ ...prev, product: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-primary" />
                  Thème de l'article <span className="text-destructive">*</span>
                </Label>
                <Select value={input.theme} onValueChange={v => setInput(prev => ({ ...prev, theme: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez un thème" />
                  </SelectTrigger>
                  <SelectContent>
                    {THEMES.map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  Objectif de l'article <span className="text-destructive">*</span>
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {OBJECTIVES.map(obj => (
                    <button
                      key={obj.value}
                      type="button"
                      onClick={() => setInput(prev => ({ ...prev, objective: obj.value }))}
                      className={`flex items-center gap-2 p-3 rounded-lg border text-left transition-colors text-sm ${
                        input.objective === obj.value
                          ? 'border-primary bg-primary/10 text-primary font-medium'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <span className="text-lg">{obj.icon}</span>
                      {obj.label}
                    </button>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Mots-clés SEO <span className="text-muted-foreground text-xs">(optionnel)</span></Label>
                <Input
                  placeholder="Tapez un mot-clé et appuyez sur Entrée"
                  value={keywordInput}
                  onChange={e => setKeywordInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addKeyword(keywordInput);
                    }
                  }}
                />
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
                <Textarea
                  placeholder="Ajoutez un angle spécifique, des contraintes ou des consignes supplémentaires…"
                  value={input.freePrompt}
                  onChange={e => setInput(prev => ({ ...prev, freePrompt: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="flex justify-end pt-2">
                <Button onClick={handleStep1Submit} disabled={!isStep1Valid || loadingAngles} className="gap-2">
                  {loadingAngles ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                  Proposer 5 angles
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2: Angles Selection */}
          {step === 2 && (
            <div className="space-y-4 py-2">
              {loadingAngles && !angles ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <p className="text-muted-foreground">Analyse de votre sujet et proposition d'angles…</p>
                </div>
              ) : angles && angles.length > 0 ? (
                <>
                  <p className="text-sm text-muted-foreground">
                    Sélectionnez l'angle qui correspond le mieux à votre stratégie pour <strong>{input.product}</strong>.
                  </p>
                  <div className="space-y-3">
                    {angles.map(angle => (
                      <Card
                        key={angle.id}
                        className="cursor-pointer transition-all hover:border-primary/50 hover:shadow-md"
                        onClick={() => handleAngleSelect(angle)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className="text-xs">{angle.type}</Badge>
                              </div>
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
                  <p className="text-destructive">Aucun angle n'a pu être généré. Réessayez.</p>
                  <Button variant="outline" onClick={() => setStep(1)} className="mt-4 gap-2">
                    <ArrowLeft className="w-4 h-4" /> Retour
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Article Generation & Preview */}
          {step === 3 && (
            <div className="space-y-4 py-2">
              {loadingArticle && !generatedArticle ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <p className="text-muted-foreground">
                    Rédaction de l'article avec l'angle : <strong>{selectedAngle?.type}</strong>
                  </p>
                  <p className="text-xs text-muted-foreground">Cela peut prendre 30 à 60 secondes…</p>
                </div>
              ) : generatedArticle ? (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="default" className="gap-1">
                      <Check className="w-3 h-3" /> Article généré
                    </Badge>
                    <Badge variant="outline">{selectedAngle?.type}</Badge>
                  </div>
                  
                  <Card>
                    <CardContent className="p-4">
                      <h3 className="text-lg font-bold mb-2">{generatedArticle.title}</h3>
                      <p className="text-sm text-muted-foreground mb-3">{generatedArticle.excerpt}</p>
                      <Separator className="my-3" />
                      <div 
                        className="prose prose-sm max-w-none max-h-[300px] overflow-y-auto"
                        dangerouslySetInnerHTML={{ __html: generatedArticle.content?.slice(0, 2000) + '...' }}
                      />
                    </CardContent>
                  </Card>

                  <div className="flex justify-between pt-2">
                    <Button variant="ghost" onClick={() => { setStep(2); }} className="gap-2">
                      <ArrowLeft className="w-4 h-4" /> Choisir un autre angle
                    </Button>
                    <Button onClick={() => { onSelectArticle(generatedArticle); handleClose(false); }} className="gap-2">
                      <Check className="w-4 h-4" /> Utiliser cet article
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-destructive">Erreur lors de la génération. Réessayez.</p>
                  <Button variant="outline" onClick={() => setStep(2)} className="mt-4 gap-2">
                    <ArrowLeft className="w-4 h-4" /> Retour aux angles
                  </Button>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
