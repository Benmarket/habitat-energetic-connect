import { useState, useMemo, useEffect, Suspense } from "react";
import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, Stage } from "@react-three/drei";
import roofTuilesAsset from "@/assets/roof-tuiles.glb.asset.json";
import roofArdoisesAsset from "@/assets/roof-ardoises.glb.asset.json";
import roofBacAcierAsset from "@/assets/roof-bac-acier.glb.asset.json";
import roofPlateAsset from "@/assets/roof-plate.glb.asset.json";
import { z } from "zod";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  Sun, Check, ArrowLeft, ArrowRight, MapPin, Home, Building2, Store, Building,
  Compass, Snowflake, Flame, Thermometer, Waves, Car, Plug, HelpCircle, Ruler,
  Loader2, Lock, Sparkles, ShieldCheck, Clock, Zap, TrendingUp, Star, Award, Leaf, X,
  Users, CalendarClock, FileText, BatteryCharging, Trees, Coins, LineChart, PiggyBank, Info,
  Phone, Mail, ClipboardCheck, Wrench, Rocket, TrendingDown,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  ResponsiveContainer, Legend, Cell,
} from "recharts";
import solarSimBg from "@/assets/simulators/solar-simulator-bg.jpg";
import regionFrance from "@/assets/regions/france.png";
import regionCorse from "@/assets/regions/corse.png";
import regionGuyane from "@/assets/regions/guyane.png";
import regionGuadeloupe from "@/assets/regions/guadeloupe.png";
import regionMartinique from "@/assets/regions/martinique.png";
import regionReunion from "@/assets/regions/reunion.png";
import pvOnduleurGif from "@/assets/pv-onduleur.gif.asset.json";
import pvBatterieGif from "@/assets/pv-onduleur-batterie.gif.asset.json";

const REGION_SHAPES: Record<string, string> = {
  corse: regionCorse,
  guyane: regionGuyane,
  guadeloupe: regionGuadeloupe,
  martinique: regionMartinique,
  reunion: regionReunion,
  "fr-sud": regionFrance,
  "fr-so": regionFrance,
  "fr-nord": regionFrance,
  fr: regionFrance,
};

// ---------- Types ----------
type HousingType = "maison" | "appartement" | "pro";
type Ownership = "oui" | "non" | "achat";
type Orientation = "N" | "NE" | "E" | "SE" | "S" | "SO" | "O" | "NO" | "?";
type RoofType = "tuiles" | "ardoise" | "bac-acier" | "toit-plat" | "?" | "";
type ProjectHorizon = "3m" | "6m" | "1a" | "info" | "";
type YesNo = "oui" | "non" | "";
type BatteryInterest = "oui" | "non" | "peut-etre" | "";

interface Sim {
  postalCode: string;
  city: string;
  housing: HousingType | "";
  surface: number | "";
  ownership: Ownership | "";
  orientation: Orientation | "";
  roofType: RoofType;
  equipments: string[];
  monthlyBill: number | "";
  householdSize: number | "";
  projectHorizon: ProjectHorizon;
  hasQuote: YesNo;
  batteryInterest: BatteryInterest;
}

// ---------- Static data ----------
const HOUSING: { id: HousingType; label: string; desc: string; icon: any }[] = [
  { id: "maison", label: "Maison", desc: "Individuelle, mitoyenne ou villa — toiture privative", icon: Home },
  { id: "appartement", label: "Appartement", desc: "Copropriété ou dernier étage — cas spécifique", icon: Building2 },
  { id: "pro", label: "Local professionnel", desc: "Commerce, bureau, atelier ou bâtiment tertiaire", icon: Store },
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

const ROOF_TYPES: { id: Exclude<RoofType, "">; label: string; desc: string }[] = [
  { id: "tuiles", label: "Tuiles", desc: "Cas le plus courant" },
  { id: "ardoise", label: "Ardoise", desc: "Toit plus délicat mais faisable" },
  { id: "bac-acier", label: "Bac acier", desc: "Idéal pour la pose" },
  { id: "toit-plat", label: "Toit plat / terrasse", desc: "Pose sur bacs lestés" },
  { id: "?", label: "Je ne sais pas", desc: "On vérifiera à l'étude" },
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

const PROJECT_HORIZONS: { id: Exclude<ProjectHorizon, "">; label: string; desc: string }[] = [
  { id: "3m", label: "Dans les 3 mois", desc: "Projet prioritaire" },
  { id: "6m", label: "Dans 6 mois", desc: "Projet en préparation" },
  { id: "1a", label: "Dans l'année", desc: "Réflexion avancée" },
  { id: "info", label: "Je me renseigne", desc: "Pas de date fixée" },
];

// ---------- Helpers ----------
// Ensoleillement basé sur l'irradiation solaire annuelle moyenne (kWh/m²/an)
// Sources : PVGIS (Commission Européenne), Ademe. Formulation factuelle, sans exagération.
function detectRegion(postal: string): { id: string; label: string; sun: string; island: boolean } {
  const p = postal.trim();
  if (p.startsWith("20")) return { id: "corse", label: "Corse", sun: "très élevé (~1 700 kWh/m²/an)", island: true };
  if (p.startsWith("974")) return { id: "reunion", label: "La Réunion", sun: "très élevé (~1 800 kWh/m²/an)", island: true };
  if (p.startsWith("973")) return { id: "guyane", label: "Guyane", sun: "élevé mais nuageux (~1 400 kWh/m²/an)", island: true };
  if (p.startsWith("972")) return { id: "martinique", label: "Martinique", sun: "très élevé (~1 800 kWh/m²/an)", island: true };
  if (p.startsWith("971")) return { id: "guadeloupe", label: "Guadeloupe", sun: "très élevé (~1 800 kWh/m²/an)", island: true };
  if (p.startsWith("976")) return { id: "mayotte", label: "Mayotte", sun: "très élevé (~1 900 kWh/m²/an)", island: true };
  if (/^\d{5}$/.test(p)) {
    const n = parseInt(p.slice(0, 2), 10);
    if ([13, 30, 34, 11, 66, 6, 83, 84, 4, 5, 7, 26].includes(n))
      return { id: "fr-sud", label: "France continentale (sud)", sun: "élevé (~1 500–1 700 kWh/m²/an)", island: false };
    if ([33, 40, 47, 24, 46, 82, 32, 31, 65, 9, 81, 12, 48, 43, 63, 15, 19, 87, 16, 17, 79, 86].includes(n))
      return { id: "fr-so", label: "France continentale (sud-ouest)", sun: "correct à élevé (~1 300–1 500 kWh/m²/an)", island: false };
    if ([59, 62, 80, 60, 76, 27, 2, 8, 51, 55, 54, 57, 67, 68, 88, 52].includes(n))
      return { id: "fr-nord", label: "France continentale (nord)", sun: "modéré (~1 000–1 150 kWh/m²/an)", island: false };
    return { id: "fr", label: "France continentale", sun: "modéré à correct (~1 150–1 300 kWh/m²/an)", island: false };
  }
  return { id: "unknown", label: "Zone non reconnue", sun: "à évaluer selon la localisation", island: false };
}

function suggestedKwc(monthly: number): { kwc: number; panels: number; label: string } {
  const annual = monthly * 12;
  // Approximation : 1 kWc ≈ 1100 kWh/an en métropole ; on vise ~70% de la conso annuelle
  const kwh = annual / 0.22; // conso estimée à partir de la facture (0.22€/kWh moyen)
  const kwc = Math.max(3, Math.min(12, Math.round((kwh * 0.7) / 1100)));
  const panels = kwc * 2; // ~500Wc par panneau
  const label = kwc <= 3 ? "3 kWc" : kwc <= 6 ? `${kwc} kWc` : `${kwc} kWc`;
  return { kwc, panels, label };
}

function orientationFeedback(o: Orientation): string {
  if (o === "S" || o === "SE" || o === "SO")
    return "Excellente orientation solaire. Cette exposition est souvent favorable pour produire davantage d'électricité dans la journée.";
  if (o === "E" || o === "O")
    return "Orientation intéressante. Une exposition Est ou Ouest peut rester pertinente, notamment pour répartir la production solaire sur la journée.";
  if (o === "?") return "Pas de souci. L'orientation peut être vérifiée facilement lors de l'étude solaire.";
  return "Une étude permet de confirmer le potentiel réel. Même si l'orientation semble moins favorable, certaines configurations restent exploitables.";
}

// ---------- Solar background ----------
const SolarBackdrop = () => (
  <div className="fixed inset-0 -z-10 overflow-hidden" aria-hidden>
    <img src={solarSimBg} alt="" className="absolute inset-0 w-full h-full object-cover opacity-50" loading="eager" />
    <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-white/30 to-white/60" />
  </div>
);

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
            <stop offset="100%" stopColor="hsl(28 92% 50%)" />
          </radialGradient>
          <linearGradient id="sectorSelected" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(38 95% 55%)" />
            <stop offset="100%" stopColor="hsl(24 90% 45%)" />
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
              <path d={d} fill={selected ? "url(#sectorSelected)" : "hsl(28 25% 96%)"} stroke={selected ? "hsl(24 90% 35%)" : "hsl(28 25% 85%)"} strokeWidth={2} className="transition-all hover:fill-[hsl(38_85%_88%)]" />
              <text x={lx} y={ly - 4} textAnchor="middle" className={`text-[14px] font-bold ${selected ? "fill-white" : "fill-slate-800"}`}>{s}</text>
              <text x={lx} y={ly + 12} textAnchor="middle" className={`text-[10px] font-semibold ${selected ? "fill-white/90" : "fill-slate-500"}`}>{perf}%</text>
            </g>
          );
        })}
        <circle cx={cx} cy={cy} r={rInner - 4} fill="url(#compassCenter)" stroke="hsl(28 92% 45%)" strokeWidth={2} />
        <g transform={`translate(${cx - 18}, ${cy - 18})`}>
          <Sun className="text-white drop-shadow" width={36} height={36} />
        </g>
      </svg>
      <button type="button" onClick={() => onChange("?")} className={`text-sm px-5 py-2.5 rounded-full border-2 transition-all ${value === "?" ? "bg-amber-500 border-amber-500 text-slate-900 font-semibold shadow-md" : "bg-white border-slate-200 text-slate-600 hover:border-amber-400"}`}>
        Je ne sais pas
      </button>
    </div>
  );
};

// ---------- Lead schema (téléphone + email uniquement) ----------
const leadSchema = z.object({
  email: z.string().trim().email("Email invalide").max(255),
  phone: z.string().trim().min(8, "Téléphone requis").max(30).regex(/^[\d\s+\-().]+$/, "Format invalide"),
  consent: z.literal(true, { errorMap: () => ({ message: "Consentement requis" }) }),
});

const nameSchema = z.object({
  fullName: z.string().trim().min(2, "Nom complet requis").max(120, "Trop long"),
});

// ---------- Main page ----------
const STEP_LABELS = ["Localisation", "Logement", "Propriété", "Toiture", "Équipements", "Facture", "Projet", "Batterie", "Résultat"];
const TOTAL_STEPS = 8; // 8 étapes de questions, la 9e étant le résultat

export default function SimulateurSolaireLead() {
  const [step, setStep] = useState<number>(0);
  const [sim, setSim] = useState<Sim>({
    postalCode: "", city: "", housing: "", surface: "", ownership: "",
    orientation: "", roofType: "", equipments: [], monthlyBill: "",
    householdSize: "", projectHorizon: "", hasQuote: "", batteryInterest: "",
  });
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [computing, setComputing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showBattery, setShowBattery] = useState(false); // toggle affichage avec batterie

  const region = useMemo(() => detectRegion(sim.postalCode || ""), [sim.postalCode]);

  useEffect(() => {
    if (step === 9 && !unlocked) {
      const t = setTimeout(() => setShowLeadModal(true), 900);
      return () => clearTimeout(t);
    }
  }, [step, unlocked]);

  useEffect(() => {
    if (step > 0 && step < 9) {
      const el = document.getElementById("sim-wizard");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    if (step === 9) window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  const canContinue = (): boolean => {
    switch (step) {
      case 1: return /^\d{5}$/.test(sim.postalCode);
      case 2: return !!sim.housing && typeof sim.surface === "number" && sim.surface >= 20;
      case 3: return !!sim.ownership;
      case 4: return !!sim.orientation; // roofType facultatif
      case 5: return sim.equipments.length > 0;
      case 6: return typeof sim.monthlyBill === "number" && sim.monthlyBill > 0;
      case 7: return !!sim.projectHorizon; // hasQuote facultatif
      case 8: return true; // batterie facultative
      default: return true;
    }
  };

  const goNext = () => {
    if (step === 8) {
      setComputing(true);
      setTimeout(() => {
        setComputing(false);
        setStep(9);
      }, 2800);
      return;
    }
    setStep((s) => Math.min(s + 1, 9));
  };
  const goBack = () => setStep((s) => Math.max(s - 1, 1));

  const [lead, setLead] = useState({ email: "", phone: "", consent: false });
  const [leadErrors, setLeadErrors] = useState<Record<string, string>>({});
  const [showNameModal, setShowNameModal] = useState(false);
  const [nameForm, setNameForm] = useState({ fullName: "" });
  const [nameErrors, setNameErrors] = useState<Record<string, string>>({});
  const [leadId, setLeadId] = useState<string | null>(null);

  // ---------- Calculs "alléchants" (indicatifs) ----------
  const annualBill = typeof sim.monthlyBill === "number" ? sim.monthlyBill * 12 : 0;
  const suggest = typeof sim.monthlyBill === "number" && sim.monthlyBill > 0 ? suggestedKwc(sim.monthlyBill) : { kwc: 0, panels: 0, label: "—" };

  // Facteur région (bonus ensoleillement)
  const sunFactor = region.id === "fr-sud" ? 1.15 : region.id === "corse" || region.id.match(/reunion|guadeloupe|martinique|mayotte/) ? 1.25 : region.id === "fr-nord" ? 0.85 : region.id === "fr-so" ? 1.05 : 1;
  // Facteur orientation
  const orientPerf = (ORIENTATIONS.find((o) => o.id === sim.orientation)?.perf ?? 85) / 100;

  // Économies annuelles estimées (autoconsommation + revente surplus)
  const savingsMid = Math.round(annualBill * 0.50 * sunFactor * orientPerf);
  const savingsMin = Math.round(savingsMid * 0.85);
  const savingsMax = Math.round(savingsMid * 1.15);
  // Sur 25 ans (dégradation panneaux ~0.5%/an + inflation élec compensée)
  const savings25 = Math.round(savingsMid * 22);
  // Aides estimées (prime autoconsommation + TVA réduite)
  const aidesMin = suggest.kwc * 220;
  const aidesMax = suggest.kwc * 380;
  // ROI (retour sur investissement en années)
  const installCost = suggest.kwc * 2400;
  const roi = savingsMid > 0 ? Math.max(5, Math.min(12, +(installCost / (savingsMid + aidesMin / 25)).toFixed(1))) : 8;
  // CO2 évité (kg/an, 55g CO2/kWh évité solaire vs mix FR)
  const co2 = Math.round(suggest.kwc * 1100 * 0.055);
  const trees = Math.round(co2 / 25); // 1 arbre = ~25kg CO2/an

  // Scénario batterie
  const batteryCost = 4500;
  const savingsWithBattery = Math.round(savingsMid * 1.35); // meilleure autoconso
  const roiWithBattery = savingsWithBattery > 0 ? +((installCost + batteryCost) / (savingsWithBattery + aidesMin / 25)).toFixed(1) : 10;

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

    const payload = {
      source: "simulateur-solaire",
      region: region.label, regionId: region.id,
      postalCode: sim.postalCode, city: sim.city,
      housingType: sim.housing, houseSurfaceM2: sim.surface,
      ownership: sim.ownership, roofOrientation: sim.orientation, roofType: sim.roofType || null,
      equipments: sim.equipments, monthlyBill: sim.monthlyBill,
      householdSize: sim.householdSize || null, projectHorizon: sim.projectHorizon || null,
      hasQuote: sim.hasQuote || null, batteryInterest: sim.batteryInterest || null,
      annualBill,
      estimatedSavingsMin: savingsMin, estimatedSavingsMax: savingsMax, estimatedSavingsMid: savingsMid,
      estimatedSavings25y: savings25, estimatedAidesMin: aidesMin, estimatedAidesMax: aidesMax,
      estimatedROI: roi, estimatedCO2: co2,
      suggestedKwc: suggest.kwc, suggestedPanels: suggest.panels,
      consentAccepted: true, createdAt: new Date().toISOString(),
    };

    const { data: inserted, error } = await supabase.from("leads").insert({
      first_name: "Prospect",
      last_name: "Solaire",
      email: parsed.data.email, phone: parsed.data.phone,
      address: sim.city || "Non renseignée",
      postal_code: sim.postalCode, city: sim.city || "Non renseignée",
      property_type: sim.housing || null,
      is_owner: sim.ownership === "oui",
      needs: ["solaire", ...sim.equipments, ...(sim.batteryInterest === "oui" ? ["batterie"] : [])],
      notes: JSON.stringify(payload),
    }).select("id").single();

    setSubmitting(false);

    if (error) {
      toast.error("Une erreur est survenue. Merci de réessayer dans quelques minutes.");
      return;
    }
    setLeadId(inserted?.id ?? null);
    toast.success("Vos résultats sont débloqués !");
    setUnlocked(true);
    setShowLeadModal(false);
    // Étape "on y est presque" : demander le nom complet
    setTimeout(() => setShowNameModal(true), 400);
  };

  const submitName = async () => {
    const parsed = nameSchema.safeParse(nameForm);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.issues.forEach((i) => { errs[i.path[0] as string] = i.message; });
      setNameErrors(errs);
      return;
    }
    setNameErrors({});
    const parts = parsed.data.fullName.trim().split(/\s+/);
    const firstName = parts[0];
    const lastName = parts.slice(1).join(" ") || parts[0];

    setSubmitting(true);
    if (leadId) {
      const { error } = await supabase.from("leads").update({
        first_name: firstName, last_name: lastName,
      }).eq("id", leadId);
      setSubmitting(false);
      if (error) {
        toast.error("Impossible d'enregistrer votre nom. Réessayez.");
        return;
      }
    } else {
      setSubmitting(false);
    }
    toast.success(`Merci ${firstName} ! Un expert vous recontacte sous 24h.`);
    setShowNameModal(false);
  };

  const resultsProps = {
    sim, region, annualBill, savingsMin, savingsMax, savingsMid, savings25,
    aidesMin, aidesMax, roi, co2, trees, suggest,
    showBattery, setShowBattery, savingsWithBattery, batteryCost, roiWithBattery,
    unlocked,
  };

  return (
    <>
      <Helmet>
        <title>Simulateur solaire gratuit — économies & aides | Prime Énergies</title>
        <meta name="description" content="Estimez en 2 minutes vos économies potentielles grâce au solaire, le potentiel de votre logement et les aides disponibles dans votre région." />
      </Helmet>

      <Header />

      <main className="relative min-h-screen pb-20">
        <SolarBackdrop />

        {step === 0 && <EntryHero onStart={() => setStep(1)} />}

        {step > 0 && step < 9 && (
          <div id="sim-wizard" className="container mx-auto px-4 max-w-3xl pt-10 md:pt-16">
            <ProgressBar step={step} />

            <div className="relative mt-5">
              <div className="absolute -inset-1 bg-gradient-to-br from-amber-400/40 via-orange-500/30 to-amber-300/30 rounded-[2rem] blur-2xl opacity-70" aria-hidden />
              <div className="relative bg-white rounded-3xl shadow-[0_30px_80px_-15px_hsl(24_60%_8%/0.6)] border border-amber-200/60 p-6 md:p-10">
                {step === 1 && <Step1Location sim={sim} setSim={setSim} region={region} />}
                {step === 2 && <Step2Housing sim={sim} setSim={setSim} />}
                {step === 3 && <Step3Ownership sim={sim} setSim={setSim} />}
                {step === 4 && <Step4Orientation sim={sim} setSim={setSim} />}
                {step === 5 && <Step5Equipments sim={sim} setSim={setSim} />}
                {step === 6 && <Step6Bill sim={sim} setSim={setSim} />}
                {step === 7 && <Step7Project sim={sim} setSim={setSim} region={region} />}
                {step === 8 && <Step8Battery sim={sim} setSim={setSim} region={region} />}

                <div className="flex items-center justify-between mt-10 pt-6 border-t border-slate-100">
                  <Button variant="ghost" onClick={goBack} disabled={step === 1} className="text-slate-500 hover:text-slate-900">
                    <ArrowLeft className="w-4 h-4 mr-1.5" /> Retour
                  </Button>
                  <Button
                    onClick={goNext}
                    disabled={!canContinue()}
                    size="lg"
                    className="bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-slate-900 font-bold shadow-[0_15px_30px_-10px_hsl(35_95%_45%/0.7)] hover:scale-105 transition-all rounded-full px-7"
                  >
                    {step === 8 ? "Calculer mes économies" : "Continuer"} <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-white/80">
              <span className="inline-flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-amber-300" /> 100% gratuit et sans engagement</span>
              <span className="inline-flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 text-amber-300" /> Vos données sont protégées</span>
              <span className="inline-flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-amber-300" /> Moins de 2 minutes</span>
            </div>
          </div>
        )}

        {step === 9 && (
          <div className="container mx-auto px-4 max-w-4xl pt-10 md:pt-16 relative">
            <ResultsPanel {...resultsProps} onUnlockClick={() => setShowLeadModal(true)} onEdit={() => setStep(8)} />
          </div>
        )}

        {computing && <ComputingOverlay />}
      </main>

      {/* Lead modal redesigné */}
      <Dialog open={showLeadModal} onOpenChange={(o) => !submitting && setShowLeadModal(o)}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden [&>button]:hidden border-0">
          <button
            type="button"
            onClick={() => !submitting && setShowLeadModal(false)}
            aria-label="Fermer"
            className="absolute right-3 top-3 z-20 inline-flex items-center justify-center w-9 h-9 rounded-full bg-white/80 hover:bg-white text-slate-700 shadow-md backdrop-blur transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="grid md:grid-cols-[1fr_1.1fr]">
            {/* Left : preview alléchant */}
            <div className="relative hidden md:block bg-gradient-to-br from-amber-400 via-orange-500 to-orange-600 p-6 text-slate-900 overflow-hidden">
              <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-yellow-200/40 blur-3xl" aria-hidden />
              <div className="absolute -bottom-20 -left-10 w-52 h-52 rounded-full bg-orange-300/30 blur-3xl" aria-hidden />
              <div className="relative">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/15 backdrop-blur text-[10px] font-bold uppercase tracking-wider mb-4">
                  <Sparkles className="w-3 h-3" /> Aperçu
                </div>
                <p className="text-xs font-semibold text-slate-900/80 mb-1">Vous avez débloqué</p>
                <p className="text-4xl font-black leading-none">
                  {savingsMid > 0 ? savingsMid.toLocaleString("fr-FR") : "1 200"} €
                </p>
                <p className="text-sm font-bold text-slate-900/80 mt-1">d'économies estimées par an</p>

                <div className="mt-6 space-y-2.5">
                  {[
                    { icon: PiggyBank, label: `~${savings25.toLocaleString("fr-FR") || "27 000"} € sur 25 ans` },
                    { icon: Coins, label: `Aides ~${aidesMin.toLocaleString("fr-FR") || "1 200"} €` },
                    { icon: LineChart, label: `Rentabilité ~${roi} ans` },
                    { icon: Leaf, label: `${co2 || 700} kg CO₂ évités / an` },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2.5 text-sm text-slate-900/90 bg-white/25 backdrop-blur-sm rounded-lg px-3 py-2">
                      <item.icon className="w-4 h-4 shrink-0" />
                      <span className="font-semibold">{item.label}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-5 border-t border-slate-900/15 flex items-center gap-2 text-[11px] font-semibold text-slate-900/75">
                  <Lock className="w-3.5 h-3.5" /> Détail complet côté droit →
                </div>
              </div>
            </div>

            {/* Right : formulaire */}
            <div className="bg-white p-6 md:p-7">
              <DialogHeader className="text-left space-y-1.5 mb-5">
                <DialogTitle className="text-2xl font-bold text-slate-900 leading-tight">
                  Débloquez votre étude complète
                </DialogTitle>
                <DialogDescription className="text-slate-600 text-sm">
                  Détail par email + un expert vous rappelle sous 24h.<br />Sans engagement.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3.5">
                <div>
                  <Label htmlFor="lead-phone" className="text-slate-700 font-medium text-sm">Téléphone *</Label>
                  <div className="relative mt-1.5">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 text-lg">📞</span>
                    <Input
                      id="lead-phone" type="tel" value={lead.phone}
                      onChange={(e) => setLead({ ...lead, phone: e.target.value })}
                      placeholder="06 12 34 56 78"
                      className="h-12 pl-10 border-slate-200 focus-visible:ring-orange-500 text-base"
                    />
                  </div>
                  {leadErrors.phone && <p className="text-xs text-destructive mt-1">{leadErrors.phone}</p>}
                </div>

                <div>
                  <Label htmlFor="lead-email" className="text-slate-700 font-medium text-sm">Email *</Label>
                  <div className="relative mt-1.5">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 text-lg">✉️</span>
                    <Input
                      id="lead-email" type="email" value={lead.email}
                      onChange={(e) => setLead({ ...lead, email: e.target.value })}
                      placeholder="vous@email.com"
                      className="h-12 pl-10 border-slate-200 focus-visible:ring-orange-500 text-base"
                    />
                  </div>
                  {leadErrors.email && <p className="text-xs text-destructive mt-1">{leadErrors.email}</p>}
                </div>

                <div className="flex items-start gap-2 pt-1 rounded-lg bg-slate-50 border border-slate-200 p-2.5">
                  <Checkbox id="lead-consent" checked={lead.consent} onCheckedChange={(c) => setLead({ ...lead, consent: c === true })} className="mt-0.5" />
                  <label htmlFor="lead-consent" className="text-[11px] text-slate-600 leading-snug cursor-pointer">
                    J'accepte d'être recontacté par email et/ou téléphone dans le cadre de ma simulation solaire.
                  </label>
                </div>
                {leadErrors.consent && <p className="text-xs text-destructive">{leadErrors.consent}</p>}

                <Button
                  onClick={submitLead}
                  disabled={submitting}
                  size="lg"
                  className="w-full h-13 py-6 bg-gradient-to-r from-amber-400 via-orange-500 to-orange-600 hover:from-amber-500 hover:to-orange-600 text-slate-900 font-bold rounded-full shadow-[0_15px_35px_-8px_hsl(35_95%_45%/0.75)] hover:scale-[1.02] transition-all text-base"
                >
                  {submitting ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Envoi…</> : <><Sun className="w-5 h-5 mr-2" /> Voir mon étude complète <ArrowRight className="w-5 h-5 ml-2" /></>}
                </Button>

                <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 pt-1 text-[10px] font-semibold text-slate-500">
                  <span className="inline-flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-emerald-600" /> RGPD</span>
                  <span className="inline-flex items-center gap-1"><Star className="w-3 h-3 text-amber-500" /> 4,9/5</span>
                  <span className="inline-flex items-center gap-1"><Award className="w-3 h-3 text-orange-600" /> RGE</span>
                  <span className="inline-flex items-center gap-1"><Lock className="w-3 h-3 text-slate-400" /> Aucun spam</span>
                </div>

                <p className="text-[10px] text-center text-slate-400 leading-relaxed">
                  <Link to="/politique-confidentialite" className="underline hover:text-orange-600">Politique de confidentialité</Link>
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Étape "On y est presque !" — Nom complet */}
      <Dialog open={showNameModal} onOpenChange={(o) => !submitting && setShowNameModal(o)}>
        <DialogContent className="max-w-md p-0 overflow-hidden border-0">
          <div className="relative bg-gradient-to-br from-amber-400 via-orange-500 to-orange-600 p-6 text-slate-900">
            <div className="absolute -top-16 -right-16 w-52 h-52 rounded-full bg-yellow-200/40 blur-3xl" aria-hidden />
            <div className="absolute -bottom-16 -left-10 w-40 h-40 rounded-full bg-orange-300/30 blur-3xl" aria-hidden />
            <div className="relative">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/15 backdrop-blur text-[10px] font-bold uppercase tracking-wider mb-3">
                <Sparkles className="w-3 h-3" /> On y est presque !
              </div>
              <h3 className="text-2xl font-black leading-tight">Dernière étape</h3>
              <p className="text-sm font-semibold text-slate-900/80 mt-1">Votre étude est prête — comment doit-on vous appeler&nbsp;?</p>
            </div>
          </div>
          <div className="bg-white p-6 space-y-4">
            <div>
              <Label htmlFor="lead-name" className="text-slate-700 font-medium text-sm">Nom complet *</Label>
              <div className="relative mt-1.5">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="lead-name" type="text" value={nameForm.fullName}
                  onChange={(e) => setNameForm({ fullName: e.target.value })}
                  placeholder="Prénom Nom"
                  autoFocus
                  className="h-12 pl-10 border-slate-200 focus-visible:ring-orange-500 text-base"
                  onKeyDown={(e) => { if (e.key === "Enter" && !submitting) submitName(); }}
                />
              </div>
              {nameErrors.fullName && <p className="text-xs text-destructive mt-1">{nameErrors.fullName}</p>}
              <p className="text-[11px] text-slate-500 mt-2 flex items-start gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                Sert uniquement à personnaliser l'échange avec votre conseiller.
              </p>
            </div>
            <Button
              onClick={submitName}
              disabled={submitting}
              size="lg"
              className="w-full py-6 bg-gradient-to-r from-amber-400 via-orange-500 to-orange-600 hover:from-amber-500 hover:to-orange-600 text-slate-900 font-bold rounded-full shadow-[0_15px_35px_-8px_hsl(35_95%_45%/0.75)] hover:scale-[1.02] transition-all text-base"
            >
              {submitting ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Enregistrement…</> : <>Valider <ArrowRight className="w-5 h-5 ml-2" /></>}
            </Button>
          </div>
        </DialogContent>
      </Dialog>


      <Footer />
    </>
  );
}

// ---------- Entry hero (step 0) ----------
const EntryHero = ({ onStart }: { onStart: () => void }) => (
  <section className="relative overflow-hidden isolate">
    <img src={solarSimBg} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover opacity-50 z-0" loading="eager" />
    <div className="absolute inset-0 z-10 bg-gradient-to-b from-white/40 via-white/30 to-white/60" aria-hidden />
    <div className="absolute inset-0 z-10" aria-hidden style={{ backgroundImage: "radial-gradient(ellipse at top right, hsla(45,95%,55%,0.18), transparent 60%), radial-gradient(ellipse at bottom left, hsla(28,85%,55%,0.14), transparent 60%)" }} />
    <div className="absolute top-20 right-[10%] w-40 h-40 rounded-full bg-amber-400/30 blur-3xl animate-pulse z-10" aria-hidden />
    <div className="absolute bottom-32 left-[8%] w-32 h-32 rounded-full bg-orange-500/20 blur-3xl z-10" aria-hidden />
    <div className="relative z-20 container mx-auto px-4 py-20 md:py-28 text-center max-w-4xl">
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 backdrop-blur-md border border-amber-200 text-slate-800 text-xs font-semibold mb-6 shadow-lg">
        <Sparkles className="w-3.5 h-3.5 text-orange-500" /> Simulateur 100% gratuit · sans engagement
      </div>
      <h1 className="text-4xl md:text-6xl font-bold leading-[1.05] tracking-tight text-slate-900 mb-6">
        Combien votre maison peut-elle
        <span className="block mt-2 bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 bg-clip-text text-transparent">
          économiser grâce au solaire&nbsp;?
        </span>
      </h1>
      <p className="text-base md:text-xl text-slate-700 max-w-2xl mx-auto mb-10 leading-relaxed">
        Estimez en moins de 2 minutes le potentiel solaire de votre logement, vos économies possibles et les aides disponibles dans votre région.
      </p>
      <Button onClick={onStart} size="lg" className="bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-slate-900 font-bold text-base md:text-lg px-10 py-7 rounded-full shadow-[0_20px_50px_-10px_hsl(35_95%_45%/0.9)] hover:scale-105 transition-all group">
        <Sun className="w-5 h-5 mr-2 group-hover:rotate-45 transition-transform" />
        Démarrer ma simulation
        <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
      </Button>
      <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-slate-700 font-medium">
        <span className="inline-flex items-center gap-1.5"><Clock className="w-4 h-4 text-orange-500" /> 2 minutes chrono</span>
        <span className="inline-flex items-center gap-1.5"><Check className="w-4 h-4 text-orange-500" /> Sans engagement</span>
        <span className="inline-flex items-center gap-1.5"><MapPin className="w-4 h-4 text-orange-500" /> Adapté à votre région</span>
      </div>
      <div className="mt-14 grid grid-cols-3 gap-3 md:gap-6 max-w-2xl mx-auto">
        {[
          { icon: TrendingUp, value: "+12 000", label: "Simulations réalisées" },
          { icon: Star, value: "4.9/5", label: "Satisfaction clients" },
          { icon: Award, value: "RGE", label: "Partenaires certifiés" },
        ].map((s, i) => (
          <div key={i} className="bg-white/80 backdrop-blur-md border border-amber-200/60 rounded-2xl px-3 py-4 md:px-5 md:py-5 shadow-lg">
            <s.icon className="w-5 h-5 md:w-6 md:h-6 text-orange-500 mx-auto mb-2" />
            <div className="text-xl md:text-2xl font-bold text-slate-900">{s.value}</div>
            <div className="text-[10px] md:text-xs text-slate-600 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// ---------- UI primitives ----------
const ProgressBar = ({ step }: { step: number }) => (
  <div className="bg-white/95 backdrop-blur rounded-2xl py-4 px-5 md:px-6 shadow-[0_10px_30px_-10px_hsl(24_60%_8%/0.5)] border border-amber-200/50">
    <div className="flex items-center justify-between mb-3 text-xs font-semibold">
      <span className="text-slate-500">Étape <span className="text-slate-900">{step}</span> / {TOTAL_STEPS}</span>
      <span className="text-orange-600 inline-flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
        {STEP_LABELS[step - 1]}
      </span>
    </div>
    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
      <div className="h-full bg-gradient-to-r from-amber-400 via-orange-500 to-amber-300 rounded-full transition-all duration-700 shadow-[0_0_12px_hsl(35_95%_50%/0.6)]" style={{ width: `${(step / TOTAL_STEPS) * 100}%` }} />
    </div>
  </div>
);

const StepTitle = ({ icon: Icon, title, subtitle }: { icon: any; title: React.ReactNode; subtitle?: string }) => (
  <div className="mb-8">
    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-slate-900 mb-4 shadow-[0_12px_25px_-8px_hsl(35_95%_45%/0.6)]">
      <Icon className="w-7 h-7" />
    </div>
    <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">{title}</h2>
    {subtitle && <p className="text-sm md:text-base text-slate-600 mt-2 leading-relaxed">{subtitle}</p>}
  </div>
);

const InfoBanner = ({ children }: { children: React.ReactNode }) => (
  <div className="mt-6 p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50/60 border border-amber-200 text-sm text-slate-700 flex gap-3">
    <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
      <Sun className="w-4 h-4 text-orange-600" />
    </div>
    <div className="flex-1">{children}</div>
  </div>
);

const ChoiceCard = ({ selected, onClick, title, description, icon: Icon }: { selected: boolean; onClick: () => void; title: string; description?: string; icon?: any; }) => (
  <button type="button" onClick={onClick} aria-pressed={selected}
    className={`group relative w-full text-left p-5 rounded-2xl border-2 transition-all duration-300 overflow-hidden ${selected ? "border-orange-500 bg-gradient-to-br from-amber-50 via-white to-orange-50 shadow-[0_18px_40px_-15px_hsl(35_95%_45%/0.55)] -translate-y-0.5" : "border-slate-200 bg-white hover:border-amber-400 hover:shadow-[0_12px_30px_-15px_hsl(35_95%_45%/0.35)] hover:-translate-y-0.5"}`}>
    {selected && <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full bg-gradient-to-br from-amber-300/40 to-orange-400/30 blur-2xl pointer-events-none" aria-hidden />}
    <div className="relative flex items-start justify-between mb-4">
      {Icon && (
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 ${selected ? "bg-gradient-to-br from-amber-400 to-orange-500 text-slate-900 shadow-[0_8px_20px_-6px_hsl(35_95%_45%/0.6)] scale-110" : "bg-gradient-to-br from-slate-100 to-slate-50 text-slate-400 group-hover:from-amber-100 group-hover:to-orange-100 group-hover:text-orange-600"}`}>
          <Icon className="w-6 h-6" strokeWidth={2} />
        </div>
      )}
      <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${selected ? "bg-orange-500 text-white scale-100 shadow-md" : "bg-slate-100 text-transparent scale-90 group-hover:bg-amber-100"}`}>
        <Check className="w-3.5 h-3.5" strokeWidth={3} />
      </div>
    </div>
    <div className="relative">
      <h4 className={`font-bold text-base leading-tight ${selected ? "text-slate-900" : "text-slate-800"}`}>{title}</h4>
      {description && <p className={`text-xs mt-1 leading-relaxed ${selected ? "text-slate-600" : "text-slate-500"}`}>{description}</p>}
    </div>
  </button>
);

const PillButton = ({ selected, onClick, children }: any) => (
  <button type="button" onClick={onClick} className={`px-3 py-3 rounded-xl border-2 text-sm font-semibold transition-all ${selected ? "border-orange-500 bg-gradient-to-r from-amber-400 to-orange-500 text-slate-900 shadow-[0_8px_18px_-6px_hsl(35_95%_45%/0.55)]" : "border-slate-200 bg-white text-slate-600 hover:border-amber-400 hover:text-slate-900"}`}>
    {children}
  </button>
);

// ---------- Steps ----------

const Step1Location = ({ sim, setSim, region }: { sim: Sim; setSim: any; region: any }) => {
  const [cityTouched, setCityTouched] = useState(false);
  const [cityOptions, setCityOptions] = useState<string[]>([]);
  const [autoFilling, setAutoFilling] = useState(false);

  useEffect(() => {
    if (!/^\d{5}$/.test(sim.postalCode)) { setCityOptions([]); return; }
    if (cityTouched) return;
    const ctrl = new AbortController();
    setAutoFilling(true);
    fetch(`https://geo.api.gouv.fr/communes?codePostal=${sim.postalCode}&fields=nom&format=json`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((data: { nom: string }[]) => {
        const names = Array.isArray(data) ? data.map((d) => d.nom) : [];
        setCityOptions(names);
        if (names.length >= 1 && !cityTouched) setSim((prev: Sim) => ({ ...prev, city: names[0] }));
      })
      .catch(() => {})
      .finally(() => setAutoFilling(false));
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sim.postalCode]);

  return (
    <div>
      <StepTitle icon={MapPin} title="Où se situe votre logement ?" subtitle="Nous adaptons votre simulation à votre zone géographique et son ensoleillement." />
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label className="text-slate-700 font-medium">Code postal *</Label>
          <Input value={sim.postalCode}
            onChange={(e) => { setSim({ ...sim, postalCode: e.target.value.replace(/\D/g, "").slice(0, 5) }); setCityTouched(false); }}
            placeholder="75001" inputMode="numeric" className="text-lg h-12 mt-1.5 border-slate-200 focus-visible:ring-orange-500" />
        </div>
        <div>
          <Label className="text-slate-700 font-medium">Ville <span className="text-slate-400 font-normal">(modifiable)</span></Label>
          <Input value={sim.city} onChange={(e) => { setCityTouched(true); setSim({ ...sim, city: e.target.value }); }}
            list={cityOptions.length > 1 ? "cp-cities" : undefined}
            placeholder={autoFilling ? "Recherche…" : "Paris"} className="h-12 mt-1.5 border-slate-200 focus-visible:ring-orange-500" />
          {cityOptions.length > 1 && <datalist id="cp-cities">{cityOptions.map((n) => <option key={n} value={n} />)}</datalist>}
          {cityOptions.length > 1 && !cityTouched && <p className="text-xs text-slate-500 mt-1">{cityOptions.length} communes pour ce code postal — vous pouvez modifier</p>}
        </div>
      </div>

      {/^\d{5}$/.test(sim.postalCode) && (
        <InfoBanner>
          <div className="flex items-start gap-4">
            {REGION_SHAPES[region.id] && <img src={REGION_SHAPES[region.id]} alt={`Silhouette ${region.label}`} className="w-16 h-16 md:w-20 md:h-20 object-contain shrink-0 opacity-90" loading="lazy" />}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-900 mb-1.5">Votre zone est analysée — {region.label}</p>
              <ul className="space-y-1 text-slate-600">
                <li>• Ensoleillement régional : <strong className="text-orange-600">{region.sun}</strong></li>
                <li>• Aides possibles selon votre éligibilité</li>
                <li>• Simulation adaptée à votre région</li>
                {region.sun.toLowerCase().includes("nuageux") && <li>• Même par temps couvert, les panneaux photovoltaïques captent la lumière diffuse et restent pertinents.</li>}
              </ul>
            </div>
          </div>
        </InfoBanner>
      )}
    </div>
  );
};

// ---------- Surface slider ----------
const SurfaceSlider = ({ value, onChange }: { value: number | ""; onChange: (n: number) => void }) => {
  const v = typeof value === "number" ? value : 100;
  const pct = Math.max(0, Math.min(100, ((v - 20) / (400 - 20)) * 100));
  const tier = v < 80 ? "Petit logement" : v < 130 ? "Logement standard" : v < 200 ? "Grand logement" : "Très grand logement";
  return (
    <div className="relative p-5 md:p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 border border-amber-400/30 shadow-[0_15px_40px_-15px_hsl(24_60%_8%/0.5)] overflow-hidden">
      <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-amber-400/20 blur-3xl pointer-events-none" aria-hidden />
      <div className="absolute -bottom-12 -left-12 w-40 h-40 rounded-full bg-orange-500/20 blur-3xl pointer-events-none" aria-hidden />
      <div className="relative">
        <div className="flex items-end justify-between mb-5 gap-4">
          <div>
            <p className="text-amber-300 text-[11px] font-bold uppercase tracking-widest mb-1">Superficie habitable</p>
            <div className="flex items-baseline gap-2">
              <input type="number" min={20} max={1000} value={typeof value === "number" ? value : ""}
                onChange={(e) => { const n = e.target.value === "" ? 0 : Math.max(0, Math.min(1000, parseInt(e.target.value, 10) || 0)); onChange(n); }}
                placeholder="100" className="bg-transparent text-white text-5xl md:text-6xl font-bold tracking-tight w-32 md:w-40 outline-none border-b-2 border-amber-400/40 focus:border-amber-300 transition-colors" />
              <span className="text-amber-300 text-2xl md:text-3xl font-bold">m²</span>
            </div>
          </div>
          <span className="text-xs font-semibold text-slate-900 bg-gradient-to-r from-amber-300 to-amber-400 px-3 py-1.5 rounded-full whitespace-nowrap shadow-md">{tier}</span>
        </div>
        <div className="relative pt-2">
          <Slider min={20} max={400} step={5} value={[v]} onValueChange={(vals) => onChange(vals[0])}
            className="[&_[role=slider]]:h-7 [&_[role=slider]]:w-7 [&_[role=slider]]:border-2 [&_[role=slider]]:border-amber-300 [&_[role=slider]]:bg-gradient-to-br [&_[role=slider]]:from-amber-300 [&_[role=slider]]:to-orange-500 [&_[role=slider]]:shadow-[0_0_20px_hsl(35_95%_60%/0.7)] [&_[role=slider]]:focus-visible:ring-amber-300 [&>span:first-child]:h-2 [&>span:first-child]:bg-white/10 [&_[data-orientation=horizontal]>span]:bg-gradient-to-r [&_[data-orientation=horizontal]>span]:from-amber-400 [&_[data-orientation=horizontal]>span]:to-orange-500" />
          <div className="relative mt-3 h-6 px-[14px]">
            {[20, 80, 130, 200, 400].map((m) => {
              const left = ((m - 20) / (400 - 20)) * 100;
              return (
                <span key={m} className="absolute top-0 flex flex-col items-center gap-1 text-[10px] text-white/60 font-semibold -translate-x-1/2" style={{ left: `${left}%` }}>
                  <span className="w-px h-1.5 bg-white/30" />{m}m²
                </span>
              );
            })}
          </div>
        </div>
        <div className="mt-5 flex items-center gap-2 text-amber-200/80 text-xs">
          <Ruler className="w-3.5 h-3.5" /><span>Faites glisser ou saisissez directement votre superficie</span>
        </div>
      </div>
      <div className="absolute left-0 right-0 bottom-0 h-1">
        <div className="h-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-300" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

const Step2Housing = ({ sim, setSim }: { sim: Sim; setSim: any }) => {
  const [showAptDisclaimer, setShowAptDisclaimer] = useState(false);
  const [aptAcknowledged, setAptAcknowledged] = useState(false);
  const handleHousingSelect = (id: HousingType) => {
    setSim({ ...sim, housing: id });
    if (id === "appartement" && !aptAcknowledged) setShowAptDisclaimer(true);
  };
  return (
    <div>
      <StepTitle icon={Home} title="Quel logement souhaitez-vous équiper ?" />
      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
        {HOUSING.map((h) => (
          <ChoiceCard key={h.id} icon={h.icon} title={h.label} description={h.desc} selected={sim.housing === h.id} onClick={() => handleHousingSelect(h.id)} />
        ))}
      </div>
      <div className="mt-8">
        <h3 className="font-semibold text-slate-900 mb-3">Quelle est la superficie de votre logement ?</h3>
        <SurfaceSlider value={sim.surface} onChange={(n) => setSim({ ...sim, surface: n })} />
      </div>
      {sim.housing && (
        <InfoBanner>
          {sim.housing === "appartement" ? "Votre projet peut nécessiter une étude spécifique. Vous pouvez continuer la simulation pour obtenir une première estimation." : "Très bon profil pour une simulation solaire. Les maisons permettent généralement d'exploiter directement la toiture pour produire une partie de l'électricité consommée."}
          {typeof sim.surface === "number" && sim.surface > 0 && <p className="mt-2 text-xs text-slate-500">Cette information nous aide à estimer indirectement le potentiel de toiture disponible.</p>}
        </InfoBanner>
      )}
      <Dialog open={showAptDisclaimer} onOpenChange={setShowAptDisclaimer}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto mb-3 w-14 h-14 rounded-full bg-orange-100 flex items-center justify-center">
              <X className="w-8 h-8 text-orange-600" strokeWidth={2.5} />
            </div>
            <DialogTitle className="text-center text-lg">Installation solaire en appartement</DialogTitle>
            <DialogDescription className="text-center pt-2 space-y-2 text-slate-600">
              <span className="block">L'installation en copropriété nécessite un accord préalable et n'entre pas dans les projets que nous traitons actuellement.</span>
              <span className="block">Vous pouvez néanmoins poursuivre la simulation à titre indicatif. Si un programme adapté à votre situation venait à ouvrir, nous pourrons vous en informer par email.</span>
            </DialogDescription>
          </DialogHeader>
          <Button onClick={() => { setAptAcknowledged(true); setShowAptDisclaimer(false); }} className="w-full h-11 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold">
            Continuer la simulation
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const Step3Ownership = ({ sim, setSim }: { sim: Sim; setSim: any }) => (
  <div>
    <StepTitle icon={Building} title="Vous êtes propriétaire du logement ?" />
    <div className="grid sm:grid-cols-3 gap-3">
      {OWNERSHIPS.map((o) => (
        <ChoiceCard key={o.id} icon={o.id === "oui" ? Check : o.id === "non" ? Lock : Sparkles} title={o.label} description={o.desc} selected={sim.ownership === o.id} onClick={() => setSim({ ...sim, ownership: o.id })} />
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
    <StepTitle icon={Compass} title="Quelle est l'orientation principale de votre toiture ?" subtitle="Le Sud capte généralement le maximum de soleil, mais d'autres orientations restent intéressantes." />
    <div className="grid md:grid-cols-[1fr_1fr] gap-8 items-center">
      <Compass8 value={sim.orientation} onChange={(o) => setSim({ ...sim, orientation: o })} />
      <div className="space-y-3">
        {sim.orientation ? <InfoBanner>{orientationFeedback(sim.orientation as Orientation)}</InfoBanner> : (
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-600">
            <Compass className="w-6 h-6 text-slate-400 mb-2" />
            Sélectionnez l'orientation correspondant à votre toiture. Plus l'exposition est proche du Sud, plus la production solaire est généralement importante.
          </div>
        )}
      </div>
    </div>

    {/* Type de toiture — facultatif */}
    <div className="mt-8 pt-6 border-t border-slate-100">
      <div className="flex items-center gap-2 mb-3">
        <h3 className="font-semibold text-slate-900">Type de toiture</h3>
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Facultatif</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {ROOF_TYPES.map((r) => (
          <button key={r.id} type="button" onClick={() => setSim({ ...sim, roofType: sim.roofType === r.id ? "" : r.id })}
            className={`p-3 rounded-xl border-2 text-left transition-all ${sim.roofType === r.id ? "border-orange-500 bg-gradient-to-br from-amber-50 to-orange-50 shadow-md" : "border-slate-200 bg-white hover:border-amber-400"}`}>
            <p className="text-sm font-bold text-slate-900">{r.label}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">{r.desc}</p>
          </button>
        ))}
      </div>

      {/* Aperçu 3D */}
      {ROOF_MODELS[sim.roofType] && (
        <div className="mt-5 relative rounded-2xl overflow-hidden border-2 border-amber-200 bg-gradient-to-b from-sky-200 via-sky-100 to-blue-50 shadow-[0_20px_50px_-20px_hsl(35_95%_45%/0.5)] animate-fade-in">
          <div className="absolute top-3 left-3 z-10 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-400/95 backdrop-blur text-[10px] font-bold uppercase tracking-wider text-slate-900 shadow-md">
            Aperçu 3D · {ROOF_TYPES.find(r => r.id === sim.roofType)?.label}
          </div>
          <div className="absolute top-3 right-3 z-10 text-[10px] text-slate-700/80 font-medium bg-white/70 backdrop-blur px-2 py-1 rounded-full">Cliquez et glissez pour tourner</div>
          <div className="h-[280px] md:h-[340px]">
            <RoofPreview3D url={ROOF_MODELS[sim.roofType]!} />
          </div>
        </div>
      )}
    </div>
  </div>
);

const ROOF_MODELS: Record<string, string | undefined> = {
  "tuiles": roofTuilesAsset.url,
  "ardoise": roofArdoisesAsset.url,
  "bac-acier": roofBacAcierAsset.url,
  "toit-plat": roofPlateAsset.url,
  "?": undefined,
  "": undefined,
};

function RoofModel({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} />;
}

const RoofPreview3D = ({ url }: { url: string }) => (
  <Canvas camera={{ position: [4, 3, 5], fov: 45 }} dpr={[1, 1.5]}>
    <color attach="background" args={["#dbeafe"]} />
    <Suspense fallback={null}>
      <Stage environment="sunset" intensity={0.4} adjustCamera={1.2} shadows={false}>
        <RoofModel url={url} />
      </Stage>
    </Suspense>
    <OrbitControls enablePan={false} enableZoom={false} minPolarAngle={Math.PI / 6} maxPolarAngle={Math.PI / 2.2} />
  </Canvas>
);

const Step5Equipments = ({ sim, setSim }: { sim: Sim; setSim: any }) => {
  const toggle = (id: string) => {
    if (id === "?") { setSim({ ...sim, equipments: sim.equipments.includes("?") ? [] : ["?"] }); return; }
    const without = sim.equipments.filter((e) => e !== "?");
    setSim({ ...sim, equipments: without.includes(id) ? without.filter((e) => e !== id) : [...without, id] });
  };
  return (
    <div>
      <StepTitle icon={Zap} title="Quels équipements possédez-vous ?" subtitle="Plusieurs choix possibles. Cela nous aide à mieux estimer votre consommation." />
      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
        {EQUIPMENTS.map((e) => (
          <ChoiceCard key={e.id} icon={e.icon} title={e.label} description={e.desc} selected={sim.equipments.includes(e.id)} onClick={() => toggle(e.id)} />
        ))}
      </div>
      {sim.equipments.length > 0 && (
        <InfoBanner>
          Ces équipements peuvent augmenter l'intérêt du solaire. Plus une partie de votre consommation est régulière, plus l'autoconsommation devient intéressante.
          {sim.equipments.includes("clim") && <p className="mt-2 text-xs text-slate-500">La climatisation peut représenter un poste important, notamment dans les régions ensoleillées.</p>}
          {sim.equipments.includes("ve") && <p className="mt-2 text-xs text-slate-500">Une voiture électrique double souvent la rentabilité d'une installation solaire.</p>}
        </InfoBanner>
      )}
    </div>
  );
};

const Step6Bill = ({ sim, setSim }: { sim: Sim; setSim: any }) => (
  <div>
    <StepTitle icon={Zap} title={<>Quel est le montant moyen de votre facture d'électricité <span className="underline decoration-orange-500 decoration-[3px] underline-offset-4 font-bold text-orange-600">par mois</span> ?</>} />
    <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50/70 px-3 py-2 text-xs text-slate-700">
      💡 <span className="font-semibold">À indiquer bien en €/mois.</span> Si vous êtes facturé tous les 2 mois, divisez par 2. Si annuel, divisez par 12.
    </div>
    <div className="grid grid-cols-5 gap-2 mb-5">
      {BILL_PRESETS.map((v, i) => (
        <PillButton key={v} selected={sim.monthlyBill === v} onClick={() => setSim({ ...sim, monthlyBill: v })}>{v} €{i === BILL_PRESETS.length - 1 ? "+" : ""}</PillButton>
      ))}
    </div>
    <Label className="text-slate-700 font-medium">Ou saisissez un montant précis (€/mois)</Label>
    <Input type="number" min={0} value={sim.monthlyBill === "" ? "" : sim.monthlyBill}
      onChange={(e) => setSim({ ...sim, monthlyBill: e.target.value === "" ? "" : Math.max(0, Number(e.target.value)) })}
      placeholder="180" className="text-lg h-12 mt-1.5 border-slate-200 focus-visible:ring-orange-500" />
    {typeof sim.monthlyBill === "number" && sim.monthlyBill > 0 && (
      <InfoBanner>
        <p className="font-semibold text-slate-900 text-base">{sim.monthlyBill} € / mois = <span className="text-orange-600">{(sim.monthlyBill * 12).toLocaleString("fr-FR")} €</span> / an</p>
        <p className="mt-1 text-slate-600">Une partie de cette dépense pourrait être réduite grâce à une production solaire adaptée à votre logement.</p>
      </InfoBanner>
    )}

    {/* Foyer — facultatif */}
    <div className="mt-8 pt-6 border-t border-slate-100">
      <div className="flex items-center gap-2 mb-3">
        <Users className="w-4 h-4 text-orange-600" />
        <h3 className="font-semibold text-slate-900">Combien de personnes dans le foyer ?</h3>
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Facultatif</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {[1, 2, 3, 4, 5, 6].map((n) => (
          <PillButton key={n} selected={sim.householdSize === n} onClick={() => setSim({ ...sim, householdSize: sim.householdSize === n ? "" : n })}>
            {n === 6 ? "6 +" : n}
          </PillButton>
        ))}
      </div>
    </div>
  </div>
);

// ---------- Step 7 : Projet (horizon + devis) ----------
const Step7Project = ({ sim, setSim, region: _region }: { sim: Sim; setSim: any; region: any }) => (
  <div>
    <StepTitle icon={CalendarClock} title="Votre projet solaire" subtitle="Dernières précisions pour finaliser votre estimation personnalisée." />

    {/* Horizon */}
    <div>
      <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
        <CalendarClock className="w-4 h-4 text-orange-600" /> À quel horizon envisagez-vous ce projet ?
      </h3>
      <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-2">
        {PROJECT_HORIZONS.map((h) => (
          <button key={h.id} type="button" onClick={() => setSim({ ...sim, projectHorizon: h.id })}
            className={`p-3.5 rounded-xl border-2 text-left transition-all ${sim.projectHorizon === h.id ? "border-orange-500 bg-gradient-to-br from-amber-50 to-orange-50 shadow-md -translate-y-0.5" : "border-slate-200 bg-white hover:border-amber-400"}`}>
            <p className="text-sm font-bold text-slate-900">{h.label}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">{h.desc}</p>
          </button>
        ))}
      </div>
    </div>

    {/* Devis */}
    <div className="mt-7">
      <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
        <FileText className="w-4 h-4 text-orange-600" /> Avez-vous déjà reçu un devis solaire ?
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Facultatif</span>
      </h3>
      <div className="grid grid-cols-2 gap-2 max-w-sm">
        <PillButton selected={sim.hasQuote === "oui"} onClick={() => setSim({ ...sim, hasQuote: sim.hasQuote === "oui" ? "" : "oui" })}>Oui</PillButton>
        <PillButton selected={sim.hasQuote === "non"} onClick={() => setSim({ ...sim, hasQuote: sim.hasQuote === "non" ? "" : "non" })}>Non, pas encore</PillButton>
      </div>
    </div>
  </div>
);

// ---------- Step 8 : Batterie de stockage (étape dédiée) ----------
const Step8Battery = ({ sim, setSim, region }: { sim: Sim; setSim: any; region: any }) => {
  const showWithBattery = sim.batteryInterest === "oui" || sim.batteryInterest === "peut-etre";
  const gifSrc = showWithBattery ? pvBatterieGif.url : pvOnduleurGif.url;

  return (
    <div>
      <StepTitle icon={BatteryCharging} title="Souhaitez-vous une batterie de stockage ?" subtitle="Stockez votre énergie solaire pour la réutiliser la nuit ou en cas de coupure." />

      {/* Visuel animé */}
      <div className="relative rounded-3xl overflow-hidden border-2 border-amber-200 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 shadow-[0_25px_60px_-20px_hsl(35_95%_45%/0.55)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(35_95%_60%/0.25),transparent_60%)]" aria-hidden />
        <div className="relative flex items-center justify-center p-6 md:p-8 min-h-[280px]">
          <img
            key={gifSrc}
            src={gifSrc}
            alt={showWithBattery ? "Installation solaire avec batterie de stockage" : "Installation solaire avec onduleur"}
            className="max-h-[280px] w-auto object-contain animate-fade-in drop-shadow-[0_10px_30px_hsl(35_95%_45%/0.35)]"
          />
        </div>
        <div className="relative px-6 pb-5 flex flex-wrap items-center justify-center gap-2">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all ${!showWithBattery ? "bg-amber-400 text-slate-900 shadow-md" : "bg-white/10 text-white/70"}`}>
            Sans batterie
          </span>
          <span className="text-white/40 text-xs">↔</span>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all ${showWithBattery ? "bg-amber-400 text-slate-900 shadow-md" : "bg-white/10 text-white/70"}`}>
            <BatteryCharging className="w-3 h-3" /> Avec batterie
          </span>
        </div>
      </div>

      {/* Bénéfices */}
      <div className="grid sm:grid-cols-3 gap-3 mt-6">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50/50 border border-amber-200">
          <ShieldCheck className="w-5 h-5 text-orange-600 mb-2" />
          <p className="text-sm font-bold text-slate-900">Backup anti-coupure</p>
          <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">Vos appareils continuent de fonctionner en cas de coupure réseau.{region.island && <> Essentiel dans les îles.</>}</p>
        </div>
        <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50/50 border border-amber-200">
          <TrendingUp className="w-5 h-5 text-orange-600 mb-2" />
          <p className="text-sm font-bold text-slate-900">Meilleure autonomie</p>
          <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">Consommez votre propre énergie même la nuit. Autoconsommation jusqu'à 80%.</p>
        </div>
        <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50/50 border border-amber-200">
          <PiggyBank className="w-5 h-5 text-orange-600 mb-2" />
          <p className="text-sm font-bold text-slate-900">Rentable à long terme</p>
          <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">Coût initial supérieur, mais protège contre la hausse continue du prix de l'électricité.</p>
        </div>
      </div>

      {/* Choix */}
      <div className="mt-7">
        <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
          <BatteryCharging className="w-4 h-4 text-orange-600" /> Votre choix
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Facultatif</span>
        </h3>
        <div className="grid grid-cols-3 gap-2">
          <PillButton selected={sim.batteryInterest === "oui"} onClick={() => setSim({ ...sim, batteryInterest: sim.batteryInterest === "oui" ? "" : "oui" })}>Oui, intéressé</PillButton>
          <PillButton selected={sim.batteryInterest === "peut-etre"} onClick={() => setSim({ ...sim, batteryInterest: sim.batteryInterest === "peut-etre" ? "" : "peut-etre" })}>Peut-être</PillButton>
          <PillButton selected={sim.batteryInterest === "non"} onClick={() => setSim({ ...sim, batteryInterest: sim.batteryInterest === "non" ? "" : "non" })}>Non merci</PillButton>
        </div>
        {sim.batteryInterest && sim.batteryInterest !== "non" && (
          <p className="mt-3 text-xs text-slate-600 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-orange-600" />
            Vous pourrez comparer les résultats <strong>avec et sans batterie</strong> à l'écran final.
          </p>
        )}
      </div>
    </div>
  );
};

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
    const lineTimer = setInterval(() => setActiveLine((i) => (i + 1) % COMPUTE_LINES.length), 520);
    const startedAt = Date.now();
    const progTimer = setInterval(() => {
      const elapsed = Date.now() - startedAt;
      setProgress(Math.min(98, 6 + (elapsed / 2800) * 92));
    }, 60);
    return () => { clearInterval(lineTimer); clearInterval(progTimer); };
  }, []);
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gradient-to-br from-[hsl(24_50%_8%)] via-[hsl(28_55%_12%)] to-[hsl(24_45%_6%)] animate-in fade-in duration-300">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-amber-400/25 blur-[120px] animate-pulse" aria-hidden />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-orange-500/30 blur-[100px]" aria-hidden />
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
        {Array.from({ length: 14 }).map((_, i) => (
          <div key={i} className="absolute w-1 h-1 rounded-full bg-amber-300/70" style={{ left: `${(i * 37) % 100}%`, top: `${(i * 53) % 100}%`, animation: `float ${3 + (i % 4)}s ease-in-out infinite`, animationDelay: `${i * 0.2}s` }} />
        ))}
      </div>
      <div className="relative text-center max-w-md px-6">
        <div className="relative mx-auto w-40 h-40 mb-10">
          <div className="absolute inset-0 rounded-full border-2 border-amber-300/30 animate-ping" />
          <div className="absolute inset-2 rounded-full border border-amber-200/40 animate-[ping_2.5s_ease-in-out_infinite]" />
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
          <div className="absolute inset-8 rounded-full bg-gradient-to-br from-amber-200 via-amber-400 to-orange-500 shadow-[0_0_60px_hsl(45_95%_60%/0.7)] flex items-center justify-center">
            <Sun className="w-12 h-12 text-white drop-shadow-lg animate-pulse" strokeWidth={1.5} />
          </div>
        </div>
        <h2 className="text-white text-2xl md:text-3xl font-bold tracking-tight mb-3">Calcul de votre potentiel solaire</h2>
        <p className="text-white/70 text-sm mb-8">Notre moteur analyse votre profil en temps réel</p>
        <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden mb-6">
          <div className="h-full bg-gradient-to-r from-amber-400 via-orange-400 to-amber-300 rounded-full shadow-[0_0_12px_hsl(45_95%_60%/0.6)] transition-all duration-200" style={{ width: `${progress}%` }} />
        </div>
        <ul className="space-y-2.5 text-left">
          {COMPUTE_LINES.map((line, i) => {
            const done = i < activeLine;
            const active = i === activeLine;
            return (
              <li key={i} className={`flex items-center gap-3 text-sm transition-all duration-300 ${active ? "text-white" : done ? "text-white/60" : "text-white/30"}`}>
                {done ? <span className="w-5 h-5 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-slate-900 flex items-center justify-center flex-shrink-0"><Check className="w-3 h-3" strokeWidth={3} /></span> : active ? <Loader2 className="w-5 h-5 animate-spin text-amber-300 flex-shrink-0" /> : <span className="w-5 h-5 rounded-full border border-white/20 flex-shrink-0" />}
                <span className={active ? "font-semibold" : ""}>{line}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

// ---------- Count-up hook ----------
const useCountUp = (target: number, duration = 1400) => {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (target <= 0) { setN(0); return; }
    const start = Date.now();
    const id = setInterval(() => {
      const elapsed = Date.now() - start;
      const p = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.round(target * eased));
      if (p >= 1) clearInterval(id);
    }, 30);
    return () => clearInterval(id);
  }, [target, duration]);
  return n;
};

// ---------- Results Panel (hero visible + teaser flouté) ----------
const ResultsPanel = ({
  sim, region, annualBill, savingsMin, savingsMax, savingsMid, savings25,
  aidesMin, aidesMax, roi, co2, trees, suggest,
  showBattery, setShowBattery, savingsWithBattery, batteryCost, roiWithBattery,
  unlocked, onUnlockClick, onEdit,
}: any) => {
  const housingLabel = HOUSING.find((h) => h.id === sim.housing)?.label || "—";
  const surfaceLabel = typeof sim.surface === "number" ? `${sim.surface} m²` : "—";
  const orientationLabel = ORIENTATIONS.find((o) => o.id === sim.orientation)?.label || (sim.orientation === "?" ? "À confirmer" : "—");

  const displayedYearly = showBattery ? savingsWithBattery : savingsMid;
  const displayedYearlyCounted = useCountUp(displayedYearly);
  const has25 = savings25 > 0;

  return (
    <div className="bg-white rounded-3xl shadow-[0_30px_80px_-20px_hsl(24_60%_8%/0.55)] border border-amber-300/40 overflow-hidden">
      {/* HERO — TOUJOURS visible avec le gros chiffre alléchant */}
      <div className="relative bg-gradient-to-br from-amber-400 via-orange-500 to-orange-600 px-6 md:px-10 py-10 md:py-12 text-slate-900 overflow-hidden">
        <div className="absolute -top-10 -right-10 w-56 h-56 rounded-full bg-yellow-200/40 blur-3xl" aria-hidden />
        <div className="absolute -bottom-14 -left-14 w-64 h-64 rounded-full bg-orange-300/40 blur-3xl" aria-hidden />
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.4), transparent 40%)" }} aria-hidden />

        <div className="relative">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/15 backdrop-blur text-xs font-bold mb-4 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> Votre potentiel solaire
          </div>
          <p className="text-sm md:text-base font-semibold text-slate-900/80">Vous pourriez économiser jusqu'à</p>
          <div className="flex items-baseline gap-3 mt-2 flex-wrap">
            <span className="text-6xl md:text-8xl font-black tabular-nums leading-none tracking-tight drop-shadow-sm">
              {displayedYearlyCounted.toLocaleString("fr-FR")}
            </span>
            <span className="text-3xl md:text-4xl font-black">€</span>
            <span className="text-lg md:text-xl font-bold text-slate-900/80">/ an</span>
          </div>
          <p className="text-sm text-slate-900/75 mt-3 max-w-xl">
            Estimation personnalisée pour {region.label}{sim.city ? ` — ${sim.city}` : ""} · facture actuelle {annualBill.toLocaleString("fr-FR")} €/an
            {showBattery && <span className="ml-2 inline-flex items-center gap-1 text-xs bg-slate-900/20 backdrop-blur px-2 py-0.5 rounded-full font-bold"><BatteryCharging className="w-3 h-3" /> Avec batterie</span>}
          </p>

          {sim.batteryInterest && sim.batteryInterest !== "non" && (
            <div className="mt-5 inline-flex items-center gap-1 p-1 rounded-full bg-slate-900/15 backdrop-blur">
              <button onClick={() => setShowBattery(false)} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${!showBattery ? "bg-white text-slate-900 shadow-md" : "text-slate-900/70 hover:text-slate-900"}`}>
                Sans batterie
              </button>
              <button onClick={() => setShowBattery(true)} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all inline-flex items-center gap-1 ${showBattery ? "bg-white text-slate-900 shadow-md" : "text-slate-900/70 hover:text-slate-900"}`}>
                <BatteryCharging className="w-3 h-3" /> Avec batterie
              </button>
            </div>
          )}
        </div>
      </div>

      {/* TEASER : cartes floutées si !unlocked */}
      <div className="relative p-6 md:p-10">
        {!unlocked && (
          <div className="absolute top-4 right-4 z-20 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 text-amber-300 text-[11px] font-bold shadow-lg">
            <Lock className="w-3 h-3" /> Contenu verrouillé
          </div>
        )}

        <div className={`transition-all duration-500 ${!unlocked ? "blur-md select-none pointer-events-none" : "blur-0"}`} aria-hidden={!unlocked}>
          {/* Chiffres clés en grille */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8">
            <StatCard icon={PiggyBank} label="Sur 25 ans" value={`~${(has25 ? savings25 : 27000).toLocaleString("fr-FR")} €`} accent="from-emerald-100 to-emerald-50" iconColor="text-emerald-700" />
            <StatCard icon={Zap} label="Installation" value={suggest.kwc > 0 ? `${suggest.kwc} kWc` : "6 kWc"} sub={suggest.panels > 0 ? `~${suggest.panels} panneaux` : "~12 panneaux"} accent="from-amber-100 to-orange-50" iconColor="text-orange-600" />
            <StatCard icon={Coins} label="Aides estimées" value={`${aidesMin.toLocaleString("fr-FR")}–${aidesMax.toLocaleString("fr-FR")} €`} accent="from-blue-100 to-blue-50" iconColor="text-blue-700" />
            <StatCard icon={LineChart} label="Rentabilité" value={`~${showBattery ? roiWithBattery : roi} ans`} accent="from-purple-100 to-purple-50" iconColor="text-purple-700" />
          </div>

          {/* Comparaison batterie */}
          {sim.batteryInterest && sim.batteryInterest !== "non" && (
            <div className="mb-8 p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white border border-amber-400/30 relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-amber-400/20 blur-3xl" aria-hidden />
              <div className="relative">
                <div className="flex items-center gap-2 mb-4">
                  <BatteryCharging className="w-5 h-5 text-amber-300" />
                  <h3 className="font-bold text-amber-300 uppercase tracking-widest text-xs">Comparaison avec / sans batterie</h3>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className={`p-4 rounded-xl border-2 transition-all ${!showBattery ? "border-amber-400 bg-white/10" : "border-white/10"}`}>
                    <p className="text-[11px] uppercase tracking-widest text-white/60 font-bold mb-1">Sans batterie</p>
                    <p className="text-2xl font-bold">{savingsMid.toLocaleString("fr-FR")} € / an</p>
                    <p className="text-xs text-white/70 mt-1">ROI : {roi} ans · Investissement estimé : {(suggest.kwc * 2400).toLocaleString("fr-FR")} €</p>
                  </div>
                  <div className={`p-4 rounded-xl border-2 transition-all ${showBattery ? "border-amber-400 bg-white/10" : "border-white/10"}`}>
                    <p className="text-[11px] uppercase tracking-widest text-white/60 font-bold mb-1">Avec batterie</p>
                    <p className="text-2xl font-bold text-amber-300">{savingsWithBattery.toLocaleString("fr-FR")} € / an</p>
                    <p className="text-xs text-white/70 mt-1">ROI : {roiWithBattery} ans · Investissement : {(suggest.kwc * 2400 + batteryCost).toLocaleString("fr-FR")} € · <span className="text-amber-300">+ backup anti-coupure</span></p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Impact environnemental */}
          <div className="mb-8 p-5 rounded-2xl bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200">
            <h3 className="text-xs font-bold text-emerald-700 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <Leaf className="w-3.5 h-3.5" /> Impact environnemental
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-3xl font-bold text-emerald-800">{co2.toLocaleString("fr-FR")} kg</p>
                <p className="text-xs text-emerald-700 mt-0.5">CO₂ évités chaque année</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-emerald-800 flex items-center gap-1.5">
                  <Trees className="w-6 h-6" /> {trees}
                </p>
                <p className="text-xs text-emerald-700 mt-0.5">arbres plantés (équivalent)</p>
              </div>
            </div>
          </div>

          {/* Profil */}
          <section className="mb-8">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Récapitulatif de votre profil</h3>
            <div className="grid md:grid-cols-2 gap-3 text-sm">
              <ProfileRow label="Zone" value={`${region.label}${sim.city ? " — " + sim.city : ""}`} />
              <ProfileRow label="Potentiel solaire régional" value={region.sun} />
              <ProfileRow label="Logement" value={`${housingLabel}${surfaceLabel !== "—" ? ` · ${surfaceLabel}` : ""}`} />
              <ProfileRow label="Orientation" value={orientationLabel} />
              <ProfileRow label="Facture actuelle" value={annualBill > 0 ? `${annualBill.toLocaleString("fr-FR")} € / an` : "—"} />
              <ProfileRow label="Horizon projet" value={PROJECT_HORIZONS.find((h) => h.id === sim.projectHorizon)?.label || "—"} />
            </div>
          </section>

          {/* Aides */}
          <section className="mb-8 p-5 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-50/40 border border-blue-200">
            <h3 className="text-xs font-bold text-blue-700 uppercase tracking-widest mb-2">Aides & financement</h3>
            <p className="text-slate-700 text-sm">
              Prime à l'autoconsommation, TVA réduite, éco-prêt à taux zéro… Votre région peut donner accès à certaines aides sous réserve d'éligibilité. Un conseiller vérifie tout gratuitement.
            </p>
          </section>

          {/* CTA final */}
          <div className="text-center">
            <Button size="lg" className="bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-slate-900 font-bold px-10 py-7 rounded-full shadow-[0_15px_40px_-10px_hsl(35_95%_45%/0.7)] hover:scale-105 transition-all" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
              <Sun className="w-4 h-4 mr-2" /> Confirmer mon estimation avec un conseiller
            </Button>
            <p className="text-xs text-slate-500 mt-3 max-w-md mx-auto">
              Un conseiller vérifie gratuitement votre toiture, votre consommation réelle, les aides disponibles et la rentabilité estimée.
            </p>
          </div>
        </div>

        {/* Overlay CTA de déblocage */}
        {!unlocked && (
          <div className="absolute inset-0 z-10 flex items-end md:items-center justify-center px-4 pb-8 md:pb-0">
            <div className="w-full max-w-md bg-white/95 backdrop-blur-xl border border-amber-200 rounded-2xl shadow-[0_25px_60px_-15px_hsl(24_60%_8%/0.5)] p-6 text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-slate-900 mb-3 shadow-lg">
                <Lock className="w-7 h-7" />
              </div>
              <p className="text-lg font-bold text-slate-900 mb-1">Débloquez votre étude complète</p>
              <p className="text-xs text-slate-600 mb-4">
                Économies sur 25 ans, aides estimées, rentabilité, impact CO₂ et détail personnalisé.
              </p>
              <div className="flex items-center gap-2 justify-center">
                <Button variant="ghost" size="sm" onClick={onEdit} className="text-slate-600 hover:text-slate-900">
                  Modifier
                </Button>
                <Button size="lg" onClick={onUnlockClick} className="bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-slate-900 font-bold rounded-full shadow-lg px-6">
                  Débloquer <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 mt-4 text-[10px] font-semibold text-slate-500">
                <span className="inline-flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-emerald-600" /> RGPD</span>
                <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3 text-orange-500" /> 30 secondes</span>
                <span className="inline-flex items-center gap-1"><Lock className="w-3 h-3 text-slate-400" /> Aucun spam</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, sub, accent, iconColor }: any) => (
  <div className={`relative p-4 rounded-2xl bg-gradient-to-br ${accent} border border-white/60 overflow-hidden`}>
    <Icon className={`w-5 h-5 ${iconColor} mb-2`} />
    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600">{label}</p>
    <p className="text-xl md:text-2xl font-black text-slate-900 mt-1 leading-tight">{value}</p>
    {sub && <p className="text-[11px] text-slate-500 mt-0.5">{sub}</p>}
  </div>
);

const ProfileRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex flex-col p-3.5 rounded-xl bg-slate-50/80 border border-slate-100">
    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">{label}</span>
    <span className="text-slate-900 font-semibold mt-1">{value}</span>
  </div>
);
