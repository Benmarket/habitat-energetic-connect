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
  Loader2, Lock, Sparkles, ShieldCheck, Clock, Zap,
} from "lucide-react";
import solarSimBg from "@/assets/simulators/solar-simulator-bg.jpg";

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
const HOUSING: { id: HousingType; label: string; icon: any }[] = [
  { id: "maison", label: "Maison individuelle", icon: Home },
  { id: "villa", label: "Villa", icon: Home },
  { id: "mitoyenne", label: "Maison mitoyenne", icon: Home },
  { id: "pro", label: "Local professionnel", icon: Store },
  { id: "appartement", label: "Appartement / copropriété", icon: Building2 },
];

const SURFACES: { id: SurfaceRange; label: string }[] = [
  { id: "<80", label: "Moins de 80 m²" },
  { id: "80-120", label: "80 à 120 m²" },
  { id: "120-160", label: "120 à 160 m²" },
  { id: ">160", label: "Plus de 160 m²" },
  { id: "?", label: "Je ne sais pas" },
];

const OWNERSHIPS: { id: Ownership; label: string }[] = [
  { id: "oui", label: "Oui" },
  { id: "non", label: "Non" },
  { id: "achat", label: "Achat en cours" },
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

const EQUIPMENTS: { id: string; label: string; icon: any }[] = [
  { id: "clim", label: "Climatisation", icon: Snowflake },
  { id: "ceau", label: "Chauffe-eau électrique", icon: Flame },
  { id: "pac", label: "Pompe à chaleur", icon: Thermometer },
  { id: "piscine", label: "Piscine", icon: Waves },
  { id: "ve", label: "Voiture électrique", icon: Car },
  { id: "elec", label: "Électroménager du quotidien", icon: Plug },
  { id: "?", label: "Je ne sais pas", icon: HelpCircle },
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
    // Southern France stronger sun
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
  // 8 sectors of 45° starting at N (top, -22.5°)
  const size = 280;
  const cx = size / 2;
  const cy = size / 2;
  const rOuter = 130;
  const rInner = 55;
  const sectors = ["N", "NE", "E", "SE", "S", "SO", "O", "NO"] as Orientation[];

  const polar = (deg: number, r: number) => {
    const rad = ((deg - 90) * Math.PI) / 180;
    return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="drop-shadow-xl">
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
                className={
                  selected
                    ? "fill-amber-400 stroke-amber-600"
                    : "fill-sky-100 hover:fill-sky-200 stroke-sky-300"
                }
                strokeWidth={1.5}
                style={{ transition: "fill .2s" }}
              />
              <text x={lx} y={ly - 4} textAnchor="middle" className={`text-[13px] font-bold ${selected ? "fill-slate-900" : "fill-slate-700"}`}>
                {s}
              </text>
              <text x={lx} y={ly + 10} textAnchor="middle" className={`text-[10px] ${selected ? "fill-slate-900" : "fill-slate-500"}`}>
                {perf}%
              </text>
            </g>
          );
        })}
        {/* center */}
        <circle cx={cx} cy={cy} r={rInner - 4} className="fill-white stroke-slate-200" strokeWidth={1.5} />
        <g transform={`translate(${cx - 16}, ${cy - 16})`}>
          <Sun className="text-amber-500" width={32} height={32} />
        </g>
      </svg>
      <button
        type="button"
        onClick={() => onChange("?")}
        className={`text-sm px-4 py-2 rounded-full border transition-colors ${
          value === "?"
            ? "bg-amber-400 border-amber-500 text-slate-900 font-semibold"
            : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
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
  const [step, setStep] = useState<number>(0); // 0 entry, 1..7 questions, 8 results unlocked
  const [sim, setSim] = useState<Sim>({
    postalCode: "",
    city: "",
    housing: "",
    surface: "",
    ownership: "",
    orientation: "",
    equipments: [],
    monthlyBill: "",
  });
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [computing, setComputing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const region = useMemo(() => detectRegion(sim.postalCode || ""), [sim.postalCode]);

  // Computing animation when reaching step 7
  useEffect(() => {
    if (step === 7) {
      setComputing(true);
      const t = setTimeout(() => setComputing(false), 2200);
      return () => clearTimeout(t);
    }
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

  const goNext = () => setStep((s) => Math.min(s + 1, 7));
  const goBack = () => setStep((s) => Math.max(s - 1, 1));

  // ----- Lead form state -----
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
      region: region.label,
      regionId: region.id,
      postalCode: sim.postalCode,
      city: sim.city,
      housingType: sim.housing,
      houseSurfaceRange: sim.surface,
      ownership: sim.ownership,
      roofOrientation: sim.orientation,
      equipments: sim.equipments,
      monthlyBill: sim.monthlyBill,
      annualBill,
      estimatedSavingsMin: savingsMin,
      estimatedSavingsMax: savingsMax,
      suggestedInstallationPower: typeof sim.monthlyBill === "number" ? suggestedKwc(sim.monthlyBill) : null,
      consentAccepted: true,
      createdAt: new Date().toISOString(),
    };

    const { error } = await supabase.from("leads").insert({
      first_name: firstName,
      last_name: lastName,
      email: parsed.data.email,
      phone: parsed.data.phone,
      address: sim.city || "Non renseignée",
      postal_code: sim.postalCode,
      city: sim.city || "Non renseignée",
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

  // ---------- Render ----------
  return (
    <>
      <Helmet>
        <title>Simulateur solaire gratuit — économies & aides | Prime Énergies</title>
        <meta name="description" content="Estimez en 2 minutes vos économies potentielles grâce au solaire, le potentiel de votre logement et les aides disponibles dans votre région." />
      </Helmet>

      <Header />

      <main className="relative min-h-screen pt-6 pb-16 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <img src={solarSimBg} alt="" className="absolute inset-0 w-full h-full object-cover opacity-50" loading="eager" width={1920} height={1080} />
          <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-white/30 to-white/60" />
        </div>

        <div className="relative z-10 container mx-auto px-4 max-w-3xl">
          {step === 0 && <EntryScreen onStart={() => setStep(1)} />}

          {step > 0 && (
            <>
              <ProgressBar step={step} />
              <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-white/60 p-6 md:p-10 mt-4">
                {step === 1 && <Step1Location sim={sim} setSim={setSim} region={region} />}
                {step === 2 && <Step2Housing sim={sim} setSim={setSim} />}
                {step === 3 && <Step3Ownership sim={sim} setSim={setSim} />}
                {step === 4 && <Step4Orientation sim={sim} setSim={setSim} />}
                {step === 5 && <Step5Equipments sim={sim} setSim={setSim} />}
                {step === 6 && <Step6Bill sim={sim} setSim={setSim} />}
                {step === 7 && (
                  <Step7Compute
                    sim={sim}
                    computing={computing}
                    onSeeResults={() => setShowLeadModal(true)}
                  />
                )}

                {/* Navigation */}
                {step < 7 && (
                  <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-100">
                    <Button variant="ghost" onClick={goBack} disabled={step === 1} className="text-slate-600">
                      <ArrowLeft className="w-4 h-4 mr-1.5" /> Retour
                    </Button>
                    <Button
                      onClick={goNext}
                      disabled={!canContinue()}
                      size="lg"
                      className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold shadow-lg hover:scale-105 transition-transform"
                    >
                      Continuer <ArrowRight className="w-4 h-4 ml-1.5" />
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Results (visible only after unlock) */}
          {unlocked && (
            <div className="mt-8">
              <ResultsPanel sim={sim} region={region} annualBill={annualBill} savingsMin={savingsMin} savingsMax={savingsMax} />
            </div>
          )}
        </div>
      </main>

      {/* Lead modal */}
      <Dialog open={showLeadModal} onOpenChange={(o) => !submitting && setShowLeadModal(o)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-amber-500" /> Vos résultats sont prêts
            </DialogTitle>
            <DialogDescription>
              Renseignez vos coordonnées pour débloquer votre estimation solaire personnalisée et recevoir les détails de votre simulation.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="lead-name">Nom complet *</Label>
              <Input id="lead-name" value={lead.fullName} onChange={(e) => setLead({ ...lead, fullName: e.target.value })} placeholder="Prénom et nom" />
              {leadErrors.fullName && <p className="text-xs text-red-600 mt-1">{leadErrors.fullName}</p>}
            </div>
            <div>
              <Label htmlFor="lead-phone">Téléphone *</Label>
              <Input id="lead-phone" type="tel" value={lead.phone} onChange={(e) => setLead({ ...lead, phone: e.target.value })} placeholder="06 12 34 56 78" />
              {leadErrors.phone && <p className="text-xs text-red-600 mt-1">{leadErrors.phone}</p>}
            </div>
            <div>
              <Label htmlFor="lead-email">Email *</Label>
              <Input id="lead-email" type="email" value={lead.email} onChange={(e) => setLead({ ...lead, email: e.target.value })} placeholder="vous@email.com" />
              {leadErrors.email && <p className="text-xs text-red-600 mt-1">{leadErrors.email}</p>}
            </div>
            <div className="flex items-start gap-2">
              <Checkbox id="lead-consent" checked={lead.consent} onCheckedChange={(c) => setLead({ ...lead, consent: c === true })} className="mt-0.5" />
              <label htmlFor="lead-consent" className="text-xs text-slate-700 leading-relaxed cursor-pointer">
                J'accepte d'être recontacté dans le cadre de ma demande de simulation solaire.
              </label>
            </div>
            {leadErrors.consent && <p className="text-xs text-red-600">{leadErrors.consent}</p>}

            <Button
              onClick={submitLead}
              disabled={submitting}
              size="lg"
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold"
            >
              {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Envoi…</> : <>Débloquer mes résultats</>}
            </Button>
            <p className="text-[11px] text-center text-slate-500 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3 h-3" /> Gratuit et sans engagement. Vos informations servent uniquement à traiter votre demande.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </>
  );
}

// ---------- Sub components ----------

const EntryScreen = ({ onStart }: { onStart: () => void }) => (
  <section className="text-center py-12 md:py-20">
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-100/80 text-amber-700 text-xs font-semibold mb-6">
      <Sparkles className="w-3.5 h-3.5" /> Simulateur 100% gratuit
    </div>
    <h1 className="text-3xl md:text-5xl font-bold leading-tight tracking-tight text-slate-900 mb-4">
      Combien votre maison peut-elle{" "}
      <span className="bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 bg-clip-text text-transparent">
        économiser
      </span>
      <br className="hidden md:block" /> grâce au solaire&nbsp;?
    </h1>
    <p className="text-base md:text-lg text-slate-600 max-w-2xl mx-auto mb-8">
      Estimez gratuitement le potentiel solaire de votre logement, vos économies possibles et les aides disponibles dans votre région.
    </p>

    <Button
      onClick={onStart}
      size="lg"
      className="bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold text-base md:text-lg px-8 py-6 rounded-full shadow-xl hover:scale-105 transition-transform"
    >
      <Sun className="w-5 h-5 mr-2" /> Lancer ma simulation <ArrowRight className="w-5 h-5 ml-2" />
    </Button>

    <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-slate-600">
      <span className="inline-flex items-center gap-1.5"><Clock className="w-4 h-4 text-amber-500" /> Résultat en moins de 2 minutes</span>
      <span className="inline-flex items-center gap-1.5"><Check className="w-4 h-4 text-green-600" /> Gratuit et sans engagement</span>
      <span className="inline-flex items-center gap-1.5"><MapPin className="w-4 h-4 text-blue-600" /> Estimation personnalisée selon votre région</span>
    </div>
  </section>
);

const ProgressBar = ({ step }: { step: number }) => (
  <div className="bg-white/90 backdrop-blur-sm rounded-xl py-3 px-4 md:px-6 shadow-md border border-white/60">
    <div className="flex items-center justify-between mb-2 text-xs font-medium text-slate-600">
      <span>Étape {step} / 7</span>
      <span className="text-amber-600">{STEP_LABELS[step - 1]}</span>
    </div>
    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-500"
        style={{ width: `${(step / 7) * 100}%` }}
      />
    </div>
  </div>
);

// ----- Steps -----

const StepTitle = ({ icon: Icon, title, subtitle }: { icon: any; title: string; subtitle?: string }) => (
  <div className="mb-6">
    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 text-orange-600 mb-3">
      <Icon className="w-6 h-6" />
    </div>
    <h2 className="text-xl md:text-2xl font-bold text-slate-900">{title}</h2>
    {subtitle && <p className="text-sm text-slate-600 mt-1">{subtitle}</p>}
  </div>
);

const InfoBanner = ({ children }: { children: React.ReactNode }) => (
  <div className="mt-5 p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 text-sm text-slate-700 flex gap-3">
    <Sparkles className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
    <div>{children}</div>
  </div>
);

const Step1Location = ({ sim, setSim, region }: { sim: Sim; setSim: any; region: any }) => (
  <div>
    <StepTitle icon={MapPin} title="Où se situe votre logement ?" subtitle="Nous adaptons votre simulation à votre zone géographique." />
    <div className="grid md:grid-cols-2 gap-4">
      <div>
        <Label>Code postal *</Label>
        <Input
          value={sim.postalCode}
          onChange={(e) => setSim({ ...sim, postalCode: e.target.value.replace(/\D/g, "").slice(0, 5) })}
          placeholder="75001"
          inputMode="numeric"
          className="text-lg"
        />
      </div>
      <div>
        <Label>Ville <span className="text-slate-400 font-normal">(facultatif)</span></Label>
        <Input value={sim.city} onChange={(e) => setSim({ ...sim, city: e.target.value })} placeholder="Paris" />
      </div>
    </div>

    {/^\d{5}$/.test(sim.postalCode) && (
      <InfoBanner>
        <p className="font-semibold text-slate-900 mb-1">Votre zone est analysée — {region.label}</p>
        <ul className="space-y-1 text-slate-700">
          <li>• Ensoleillement régional : <strong>{region.sun}</strong></li>
          <li>• Aides possibles selon votre éligibilité</li>
          <li>• Simulation adaptée à votre région</li>
        </ul>
      </InfoBanner>
    )}
  </div>
);

const ChoiceCard = ({ selected, onClick, children, icon: Icon }: any) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
      selected
        ? "border-amber-500 bg-amber-50 shadow-md"
        : "border-slate-200 bg-white hover:border-amber-300 hover:bg-amber-50/50"
    }`}
  >
    {Icon && (
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${selected ? "bg-amber-500 text-white" : "bg-slate-100 text-slate-500"}`}>
        <Icon className="w-5 h-5" />
      </div>
    )}
    <span className={`font-medium ${selected ? "text-slate-900" : "text-slate-700"}`}>{children}</span>
    {selected && <Check className="w-5 h-5 text-amber-600 ml-auto" />}
  </button>
);

const Step2Housing = ({ sim, setSim }: { sim: Sim; setSim: any }) => (
  <div>
    <StepTitle icon={Home} title="Quel logement souhaitez-vous équiper ?" />
    <div className="grid md:grid-cols-2 gap-3">
      {HOUSING.map((h) => (
        <ChoiceCard key={h.id} icon={h.icon} selected={sim.housing === h.id} onClick={() => setSim({ ...sim, housing: h.id })}>
          {h.label}
        </ChoiceCard>
      ))}
    </div>

    <div className="mt-8">
      <h3 className="font-semibold text-slate-900 mb-3">Quelle est la superficie approximative du logement ?</h3>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {SURFACES.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSim({ ...sim, surface: s.id })}
            className={`px-3 py-3 rounded-lg border-2 text-sm font-medium transition-all ${
              sim.surface === s.id ? "border-amber-500 bg-amber-50 text-slate-900" : "border-slate-200 bg-white text-slate-600 hover:border-amber-300"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>

    {sim.housing && (
      <InfoBanner>
        {sim.housing === "appartement"
          ? "Votre projet peut nécessiter une étude spécifique. Vous pouvez continuer la simulation pour obtenir une première estimation."
          : "Très bon profil pour une simulation solaire. Les maisons permettent généralement d'exploiter directement la toiture pour produire une partie de l'électricité consommée."}
        {sim.surface && (
          <p className="mt-2 text-xs text-slate-600">
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
    <div className="grid md:grid-cols-3 gap-3">
      {OWNERSHIPS.map((o) => (
        <ChoiceCard key={o.id} selected={sim.ownership === o.id} onClick={() => setSim({ ...sim, ownership: o.id })}>
          {o.label}
        </ChoiceCard>
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
    <div className="grid md:grid-cols-[1fr_1fr] gap-6 items-center">
      <Compass8 value={sim.orientation} onChange={(o) => setSim({ ...sim, orientation: o })} />
      <div className="space-y-3">
        {sim.orientation ? (
          <InfoBanner>{orientationFeedback(sim.orientation as Orientation)}</InfoBanner>
        ) : (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-600">
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
          {sim.equipments.includes("clim") && <p className="mt-2 text-xs">La climatisation peut représenter un poste important de consommation, notamment dans les régions ensoleillées.</p>}
          {sim.equipments.includes("ceau") && <p className="mt-2 text-xs">Le chauffe-eau électrique est souvent un poste intéressant à prendre en compte dans une étude solaire.</p>}
          {(sim.equipments.includes("piscine") || sim.equipments.includes("ve")) && <p className="mt-2 text-xs">Ce type d'équipement peut renforcer l'intérêt d'une production solaire adaptée.</p>}
        </InfoBanner>
      )}
    </div>
  );
};

const Step6Bill = ({ sim, setSim }: { sim: Sim; setSim: any }) => (
  <div>
    <StepTitle icon={Zap} title="Quel est le montant moyen de votre facture d'électricité par mois ?" />
    <div className="grid grid-cols-5 gap-2 mb-4">
      {BILL_PRESETS.map((v, i) => (
        <button
          key={v}
          type="button"
          onClick={() => setSim({ ...sim, monthlyBill: v })}
          className={`py-3 rounded-lg border-2 text-sm font-semibold transition-all ${
            sim.monthlyBill === v ? "border-amber-500 bg-amber-50 text-slate-900" : "border-slate-200 bg-white text-slate-600 hover:border-amber-300"
          }`}
        >
          {v} €{i === BILL_PRESETS.length - 1 ? "+" : ""}
        </button>
      ))}
    </div>
    <Label>Ou saisissez un montant précis (€/mois)</Label>
    <Input
      type="number"
      min={0}
      value={sim.monthlyBill === "" ? "" : sim.monthlyBill}
      onChange={(e) => setSim({ ...sim, monthlyBill: e.target.value === "" ? "" : Math.max(0, Number(e.target.value)) })}
      placeholder="180"
      className="text-lg"
    />
    {typeof sim.monthlyBill === "number" && sim.monthlyBill > 0 && (
      <InfoBanner>
        <p className="font-semibold text-slate-900">
          {sim.monthlyBill} € / mois = {(sim.monthlyBill * 12).toLocaleString("fr-FR")} € / an
        </p>
        <p className="mt-1">Une partie de cette dépense pourrait être réduite grâce à une production solaire adaptée à votre logement.</p>
      </InfoBanner>
    )}
  </div>
);

const Step7Compute = ({ sim, computing, onSeeResults }: { sim: Sim; computing: boolean; onSeeResults: () => void }) => (
  <div className="text-center py-4">
    <StepTitle icon={Sparkles} title="Votre estimation est prête à être calculée" />
    <p className="text-sm text-slate-600 mb-6">Nous avons analysé :</p>
    <ul className="text-sm text-left max-w-md mx-auto space-y-2 text-slate-700 mb-8">
      <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-600" /> Votre région</li>
      <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-600" /> Votre type de logement</li>
      <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-600" /> Votre statut propriétaire</li>
      <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-600" /> La superficie approximative de votre maison</li>
      <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-600" /> L'orientation de votre toiture</li>
      <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-600" /> Vos équipements électriques</li>
      <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-600" /> Votre facture mensuelle</li>
    </ul>

    {computing ? (
      <div className="space-y-2 max-w-sm mx-auto text-sm text-slate-600">
        <p className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin text-amber-500" /> Calcul du potentiel solaire…</p>
        <p className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin text-amber-500" /> Estimation des économies…</p>
        <p className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin text-amber-500" /> Vérification des aides possibles…</p>
        <p className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin text-amber-500" /> Préparation de votre résultat personnalisé…</p>
      </div>
    ) : (
      <Button
        onClick={onSeeResults}
        size="lg"
        className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold px-8 py-6 rounded-full shadow-xl hover:scale-105 transition-transform"
      >
        <Lock className="w-4 h-4 mr-2" /> Voir mes résultats
      </Button>
    )}
  </div>
);

const ResultsPanel = ({ sim, region, annualBill, savingsMin, savingsMax }: any) => {
  const housingLabel = HOUSING.find((h) => h.id === sim.housing)?.label || "—";
  const surfaceLabel = SURFACES.find((s) => s.id === sim.surface)?.label || "—";
  const orientationLabel = ORIENTATIONS.find((o) => o.id === sim.orientation)?.label || (sim.orientation === "?" ? "À confirmer" : "—");
  const equipmentsLabels = sim.equipments.map((id: string) => EQUIPMENTS.find((e) => e.id === id)?.label).filter(Boolean).join(", ") || "Aucun";

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-amber-200 p-6 md:p-10">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold mb-3">
          <Check className="w-3.5 h-3.5" /> Résultats débloqués
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-slate-900">Votre estimation solaire</h2>
      </div>

      {/* Profil */}
      <section className="mb-6">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Votre profil</h3>
        <div className="grid md:grid-cols-2 gap-3 text-sm">
          <ProfileRow label="Zone" value={`${region.label}${sim.city ? " — " + sim.city : ""}`} />
          <ProfileRow label="Potentiel solaire régional" value={region.sun} />
          <ProfileRow label="Logement" value={housingLabel} />
          <ProfileRow label="Superficie approximative" value={surfaceLabel} />
          <ProfileRow label="Orientation" value={orientationLabel} />
          <ProfileRow label="Équipements" value={equipmentsLabels} />
        </div>
      </section>

      {/* Économies */}
      <section className="mb-6 p-5 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200">
        <h3 className="text-sm font-semibold text-orange-700 uppercase tracking-wide mb-2">Économies potentielles</h3>
        <p className="text-slate-700 mb-2">Votre facture annuelle estimée : <strong>{annualBill.toLocaleString("fr-FR")} € / an</strong></p>
        <p className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
          Entre {savingsMin.toLocaleString("fr-FR")} € et {savingsMax.toLocaleString("fr-FR")} € / an
        </p>
        <p className="text-xs text-slate-500 mt-2">Estimation indicative, à confirmer après étude technique.</p>
      </section>

      {/* Installation */}
      <section className="mb-6 p-5 rounded-xl bg-sky-50 border border-sky-200">
        <h3 className="text-sm font-semibold text-sky-700 uppercase tracking-wide mb-2">Installation recommandée</h3>
        <p className="text-slate-800 text-lg font-semibold">
          Installation à étudier {typeof sim.monthlyBill === "number" ? suggestedKwc(sim.monthlyBill) : "—"}
        </p>
        <p className="text-sm text-slate-600 mt-2">
          Cette puissance peut être adaptée selon votre consommation, votre toiture, votre région et votre budget. Une étude gratuite permet de confirmer la solution la plus rentable.
        </p>
      </section>

      {/* Aides */}
      <section className="mb-8 p-5 rounded-xl bg-blue-50 border border-blue-200">
        <h3 className="text-sm font-semibold text-blue-700 uppercase tracking-wide mb-2">Aides & financement</h3>
        <p className="text-slate-700">
          Votre région peut donner accès à certaines aides ou solutions de financement, sous réserve d'éligibilité.
        </p>
      </section>

      <div className="text-center">
        <Button
          size="lg"
          className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold px-8 py-6 rounded-full shadow-xl hover:scale-105 transition-transform"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          <Sun className="w-4 h-4 mr-2" /> Confirmer mon estimation avec un conseiller
        </Button>
        <p className="text-xs text-slate-500 mt-3 max-w-md mx-auto">
          Un conseiller peut vérifier gratuitement votre toiture, votre consommation réelle, les aides disponibles et la rentabilité estimée.
        </p>
      </div>
    </div>
  );
};

const ProfileRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex flex-col p-3 rounded-lg bg-slate-50 border border-slate-100">
    <span className="text-xs text-slate-500 uppercase tracking-wide">{label}</span>
    <span className="text-slate-900 font-medium mt-0.5">{value}</span>
  </div>
);
