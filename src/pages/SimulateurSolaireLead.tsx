import { useState, useMemo, useEffect } from "react";
import { Helmet } from "react-helmet";
import { z } from "zod";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  Sun, Check, ArrowLeft, ArrowRight, MapPin, Home, Building2, Store, Building,
  Compass, Snowflake, Flame, Thermometer, Waves, Car, Plug, HelpCircle,
  Loader2, Lock, Sparkles, ShieldCheck, Clock, Zap, TrendingUp, Star, Award, Leaf,
} from "lucide-react";
import solarHouseBanner from "@/assets/solar-house-banner.jpg";

// ---------- Types ----------
type HousingType = "maison" | "villa" | "mitoyenne" | "pro" | "appartement";
type SurfaceRange = "<80" | "80-120" | "120-160" | ">160" | "?";
type Ownership = "oui" | "non" | "achat";
type Orientation = "N" | "NE" | "E" | "SE" | "S" | "SO" | "O" | "NO" | "?";

interface Sim {
  postalCode: string;
  city: string;
  housing: HousingType | "";
  surface: SurfaceRange | "";
  ownership: Ownership | "";
  orientation: Orientation | "";
  equipments: string[];
  monthlyBill: number | "";
}

// ---------- Static data ----------
const HOUSING: { id: HousingType; label: string; desc: string; icon: any }[] = [
  { id: "maison", label: "Maison individuelle", desc: "Pavillon avec toit dégagé", icon: Home },
  { id: "villa", label: "Villa", desc: "Avec terrain, idéale pour le solaire", icon: Home },
  { id: "mitoyenne", label: "Maison mitoyenne", desc: "Maison de village ou en bande", icon: Home },
  { id: "pro", label: "Local professionnel", desc: "Commerce, bureau, atelier", icon: Store },
  { id: "appartement", label: "Appartement", desc: "Copropriété ou dernier étage", icon: Building2 },
];

const SURFACES: { id: SurfaceRange; label: string }[] = [
  { id: "<80", label: "Moins de 80 m²" },
  { id: "80-120", label: "80 à 120 m²" },
  { id: "120-160", label: "120 à 160 m²" },
  { id: ">160", label: "Plus de 160 m²" },
  { id: "?", label: "Je ne sais pas" },
];

const OWNERSHIPS: { id: Ownership; label: string; desc: string }[] = [
  { id: "oui", label: "Oui, propriétaire", desc: "Je peux décider de l'installation" },
  { id: "non", label: "Non, locataire", desc: "Accord du propriétaire requis" },
  { id: "achat", label: "Achat en cours", desc: "Je prépare mon futur logement" },
];

const ORIENTATIONS: { id: Orientation; label: string; perf: number }[] = [
  { id: "S", label: "Sud", perf: 100 },
  { id: "SE", label: "Sud-Est", perf: 97 },
  { id: "SO", label: "Sud-Ouest", perf: 97 },
  { id: "E", label: "Est", perf: 85 },
  { id: "O", label: "Ouest", perf: 85 },
  { id: "NE", label: "Nord-Est", perf: 72 },
  { id: "NO", label: "Nord-Ouest", perf: 72 },
  { id: "N", label: "Nord", perf: 60 },
];

const EQUIPMENTS: { id: string; label: string; desc: string; icon: any }[] = [
  { id: "clim", label: "Climatisation", desc: "Consommation forte l'été", icon: Snowflake },
  { id: "ceau", label: "Chauffe-eau électrique", desc: "Poste régulier toute l'année", icon: Flame },
  { id: "pac", label: "Pompe à chaleur", desc: "Chauffage haute performance", icon: Thermometer },
  { id: "piscine", label: "Piscine", desc: "Filtration et chauffage", icon: Waves },
  { id: "ve", label: "Voiture électrique", desc: "Recharge à domicile", icon: Car },
  { id: "elec", label: "Électroménager", desc: "Usage quotidien standard", icon: Plug },
  { id: "?", label: "Je ne sais pas", desc: "On verra à l'étude", icon: HelpCircle },
];

const BILL_PRESETS = [100, 150, 200, 250, 300];

// ---------- Helpers ----------
function detectRegion(postal: string): { id: string; label: string; sun: string } {
  const p = postal.trim();
  if (p.startsWith("20")) return { id: "corse", label: "Corse", sun: "excellent" };
  if (p.startsWith("974")) return { id: "reunion", label: "La Réunion", sun: "excellent" };
  if (p.startsWith("973")) return { id: "guyane", label: "Guyane", sun: "excellent" };
  if (p.startsWith("972")) return { id: "martinique", label: "Martinique", sun: "excellent" };
  if (p.startsWith("971")) return { id: "guadeloupe", label: "Guadeloupe", sun: "excellent" };
  if (p.startsWith("976")) return { id: "mayotte", label: "Mayotte", sun: "excellent" };
  if (/^\d{5}$/.test(p)) {
    const n = parseInt(p.slice(0, 2), 10);
    if ([13, 30, 34, 11, 66, 6, 83, 84, 4, 5, 7, 26].includes(n))
      return { id: "fr-sud", label: "France continentale (sud)", sun: "très favorable" };
    return { id: "fr", label: "France continentale", sun: "favorable" };
  }
  return { id: "unknown", label: "Zone non reconnue", sun: "favorable" };
}

function suggestedKwc(monthly: number): string {
  if (monthly < 100) return "environ 3 kWc";
  if (monthly < 180) return "entre 3 et 6 kWc";
  if (monthly < 280) return "entre 6 et 9 kWc";
  return "à partir de 9 kWc";
}

function orientationFeedback(o: Orientation): string {
  if (o === "S" || o === "SE" || o === "SO")
    return "Excellente orientation solaire. Cette exposition est souvent favorable pour produire davantage d'électricité dans la journée.";
  if (o === "E" || o === "O")
    return "Orientation intéressante. Une exposition Est ou Ouest peut rester pertinente, notamment pour répartir la production solaire sur la journée.";
  if (o === "?") return "Pas de souci. L'orientation peut être vérifiée facilement lors de l'étude solaire.";
  return "Une étude permet de confirmer le potentiel réel. Même si l'orientation semble moins favorable, certaines configurations restent exploitables.";
}

// ---------- Compass ----------
const Compass8 = ({ value, onChange }: { value: Orientation | ""; onChange: (o: Orientation) => void }) => {
  const size = 300;
  const cx = size / 2;
  const cy = size / 2;
  const rOuter = 140;
  const rInner = 58;
  const sectors = ["N", "NE", "E", "SE", "S", "SO", "O", "NO"] as Orientation[];

  const polar = (deg: number, r: number) => {
    const rad = ((deg - 90) * Math.PI) / 180;
    return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="drop-shadow-2xl">
        <defs>
          <radialGradient id="compassCenter" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="hsl(48 95% 70%)" />
            <stop offset="100%" stopColor="hsl(38 92% 55%)" />
          </radialGradient>
          <linearGradient id="sectorSelected" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(145 65% 55%)" />
            <stop offset="100%" stopColor="hsl(145 65% 40%)" />
          </linearGradient>
        </defs>
        {sectors.map((s, i) => {
          const startAngle = i * 45 - 22.5;
          const endAngle = startAngle + 45;
          const [x1, y1] = polar(startAngle, rOuter);
          const [x2, y2] = polar(endAngle, rOuter);
          const [x3, y3] = polar(endAngle, rInner);
          const [x4, y4] = polar(startAngle, rInner);
          const d = `M ${x1} ${y1} A ${rOuter} ${rOuter} 0 0 1 ${x2} ${y2} L ${x3} ${y3} A ${rInner} ${rInner} 0 0 0 ${x4} ${y4} Z`;
          const selected = value === s;
          const perf = ORIENTATIONS.find((o) => o.id === s)?.perf ?? 0;
          const [lx, ly] = polar(startAngle + 22.5, (rOuter + rInner) / 2);
          return (
            <g key={s} onClick={() => onChange(s)} className="cursor-pointer">
              <path
                d={d}
                fill={selected ? "url(#sectorSelected)" : "hsl(145 35% 95%)"}
                stroke={selected ? "hsl(145 65% 30%)" : "hsl(145 35% 80%)"}
                strokeWidth={2}
                className="transition-all hover:fill-[hsl(145_45%_88%)]"
              />
              <text x={lx} y={ly - 4} textAnchor="middle" className={`text-[14px] font-bold ${selected ? "fill-white" : "fill-slate-800"}`}>
                {s}
              </text>
              <text x={lx} y={ly + 12} textAnchor="middle" className={`text-[10px] font-semibold ${selected ? "fill-white/90" : "fill-slate-500"}`}>
                {perf}%
              </text>
            </g>
          );
        })}
        <circle cx={cx} cy={cy} r={rInner - 4} fill="url(#compassCenter)" stroke="hsl(38 92% 50%)" strokeWidth={2} />
        <g transform={`translate(${cx - 18}, ${cy - 18})`}>
          <Sun className="text-white drop-shadow" width={36} height={36} />
        </g>
      </svg>
      <button
        type="button"
        onClick={() => onChange("?")}
        className={`text-sm px-5 py-2.5 rounded-full border-2 transition-all ${
          value === "?"
            ? "bg-primary border-primary text-primary-foreground font-semibold shadow-md"
            : "bg-white border-slate-200 text-slate-600 hover:border-primary/40"
        }`}
      >
        Je ne sais pas
      </button>
    </div>
  );
};

// ---------- Lead schema ----------
const leadSchema = z.object({
  fullName: z.string().trim().min(2, "Nom complet requis").max(120),
  email: z.string().trim().email("Email invalide").max(255),
  phone: z.string().trim().min(8, "Téléphone requis").max(30),
  consent: z.literal(true, { errorMap: () => ({ message: "Consentement requis" }) }),
});

// ---------- Main page ----------
const STEP_LABELS = ["Localisation", "Logement", "Propriété", "Toiture", "Équipements", "Facture", "Résultat"];

export default function SimulateurSolaireLead() {
  const [step, setStep] = useState<number>(0);
  const [sim, setSim] = useState<Sim>({
    postalCode: "", city: "", housing: "", surface: "", ownership: "",
    orientation: "", equipments: [], monthlyBill: "",
  });
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [computing, setComputing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const region = useMemo(() => detectRegion(sim.postalCode || ""), [sim.postalCode]);

  // Auto-open lead modal when arriving on results step (if not unlocked)
  useEffect(() => {
    if (step === 7 && !unlocked) {
      const t = setTimeout(() => setShowLeadModal(true), 450);
      return () => clearTimeout(t);
    }
  }, [step, unlocked]);

  // Scroll behaviour on step change
  useEffect(() => {
    if (step > 0 && step < 7) {
      const el = document.getElementById("sim-wizard");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    if (step === 7) window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  const canContinue = (): boolean => {
    switch (step) {
      case 1: return /^\d{5}$/.test(sim.postalCode);
      case 2: return !!sim.housing && !!sim.surface;
      case 3: return !!sim.ownership;
      case 4: return !!sim.orientation;
      case 5: return sim.equipments.length > 0;
      case 6: return typeof sim.monthlyBill === "number" && sim.monthlyBill > 0;
      default: return true;
    }
  };

  const goNext = () => {
    // After last question, play full-screen computing animation then jump to results
    if (step === 6) {
      setComputing(true);
      setTimeout(() => {
        setComputing(false);
        setStep(7);
      }, 2800);
      return;
    }
    setStep((s) => Math.min(s + 1, 7));
  };
  const goBack = () => setStep((s) => Math.max(s - 1, 1));

  const [lead, setLead] = useState({ fullName: "", email: "", phone: "", consent: false });
  const [leadErrors, setLeadErrors] = useState<Record<string, string>>({});

  const annualBill = typeof sim.monthlyBill === "number" ? sim.monthlyBill * 12 : 0;
  const savingsMin = Math.round(annualBill * 0.25);
  const savingsMax = Math.round(annualBill * 0.55);

  const submitLead = async () => {
    const parsed = leadSchema.safeParse(lead);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.issues.forEach((i) => { errs[i.path[0] as string] = i.message; });
      setLeadErrors(errs);
      return;
    }
    setLeadErrors({});
    setSubmitting(true);

    const [firstName, ...rest] = parsed.data.fullName.split(" ");
    const lastName = rest.join(" ") || firstName;

    const payload = {
      source: "simulateur-solaire",
      region: region.label, regionId: region.id,
      postalCode: sim.postalCode, city: sim.city,
      housingType: sim.housing, houseSurfaceRange: sim.surface,
      ownership: sim.ownership, roofOrientation: sim.orientation,
      equipments: sim.equipments, monthlyBill: sim.monthlyBill,
      annualBill, estimatedSavingsMin: savingsMin, estimatedSavingsMax: savingsMax,
      suggestedInstallationPower: typeof sim.monthlyBill === "number" ? suggestedKwc(sim.monthlyBill) : null,
      consentAccepted: true, createdAt: new Date().toISOString(),
    };

    const { error } = await supabase.from("leads").insert({
      first_name: firstName, last_name: lastName,
      email: parsed.data.email, phone: parsed.data.phone,
      address: sim.city || "Non renseignée",
      postal_code: sim.postalCode, city: sim.city || "Non renseignée",
      property_type: sim.housing || null,
      is_owner: sim.ownership === "oui",
      needs: ["solaire", ...sim.equipments],
      notes: JSON.stringify(payload),
    });

    setSubmitting(false);

    if (error) {
      toast.error("Une erreur est survenue. Merci de réessayer dans quelques minutes.");
      return;
    }
    toast.success("Vos résultats sont débloqués !");
    setUnlocked(true);
    setShowLeadModal(false);
  };

  return (
    <>
      <Helmet>
        <title>Simulateur solaire gratuit — économies & aides | Prime Énergies</title>
        <meta name="description" content="Estimez en 2 minutes vos économies potentielles grâce au solaire, le potentiel de votre logement et les aides disponibles dans votre région." />
      </Helmet>

      <Header />

      <main className="relative min-h-screen pb-20 bg-gradient-to-b from-[hsl(145_35%_97%)] via-white to-[hsl(145_35%_96%)]">
        {step === 0 && <EntryHero onStart={() => setStep(1)} />}

        {step > 0 && step < 7 && (
          <div id="sim-wizard" className="container mx-auto px-4 max-w-3xl pt-8 md:pt-12">
            <ProgressBar step={step} />

            <div className="relative mt-5">
              <div className="absolute -inset-1 bg-gradient-to-br from-primary/20 via-amber-200/20 to-primary/10 rounded-[2rem] blur-2xl opacity-60" aria-hidden />
              <div className="relative bg-white rounded-3xl shadow-[0_20px_60px_-15px_hsl(145_65%_25%/0.18)] border border-slate-100 p-6 md:p-10">
                {step === 1 && <Step1Location sim={sim} setSim={setSim} region={region} />}
                {step === 2 && <Step2Housing sim={sim} setSim={setSim} />}
                {step === 3 && <Step3Ownership sim={sim} setSim={setSim} />}
                {step === 4 && <Step4Orientation sim={sim} setSim={setSim} />}
                {step === 5 && <Step5Equipments sim={sim} setSim={setSim} />}
                {step === 6 && <Step6Bill sim={sim} setSim={setSim} />}

                <div className="flex items-center justify-between mt-10 pt-6 border-t border-slate-100">
                  <Button variant="ghost" onClick={goBack} disabled={step === 1} className="text-slate-500 hover:text-slate-900">
                    <ArrowLeft className="w-4 h-4 mr-1.5" /> Retour
                  </Button>
                  <Button
                    onClick={goNext}
                    disabled={!canContinue()}
                    size="lg"
                    className="bg-primary hover:bg-primary-hover text-primary-foreground font-semibold shadow-[0_10px_25px_-8px_hsl(145_65%_45%/0.5)] hover:scale-105 transition-all rounded-full px-7"
                  >
                    {step === 6 ? "Calculer mes économies" : "Continuer"} <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-primary" /> 100% gratuit et sans engagement</span>
              <span className="inline-flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 text-primary" /> Vos données sont protégées</span>
              <span className="inline-flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-primary" /> Moins de 2 minutes</span>
            </div>
          </div>
        )}

        {step === 7 && (
          <div className="container mx-auto px-4 max-w-3xl pt-8 md:pt-12">
            <div
              className={`transition-all duration-500 ${!unlocked ? "blur-md pointer-events-none select-none" : "blur-0"}`}
              aria-hidden={!unlocked}
            >
              <ResultsPanel sim={sim} region={region} annualBill={annualBill} savingsMin={savingsMin} savingsMax={savingsMax} />
            </div>
          </div>
        )}

        {computing && <ComputingOverlay />}
      </main>

      {/* Lead modal */}
      <Dialog open={showLeadModal} onOpenChange={(o) => !submitting && setShowLeadModal(o)}>
        <DialogContent className="max-w-md p-0 overflow-hidden">
          <div className="bg-gradient-to-br from-primary to-[hsl(145_65%_35%)] px-6 pt-6 pb-8 text-primary-foreground">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 backdrop-blur text-[11px] font-semibold mb-3">
              <Sparkles className="w-3 h-3" /> Estimation prête
            </div>
            <DialogHeader className="text-left space-y-2">
              <DialogTitle className="text-2xl font-bold text-primary-foreground">
                Vos résultats sont prêts
              </DialogTitle>
              <DialogDescription className="text-primary-foreground/85">
                Renseignez vos coordonnées pour débloquer votre estimation personnalisée.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <Label htmlFor="lead-name">Nom complet *</Label>
              <Input id="lead-name" value={lead.fullName} onChange={(e) => setLead({ ...lead, fullName: e.target.value })} placeholder="Prénom et nom" />
              {leadErrors.fullName && <p className="text-xs text-destructive mt-1">{leadErrors.fullName}</p>}
            </div>
            <div>
              <Label htmlFor="lead-phone">Téléphone *</Label>
              <Input id="lead-phone" type="tel" value={lead.phone} onChange={(e) => setLead({ ...lead, phone: e.target.value })} placeholder="06 12 34 56 78" />
              {leadErrors.phone && <p className="text-xs text-destructive mt-1">{leadErrors.phone}</p>}
            </div>
            <div>
              <Label htmlFor="lead-email">Email *</Label>
              <Input id="lead-email" type="email" value={lead.email} onChange={(e) => setLead({ ...lead, email: e.target.value })} placeholder="vous@email.com" />
              {leadErrors.email && <p className="text-xs text-destructive mt-1">{leadErrors.email}</p>}
            </div>
            <div className="flex items-start gap-2">
              <Checkbox id="lead-consent" checked={lead.consent} onCheckedChange={(c) => setLead({ ...lead, consent: c === true })} className="mt-0.5" />
              <label htmlFor="lead-consent" className="text-xs text-slate-700 leading-relaxed cursor-pointer">
                J'accepte d'être recontacté dans le cadre de ma demande de simulation solaire.
              </label>
            </div>
            {leadErrors.consent && <p className="text-xs text-destructive">{leadErrors.consent}</p>}

            <Button
              onClick={submitLead}
              disabled={submitting}
              size="lg"
              className="w-full bg-primary hover:bg-primary-hover text-primary-foreground font-semibold rounded-full shadow-[0_10px_25px_-8px_hsl(145_65%_45%/0.5)]"
            >
              {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Envoi…</> : <>Débloquer mes résultats <ArrowRight className="w-4 h-4 ml-2" /></>}
            </Button>
            <p className="text-[11px] text-center text-slate-500 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3 h-3" /> Gratuit et sans engagement. Données utilisées uniquement pour votre demande.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </>
  );
}

// ---------- Sub components ----------

const EntryHero = ({ onStart }: { onStart: () => void }) => (
  <section className="relative overflow-hidden">
    {/* Background image + strong dark overlays for guaranteed contrast */}
    <div className="absolute inset-0" aria-hidden>
      <img src={solarHouseBanner} alt="" className="absolute inset-0 w-full h-full object-cover" loading="eager" />
      {/* Solid dark base */}
      <div className="absolute inset-0 bg-[hsl(145_55%_12%)]/80" />
      {/* Brand gradient on top */}
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(145_70%_15%)]/90 via-[hsl(145_60%_22%)]/75 to-[hsl(38_85%_30%)]/65" />
      {/* Vignette bottom for CTA visibility */}
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-[hsl(145_65%_10%)]/85 to-transparent" />
      {/* Warm sun glow top-right */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(48_95%_55%/0.28),transparent_55%)]" />
    </div>

    {/* Floating ambient orb */}
    <div className="absolute top-20 right-[10%] w-40 h-40 rounded-full bg-amber-400/30 blur-3xl animate-pulse" aria-hidden />
    <div className="absolute bottom-32 left-[8%] w-32 h-32 rounded-full bg-primary/30 blur-3xl" aria-hidden />

    <div className="relative container mx-auto px-4 py-20 md:py-28 text-center max-w-4xl">
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-white text-xs font-semibold mb-6 shadow-lg">
        <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Simulateur 100% gratuit · sans engagement
      </div>

      <h1
        className="text-4xl md:text-6xl font-bold leading-[1.05] tracking-tight text-white mb-6"
        style={{ textShadow: "0 4px 30px hsl(145 65% 10% / 0.6), 0 2px 10px hsl(145 65% 10% / 0.4)" }}
      >
        Combien votre maison peut-elle
        <span className="block mt-2 bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-300 bg-clip-text text-transparent">
          économiser grâce au solaire&nbsp;?
        </span>
      </h1>

      <p
        className="text-base md:text-xl text-white max-w-2xl mx-auto mb-10 leading-relaxed"
        style={{ textShadow: "0 2px 15px hsl(145 65% 10% / 0.6)" }}
      >
        Estimez en moins de 2 minutes le potentiel solaire de votre logement, vos économies possibles et les aides disponibles dans votre région.
      </p>

      <Button
        onClick={onStart}
        size="lg"
        className="bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-900 font-bold text-base md:text-lg px-10 py-7 rounded-full shadow-[0_20px_50px_-10px_hsl(45_95%_50%/0.8)] hover:scale-105 transition-all group"
      >
        <Sun className="w-5 h-5 mr-2 group-hover:rotate-45 transition-transform" />
        Démarrer ma simulation
        <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
      </Button>

      <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-white font-medium">
        <span className="inline-flex items-center gap-1.5"><Clock className="w-4 h-4 text-amber-300" /> 2 minutes chrono</span>
        <span className="inline-flex items-center gap-1.5"><Check className="w-4 h-4 text-amber-300" /> Sans engagement</span>
        <span className="inline-flex items-center gap-1.5"><MapPin className="w-4 h-4 text-amber-300" /> Adapté à votre région</span>
      </div>

      {/* Stats / social proof */}
      <div className="mt-14 grid grid-cols-3 gap-3 md:gap-6 max-w-2xl mx-auto">
        {[
          { icon: TrendingUp, value: "+12 000", label: "Simulations réalisées" },
          { icon: Star, value: "4.9/5", label: "Satisfaction clients" },
          { icon: Award, value: "RGE", label: "Partenaires certifiés" },
        ].map((s, i) => (
          <div key={i} className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-3 py-4 md:px-5 md:py-5 shadow-lg">
            <s.icon className="w-5 h-5 md:w-6 md:h-6 text-amber-300 mx-auto mb-2" />
            <div className="text-xl md:text-2xl font-bold text-white">{s.value}</div>
            <div className="text-[10px] md:text-xs text-white/80 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>
    </div>

    {/* wave separator */}
    <svg className="relative block w-full text-[hsl(145_35%_97%)]" viewBox="0 0 1440 80" preserveAspectRatio="none" aria-hidden>
      <path fill="currentColor" d="M0,32 C240,80 480,80 720,48 C960,16 1200,16 1440,48 L1440,80 L0,80 Z" />
    </svg>
  </section>
);

const ProgressBar = ({ step }: { step: number }) => (
  <div className="bg-white rounded-2xl py-4 px-5 md:px-6 shadow-[0_8px_24px_-8px_hsl(145_65%_25%/0.15)] border border-slate-100">
    <div className="flex items-center justify-between mb-3 text-xs font-semibold">
      <span className="text-slate-500">Étape <span className="text-slate-900">{step}</span> / 7</span>
      <span className="text-primary inline-flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
        {STEP_LABELS[step - 1]}
      </span>
    </div>
    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-primary via-[hsl(145_65%_50%)] to-amber-400 rounded-full transition-all duration-700 shadow-[0_0_12px_hsl(145_65%_45%/0.5)]"
        style={{ width: `${(step / 7) * 100}%` }}
      />
    </div>
  </div>
);

const StepTitle = ({ icon: Icon, title, subtitle }: { icon: any; title: string; subtitle?: string }) => (
  <div className="mb-8">
    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-[hsl(145_65%_35%)] text-white mb-4 shadow-[0_10px_25px_-8px_hsl(145_65%_45%/0.5)]">
      <Icon className="w-7 h-7" />
    </div>
    <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">{title}</h2>
    {subtitle && <p className="text-sm md:text-base text-slate-600 mt-2 leading-relaxed">{subtitle}</p>}
  </div>
);

const InfoBanner = ({ children }: { children: React.ReactNode }) => (
  <div className="mt-6 p-4 rounded-2xl bg-gradient-to-br from-[hsl(145_35%_95%)] to-[hsl(145_35%_92%)] border border-primary/20 text-sm text-slate-700 flex gap-3">
    <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
      <Leaf className="w-4 h-4 text-primary" />
    </div>
    <div className="flex-1">{children}</div>
  </div>
);

const Step1Location = ({ sim, setSim, region }: { sim: Sim; setSim: any; region: any }) => (
  <div>
    <StepTitle icon={MapPin} title="Où se situe votre logement ?" subtitle="Nous adaptons votre simulation à votre zone géographique et son ensoleillement." />
    <div className="grid md:grid-cols-2 gap-4">
      <div>
        <Label className="text-slate-700 font-medium">Code postal *</Label>
        <Input
          value={sim.postalCode}
          onChange={(e) => setSim({ ...sim, postalCode: e.target.value.replace(/\D/g, "").slice(0, 5) })}
          placeholder="75001"
          inputMode="numeric"
          className="text-lg h-12 mt-1.5 border-slate-200 focus-visible:ring-primary"
        />
      </div>
      <div>
        <Label className="text-slate-700 font-medium">Ville <span className="text-slate-400 font-normal">(facultatif)</span></Label>
        <Input value={sim.city} onChange={(e) => setSim({ ...sim, city: e.target.value })} placeholder="Paris" className="h-12 mt-1.5 border-slate-200 focus-visible:ring-primary" />
      </div>
    </div>

    {/^\d{5}$/.test(sim.postalCode) && (
      <InfoBanner>
        <p className="font-semibold text-slate-900 mb-1.5">Votre zone est analysée — {region.label}</p>
        <ul className="space-y-1 text-slate-600">
          <li>• Ensoleillement régional : <strong className="text-primary">{region.sun}</strong></li>
          <li>• Aides possibles selon votre éligibilité</li>
          <li>• Simulation adaptée à votre région</li>
        </ul>
      </InfoBanner>
    )}
  </div>
);

const ChoiceCard = ({ selected, onClick, title, description, icon: Icon }: {
  selected: boolean; onClick: () => void; title: string; description?: string; icon?: any;
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={selected}
    className={`group relative w-full text-left p-5 rounded-2xl border-2 transition-all duration-300 overflow-hidden ${
      selected
        ? "border-primary bg-gradient-to-br from-[hsl(145_45%_94%)] via-white to-[hsl(48_95%_94%)] shadow-[0_18px_40px_-15px_hsl(145_65%_45%/0.45)] -translate-y-0.5"
        : "border-slate-200 bg-white hover:border-primary/50 hover:shadow-[0_12px_30px_-15px_hsl(145_65%_45%/0.3)] hover:-translate-y-0.5"
    }`}
  >
    {/* Decorative gradient orb on selected */}
    {selected && (
      <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full bg-gradient-to-br from-primary/20 to-amber-300/20 blur-2xl pointer-events-none" aria-hidden />
    )}

    {/* Top row: icon + check */}
    <div className="relative flex items-start justify-between mb-4">
      {Icon && (
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
            selected
              ? "bg-gradient-to-br from-primary to-[hsl(145_65%_35%)] text-primary-foreground shadow-[0_8px_20px_-6px_hsl(145_65%_45%/0.6)] scale-110"
              : "bg-gradient-to-br from-slate-100 to-slate-50 text-slate-400 group-hover:from-primary/10 group-hover:to-amber-100/40 group-hover:text-primary"
          }`}
        >
          <Icon className="w-6 h-6" strokeWidth={2} />
        </div>
      )}
      <div
        className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${
          selected
            ? "bg-primary text-primary-foreground scale-100 shadow-md"
            : "bg-slate-100 text-transparent scale-90 group-hover:bg-primary/10"
        }`}
      >
        <Check className="w-3.5 h-3.5" strokeWidth={3} />
      </div>
    </div>

    {/* Title + description */}
    <div className="relative">
      <h4 className={`font-bold text-base leading-tight transition-colors ${selected ? "text-slate-900" : "text-slate-800"}`}>
        {title}
      </h4>
      {description && (
        <p className={`text-xs mt-1 leading-relaxed transition-colors ${selected ? "text-slate-600" : "text-slate-500"}`}>
          {description}
        </p>
      )}
    </div>
  </button>
);

const PillButton = ({ selected, onClick, children }: any) => (
  <button
    type="button"
    onClick={onClick}
    className={`px-3 py-3 rounded-xl border-2 text-sm font-semibold transition-all ${
      selected
        ? "border-primary bg-primary text-primary-foreground shadow-[0_6px_16px_-6px_hsl(145_65%_45%/0.5)]"
        : "border-slate-200 bg-white text-slate-600 hover:border-primary/40 hover:text-slate-900"
    }`}
  >
    {children}
  </button>
);

const Step2Housing = ({ sim, setSim }: { sim: Sim; setSim: any }) => (
  <div>
    <StepTitle icon={Home} title="Quel logement souhaitez-vous équiper ?" />
    <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
      {HOUSING.map((h) => (
        <ChoiceCard
          key={h.id}
          icon={h.icon}
          title={h.label}
          description={h.desc}
          selected={sim.housing === h.id}
          onClick={() => setSim({ ...sim, housing: h.id })}
        />
      ))}
    </div>

    <div className="mt-8">
      <h3 className="font-semibold text-slate-900 mb-3">Quelle est la superficie approximative du logement ?</h3>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {SURFACES.map((s) => (
          <PillButton key={s.id} selected={sim.surface === s.id} onClick={() => setSim({ ...sim, surface: s.id })}>
            {s.label}
          </PillButton>
        ))}
      </div>
    </div>

    {sim.housing && (
      <InfoBanner>
        {sim.housing === "appartement"
          ? "Votre projet peut nécessiter une étude spécifique. Vous pouvez continuer la simulation pour obtenir une première estimation."
          : "Très bon profil pour une simulation solaire. Les maisons permettent généralement d'exploiter directement la toiture pour produire une partie de l'électricité consommée."}
        {sim.surface && (
          <p className="mt-2 text-xs text-slate-500">
            Cette information nous aide à estimer indirectement le potentiel de toiture disponible, sans vous demander de mesurer votre toit.
          </p>
        )}
      </InfoBanner>
    )}
  </div>
);

const Step3Ownership = ({ sim, setSim }: { sim: Sim; setSim: any }) => (
  <div>
    <StepTitle icon={Building} title="Vous êtes propriétaire du logement ?" />
    <div className="grid sm:grid-cols-3 gap-3">
      {OWNERSHIPS.map((o) => (
        <ChoiceCard
          key={o.id}
          icon={o.id === "oui" ? Check : o.id === "non" ? Lock : Sparkles}
          title={o.label}
          description={o.desc}
          selected={sim.ownership === o.id}
          onClick={() => setSim({ ...sim, ownership: o.id })}
        />
      ))}
    </div>
    {sim.ownership && (
      <InfoBanner>
        {sim.ownership === "oui" && "Parfait. Les propriétaires peuvent généralement avancer plus rapidement sur une étude solaire et vérifier leur éligibilité."}
        {sim.ownership === "non" && "Vous pouvez continuer la simulation. Une installation nécessitera probablement l'accord du propriétaire."}
        {sim.ownership === "achat" && "Très bien. Cette simulation peut vous aider à anticiper le potentiel solaire du logement."}
      </InfoBanner>
    )}
  </div>
);

const Step4Orientation = ({ sim, setSim }: { sim: Sim; setSim: any }) => (
  <div>
    <StepTitle
      icon={Compass}
      title="Quelle est l'orientation principale de votre toiture ?"
      subtitle="Le Sud capte généralement le maximum de soleil, mais d'autres orientations restent intéressantes."
    />
    <div className="grid md:grid-cols-[1fr_1fr] gap-8 items-center">
      <Compass8 value={sim.orientation} onChange={(o) => setSim({ ...sim, orientation: o })} />
      <div className="space-y-3">
        {sim.orientation ? (
          <InfoBanner>{orientationFeedback(sim.orientation as Orientation)}</InfoBanner>
        ) : (
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-600">
            <Compass className="w-6 h-6 text-slate-400 mb-2" />
            Sélectionnez une orientation sur la boussole pour découvrir son potentiel solaire.
          </div>
        )}
      </div>
    </div>
  </div>
);

const Step5Equipments = ({ sim, setSim }: { sim: Sim; setSim: any }) => {
  const toggle = (id: string) => {
    const has = sim.equipments.includes(id);
    setSim({ ...sim, equipments: has ? sim.equipments.filter((e) => e !== id) : [...sim.equipments, id] });
  };
  return (
    <div>
      <StepTitle icon={Zap} title="Quels équipements consomment le plus chez vous ?" subtitle="Sélection multiple possible." />
      <div className="grid md:grid-cols-2 gap-3">
        {EQUIPMENTS.map((e) => (
          <ChoiceCard key={e.id} icon={e.icon} selected={sim.equipments.includes(e.id)} onClick={() => toggle(e.id)}>
            {e.label}
          </ChoiceCard>
        ))}
      </div>
      {sim.equipments.length > 0 && (
        <InfoBanner>
          Ces équipements peuvent augmenter l'intérêt du solaire. Plus une partie de votre consommation est régulière, plus l'autoconsommation peut devenir intéressante.
          {sim.equipments.includes("clim") && <p className="mt-2 text-xs text-slate-500">La climatisation peut représenter un poste important de consommation, notamment dans les régions ensoleillées.</p>}
          {sim.equipments.includes("ceau") && <p className="mt-2 text-xs text-slate-500">Le chauffe-eau électrique est souvent un poste intéressant à prendre en compte dans une étude solaire.</p>}
          {(sim.equipments.includes("piscine") || sim.equipments.includes("ve")) && <p className="mt-2 text-xs text-slate-500">Ce type d'équipement peut renforcer l'intérêt d'une production solaire adaptée.</p>}
        </InfoBanner>
      )}
    </div>
  );
};

const Step6Bill = ({ sim, setSim }: { sim: Sim; setSim: any }) => (
  <div>
    <StepTitle icon={Zap} title="Quel est le montant moyen de votre facture d'électricité par mois ?" />
    <div className="grid grid-cols-5 gap-2 mb-5">
      {BILL_PRESETS.map((v, i) => (
        <PillButton key={v} selected={sim.monthlyBill === v} onClick={() => setSim({ ...sim, monthlyBill: v })}>
          {v} €{i === BILL_PRESETS.length - 1 ? "+" : ""}
        </PillButton>
      ))}
    </div>
    <Label className="text-slate-700 font-medium">Ou saisissez un montant précis (€/mois)</Label>
    <Input
      type="number"
      min={0}
      value={sim.monthlyBill === "" ? "" : sim.monthlyBill}
      onChange={(e) => setSim({ ...sim, monthlyBill: e.target.value === "" ? "" : Math.max(0, Number(e.target.value)) })}
      placeholder="180"
      className="text-lg h-12 mt-1.5 border-slate-200 focus-visible:ring-primary"
    />
    {typeof sim.monthlyBill === "number" && sim.monthlyBill > 0 && (
      <InfoBanner>
        <p className="font-semibold text-slate-900 text-base">
          {sim.monthlyBill} € / mois = <span className="text-primary">{(sim.monthlyBill * 12).toLocaleString("fr-FR")} €</span> / an
        </p>
        <p className="mt-1 text-slate-600">Une partie de cette dépense pourrait être réduite grâce à une production solaire adaptée à votre logement.</p>
      </InfoBanner>
    )}
  </div>
);

// ---------- Full-screen computing overlay ----------
const COMPUTE_LINES = [
  "Analyse de votre zone géographique…",
  "Calcul du potentiel solaire de votre toiture…",
  "Estimation de vos économies annuelles…",
  "Recherche des aides disponibles dans votre région…",
  "Préparation de votre rapport personnalisé…",
];

const ComputingOverlay = () => {
  const [activeLine, setActiveLine] = useState(0);
  const [progress, setProgress] = useState(6);

  useEffect(() => {
    const lineTimer = setInterval(() => {
      setActiveLine((i) => (i + 1) % COMPUTE_LINES.length);
    }, 520);
    const startedAt = Date.now();
    const progTimer = setInterval(() => {
      const elapsed = Date.now() - startedAt;
      setProgress(Math.min(98, 6 + (elapsed / 2800) * 92));
    }, 60);
    return () => { clearInterval(lineTimer); clearInterval(progTimer); };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gradient-to-br from-[hsl(145_65%_18%)] via-[hsl(145_55%_22%)] to-[hsl(145_45%_15%)] animate-in fade-in duration-300">
      {/* Ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-amber-400/20 blur-[120px] animate-pulse" aria-hidden />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-primary/30 blur-[100px]" aria-hidden />

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
        {Array.from({ length: 14 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-amber-300/70"
            style={{
              left: `${(i * 37) % 100}%`,
              top: `${(i * 53) % 100}%`,
              animation: `float ${3 + (i % 4)}s ease-in-out infinite`,
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
      </div>

      <div className="relative text-center max-w-md px-6">
        {/* Animated solar disc */}
        <div className="relative mx-auto w-40 h-40 mb-10">
          {/* Outer pulsating ring */}
          <div className="absolute inset-0 rounded-full border-2 border-amber-300/30 animate-ping" />
          <div className="absolute inset-2 rounded-full border border-amber-200/40 animate-[ping_2.5s_ease-in-out_infinite]" />
          {/* Rotating rays */}
          <svg className="absolute inset-0 w-full h-full animate-[spin_8s_linear_infinite]" viewBox="0 0 160 160" aria-hidden>
            {Array.from({ length: 12 }).map((_, i) => {
              const a = (i * 30 * Math.PI) / 180;
              const x1 = 80 + Math.cos(a) * 58;
              const y1 = 80 + Math.sin(a) * 58;
              const x2 = 80 + Math.cos(a) * 74;
              const y2 = 80 + Math.sin(a) * 74;
              return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="hsl(48 95% 70%)" strokeWidth="2.5" strokeLinecap="round" opacity={0.7} />;
            })}
          </svg>
          {/* Sun core */}
          <div className="absolute inset-8 rounded-full bg-gradient-to-br from-amber-200 via-amber-400 to-orange-500 shadow-[0_0_60px_hsl(45_95%_60%/0.7)] flex items-center justify-center">
            <Sun className="w-12 h-12 text-white drop-shadow-lg animate-pulse" strokeWidth={1.5} />
          </div>
        </div>

        <h2 className="text-white text-2xl md:text-3xl font-bold tracking-tight mb-3">
          Calcul de votre potentiel solaire
        </h2>
        <p className="text-white/70 text-sm mb-8">Notre moteur analyse votre profil en temps réel</p>

        {/* Progress bar */}
        <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden mb-6">
          <div
            className="h-full bg-gradient-to-r from-primary via-amber-300 to-amber-400 rounded-full shadow-[0_0_12px_hsl(45_95%_60%/0.6)] transition-all duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Rolling lines */}
        <ul className="space-y-2.5 text-left">
          {COMPUTE_LINES.map((line, i) => {
            const done = i < activeLine || (activeLine === COMPUTE_LINES.length - 1 && i < activeLine);
            const active = i === activeLine;
            return (
              <li
                key={i}
                className={`flex items-center gap-3 text-sm transition-all duration-300 ${
                  active ? "text-white" : done ? "text-white/60" : "text-white/30"
                }`}
              >
                {done ? (
                  <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3" />
                  </span>
                ) : active ? (
                  <Loader2 className="w-5 h-5 animate-spin text-amber-300 flex-shrink-0" />
                ) : (
                  <span className="w-5 h-5 rounded-full border border-white/20 flex-shrink-0" />
                )}
                <span className={active ? "font-semibold" : ""}>{line}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

const ResultsPanel = ({ sim, region, annualBill, savingsMin, savingsMax }: any) => {
  const housingLabel = HOUSING.find((h) => h.id === sim.housing)?.label || "—";
  const surfaceLabel = SURFACES.find((s) => s.id === sim.surface)?.label || "—";
  const orientationLabel = ORIENTATIONS.find((o) => o.id === sim.orientation)?.label || (sim.orientation === "?" ? "À confirmer" : "—");
  const equipmentsLabels = sim.equipments.map((id: string) => EQUIPMENTS.find((e) => e.id === id)?.label).filter(Boolean).join(", ") || "Aucun";

  return (
    <div className="bg-white rounded-3xl shadow-[0_30px_80px_-20px_hsl(145_65%_25%/0.25)] border border-primary/20 overflow-hidden">
      {/* Hero result */}
      <div className="relative bg-gradient-to-br from-primary via-[hsl(145_65%_35%)] to-[hsl(145_55%_25%)] px-6 md:px-10 py-10 text-primary-foreground overflow-hidden">
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-amber-300/30 blur-3xl" aria-hidden />
        <div className="relative">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur text-xs font-semibold mb-3">
            <Check className="w-3.5 h-3.5" /> Résultats débloqués
          </div>
          <h2 className="text-2xl md:text-3xl font-bold mb-2">Votre estimation solaire</h2>
          <p className="text-primary-foreground/80 text-sm">Basée sur votre profil et votre région.</p>

          <div className="mt-6 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5">
            <p className="text-xs uppercase tracking-wide text-primary-foreground/70 mb-1">Économies estimées</p>
            <p className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-amber-200 to-yellow-100 bg-clip-text text-transparent">
              {savingsMin.toLocaleString("fr-FR")} – {savingsMax.toLocaleString("fr-FR")} € / an
            </p>
            <p className="text-xs text-primary-foreground/70 mt-2">
              Sur une facture annuelle estimée à <strong className="text-primary-foreground">{annualBill.toLocaleString("fr-FR")} €</strong>. Indicatif, à confirmer après étude.
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 md:p-10">
        {/* Profil */}
        <section className="mb-8">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Votre profil</h3>
          <div className="grid md:grid-cols-2 gap-3 text-sm">
            <ProfileRow label="Zone" value={`${region.label}${sim.city ? " — " + sim.city : ""}`} />
            <ProfileRow label="Potentiel solaire régional" value={region.sun} />
            <ProfileRow label="Logement" value={housingLabel} />
            <ProfileRow label="Superficie approximative" value={surfaceLabel} />
            <ProfileRow label="Orientation" value={orientationLabel} />
            <ProfileRow label="Équipements" value={equipmentsLabels} />
          </div>
        </section>

        {/* Installation */}
        <section className="mb-6 p-5 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50/50 border border-amber-200">
          <h3 className="text-xs font-bold text-amber-700 uppercase tracking-widest mb-2">Installation recommandée</h3>
          <p className="text-slate-900 text-lg font-bold">
            {typeof sim.monthlyBill === "number" ? suggestedKwc(sim.monthlyBill) : "—"}
          </p>
          <p className="text-sm text-slate-600 mt-2">
            Cette puissance peut être adaptée selon votre consommation, votre toiture, votre région et votre budget. Une étude gratuite permet de confirmer la solution la plus rentable.
          </p>
        </section>

        {/* Aides */}
        <section className="mb-8 p-5 rounded-2xl bg-gradient-to-br from-[hsl(145_35%_95%)] to-white border border-primary/20">
          <h3 className="text-xs font-bold text-primary uppercase tracking-widest mb-2">Aides & financement</h3>
          <p className="text-slate-700">
            Votre région peut donner accès à certaines aides ou solutions de financement, sous réserve d'éligibilité.
          </p>
        </section>

        <div className="text-center">
          <Button
            size="lg"
            className="bg-gradient-to-r from-primary to-[hsl(145_65%_35%)] text-primary-foreground font-bold px-10 py-7 rounded-full shadow-[0_15px_40px_-10px_hsl(145_65%_45%/0.6)] hover:scale-105 transition-all"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            <Sun className="w-4 h-4 mr-2" /> Confirmer mon estimation avec un conseiller
          </Button>
          <p className="text-xs text-slate-500 mt-3 max-w-md mx-auto">
            Un conseiller peut vérifier gratuitement votre toiture, votre consommation réelle, les aides disponibles et la rentabilité estimée.
          </p>
        </div>
      </div>
    </div>
  );
};

const ProfileRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex flex-col p-3.5 rounded-xl bg-slate-50/80 border border-slate-100">
    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">{label}</span>
    <span className="text-slate-900 font-semibold mt-1">{value}</span>
  </div>
);
