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

interface RegionRate {
  region: string;
  rate: number;
}

interface SolarRatesSettings {
  france: number;
  regions: RegionRate[];
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
  { code: "corse", label: "Corse" },
  { code: "reunion", label: "Réunion" },
  { code: "martinique", label: "Martinique" },
  { code: "guadeloupe", label: "Guadeloupe" },
  { code: "guyane", label: "Guyane" },
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
  
  // Solar simulator settings - Regions
  const [solarRates, setSolarRates] = useState<SolarRatesSettings>({
    france: 0.13,
    regions: []
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
        // Load rates settings
        const { data: ratesData, error: ratesError } = await supabase
          .from('simulator_settings')
          .select('*')
          .eq('simulator_id', 'solaire')
          .eq('setting_key', 'tarifs_rachat_kwh')
          .maybeSingle();

        if (ratesError && ratesError.code !== 'PGRST116') {
          console.error('Error loading rates settings:', ratesError);
        }

        if (ratesData?.setting_value) {
          const value = ratesData.setting_value as unknown as SolarRatesSettings;
          setSolarRates({
            france: value.france ?? 0.13,
            regions: value.regions ?? []
          });
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

  const handleSaveRates = async () => {
    setSaving(true);
    try {
      await saveSettingToDb('tarifs_rachat_kwh', solarRates);
      toast({
        title: "Paramètres enregistrés",
        description: "Les tarifs de rachat ont été mis à jour avec succès.",
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
    const usedRegions = solarRates.regions.map(r => r.region);
    const availableRegion = REGION_OPTIONS.find(r => !usedRegions.includes(r.code));
    
    if (availableRegion) {
      setSolarRates(prev => ({
        ...prev,
        regions: [...prev.regions, { region: availableRegion.code, rate: 0.13 }]
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
    setSolarRates(prev => ({
      ...prev,
      regions: prev.regions.filter((_, i) => i !== index)
    }));
  };

  const updateRegion = (index: number, field: 'region' | 'rate', value: string | number) => {
    setSolarRates(prev => ({
      ...prev,
      regions: prev.regions.map((r, i) => 
        i === index ? { ...r, [field]: field === 'rate' ? Number(value) : value } : r
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

  const renderRegionsTab = () => (
    <div className="space-y-6">
      {/* France rate */}
      <div className="space-y-2">
        <Label htmlFor="france-rate" className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-blue-600" />
          Tarif rachat kWh France
        </Label>
        <div className="flex items-center gap-2">
          <Input
            id="france-rate"
            type="number"
            step="0.01"
            min="0"
            value={solarRates.france}
            onChange={(e) => setSolarRates(prev => ({ ...prev, france: Number(e.target.value) }))}
            className="max-w-xs"
          />
          <span className="text-muted-foreground">€/kWh</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Tarif de rachat par défaut pour la France métropolitaine
        </p>
      </div>

      {/* Regional rates */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-orange-500" />
            Tarifs régionaux spécifiques
          </Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addRegion}
            className="gap-1"
          >
            <Plus className="w-4 h-4" />
            Ajouter une région
          </Button>
        </div>

        {solarRates.regions.length === 0 ? (
          <div className="border border-dashed rounded-lg p-6 text-center text-muted-foreground">
            <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Aucune région spécifique configurée</p>
            <p className="text-xs mt-1">Le tarif France sera appliqué à toutes les régions</p>
          </div>
        ) : (
          <div className="space-y-3">
            {solarRates.regions.map((regionRate, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <select
                  value={regionRate.region}
                  onChange={(e) => updateRegion(index, 'region', e.target.value)}
                  className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {REGION_OPTIONS.map(opt => (
                    <option key={opt.code} value={opt.code}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={regionRate.rate}
                  onChange={(e) => updateRegion(index, 'rate', e.target.value)}
                  className="max-w-[120px]"
                />
                <span className="text-sm text-muted-foreground">€/kWh</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeRegion(index)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 ml-auto"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Save button */}
      <div className="pt-4 border-t">
        <Button
          onClick={handleSaveRates}
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
