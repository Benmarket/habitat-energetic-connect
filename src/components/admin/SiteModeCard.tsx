import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Check, Copy, Loader2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useSiteMode, saveSiteMode, type SiteMode } from "@/hooks/useSiteMode";

const REVERT_PROMPT = `Bonjour, je viens de basculer le site en mode "Prime" (réseau d'installateurs partenaires).
Le switch dans Admin > Paramètres bascule automatiquement le texte des 9 emplacements front listés ci-dessous, mais il ne peut PAS toucher aux contenus stockés en base ni aux ressources statiques.

Merci de faire l'audit et de me proposer les modifications (sans les appliquer) pour ces zones NON couvertes par le switch :

1. Contenus stockés en base (à revoir manuellement dans l'admin correspondant) :
   - Articles / posts (table posts) : rechercher "installateur", "réseau", "partenaire", "FRH", "propriété"
   - Guides (table guides / sections) : mêmes termes
   - Landing pages régionales et modulaires (table landing_pages) : sections texte
   - Popups et bannières CTA (tables popups, cta_banners) : textes visibles
   - Flux chatbot (table chatbot_flows) : messages mentionnant l'installateur
   - Hero slider, sections d'accueil éditables (table site_settings clés hero_slider / homepage_sections)
   - Aides (table aides) : phrases d'accompagnement
   - Modèles d'emails (table email_template_gallery + templates transactionnels edge functions)

2. Fichiers statiques / SEO non couverts par le hook useSiteMode :
   - index.html : <title>, <meta description>, og:title, og:description, twitter:*
   - public/robots.txt et public/manifest.json (description, nom)
   - public/sw.js si textes visibles
   - Edge function generate-sitemap (descriptions statiques éventuelles)
   - Rapports .md à la racine (RAPPORT_*.md, ARCHITECTURE_*.md) — informationnel, pas prod

3. Emails transactionnels (supabase/functions/_shared/transactional-email-templates/*) :
   - Vérifier tout texte mentionnant "notre équipe d'installateurs" vs "notre réseau d'installateurs partenaires".

4. Schémas JSON-LD injectés dynamiquement dans les pages non listées dans le hook (Organization, WebSite, LandingService) — vérifier les champs description.

5. Textes générés par IA déjà stockés en base (articles rédigés, contenus régionaux) : liste et propositions de reformulation, à valider avant écrasement.

Livrable attendu : une liste par zone avec le texte actuel, le texte proposé version "Prime", et l'action à faire (SQL, édition fichier, admin UI).
Ne modifie rien tant que je n'ai pas validé.`;

const FRONT_COVERED = [
  "src/components/Footer.tsx (baseline paragraphe)",
  "src/components/InstallerFinderSection.tsx (sous-titre hero)",
  "src/components/ContactSection.tsx (liste \"Pourquoi nous choisir\")",
  "src/components/AidesSection.tsx (bloc \"Besoin d'aide\")",
  "src/components/FAQSection.tsx (question/réponse installateurs)",
  "src/pages/FAQ.tsx (question/réponse installateurs)",
  "src/components/landing/SolarHowItWorks.tsx (étape 02)",
  "src/pages/services/ServicePompesAChaleur.tsx (CTA bas de page)",
  "src/pages/services/ServiceInstallationSolaire.tsx (meta + JSON-LD Service)",
];

export function SiteModeCard() {
  const { mode, loading } = useSiteMode();
  const { user } = useAuth();
  const { toast } = useToast();
  const [selected, setSelected] = useState<SiteMode>(mode);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!loading) setSelected(mode);
  }, [mode, loading]);

  const dirty = selected !== mode;

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveSiteMode(selected, user?.id);
      toast({
        title: "Mode du site mis à jour",
        description: selected === "frh"
          ? "Version FRH active : formulations \"notre équipe d'installateurs\"."
          : "Version Prime active : formulations \"réseau d'installateurs partenaires\".",
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Erreur inconnue";
      toast({ title: "Échec de l'enregistrement", description: message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(REVERT_PROMPT);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Impossible de copier", variant: "destructive" });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3 flex-wrap">
          <CardTitle>Mode du site : FRH / Prime</CardTitle>
          <Badge variant={mode === "frh" ? "secondary" : "default"}>
            Actif : {mode === "frh" ? "FRH (propriétaire)" : "Prime (réseau de partenaires)"}
          </Badge>
        </div>
        <CardDescription>
          Bascule les formulations sur 9 emplacements front entre le modèle actuel (FRH, installateur unique)
          et le modèle Prime (réseau d'installateurs partenaires). Les contenus stockés en base et les
          fichiers statiques ne sont PAS couverts — voir le prompt de bascule ci-dessous.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <RadioGroup
          value={selected}
          onValueChange={(v) => setSelected(v as SiteMode)}
          className="grid grid-cols-1 md:grid-cols-2 gap-3"
        >
          <label
            htmlFor="mode-frh"
            className={`border rounded-lg p-4 cursor-pointer flex gap-3 items-start ${
              selected === "frh" ? "border-primary ring-1 ring-primary" : ""
            }`}
          >
            <RadioGroupItem id="mode-frh" value="frh" className="mt-1" />
            <div>
              <div className="font-medium">Version FRH</div>
              <p className="text-sm text-muted-foreground">
                Installateur unique (FRH). Formulations au singulier : « notre équipe d'installateurs
                certifiés RGE ». Pas de mention de « réseau » ni de « partenaires ».
              </p>
            </div>
          </label>
          <label
            htmlFor="mode-prime"
            className={`border rounded-lg p-4 cursor-pointer flex gap-3 items-start ${
              selected === "prime" ? "border-primary ring-1 ring-primary" : ""
            }`}
          >
            <RadioGroupItem id="mode-prime" value="prime" className="mt-1" />
            <div>
              <div className="font-medium">Version Prime</div>
              <p className="text-sm text-muted-foreground">
                Réseau d'installateurs partenaires. Formulations d'origine : « nos installateurs
                partenaires », « réseau d'installateurs certifiés RGE ».
              </p>
            </div>
          </label>
        </RadioGroup>

        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={!dirty || saving || loading}>
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Enregistrer le mode
          </Button>
          {dirty && (
            <Button variant="ghost" onClick={() => setSelected(mode)} disabled={saving}>
              Annuler
            </Button>
          )}
        </div>

        <div className="border rounded-lg p-4 bg-muted/40 space-y-3">
          <div className="flex items-start gap-2">
            <div className="text-sm font-semibold">Emplacements front couverts par le switch (9)</div>
          </div>
          <ul className="text-xs text-muted-foreground list-disc pl-5 space-y-0.5">
            {FRONT_COVERED.map((f) => (
              <li key={f}><code>{f}</code></li>
            ))}
          </ul>
        </div>

        <div className="border rounded-lg p-4 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900 space-y-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold">Ce que le switch NE fait PAS</div>
              <p className="text-sm text-muted-foreground">
                Après chaque bascule (surtout retour vers « Prime »), copie le prompt ci-dessous
                et colle-le dans un message Lovable pour lancer l'audit des zones non automatisées
                (contenus en base, index.html, emails transactionnels, JSON-LD dynamiques, IA).
              </p>
            </div>
          </div>

          <div className="flex justify-end">
            <Button size="sm" variant="secondary" onClick={handleCopy}>
              {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
              {copied ? "Copié" : "Copier le prompt de bascule"}
            </Button>
          </div>

          <Textarea
            readOnly
            value={REVERT_PROMPT}
            rows={16}
            className="text-xs font-mono bg-background"
          />
        </div>
      </CardContent>
    </Card>
  );
}
