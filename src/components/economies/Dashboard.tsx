import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { TrendingUp, Sparkles, Edit3, FileSearch, Info, ChevronRight } from "lucide-react";
import House3DGeneric from "./House3DGeneric";
import { CATEGORY_LABELS, computeSavings, totalRealised, totalPotential, type EquipmentSavings } from "@/lib/economiesCalculator";
import { DPE_COLORS } from "@/lib/dpeCalculator";
import type { HomeProfile, HomeEquipment, SavingsReference } from "@/hooks/useMemberHomeProfile";

interface Props {
  profile: HomeProfile;
  equipments: HomeEquipment[];
  reference: SavingsReference[];
  onEdit: () => void;
}

const fmt = (n: number) => `${n.toLocaleString("fr-FR")} €/an`;

const Dashboard = ({ profile, equipments, reference, onEdit }: Props) => {
  const [opened, setOpened] = useState<EquipmentSavings | null>(null);
  const savings = computeSavings(reference, equipments, profile.surface_m2);
  const realised = totalRealised(savings);
  const potential = totalPotential(savings);
  const dpe = profile.dpe_estimated || "D";

  const ownedKeys = new Set(equipments.filter((e) => e.status === "owned").map((e) => e.equipment_key));

  const grouped = savings.reduce((acc, s) => {
    (acc[s.reference.category] = acc[s.reference.category] || []).push(s);
    return acc;
  }, {} as Record<string, EquipmentSavings[]>);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Mes économies</h1>
          <p className="text-muted-foreground text-sm">
            {profile.address}, {profile.postal_code} {profile.city} • {profile.surface_m2} m²
          </p>
        </div>
        <Button variant="outline" onClick={onEdit}>
          <Edit3 className="w-4 h-4 mr-2" /> Modifier ma fiche
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="p-6 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium opacity-90">Économies réalisées</span>
            <TrendingUp className="w-5 h-5" />
          </div>
          <div className="text-3xl font-bold mt-2">{fmt(realised)}</div>
          <p className="text-xs opacity-90 mt-1">Estimation basée sur vos équipements actuels</p>
        </Card>
        <Card className="p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium opacity-90">Potentiel restant</span>
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="text-3xl font-bold mt-2">{fmt(potential)}</div>
          <p className="text-xs opacity-90 mt-1">En complétant votre rénovation énergétique</p>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">DPE estimé</span>
            <FileSearch className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className={`inline-flex mt-2 px-4 py-2 rounded-lg font-bold text-2xl ${DPE_COLORS[dpe]}`}>
            {dpe}
          </div>
          <p className="text-xs text-muted-foreground mt-2 flex items-start gap-1">
            <Info className="w-3 h-3 mt-0.5 shrink-0" />
            Estimation indicative — pour un DPE certifié,{" "}
            <Link to="/services/audit-energetique" className="underline text-primary">
              réalisez un audit énergétique
            </Link>
          </p>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Votre logement (vue générique)</h2>
          <Badge variant="secondary">Maison 3D illustrative</Badge>
        </div>
        <House3DGeneric
          hasSolar={ownedKeys.has("panneaux_solaires_pv") || ownedKeys.has("panneaux_solaires_pv_batterie")}
          hasInsulationWalls={ownedKeys.has("isolation_murs_ite") || ownedKeys.has("isolation_murs_iti")}
          hasInsulationRoof={ownedKeys.has("isolation_combles") || ownedKeys.has("isolation_toiture")}
          hasHeating={
            ownedKeys.has("pac_air_eau") ||
            ownedKeys.has("pac_air_air") ||
            ownedKeys.has("poele_granules") ||
            ownedKeys.has("chaudiere_biomasse")
          }
          hasVentilation={ownedKeys.has("vmc_double_flux") || ownedKeys.has("vmc_simple_flux_hygro")}
        />
        <p className="text-xs text-muted-foreground mt-3 text-center">
          Les couleurs représentent les équipements et améliorations détectés sur <strong>une maison générique</strong>, pas votre logement réel.
        </p>
      </Card>

      <div className="space-y-4">
        <h2 className="text-xl font-bold">Détail par équipement</h2>
        {Object.entries(grouped).map(([cat, list]) => (
          <Card key={cat} className="p-5">
            <h3 className="font-bold mb-3">{CATEGORY_LABELS[cat]}</h3>
            <div className="space-y-2">
              {list.map((s) => (
                <button
                  key={s.reference.id}
                  onClick={() => setOpened(s)}
                  className="w-full flex items-center justify-between gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        s.status === "owned" ? "bg-emerald-500" : s.status === "wanted" ? "bg-blue-500" : "bg-muted-foreground/30"
                      }`}
                    />
                    <div className="min-w-0">
                      <div className="font-medium text-sm">{s.reference.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {s.status === "owned" && "Vous l'avez ✓"}
                        {s.status === "wanted" && "Envisagé"}
                        {s.status === "missing" && "Non installé"}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-sm font-bold ${s.status === "owned" ? "text-emerald-600" : "text-muted-foreground"}`}>
                      {fmt(s.yearlyEur)}
                    </span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </button>
              ))}
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={!!opened} onOpenChange={(o) => !o && setOpened(null)}>
        <DialogContent className="max-w-lg">
          {opened && (
            <>
              <DialogHeader>
                <DialogTitle>{opened.reference.label}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">{opened.reference.description}</p>
                <Card className="p-4 bg-muted/50">
                  <div className="text-sm text-muted-foreground">
                    {opened.status === "owned" ? "Vous économisez environ" : "Vous pourriez économiser"}
                  </div>
                  <div className={`text-2xl font-bold ${opened.status === "owned" ? "text-emerald-600" : "text-blue-600"}`}>
                    {fmt(opened.yearlyEur)}
                  </div>
                </Card>
                {opened.reference.eligible_aids.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold text-muted-foreground uppercase mb-2">Aides potentielles</div>
                    <div className="flex flex-wrap gap-2">
                      {opened.reference.eligible_aids.map((a) => (
                        <Badge key={a} variant="outline">{a}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {opened.status !== "owned" && (
                  <Button asChild className="w-full">
                    <Link to="/aides">Voir les aides disponibles</Link>
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
