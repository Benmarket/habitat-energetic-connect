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
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, ArrowLeft, Sun, Zap, Home, Thermometer, Wind, Calculator, Plus, Trash2, Lock, MapPin, Settings, Gauge } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface TarifsTranches {
  tranche_0_3: number;
  tranche_4_9: number;
  tranche_10_36: number;
  tranche_37_100: number;
  tranche_101_500: number;
}

interface PrimesTranches {
  tranche_0_3: number;
  tranche_4_9: number;
  tranche_10_36: number;
  tranche_37_100: number;
  tranche_101_500: number;
}

interface RegionSettings {
  region: string;
  tarifKwh: number;
  variationPrixInstallation: number;
  modulePuissanceDefaut: string;
  tarifsRachatEdf: TarifsTranches;
  primes: PrimesTranches;
}

interface SolarRegionsSettings {
  regions: RegionSettings[];
}

interface GlobalParams {
  ratioJour: number;
  angleInclinaison: number;
  hausseElectricite: number;
  hausseElectriciteGraph: number;
  periodeCalcul: number;
}

const SIMULATOR_LIST = [
  { id: "solaire", title: "Économies avec le solaire", icon: Sun, color: "from-orange-500 to-yellow-500", enabled: true },
  { id: "classe-energetique", title: "Classe énergétique", icon: Home, color: "from-blue-500 to-cyan-500", enabled: false },
  { id: "pompe-chaleur", title: "Chauffage pompe à chaleur", icon: Thermometer, color: "from-red-500 to-orange-500", enabled: false },
  { id: "isolation", title: "Isolation thermique", icon: Zap, color: "from-green-500 to-emerald-500", enabled: false },
  { id: "eolien", title: "Production Éolienne", icon: Wind, color: "from-sky-500 to-blue-500", enabled: false },
  { id: "global", title: "Simulateur global", icon: Calculator, color: "from-purple-500 to-indigo-500", enabled: false },
];

const REGION_OPTIONS = [
  { code: "france_metropolitaine", label: "France métropolitaine" },
  { code: "corse", label: "Corse" },
  { code: "reunion", label: "Réunion" },
  { code: "martinique", label: "Martinique" },
  { code: "guadeloupe", label: "Guadeloupe" },
  { code: "guyane", label: "Guyane" },
];

const MODULE_PUISSANCE_OPTIONS = [
  { value: "aucun", label: "Aucun" },
  { value: "3kwc", label: "3 kWc" },
  { value: "6kwc", label: "6 kWc" },
  { value: "9kwc", label: "9 kWc" },
];

const DEFAULT_REGION_SETTINGS: Omit<RegionSettings, 'region'> = {
  tarifKwh: 0.248,
  variationPrixInstallation: 0,
  modulePuissanceDefaut: "aucun",
  tarifsRachatEdf: {
    tranche_0_3: 0.04,
    tranche_4_9: 0.04,
    tranche_10_36: 0.0761,
    tranche_37_100: 0.0761,
    tranche_101_500: 0.0761,
  },
  primes: {
    tranche_0_3: 0.08,
    tranche_4_9: 0.08,
    tranche_10_36: 0.19,
    tranche_37_100: 0.10,
    tranche_101_500: 0.00,
  }
};

type SolarTab = 'regions' | 'puissances' | 'parametres';

const AdminSimulators = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [selectedSimulator, setSelectedSimulator] = useState<string | null>("solaire");
  const [solarTab, setSolarTab] = useState<SolarTab>('regions');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Solar simulator settings - Regions
  const [solarRegions, setSolarRegions] = useState<SolarRegionsSettings>({
    regions: [{ region: "france_metropolitaine", ...DEFAULT_REGION_SETTINGS }]
  });

  // Solar simulator settings - Global params
  const [globalParams, setGlobalParams] = useState<GlobalParams>({
    ratioJour: 60,
    angleInclinaison: 25,
    hausseElectricite: 1,
    hausseElectriciteGraph: 5,
    periodeCalcul: 20
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/connexion");
    }
  }, [user, authLoading, navigate]);

  // Load settings from database
  useEffect(() => {
    const loadSettings = async () => {
      if (!user) return;
      
      try {
        // Load regions settings
        const { data: regionsData, error: regionsError } = await supabase
          .from('simulator_settings')
          .select('*')
          .eq('simulator_id', 'solaire')
          .eq('setting_key', 'regions_settings')
          .maybeSingle();

        if (regionsError && regionsError.code !== 'PGRST116') {
          console.error('Error loading regions settings:', regionsError);
        }

        if (regionsData?.setting_value) {
          const value = regionsData.setting_value as unknown as SolarRegionsSettings;
          if (value.regions && value.regions.length > 0) {
            setSolarRegions(value);
          }
        }

        // Load global params
        const { data: paramsData, error: paramsError } = await supabase
          .from('simulator_settings')
          .select('*')
          .eq('simulator_id', 'solaire')
          .eq('setting_key', 'parametres_globaux')
          .maybeSingle();

        if (paramsError && paramsError.code !== 'PGRST116') {
          console.error('Error loading params settings:', paramsError);
        }

        if (paramsData?.setting_value) {
          const value = paramsData.setting_value as unknown as GlobalParams;
          setGlobalParams({
            ratioJour: value.ratioJour ?? 60,
            angleInclinaison: value.angleInclinaison ?? 25,
            hausseElectricite: value.hausseElectricite ?? 1,
            hausseElectriciteGraph: value.hausseElectriciteGraph ?? 5,
            periodeCalcul: value.periodeCalcul ?? 20
          });
        }
      } catch (err) {
        console.error('Error loading settings:', err);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [user]);

  const saveSettingToDb = async (settingKey: string, settingValue: unknown) => {
    const { data: existing } = await supabase
      .from('simulator_settings')
      .select('id')
      .eq('simulator_id', 'solaire')
      .eq('setting_key', settingKey)
      .maybeSingle();

    if (existing) {
      const { error: updateError } = await supabase
        .from('simulator_settings')
        .update({ setting_value: JSON.parse(JSON.stringify(settingValue)) })
        .eq('id', existing.id);
      if (updateError) throw updateError;
    } else {
      const { error: insertError } = await supabase
        .from('simulator_settings')
        .insert([{
          simulator_id: 'solaire',
          setting_key: settingKey,
          setting_value: JSON.parse(JSON.stringify(settingValue))
        }]);
      if (insertError) throw insertError;
    }
  };

  const handleSaveRegions = async () => {
    setSaving(true);
    try {
      await saveSettingToDb('regions_settings', solarRegions);
      toast({
        title: "Paramètres enregistrés",
        description: "Les paramètres régionaux ont été mis à jour avec succès.",
      });
    } catch (err) {
      console.error('Error saving settings:', err);
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer les paramètres.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveGlobalParams = async () => {
    setSaving(true);
    try {
      await saveSettingToDb('parametres_globaux', globalParams);
      toast({
        title: "Paramètres enregistrés",
        description: "Les paramètres globaux ont été mis à jour avec succès.",
      });
    } catch (err) {
      console.error('Error saving settings:', err);
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer les paramètres.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const addRegion = () => {
    const usedRegions = solarRegions.regions.map(r => r.region);
    const availableRegion = REGION_OPTIONS.find(r => !usedRegions.includes(r.code));
    
    if (availableRegion) {
      setSolarRegions(prev => ({
        ...prev,
        regions: [...prev.regions, { region: availableRegion.code, ...DEFAULT_REGION_SETTINGS }]
      }));
    } else {
      toast({
        title: "Toutes les régions ajoutées",
        description: "Vous avez déjà ajouté toutes les régions disponibles.",
        variant: "default"
      });
    }
  };

  const removeRegion = (index: number) => {
    if (solarRegions.regions.length <= 1) {
      toast({
        title: "Action impossible",
        description: "Vous devez conserver au moins une région.",
        variant: "destructive"
      });
      return;
    }
    setSolarRegions(prev => ({
      ...prev,
      regions: prev.regions.filter((_, i) => i !== index)
    }));
  };

  const updateRegionField = <K extends keyof RegionSettings>(
    index: number, 
    field: K, 
    value: RegionSettings[K]
  ) => {
    setSolarRegions(prev => ({
      ...prev,
      regions: prev.regions.map((r, i) => 
        i === index ? { ...r, [field]: value } : r
      )
    }));
  };

  const updateTarifRachat = (
    index: number, 
    tranche: keyof TarifsTranches, 
    value: number
  ) => {
    setSolarRegions(prev => ({
      ...prev,
      regions: prev.regions.map((r, i) => 
        i === index ? { ...r, tarifsRachatEdf: { ...r.tarifsRachatEdf, [tranche]: value } } : r
      )
    }));
  };

  const updatePrime = (
    index: number, 
    tranche: keyof PrimesTranches, 
    value: number
  ) => {
    setSolarRegions(prev => ({
      ...prev,
      regions: prev.regions.map((r, i) => 
        i === index ? { ...r, primes: { ...r.primes, [tranche]: value } } : r
      )
    }));
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

  const renderRegionBlock = (region: RegionSettings, index: number) => {
    const regionLabel = REGION_OPTIONS.find(r => r.code === region.region)?.label || region.region;
    
    return (
      <div key={index} className="border-l-4 border-green-500 bg-muted/30 rounded-lg p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-green-700">{regionLabel}</h3>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => removeRegion(index)}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Supprimer
          </Button>
        </div>

        {/* Basic settings */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label className="font-medium">Tarif kWh par défaut</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                step="0.001"
                min="0.1"
                max="0.999"
                placeholder="Ex: 0.248"
                value={region.tarifKwh}
                onChange={(e) => updateRegionField(index, 'tarifKwh', Number(e.target.value))}
                className="max-w-[140px]"
              />
              <span className="text-xs text-muted-foreground">Valeur comprise entre 0.1 et 0.999</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="font-medium">Variation du prix de l'installation (%)</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="0"
                max="100"
                placeholder="Ex: 0"
                value={region.variationPrixInstallation}
                onChange={(e) => updateRegionField(index, 'variationPrixInstallation', Number(e.target.value))}
                className="max-w-[140px]"
              />
              <span className="text-xs text-muted-foreground">Valeur comprise entre 0 et 100</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="font-medium">Module de puissance par défaut</Label>
            <select
              value={region.modulePuissanceDefaut}
              onChange={(e) => updateRegionField(index, 'modulePuissanceDefaut', e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {MODULE_PUISSANCE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Tarifs de rachat EDF */}
        <div className="space-y-3">
          <Label className="font-medium text-base">Tarifs de rachat EDF</Label>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {[
              { key: 'tranche_0_3', label: 'Tranche 0-3 kWc' },
              { key: 'tranche_4_9', label: 'Tranche 4-9 kWc' },
              { key: 'tranche_10_36', label: 'Tranche 10-36 kWc' },
              { key: 'tranche_37_100', label: 'Tranche 37-100 kWc' },
              { key: 'tranche_101_500', label: 'Tranche 101-500 kWc' },
            ].map(({ key, label }) => (
              <div key={key} className="space-y-1">
                <Label className="text-sm font-normal">{label}</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    step="0.0001"
                    min="0"
                    max="1"
                    placeholder={`Ex: ${region.tarifsRachatEdf[key as keyof TarifsTranches]}`}
                    value={region.tarifsRachatEdf[key as keyof TarifsTranches]}
                    onChange={(e) => updateTarifRachat(index, key as keyof TarifsTranches, Number(e.target.value))}
                    className="max-w-[120px]"
                  />
                  <span className="text-xs text-muted-foreground">Valeur comprise entre 0 et 1</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Primes */}
        <div className="space-y-3">
          <Label className="font-medium text-base">Primes (€/Wc)</Label>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {[
              { key: 'tranche_0_3', label: 'Tranche 0-3 kWc' },
              { key: 'tranche_4_9', label: 'Tranche 4-9 kWc' },
              { key: 'tranche_10_36', label: 'Tranche 10-36 kWc' },
              { key: 'tranche_37_100', label: 'Tranche 37-100 kWc' },
              { key: 'tranche_101_500', label: 'Tranche 101-500 kWc' },
            ].map(({ key, label }) => (
              <div key={key} className="space-y-1">
                <Label className="text-sm font-normal">{label}</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="5"
                    placeholder={`Ex: ${region.primes[key as keyof PrimesTranches]}`}
                    value={region.primes[key as keyof PrimesTranches]}
                    onChange={(e) => updatePrime(index, key as keyof PrimesTranches, Number(e.target.value))}
                    className="max-w-[120px]"
                  />
                  <span className="text-xs text-muted-foreground">Valeur comprise entre 0 et 5</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
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
          onClick={addRegion}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Ajouter une région
        </Button>
      </div>

      {/* Region blocks */}
      <div className="space-y-6">
        {solarRegions.regions.map((region, index) => renderRegionBlock(region, index))}
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
      <div className="border border-dashed rounded-lg p-8 text-center text-muted-foreground">
        <Gauge className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p className="font-medium">Paramètres de puissance</p>
        <p className="text-sm mt-1">Cette section sera bientôt disponible</p>
      </div>
    </div>
  );

  const renderParametresTab = () => (
    <div className="space-y-8">
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
              value={globalParams.ratioJour}
              onChange={(e) => setGlobalParams(prev => ({ ...prev, ratioJour: Number(e.target.value) }))}
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
              value={globalParams.angleInclinaison}
              onChange={(e) => setGlobalParams(prev => ({ ...prev, angleInclinaison: Number(e.target.value) }))}
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
              value={globalParams.hausseElectricite}
              onChange={(e) => setGlobalParams(prev => ({ ...prev, hausseElectricite: Number(e.target.value) }))}
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
              value={globalParams.hausseElectriciteGraph}
              onChange={(e) => setGlobalParams(prev => ({ ...prev, hausseElectriciteGraph: Number(e.target.value) }))}
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
              value={globalParams.periodeCalcul}
              onChange={(e) => setGlobalParams(prev => ({ ...prev, periodeCalcul: Number(e.target.value) }))}
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

            <div className="grid lg:grid-cols-3 gap-6">
              {/* Simulators list */}
              <div className="lg:col-span-1 space-y-3">
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
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg bg-gradient-to-br ${sim.color} text-white`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-sm">{sim.title}</p>
                          </div>
                          {!isEnabled && (
                            <Lock className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Settings panel */}
              <div className="lg:col-span-2">
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
                              <TabIcon className="w-8 h-8" />
                              <span className="text-xs font-medium text-center">{tab.label}</span>
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
                      <Lock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p className="font-medium">Simulateur non disponible</p>
                      <p className="text-sm mt-1">Ce simulateur n'est pas encore configurable</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default AdminSimulators;
