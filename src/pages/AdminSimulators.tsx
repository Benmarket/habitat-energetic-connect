import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, ArrowLeft, Sun, Zap, Home, Thermometer, Wind, Calculator, Plus, Trash2, Lock, MapPin, Settings, Gauge } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface SolarRegion {
  id: string;
  name: string;
  tarif_kwh: number;
  variation_prix_installation: number;
  module_puissance_defaut: string;
  tarif_rachat_0_3: number;
  tarif_rachat_4_9: number;
  tarif_rachat_10_36: number;
  tarif_rachat_37_100: number;
  tarif_rachat_101_500: number;
  prime_0_3: number;
  prime_4_9: number;
  prime_10_36: number;
  prime_37_100: number;
  prime_101_500: number;
  display_order: number;
  postal_prefixes: string[];
}

interface GlobalParams {
  id: string;
  ratio_jour: number;
  angle_inclinaison: number;
  hausse_electricite: number;
  hausse_electricite_graph: number;
  periode_calcul: number;
}

interface SolarPower {
  id: string;
  puissance_kwc: number;
  prix_euros: number;
  display_order: number;
}

const SIMULATOR_LIST = [
  { id: "solaire", title: "Économies avec le solaire", icon: Sun, color: "from-orange-500 to-yellow-500", enabled: true },
  { id: "classe-energetique", title: "Classe énergétique", icon: Home, color: "from-blue-500 to-cyan-500", enabled: false },
  { id: "pompe-chaleur", title: "Chauffage pompe à chaleur", icon: Thermometer, color: "from-red-500 to-orange-500", enabled: false },
  { id: "isolation", title: "Isolation thermique", icon: Zap, color: "from-green-500 to-emerald-500", enabled: false },
  { id: "eolien", title: "Production Éolienne", icon: Wind, color: "from-sky-500 to-blue-500", enabled: false },
  { id: "global", title: "Simulateur global", icon: Calculator, color: "from-purple-500 to-indigo-500", enabled: false },
];

const MODULE_PUISSANCE_OPTIONS = [
  { value: "aucun", label: "Aucun" },
  { value: "3kwc", label: "3 kWc" },
  { value: "6kwc", label: "6 kWc" },
  { value: "9kwc", label: "9 kWc" },
];

type SolarTab = 'regions' | 'puissances' | 'parametres';

const AdminSimulators = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [selectedSimulator, setSelectedSimulator] = useState<string | null>("solaire");
  const [solarTab, setSolarTab] = useState<SolarTab>('regions');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [showAddRegionModal, setShowAddRegionModal] = useState(false);
  const [newRegionName, setNewRegionName] = useState("");
  
  // Solar simulator data from DB
  const [regions, setRegions] = useState<SolarRegion[]>([]);
  const [globalParams, setGlobalParams] = useState<GlobalParams | null>(null);
  const [powers, setPowers] = useState<SolarPower[]>([]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/connexion");
    }
  }, [user, authLoading, navigate]);

  // Load data from database
  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      
      try {
        // Load regions
        const { data: regionsData, error: regionsError } = await supabase
          .from('solar_simulator_regions')
          .select('*')
          .order('display_order', { ascending: true });

        if (regionsError) throw regionsError;
        if (regionsData) {
          setRegions(regionsData);
        }

        // Load global params
        const { data: paramsData, error: paramsError } = await supabase
          .from('solar_simulator_global_params')
          .select('*')
          .limit(1)
          .single();

        if (paramsError && paramsError.code !== 'PGRST116') {
          console.error('Error loading global params:', paramsError);
        }
        if (paramsData) {
          setGlobalParams(paramsData);
        }

        // Load powers
        const { data: powersData, error: powersError } = await supabase
          .from('solar_simulator_powers')
          .select('*')
          .order('display_order', { ascending: true });

        if (powersError) {
          console.error('Error loading powers:', powersError);
        }
        if (powersData) {
          setPowers(powersData);
        }
      } catch (err) {
        console.error('Error loading data:', err);
        toast({
          title: "Erreur",
          description: "Impossible de charger les données.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user, toast]);

  const handleAddRegion = async () => {
    if (!newRegionName.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez entrer un nom de région.",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      const maxOrder = regions.length > 0 ? Math.max(...regions.map(r => r.display_order)) + 1 : 0;
      
      const { data, error } = await supabase
        .from('solar_simulator_regions')
        .insert([{ name: newRegionName.trim(), display_order: maxOrder }])
        .select()
        .single();

      if (error) throw error;
      
      setRegions(prev => [...prev, data]);
      setNewRegionName("");
      setShowAddRegionModal(false);
      
      toast({
        title: "Région ajoutée",
        description: `La région "${newRegionName}" a été créée avec succès.`,
      });
    } catch (err) {
      console.error('Error adding region:', err);
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter la région.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRegion = async (regionId: string, regionName: string) => {
    if (regions.length <= 1) {
      toast({
        title: "Action impossible",
        description: "Vous devez conserver au moins une région.",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('solar_simulator_regions')
        .delete()
        .eq('id', regionId);

      if (error) throw error;
      
      setRegions(prev => prev.filter(r => r.id !== regionId));
      
      toast({
        title: "Région supprimée",
        description: `La région "${regionName}" a été supprimée.`,
      });
    } catch (err) {
      console.error('Error deleting region:', err);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la région.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateRegion = async (regionId: string, field: keyof SolarRegion, value: number | string | string[]) => {
    // Update local state immediately
    setRegions(prev => prev.map(r => 
      r.id === regionId ? { ...r, [field]: value } : r
    ));
  };

  const handleSaveRegions = async () => {
    setSaving(true);
    try {
      // Update all regions
      for (const region of regions) {
        const { error } = await supabase
          .from('solar_simulator_regions')
          .update({
            name: region.name,
            tarif_kwh: region.tarif_kwh,
            variation_prix_installation: region.variation_prix_installation,
            module_puissance_defaut: region.module_puissance_defaut,
            tarif_rachat_0_3: region.tarif_rachat_0_3,
            tarif_rachat_4_9: region.tarif_rachat_4_9,
            tarif_rachat_10_36: region.tarif_rachat_10_36,
            tarif_rachat_37_100: region.tarif_rachat_37_100,
            tarif_rachat_101_500: region.tarif_rachat_101_500,
            prime_0_3: region.prime_0_3,
            prime_4_9: region.prime_4_9,
            prime_10_36: region.prime_10_36,
            prime_37_100: region.prime_37_100,
            prime_101_500: region.prime_101_500,
            postal_prefixes: region.postal_prefixes,
          })
          .eq('id', region.id);

        if (error) throw error;
      }
      
      toast({
        title: "Paramètres enregistrés",
        description: "Les paramètres régionaux ont été mis à jour avec succès.",
      });
    } catch (err) {
      console.error('Error saving regions:', err);
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer les paramètres.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  // Powers handlers
  const handleAddPower = async () => {
    setSaving(true);
    try {
      const maxOrder = powers.length > 0 ? Math.max(...powers.map(p => p.display_order)) + 1 : 0;
      
      const { data, error } = await supabase
        .from('solar_simulator_powers')
        .insert([{ puissance_kwc: 0, prix_euros: 0, display_order: maxOrder }])
        .select()
        .single();

      if (error) throw error;
      
      setPowers(prev => [...prev, data]);
      
      toast({
        title: "Puissance ajoutée",
        description: "Une nouvelle puissance a été créée.",
      });
    } catch (err) {
      console.error('Error adding power:', err);
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter la puissance.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePower = async (powerId: string) => {
    if (powers.length <= 1) {
      toast({
        title: "Action impossible",
        description: "Vous devez conserver au moins une puissance.",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('solar_simulator_powers')
        .delete()
        .eq('id', powerId);

      if (error) throw error;
      
      setPowers(prev => prev.filter(p => p.id !== powerId));
      
      toast({
        title: "Puissance supprimée",
        description: "La puissance a été supprimée.",
      });
    } catch (err) {
      console.error('Error deleting power:', err);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la puissance.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePower = (powerId: string, field: keyof SolarPower, value: number) => {
    setPowers(prev => prev.map(p => 
      p.id === powerId ? { ...p, [field]: value } : p
    ));
  };

  const handleSavePowers = async () => {
    setSaving(true);
    try {
      for (const power of powers) {
        const { error } = await supabase
          .from('solar_simulator_powers')
          .update({
            puissance_kwc: power.puissance_kwc,
            prix_euros: power.prix_euros,
          })
          .eq('id', power.id);

        if (error) throw error;
      }
      
      toast({
        title: "Paramètres enregistrés",
        description: "Les puissances ont été mises à jour avec succès.",
      });
    } catch (err) {
      console.error('Error saving powers:', err);
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer les puissances.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveGlobalParams = async () => {
    if (!globalParams) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('solar_simulator_global_params')
        .update({
          ratio_jour: globalParams.ratio_jour,
          angle_inclinaison: globalParams.angle_inclinaison,
          hausse_electricite: globalParams.hausse_electricite,
          hausse_electricite_graph: globalParams.hausse_electricite_graph,
          periode_calcul: globalParams.periode_calcul,
        })
        .eq('id', globalParams.id);

      if (error) throw error;
      
      toast({
        title: "Paramètres enregistrés",
        description: "Les paramètres globaux ont été mis à jour avec succès.",
      });
    } catch (err) {
      console.error('Error saving global params:', err);
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer les paramètres.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const selectedSim = SIMULATOR_LIST.find(s => s.id === selectedSimulator);

  const SOLAR_TABS = [
    { id: 'regions' as SolarTab, label: 'Régions', icon: MapPin },
    { id: 'puissances' as SolarTab, label: 'Puissances', icon: Gauge },
    { id: 'parametres' as SolarTab, label: 'Paramètres globaux', icon: Settings },
  ];

  const renderRegionBlock = (region: SolarRegion) => {
    const isDefaultRegion = region.name.toLowerCase().includes('france métropolitaine') || region.name.toLowerCase().includes('france metropolitaine');
    
    return (
    <Card key={region.id} className="overflow-hidden shadow-md hover:shadow-lg transition-shadow">
      {/* Header avec gradient */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">{region.name}</h3>
              {isDefaultRegion && (
                <span className="text-xs text-white/70">Région par défaut</span>
              )}
            </div>
          </div>
          {!isDefaultRegion && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleDeleteRegion(region.id, region.name)}
              className="text-white/80 hover:text-white hover:bg-white/20"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Supprimer
            </Button>
          )}
        </div>
      </div>

      <CardContent className="p-6 space-y-8">
        {/* Paramètres de base */}
        <div className="grid gap-6 md:grid-cols-3">
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-foreground">Tarif kWh par défaut</Label>
            <Input
              type="number"
              step="0.001"
              min="0.1"
              max="0.999"
              placeholder="Ex: 0.248"
              value={region.tarif_kwh}
              onChange={(e) => handleUpdateRegion(region.id, 'tarif_kwh', Number(e.target.value))}
            />
            <p className="text-xs text-muted-foreground">Valeur comprise entre 0.1 et 0.999</p>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold text-foreground">Variation du prix de l'installation (%)</Label>
            <Input
              type="number"
              min="0"
              max="100"
              placeholder="Ex: 0"
              value={region.variation_prix_installation}
              onChange={(e) => handleUpdateRegion(region.id, 'variation_prix_installation', Number(e.target.value))}
            />
            <p className="text-xs text-muted-foreground">Valeur comprise entre 0 et 100</p>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold text-foreground">Module de puissance par défaut</Label>
            <select
              value={region.module_puissance_defaut}
              onChange={(e) => handleUpdateRegion(region.id, 'module_puissance_defaut', e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {MODULE_PUISSANCE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Codes postaux pour détection automatique - uniquement pour les régions non-par-défaut */}
        {!isDefaultRegion && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b">
              <MapPin className="w-5 h-5 text-blue-500" />
              <h4 className="font-semibold text-foreground">Préfixes de codes postaux</h4>
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">
                Entrez les préfixes de codes postaux séparés par des virgules (ex: 20, 2A, 2B pour la Corse).
              </Label>
              <Input
                placeholder="Ex: 20, 2A, 2B"
                value={region.postal_prefixes?.join(', ') || ''}
                onChange={(e) => {
                  const prefixes = e.target.value
                    .split(',')
                    .map(p => p.trim())
                    .filter(p => p !== '');
                  handleUpdateRegion(region.id, 'postal_prefixes', prefixes);
                }}
              />
            </div>
          </div>
        )}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b">
            <Zap className="w-5 h-5 text-amber-500" />
            <h4 className="font-semibold text-foreground">Tarifs de rachat EDF</h4>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {[
              { key: 'tarif_rachat_0_3' as const, label: 'Tranche 0-3 kWc' },
              { key: 'tarif_rachat_4_9' as const, label: 'Tranche 4-9 kWc' },
              { key: 'tarif_rachat_10_36' as const, label: 'Tranche 10-36 kWc' },
              { key: 'tarif_rachat_37_100' as const, label: 'Tranche 37-100 kWc' },
              { key: 'tarif_rachat_101_500' as const, label: 'Tranche 101-500 kWc' },
            ].map(({ key, label }) => (
              <div key={key} className="space-y-2 p-3 bg-muted/30 rounded-lg">
                <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
                <Input
                  type="number"
                  step="0.0001"
                  min="0"
                  max="1"
                  value={region[key]}
                  onChange={(e) => handleUpdateRegion(region.id, key, Number(e.target.value))}
                  className="bg-background"
                />
                <p className="text-[10px] text-muted-foreground">Entre 0 et 1</p>
              </div>
            ))}
          </div>
        </div>

        {/* Primes */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b">
            <Calculator className="w-5 h-5 text-green-500" />
            <h4 className="font-semibold text-foreground">Primes (€/Wc)</h4>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {[
              { key: 'prime_0_3' as const, label: 'Tranche 0-3 kWc' },
              { key: 'prime_4_9' as const, label: 'Tranche 4-9 kWc' },
              { key: 'prime_10_36' as const, label: 'Tranche 10-36 kWc' },
              { key: 'prime_37_100' as const, label: 'Tranche 37-100 kWc' },
              { key: 'prime_101_500' as const, label: 'Tranche 101-500 kWc' },
            ].map(({ key, label }) => (
              <div key={key} className="space-y-2 p-3 bg-muted/30 rounded-lg">
                <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="5"
                  value={region[key]}
                  onChange={(e) => handleUpdateRegion(region.id, key, Number(e.target.value))}
                  className="bg-background"
                />
                <p className="text-[10px] text-muted-foreground">Entre 0 et 5</p>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
  };

  const renderRegionsTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Administration des tarifs et primes par défaut</h2>
          <p className="text-sm text-muted-foreground mt-1">Configurez les tarifs pour chaque région</p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowAddRegionModal(true)}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Ajouter une région
        </Button>
      </div>

      {/* Region blocks */}
      <div className="space-y-6">
        {regions.map((region) => renderRegionBlock(region))}
      </div>

      {/* Save button */}
      <div className="pt-4 border-t">
        <Button
          onClick={handleSaveRegions}
          disabled={saving}
          className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Enregistrement...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Enregistrer
            </>
          )}
        </Button>
      </div>
    </div>
  );

  const renderPuissancesTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Liste des puissances disponibles</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Vous pouvez modifier, ajouter ou supprimer des puissances ci-dessous. Ces puissances seront disponibles dans le formulaire de simulation.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={handleAddPower}
          disabled={saving}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Ajouter une puissance
        </Button>
      </div>

      {/* Power blocks */}
      <div className="space-y-4">
        {powers.map((power) => (
          <Card key={power.id} className="overflow-hidden shadow-md hover:shadow-lg transition-shadow">
            <div className="bg-gradient-to-r from-blue-500 to-cyan-500 px-6 py-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <Gauge className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-base font-bold text-white">
                  Module {power.puissance_kwc} kWc
                </h3>
              </div>
            </div>
            <CardContent className="p-6">
              <div className="flex items-end gap-6">
                <div className="flex-1 space-y-2">
                  <Label className="text-sm font-semibold text-foreground">Puissance (kWc)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    value={power.puissance_kwc}
                    onChange={(e) => handleUpdatePower(power.id, 'puissance_kwc', Number(e.target.value))}
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <Label className="text-sm font-semibold text-foreground">Prix (€)</Label>
                  <Input
                    type="number"
                    step="100"
                    min="0"
                    value={power.prix_euros}
                    onChange={(e) => handleUpdatePower(power.id, 'prix_euros', Number(e.target.value))}
                  />
                </div>
                {powers.length > 1 && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeletePower(power.id)}
                    disabled={saving}
                    className="gap-1"
                  >
                    <Trash2 className="w-4 h-4" />
                    Supprimer
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Save button */}
      <div className="pt-4 border-t">
        <Button
          onClick={handleSavePowers}
          disabled={saving}
          className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Enregistrement...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Enregistrer
            </>
          )}
        </Button>
      </div>
    </div>
  );

  const renderParametresTab = () => (
    <div className="space-y-8">
      {!globalParams ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Section 1: Paramètres de production */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Sun className="w-5 h-5 text-orange-500" />
              Paramètres de production
            </h3>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="ratio-jour">Ratio jour (%)</Label>
                <Input
                  id="ratio-jour"
                  type="number"
                  min="0"
                  max="100"
                  value={globalParams.ratio_jour}
                  onChange={(e) => setGlobalParams(prev => prev ? { ...prev, ratio_jour: Number(e.target.value) } : null)}
                />
                <p className="text-xs text-muted-foreground">
                  Pourcentage de production journalière (entre 0 et 100)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="angle-inclinaison">Angle d'inclinaison (°)</Label>
                <Input
                  id="angle-inclinaison"
                  type="number"
                  min="1"
                  max="100"
                  value={globalParams.angle_inclinaison}
                  onChange={(e) => setGlobalParams(prev => prev ? { ...prev, angle_inclinaison: Number(e.target.value) } : null)}
                />
                <p className="text-xs text-muted-foreground">
                  Angle d'inclinaison des panneaux (entre 1 et 100)
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Paramètres économiques */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Calculator className="w-5 h-5 text-green-500" />
              Paramètres économiques
            </h3>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="hausse-electricite">Hausse électricité (%)</Label>
                <Input
                  id="hausse-electricite"
                  type="number"
                  min="0"
                  max="100"
                  value={globalParams.hausse_electricite}
                  onChange={(e) => setGlobalParams(prev => prev ? { ...prev, hausse_electricite: Number(e.target.value) } : null)}
                />
                <p className="text-xs text-muted-foreground">
                  Pourcentage d'augmentation annuelle du prix de l'électricité (entre 0 et 100)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="hausse-electricite-graph">Hausse électricité graph (%)</Label>
                <Input
                  id="hausse-electricite-graph"
                  type="number"
                  min="0"
                  max="100"
                  value={globalParams.hausse_electricite_graph}
                  onChange={(e) => setGlobalParams(prev => prev ? { ...prev, hausse_electricite_graph: Number(e.target.value) } : null)}
                />
                <p className="text-xs text-muted-foreground">
                  Pourcentage d'augmentation pour le graphique (entre 0 et 100)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="periode-calcul">Période de calcul (années)</Label>
                <Input
                  id="periode-calcul"
                  type="number"
                  min="1"
                  max="30"
                  value={globalParams.periode_calcul}
                  onChange={(e) => setGlobalParams(prev => prev ? { ...prev, periode_calcul: Number(e.target.value) } : null)}
                />
                <p className="text-xs text-muted-foreground">
                  Durée de la période de calcul (entre 1 et 30 ans)
                </p>
              </div>
            </div>
          </div>

          {/* Save button */}
          <div className="pt-4 border-t">
            <Button
              onClick={handleSaveGlobalParams}
              disabled={saving}
              className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Enregistrer
                </>
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  );

  return (
    <>
      <Helmet>
        <title>Gestion des Simulateurs | Prime Énergies</title>
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="pt-20">
          <div className="container mx-auto px-4 py-8">
            <Link 
              to="/administration"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour à l'administration
            </Link>

            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-orange-500 to-yellow-500 bg-clip-text text-transparent">
                Gestion des Simulateurs
              </h1>
              <p className="text-muted-foreground">
                Configurez les paramètres de calcul pour chaque simulateur
              </p>
            </div>

            <div className="grid lg:grid-cols-[280px_1fr] gap-6">
              {/* Simulators list */}
              <div className="space-y-2">
                {SIMULATOR_LIST.map((sim) => {
                  const Icon = sim.icon;
                  const isSelected = selectedSimulator === sim.id;
                  const isEnabled = sim.enabled;
                  
                  return (
                    <Card 
                      key={sim.id}
                      className={`cursor-pointer transition-all duration-200 ${
                        isSelected 
                          ? 'ring-2 ring-primary shadow-lg' 
                          : isEnabled 
                            ? 'hover:shadow-md' 
                            : 'opacity-60'
                      } ${!isEnabled ? 'cursor-not-allowed' : ''}`}
                      onClick={() => isEnabled && setSelectedSimulator(sim.id)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-lg bg-gradient-to-br ${sim.color} text-white`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <p className="font-medium text-sm flex-1 truncate">{sim.title}</p>
                          {!isEnabled && (
                            <Lock className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Settings panel */}
              <div>
                {loading ? (
                  <Card>
                    <CardContent className="p-8 flex items-center justify-center">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </CardContent>
                  </Card>
                ) : selectedSimulator === 'solaire' && selectedSim ? (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-xl bg-gradient-to-br ${selectedSim.color} text-white`}>
                          <selectedSim.icon className="w-6 h-6" />
                        </div>
                        <div>
                          <CardTitle>{selectedSim.title}</CardTitle>
                          <CardDescription>Configurez les paramètres du simulateur solaire</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Tab icons */}
                      <div className="flex justify-center gap-4 pb-4 border-b">
                        {SOLAR_TABS.map((tab) => {
                          const TabIcon = tab.icon;
                          const isActive = solarTab === tab.id;
                          return (
                            <button
                              key={tab.id}
                              onClick={() => setSolarTab(tab.id)}
                              className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all duration-200 min-w-[100px] ${
                                isActive 
                                  ? 'bg-gradient-to-br from-orange-500 to-yellow-500 text-white shadow-lg scale-105' 
                                  : 'bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground'
                              }`}
                            >
                              <TabIcon className="w-6 h-6" />
                              <span className="text-xs font-medium">{tab.label}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Tab content */}
                      {solarTab === 'regions' && renderRegionsTab()}
                      {solarTab === 'puissances' && renderPuissancesTab()}
                      {solarTab === 'parametres' && renderParametresTab()}
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="p-8 text-center text-muted-foreground">
                      <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Sélectionnez un simulateur pour configurer ses paramètres</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>

      {/* Modal d'ajout de région */}
      <Dialog open={showAddRegionModal} onOpenChange={setShowAddRegionModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-green-500" />
              Ajouter une nouvelle région
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="region-name">Nom de la région</Label>
              <Input
                id="region-name"
                placeholder="Ex: Île-de-France, Occitanie, DOM-TOM..."
                value={newRegionName}
                onChange={(e) => setNewRegionName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddRegion()}
              />
              <p className="text-xs text-muted-foreground">
                Entrez le nom de la région tel qu'il apparaîtra dans le simulateur
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddRegionModal(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleAddRegion} 
              disabled={saving || !newRegionName.trim()}
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Ajout...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminSimulators;
