import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Save, Plus, Trash2, MapPin, TrendingUp, HelpCircle, Quote, 
  Shield, Search, Users, BarChart3, Loader2, Sparkles, ImageIcon
} from "lucide-react";
import type { RegionalContent, RegionalHighlight, RegionalAidItem, RegionalTestimonial, RegionalFAQ } from "@/hooks/useRegionalContent";

interface RegionalContentEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  landingPageId: string;
  regionName: string;
  regionCode: string;
  initialContent: RegionalContent;
  variantSlug?: string | null;
  onSaved: () => void;
}

const RegionalContentEditor = ({
  open, onOpenChange, landingPageId, regionName, regionCode, initialContent, variantSlug, onSaved,
}: RegionalContentEditorProps) => {
  const [content, setContent] = useState<RegionalContent>(initialContent);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState("hero");

  useEffect(() => {
    setContent(initialContent);
  }, [initialContent, open]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("landing_pages")
        .update({ regional_content: content as any })
        .eq("id", landingPageId);
      if (error) throw error;
      toast.success("Contenu régional sauvegardé");
      onSaved();
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const handleAIGenerate = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-regional-content", {
        body: { regionCode, regionName, variantSlug: variantSlug || null },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (data?.content) {
        setContent(prev => ({
          ...prev,
          ...data.content,
          // Preserve existing images (AI doesn't generate those)
          images: prev.images,
          hero_image: prev.hero_image || data.content.hero_image,
        }));
        toast.success("Contenu généré par l'IA ! Vérifiez et ajustez avant de sauvegarder.");
      }
    } catch (err: any) {
      console.error(err);
      if (err?.message?.includes("429") || err?.message?.includes("Limite")) {
        toast.error("Limite de requêtes atteinte, réessayez dans quelques minutes.");
      } else if (err?.message?.includes("402") || err?.message?.includes("Crédits")) {
        toast.error("Crédits IA insuffisants.");
      } else {
        toast.error("Erreur lors de la génération IA");
      }
    } finally {
      setGenerating(false);
    }
  };

  // Helpers for nested updates
  const updateField = <K extends keyof RegionalContent>(key: K, value: RegionalContent[K]) => {
    setContent(prev => ({ ...prev, [key]: value }));
  };

  const updateContext = (field: string, value: any) => {
    setContent(prev => ({
      ...prev,
      context: { title: "", intro_text: "", highlights: [], ...prev.context, [field]: value },
    }));
  };

  const updateProfitability = (field: string, value: any) => {
    setContent(prev => ({
      ...prev,
      profitability: { title: "", intro_text: "", roi_years: 0, annual_production_kwh: 0, savings_25_years: "", table_data: [], ...prev.profitability, [field]: value },
    }));
  };

  const updateSeo = (field: string, value: any) => {
    setContent(prev => ({
      ...prev,
      seo: { meta_title: "", meta_description: "", h1: "", ...prev.seo, [field]: value },
    }));
  };

  const updateDynamicVars = (field: string, value: any) => {
    setContent(prev => ({
      ...prev,
      dynamic_vars: { ...prev.dynamic_vars, [field]: value },
    }));
  };

  const updateImages = (field: string, value: string) => {
    setContent(prev => ({
      ...prev,
      images: { ...prev.images, [field]: value },
    }));
  };

  // Array helpers
  const addHighlight = () => {
    const highlights = [...(content.context?.highlights || []), { icon: "Sun", label: "", value: "", description: "" }];
    updateContext("highlights", highlights);
  };

  const removeHighlight = (index: number) => {
    const highlights = [...(content.context?.highlights || [])];
    highlights.splice(index, 1);
    updateContext("highlights", highlights);
  };

  const updateHighlight = (index: number, field: keyof RegionalHighlight, value: string) => {
    const highlights = [...(content.context?.highlights || [])];
    highlights[index] = { ...highlights[index], [field]: value };
    updateContext("highlights", highlights);
  };

  const addAid = () => {
    const items = [...(content.aids?.items || []), { name: "", amount: "", description: "", is_local: true, year: new Date().getFullYear() }];
    setContent(prev => ({
      ...prev,
      aids: { title: prev.aids?.title || `Aides en ${regionName}`, items, intro_text: prev.aids?.intro_text },
    }));
  };

  const removeAid = (index: number) => {
    const items = [...(content.aids?.items || [])];
    items.splice(index, 1);
    setContent(prev => ({
      ...prev,
      aids: { title: prev.aids?.title || "", items, intro_text: prev.aids?.intro_text },
    }));
  };

  const updateAid = (index: number, field: keyof RegionalAidItem, value: any) => {
    const items = [...(content.aids?.items || [])];
    items[index] = { ...items[index], [field]: value };
    setContent(prev => ({
      ...prev,
      aids: { title: prev.aids?.title || "", items, intro_text: prev.aids?.intro_text },
    }));
  };

  const addTestimonial = () => {
    updateField("testimonials", [...(content.testimonials || []), { text: "", name: "", location: regionName }]);
  };

  const removeTestimonial = (index: number) => {
    const arr = [...(content.testimonials || [])];
    arr.splice(index, 1);
    updateField("testimonials", arr);
  };

  const updateTestimonial = (index: number, field: keyof RegionalTestimonial, value: string) => {
    const arr = [...(content.testimonials || [])];
    arr[index] = { ...arr[index], [field]: value };
    updateField("testimonials", arr);
  };

  const addFaq = () => {
    updateField("faq", [...(content.faq || []), { question: "", answer: "" }]);
  };

  const removeFaq = (index: number) => {
    const arr = [...(content.faq || [])];
    arr.splice(index, 1);
    updateField("faq", arr);
  };

  const updateFaq = (index: number, field: keyof RegionalFAQ, value: string) => {
    const arr = [...(content.faq || [])];
    arr[index] = { ...arr[index], [field]: value };
    updateField("faq", arr);
  };

  const filledCount = [
    content.context?.intro_text,
    content.profitability?.table_data?.length || content.profitability?.roi_years,
    content.aids?.items?.length,
    content.testimonials?.length,
    content.faq?.length,
    content.seo?.h1,
  ].filter(Boolean).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Contenu régional — {regionName}
            {variantSlug && <Badge variant="outline" className="text-xs">{variantSlug}</Badge>}
            <Badge variant="secondary">{filledCount}/6 sections</Badge>
          </DialogTitle>
        </DialogHeader>

        {/* AI Generate Button */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
          <Sparkles className="w-5 h-5 text-primary flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium">Remplissage IA</p>
            <p className="text-xs text-muted-foreground">Génère automatiquement tout le contenu pour cette région. Vous pourrez éditer manuellement ensuite.</p>
          </div>
          <Button
            onClick={handleAIGenerate}
            disabled={generating}
            variant="default"
            size="sm"
            className="flex-shrink-0"
          >
            {generating ? (
              <><Loader2 className="w-4 h-4 mr-1 animate-spin" />Génération...</>
            ) : (
              <><Sparkles className="w-4 h-4 mr-1" />Remplir avec l'IA</>
            )}
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
          <TabsList className="grid grid-cols-4 lg:grid-cols-8 gap-1">
            <TabsTrigger value="hero" className="text-xs">Hero</TabsTrigger>
            <TabsTrigger value="images" className="text-xs">Images</TabsTrigger>
            <TabsTrigger value="context" className="text-xs">Contexte</TabsTrigger>
            <TabsTrigger value="profitability" className="text-xs">Rentabilité</TabsTrigger>
            <TabsTrigger value="aids" className="text-xs">Aides</TabsTrigger>
            <TabsTrigger value="testimonials" className="text-xs">Témoignages</TabsTrigger>
            <TabsTrigger value="faq" className="text-xs">FAQ</TabsTrigger>
            <TabsTrigger value="seo" className="text-xs">SEO & Biz</TabsTrigger>
          </TabsList>

          {/* Hero */}
          <TabsContent value="hero" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Section Hero</CardTitle>
                <CardDescription>Titre et sous-titre. Laissez vide pour le fallback national.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Titre Hero</Label>
                  <Input value={content.hero_title || ""} onChange={e => updateField("hero_title", e.target.value)} placeholder={`Installation Panneaux Solaires en ${regionName}`} />
                </div>
                <div>
                  <Label>Sous-titre</Label>
                  <Textarea value={content.hero_subtitle || ""} onChange={e => updateField("hero_subtitle", e.target.value)} placeholder="Faites jusqu'à 70% d'économie..." rows={2} />
                </div>
                <div>
                  <Label>URL image hero</Label>
                  <Input value={content.hero_image || ""} onChange={e => updateField("hero_image", e.target.value)} placeholder="https://..." />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Images */}
          <TabsContent value="images" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><ImageIcon className="w-4 h-4" />Images par section</CardTitle>
                <CardDescription>Images spécifiques à la région pour chaque section. Laissez vide pour les images par défaut.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Image Hero (bandeau principal)</Label>
                  <Input value={content.hero_image || ""} onChange={e => updateField("hero_image", e.target.value)} placeholder="https://..." />
                  {content.hero_image && <img src={content.hero_image} alt="Hero preview" className="mt-2 rounded-lg h-24 object-cover w-full" />}
                </div>
                <div>
                  <Label>Image Contexte (section ensoleillement)</Label>
                  <Input value={content.images?.context || ""} onChange={e => updateImages("context", e.target.value)} placeholder="https://..." />
                  {content.images?.context && <img src={content.images.context} alt="Context preview" className="mt-2 rounded-lg h-24 object-cover w-full" />}
                </div>
                <div>
                  <Label>Image Rentabilité</Label>
                  <Input value={content.images?.profitability || ""} onChange={e => updateImages("profitability", e.target.value)} placeholder="https://..." />
                  {content.images?.profitability && <img src={content.images.profitability} alt="Profitability preview" className="mt-2 rounded-lg h-24 object-cover w-full" />}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Context */}
          <TabsContent value="context" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><MapPin className="w-4 h-4" />Contexte Local</CardTitle>
                <CardDescription>Données d'ensoleillement, contexte géographique, chiffres clés</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Titre de section</Label>
                  <Input value={content.context?.title || ""} onChange={e => updateContext("title", e.target.value)} placeholder={`Pourquoi le solaire en ${regionName} ?`} />
                </div>
                <div>
                  <Label>Texte d'introduction</Label>
                  <Textarea value={content.context?.intro_text || ""} onChange={e => updateContext("intro_text", e.target.value)} placeholder="Avec plus de 2800 heures d'ensoleillement..." rows={3} />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Points clés (highlights)</Label>
                    <Button variant="outline" size="sm" onClick={addHighlight}><Plus className="w-3 h-3 mr-1" />Ajouter</Button>
                  </div>
                  {(content.context?.highlights || []).map((h, i) => (
                    <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-end p-3 rounded-lg bg-muted/50">
                      <div><Label className="text-xs">Label</Label><Input value={h.label} onChange={e => updateHighlight(i, "label", e.target.value)} placeholder="Ensoleillement" /></div>
                      <div><Label className="text-xs">Valeur</Label><Input value={h.value} onChange={e => updateHighlight(i, "value", e.target.value)} placeholder="2800h/an" /></div>
                      <div><Label className="text-xs">Description</Label><Input value={h.description} onChange={e => updateHighlight(i, "description", e.target.value)} /></div>
                      <Button variant="ghost" size="icon" onClick={() => removeHighlight(i)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Profitability */}
          <TabsContent value="profitability" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><TrendingUp className="w-4 h-4" />Rentabilité</CardTitle>
                <CardDescription>Données de ROI et tableau comparatif</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Titre</Label><Input value={content.profitability?.title || ""} onChange={e => updateProfitability("title", e.target.value)} placeholder={`Rentabilité solaire en ${regionName}`} /></div>
                  <div><Label>Années ROI</Label><Input type="number" value={content.profitability?.roi_years || ""} onChange={e => updateProfitability("roi_years", Number(e.target.value))} /></div>
                  <div><Label>Production annuelle (kWh)</Label><Input type="number" value={content.profitability?.annual_production_kwh || ""} onChange={e => updateProfitability("annual_production_kwh", Number(e.target.value))} /></div>
                  <div><Label>Économies 25 ans</Label><Input value={content.profitability?.savings_25_years || ""} onChange={e => updateProfitability("savings_25_years", e.target.value)} placeholder="45 000 €" /></div>
                </div>
                <div><Label>Texte d'intro</Label><Textarea value={content.profitability?.intro_text || ""} onChange={e => updateProfitability("intro_text", e.target.value)} rows={2} /></div>
                <div><Label>Texte comparatif</Label><Textarea value={content.profitability?.comparison_text || ""} onChange={e => updateProfitability("comparison_text", e.target.value)} rows={2} placeholder="Comparé à la moyenne nationale..." /></div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aids */}
          <TabsContent value="aids" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><Shield className="w-4 h-4" />Aides & Subventions</CardTitle>
                <CardDescription>Aides locales et nationales disponibles dans la région</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div><Label>Titre de section</Label><Input value={content.aids?.title || ""} onChange={e => setContent(prev => ({ ...prev, aids: { ...prev.aids!, title: e.target.value, items: prev.aids?.items || [] } }))} /></div>
                <div><Label>Texte d'intro</Label><Textarea value={content.aids?.intro_text || ""} onChange={e => setContent(prev => ({ ...prev, aids: { ...prev.aids!, intro_text: e.target.value, items: prev.aids?.items || [], title: prev.aids?.title || "" } }))} rows={2} /></div>
                <div className="flex items-center justify-between">
                  <Label>Aides</Label>
                  <Button variant="outline" size="sm" onClick={addAid}><Plus className="w-3 h-3 mr-1" />Ajouter</Button>
                </div>
                {(content.aids?.items || []).map((aid, i) => (
                  <div key={i} className="p-3 rounded-lg bg-muted/50 space-y-2">
                    <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 items-end">
                      <div><Label className="text-xs">Nom</Label><Input value={aid.name} onChange={e => updateAid(i, "name", e.target.value)} placeholder="Prime Autoconsommation" /></div>
                      <div><Label className="text-xs">Montant</Label><Input value={aid.amount} onChange={e => updateAid(i, "amount", e.target.value)} placeholder="1 500 €" className="w-28" /></div>
                      <div><Label className="text-xs">Année</Label><Input type="number" value={aid.year || new Date().getFullYear()} onChange={e => updateAid(i, "year", Number(e.target.value))} className="w-20" /></div>
                      <Button variant="ghost" size="icon" onClick={() => removeAid(i)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                    </div>
                    <div className="grid grid-cols-[1fr_auto] gap-2 items-center">
                      <div><Label className="text-xs">Description</Label><Input value={aid.description} onChange={e => updateAid(i, "description", e.target.value)} /></div>
                      <div className="flex items-center gap-2">
                        <Switch checked={aid.is_local} onCheckedChange={v => updateAid(i, "is_local", v)} />
                        <Label className="text-xs">Locale</Label>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Testimonials */}
          <TabsContent value="testimonials" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><Quote className="w-4 h-4" />Témoignages</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-end"><Button variant="outline" size="sm" onClick={addTestimonial}><Plus className="w-3 h-3 mr-1" />Ajouter</Button></div>
                {(content.testimonials || []).map((t, i) => (
                  <div key={i} className="p-3 rounded-lg bg-muted/50 space-y-2">
                    <div className="grid grid-cols-[1fr_1fr_auto] gap-2 items-end">
                      <div><Label className="text-xs">Nom</Label><Input value={t.name} onChange={e => updateTestimonial(i, "name", e.target.value)} /></div>
                      <div><Label className="text-xs">Localisation</Label><Input value={t.location || ""} onChange={e => updateTestimonial(i, "location", e.target.value)} /></div>
                      <Button variant="ghost" size="icon" onClick={() => removeTestimonial(i)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                    </div>
                    <div><Label className="text-xs">Témoignage</Label><Textarea value={t.text} onChange={e => updateTestimonial(i, "text", e.target.value)} rows={2} /></div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* FAQ */}
          <TabsContent value="faq" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><HelpCircle className="w-4 h-4" />FAQ Régionale</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-end"><Button variant="outline" size="sm" onClick={addFaq}><Plus className="w-3 h-3 mr-1" />Ajouter</Button></div>
                {(content.faq || []).map((f, i) => (
                  <div key={i} className="p-3 rounded-lg bg-muted/50 space-y-2">
                    <div className="flex items-end gap-2">
                      <div className="flex-1"><Label className="text-xs">Question</Label><Input value={f.question} onChange={e => updateFaq(i, "question", e.target.value)} /></div>
                      <Button variant="ghost" size="icon" onClick={() => removeFaq(i)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                    </div>
                    <div><Label className="text-xs">Réponse</Label><Textarea value={f.answer} onChange={e => updateFaq(i, "answer", e.target.value)} rows={2} /></div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* SEO & Business vars */}
          <TabsContent value="seo" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><Search className="w-4 h-4" />SEO</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div><Label>Meta Title <span className="text-xs text-muted-foreground">(&lt;60 car.)</span></Label><Input value={content.seo?.meta_title || ""} onChange={e => updateSeo("meta_title", e.target.value)} placeholder={`Panneaux Solaires ${regionName} : Prix, Aides & Rentabilité 2026`} maxLength={60} /><p className="text-xs text-muted-foreground mt-1">{(content.seo?.meta_title || "").length}/60</p></div>
                <div><Label>Meta Description <span className="text-xs text-muted-foreground">(&lt;160 car.)</span></Label><Textarea value={content.seo?.meta_description || ""} onChange={e => updateSeo("meta_description", e.target.value)} rows={2} maxLength={160} /><p className="text-xs text-muted-foreground mt-1">{(content.seo?.meta_description || "").length}/160</p></div>
                <div><Label>H1</Label><Input value={content.seo?.h1 || ""} onChange={e => updateSeo("h1", e.target.value)} placeholder={`Installation Panneaux Solaires en ${regionName}`} /></div>
                <div><Label>Mots-clés focus (séparés par virgule)</Label><Input value={(content.seo?.focus_keywords || []).join(", ")} onChange={e => updateSeo("focus_keywords", e.target.value.split(",").map(k => k.trim()).filter(Boolean))} /></div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><BarChart3 className="w-4 h-4" />Variables Business</CardTitle>
                <CardDescription>Données dynamiques pour renforcer la conversion</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Nombre de clients</Label><Input type="number" value={content.dynamic_vars?.clients_count || ""} onChange={e => updateDynamicVars("clients_count", Number(e.target.value) || undefined)} placeholder="1250" /></div>
                  <div><Label>Nombre d'installations</Label><Input type="number" value={content.dynamic_vars?.installations_count || ""} onChange={e => updateDynamicVars("installations_count", Number(e.target.value) || undefined)} placeholder="850" /></div>
                  <div><Label>Note moyenne</Label><Input type="number" step="0.1" min="0" max="5" value={content.dynamic_vars?.average_rating || ""} onChange={e => updateDynamicVars("average_rating", Number(e.target.value) || undefined)} placeholder="4.8" /></div>
                  <div><Label>Dernière MAJ</Label><Input type="date" value={content.dynamic_vars?.last_updated || ""} onChange={e => updateDynamicVars("last_updated", e.target.value)} /></div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
            Sauvegarder
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RegionalContentEditor;
