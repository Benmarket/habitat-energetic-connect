import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowLeft, Mail, CheckCircle2, AlertCircle, Loader2, ExternalLink, FileText, RefreshCw, Eye, Sun, Snowflake, Flame, Hammer, HelpCircle, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PreviewedTemplate {
  templateName: string;
  displayName: string;
  subject: string;
  html: string;
  previewData: Record<string, unknown> | null;
  status: "ready" | "render_failed";
  errorMessage?: string;
}

type WorkType = "mix" | "solaire" | "isolation" | "chauffage" | "renovation" | "none";

const WORK_TYPE_OPTIONS: Array<{
  value: WorkType;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}> = [
  {
    value: "mix",
    label: "Je ne sais pas",
    description: "Mix d'images (défaut)",
    icon: HelpCircle,
    color: "text-amber-600 border-amber-300 bg-amber-50",
  },
  {
    value: "solaire",
    label: "Solaire / PV",
    description: "Panneaux photovoltaïques",
    icon: Sun,
    color: "text-orange-600 border-orange-300 bg-orange-50",
  },
  {
    value: "isolation",
    label: "Isolation",
    description: "Combles, ITE, murs",
    icon: Snowflake,
    color: "text-sky-600 border-sky-300 bg-sky-50",
  },
  {
    value: "chauffage",
    label: "Chauffage",
    description: "PAC, poêle, chaudière",
    icon: Flame,
    color: "text-red-600 border-red-300 bg-red-50",
  },
  {
    value: "renovation",
    label: "Rénovation globale",
    description: "Travaux d'ampleur",
    icon: Hammer,
    color: "text-emerald-600 border-emerald-300 bg-emerald-50",
  },
  {
    value: "none",
    label: "Autre / aucun",
    description: "Sans galerie d'images",
    icon: Phone,
    color: "text-slate-600 border-slate-300 bg-slate-50",
  },
];

const AdminConfirmation = () => {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<PreviewedTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("");
  const [workType, setWorkType] = useState<WorkType>("mix");

  const loadTemplates = async (selectedWorkType: WorkType = workType) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.functions.invoke("admin-preview-emails", {
        body: { workType: selectedWorkType },
      });
      if (error) throw error;
      const list: PreviewedTemplate[] = data?.templates ?? [];
      setTemplates(list);
      if (list.length > 0 && !activeTab) {
        setActiveTab(list[0].templateName);
      }
    } catch (e: any) {
      const msg = e?.message ?? "Erreur de chargement des templates";
      setError(msg);
      toast({ title: "Erreur", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates(workType);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workType]);

  return (
    <>
      <Helmet>
        <title>Confirmation (page merci + emails) | Administration</title>
      </Helmet>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="flex items-center gap-3 mb-2">
            <Link to="/administration">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" /> Retour
              </Button>
            </Link>
          </div>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                <Mail className="w-7 h-7 text-orange-600" />
                Confirmation (page merci + emails)
              </h1>
              <p className="text-muted-foreground mt-1">
                Emails automatiques envoyés à chaque lead, et page de remerciement affichée après soumission.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => loadTemplates(workType)} disabled={loading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                Recharger
              </Button>
              <a href="/merci" target="_blank" rel="noopener noreferrer">
                <Button variant="outline">
                  <Eye className="w-4 h-4 mr-2" /> Voir page /merci
                </Button>
              </a>
            </div>
          </div>

          {/* Vue d'ensemble */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card className="border-l-4 border-l-orange-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Mail className="w-5 h-5 text-orange-600" /> Domaine expéditeur
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-mono text-sm">Prime Energies &lt;noreply@prime-energies.fr&gt;</p>
                <Badge variant="outline" className="mt-2 bg-green-50 text-green-700 border-green-200">
                  <CheckCircle2 className="w-3 h-3 mr-1" /> DNS vérifié
                </Badge>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" /> Templates actifs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{templates.length}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Lead + activation, lead existant, confirmation simple
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-purple-600" /> Activation par défaut
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">Email + lien d'inscription : <strong>activés</strong></p>
                <p className="text-xs text-muted-foreground mt-1">
                  Désactivable par formulaire dans <Link to="/admin/formulaires" className="underline">Formulaires</Link>
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Comment ça marche */}
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Comment ça marche ?</AlertTitle>
            <AlertDescription className="space-y-1 mt-2">
              <p>1. Un visiteur soumet un formulaire (contact, simulateur, demande solaire, chatbot…).</p>
              <p>2. Le système choisit automatiquement le bon template :</p>
              <ul className="list-disc ml-6 space-y-0.5 text-sm">
                <li><strong>Lead + signup</strong> : nouveau lead, lien magique pour créer son espace membre.</li>
                <li><strong>Lead existant</strong> : compte déjà créé, invitation à se reconnecter.</li>
                <li><strong>Simple</strong> : confirmation seule (si lien d'inscription désactivé sur le formulaire).</li>
              </ul>
              <p>3. Le lien d'activation est valable <strong>7 jours</strong> et personnel (token UUID).</p>
              <p>4. La page <code>/merci</code> s'affiche avec un récapitulatif personnalisé.</p>
            </AlertDescription>
          </Alert>

          {/* Sélecteur visuel de produit pour la prévisualisation */}
          <Card className="mb-6 border-2 border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Eye className="w-5 h-5 text-primary" />
                Prévisualiser un produit
              </CardTitle>
              <CardDescription>
                <strong>Tous les produits sont actifs en production.</strong> Ce sélecteur sert uniquement à <em>prévisualiser</em> ici comment l'email s'adapte selon le projet du lead. La détection se fait automatiquement à l'envoi.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                {WORK_TYPE_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const isActive = workType === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setWorkType(opt.value)}
                      disabled={loading}
                      className={`group relative flex flex-col items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all text-center ${
                        isActive
                          ? `${opt.color} border-current shadow-md scale-[1.02]`
                          : "border-border bg-card hover:border-primary/40 hover:bg-muted/50"
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                      aria-pressed={isActive}
                    >
                      <Icon className={`w-7 h-7 ${isActive ? "" : "text-muted-foreground"}`} />
                      <div className="space-y-0.5">
                        <p className={`text-sm font-semibold leading-tight ${isActive ? "" : "text-foreground"}`}>
                          {opt.label}
                        </p>
                        <p className={`text-[11px] leading-tight ${isActive ? "opacity-80" : "text-muted-foreground"}`}>
                          {opt.description}
                        </p>
                      </div>
                      {isActive && (
                        <Badge className="absolute -top-2 -right-2 h-5 px-1.5 text-[10px] bg-primary text-primary-foreground">
                          <Eye className="w-3 h-3 mr-0.5" /> Aperçu
                        </Badge>
                      )}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Éditeur de galerie pour le produit sélectionné */}
          {workType !== "none" && (
            <EmailGalleryEditor
              workType={workType}
              workTypeLabel={WORK_TYPE_OPTIONS.find((o) => o.value === workType)?.label ?? workType}
              onSaved={() => loadTemplates(workType)}
            />
          )}

          {/* Templates preview */}
          <Card>
            <CardHeader>
              <CardTitle>Aperçu des templates email</CardTitle>
              <CardDescription>
                Rendu final tel qu'il sera reçu par le lead (avec données d'exemple).
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : error ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Impossible de charger les templates</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : templates.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Aucun template trouvé.</p>
              ) : (
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid grid-cols-1 sm:grid-cols-3 h-auto gap-1">
                    {templates.map((t) => (
                      <TabsTrigger key={t.templateName} value={t.templateName} className="text-xs sm:text-sm">
                        {t.displayName}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  {templates.map((t) => (
                    <TabsContent key={t.templateName} value={t.templateName} className="mt-4 space-y-3">
                      <div className="flex flex-wrap gap-2 items-center">
                        <Badge variant="secondary" className="font-mono text-xs">{t.templateName}</Badge>
                        {t.status === "ready" ? (
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Prêt
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <AlertCircle className="w-3 h-3 mr-1" /> Erreur de rendu
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">Objet : </span>
                        <span className="font-medium">{t.subject || <em className="text-muted-foreground">(non défini)</em>}</span>
                      </div>
                      {t.errorMessage && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription className="font-mono text-xs">{t.errorMessage}</AlertDescription>
                        </Alert>
                      )}
                      {t.html && (
                        <div className="border rounded-lg overflow-hidden bg-white">
                          <iframe
                            srcDoc={t.html}
                            title={t.displayName}
                            className="w-full"
                            style={{ minHeight: 720, border: 0 }}
                            sandbox=""
                          />
                        </div>
                      )}
                    </TabsContent>
                  ))}
                </Tabs>
              )}
            </CardContent>
          </Card>

          {/* Page /merci */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Page de remerciement /merci</CardTitle>
              <CardDescription>
                Page affichée immédiatement après soumission d'un formulaire.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Édition visuelle de cette page : <Badge variant="outline">à venir</Badge> — pour le moment la page utilise les paramètres d'URL (<code>name</code>, <code>workType</code>, <code>surplus</code>, <code>type</code>) pour personnaliser dynamiquement le contenu.
              </p>
              <a href="/merci?name=Jean&workType=energie-solaire" target="_blank" rel="noopener noreferrer">
                <Button variant="outline">
                  <ExternalLink className="w-4 h-4 mr-2" /> Prévisualiser /merci
                </Button>
              </a>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default AdminConfirmation;
