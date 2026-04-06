import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, CheckCircle2, Clock, Loader2, Star, Table2, Image, MousePointerClick, Lightbulb, XCircle, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from "react";

interface ReviewCritere {
  nom: string;
  note: number;
  commentaire: string;
}

interface ReviewProbleme {
  localisation: string;
  probleme: string;
  suggestion: string;
}

export interface ArticleReview {
  score_global: number;
  verdict: string;
  criteres: ReviewCritere[];
  problemes: ReviewProbleme[];
  suggestions: string[];
  tableaux_presents: boolean;
  nb_cta: number;
  cta_couleurs_variees: boolean;
  nb_images: number;
}

interface ArticleReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  review: ArticleReview | null;
  loading: boolean;
  onStartReview: () => void;
  onApplyFixes?: () => void;
  loadingFix?: boolean;
}

const getNoteColor = (note: number) => {
  if (note >= 8) return "text-green-600";
  if (note >= 6) return "text-yellow-600";
  if (note >= 4) return "text-orange-500";
  return "text-red-500";
};

const getNoteBg = (note: number) => {
  if (note >= 8) return "bg-green-100 border-green-300";
  if (note >= 6) return "bg-yellow-50 border-yellow-300";
  if (note >= 4) return "bg-orange-50 border-orange-300";
  return "bg-red-50 border-red-300";
};

const getScoreBadge = (score: number) => {
  if (score >= 8) return { label: "Excellent", variant: "default" as const, className: "bg-green-600" };
  if (score >= 6.5) return { label: "Correct", variant: "default" as const, className: "bg-yellow-600" };
  if (score >= 5) return { label: "À améliorer", variant: "default" as const, className: "bg-orange-500" };
  return { label: "Insuffisant", variant: "destructive" as const, className: "" };
};

export const ArticleReviewModal = ({ open, onOpenChange, review, loading, onStartReview, onApplyFixes, loadingFix }: ArticleReviewModalProps) => {
  const scoreBadge = review ? getScoreBadge(review.score_global) : null;
  const hasIssues = review && (review.problemes.length > 0 || review.suggestions.length > 0);

  // Timer for loading states
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isTimerActive = loading || loadingFix;

  useEffect(() => {
    if (isTimerActive) {
      setElapsedSeconds(0);
      timerRef.current = setInterval(() => setElapsedSeconds(s => s + 1), 1000);
    } else {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isTimerActive]);

  const formatTimer = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const TimerDisplay = () => (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Clock className="w-4 h-4 animate-pulse" />
      <span>{formatTimer(elapsedSeconds)}</span>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="w-5 h-5 text-primary" />
            Relecture IA de l'article
          </DialogTitle>
        </DialogHeader>

        {!review && !loading && (
          <div className="text-center py-10 space-y-4">
            <p className="text-muted-foreground">
              Lancez la relecture IA pour analyser la qualité, la cohérence, les CTA, les tableaux et l'originalité de votre article.
            </p>
            <Button onClick={onStartReview} className="gap-2">
              <Star className="w-4 h-4" />
              Lancer la relecture
            </Button>
          </div>
        )}

        {loading && (
          <div className="text-center py-16 space-y-4">
            <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground font-medium">Analyse en cours…</p>
            <TimerDisplay />
            <p className="text-sm text-muted-foreground">L'IA relit l'intégralité de votre article</p>
          </div>
        )}

        {loadingFix && (
          <div className="text-center py-16 space-y-4">
            <Wand2 className="w-10 h-10 animate-pulse text-primary mx-auto" />
            <p className="text-muted-foreground font-medium">Correction en cours…</p>
            <TimerDisplay />
            <p className="text-sm text-muted-foreground">L'IA corrige l'article et génère les éléments manquants</p>
          </div>
        )}

        {review && !loading && !loadingFix && (
          <ScrollArea className="max-h-[70vh] pr-4">
            <div className="space-y-6">
              {/* Score global */}
              <div className="text-center space-y-3">
                <div className="text-5xl font-bold text-foreground">{review.score_global}<span className="text-2xl text-muted-foreground">/10</span></div>
                {scoreBadge && <Badge className={scoreBadge.className}>{scoreBadge.label}</Badge>}
                <p className="text-muted-foreground italic">{review.verdict}</p>
              </div>

              {/* Quick stats */}
              <div className="grid grid-cols-4 gap-2">
                <div className={`text-center p-2 rounded-lg border ${review.tableaux_presents ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                  <Table2 className={`w-4 h-4 mx-auto ${review.tableaux_presents ? 'text-green-600' : 'text-red-500'}`} />
                  <p className="text-xs mt-1">{review.tableaux_presents ? 'Tableaux ✓' : 'Pas de tableau'}</p>
                </div>
                <div className={`text-center p-2 rounded-lg border ${review.nb_images >= 3 ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
                  <Image className={`w-4 h-4 mx-auto ${review.nb_images >= 3 ? 'text-green-600' : 'text-yellow-600'}`} />
                  <p className="text-xs mt-1">{review.nb_images} image{review.nb_images > 1 ? 's' : ''}</p>
                </div>
                <div className={`text-center p-2 rounded-lg border ${review.nb_cta >= 2 ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
                  <MousePointerClick className={`w-4 h-4 mx-auto ${review.nb_cta >= 2 ? 'text-green-600' : 'text-yellow-600'}`} />
                  <p className="text-xs mt-1">{review.nb_cta} CTA</p>
                </div>
                <div className={`text-center p-2 rounded-lg border ${review.cta_couleurs_variees ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                  <span className={`text-lg ${review.cta_couleurs_variees ? '' : 'grayscale'}`}>🎨</span>
                  <p className="text-xs mt-1">{review.cta_couleurs_variees ? 'CTA variés' : 'CTA monotones'}</p>
                </div>
              </div>

              <Separator />

              {/* Critères détaillés */}
              <div className="space-y-3">
                <h3 className="font-semibold text-foreground">Critères détaillés</h3>
                {review.criteres.map((c, i) => (
                  <div key={i} className={`p-3 rounded-lg border ${getNoteBg(c.note)}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">{c.nom}</span>
                      <span className={`font-bold text-lg ${getNoteColor(c.note)}`}>{c.note}/10</span>
                    </div>
                    <Progress value={c.note * 10} className="h-1.5 mb-2" />
                    <p className="text-sm text-muted-foreground">{c.commentaire}</p>
                  </div>
                ))}
              </div>

              {/* Problèmes */}
              {review.problemes.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h3 className="font-semibold text-foreground flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-orange-500" />
                      Problèmes détectés ({review.problemes.length})
                    </h3>
                    {review.problemes.map((p, i) => (
                      <div key={i} className="p-3 rounded-lg border border-orange-200 bg-orange-50/50 space-y-1">
                        <p className="text-xs text-orange-600 font-medium">📍 {p.localisation}</p>
                        <p className="text-sm flex items-start gap-1.5">
                          <XCircle className="w-3.5 h-3.5 text-red-500 mt-0.5 shrink-0" />
                          {p.probleme}
                        </p>
                        <p className="text-sm flex items-start gap-1.5 text-green-700">
                          <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                          {p.suggestion}
                        </p>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Suggestions */}
              {review.suggestions.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h3 className="font-semibold text-foreground flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-yellow-500" />
                      Suggestions d'amélioration
                    </h3>
                    <ul className="space-y-2">
                      {review.suggestions.map((s, i) => (
                        <li key={i} className="text-sm flex items-start gap-2 p-2 rounded-lg bg-muted/50">
                          <span className="text-primary font-bold shrink-0">{i + 1}.</span>
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}

              {/* Actions */}
              <Separator />
              <div className="flex items-center justify-center gap-3 pt-2">
                <Button variant="outline" onClick={onStartReview} size="sm" className="gap-2">
                  <Star className="w-4 h-4" />
                  Relancer l'analyse
                </Button>
                {hasIssues && onApplyFixes && (
                  <Button onClick={onApplyFixes} size="sm" className="gap-2 bg-gradient-to-r from-primary to-emerald-600 hover:from-primary/90 hover:to-emerald-700">
                    <Wand2 className="w-4 h-4" />
                    Appliquer les corrections
                  </Button>
                )}
              </div>
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
};
