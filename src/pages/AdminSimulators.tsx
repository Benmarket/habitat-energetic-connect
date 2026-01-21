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
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, ArrowLeft, Sun, Zap, Home, Thermometer, Wind, Calculator, Plus, Trash2, Lock, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface RegionRate {
  region: string;
  rate: number;
}

interface SolarRatesSettings {
  france: number;
  regions: RegionRate[];
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

const AdminSimulators = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [selectedSimulator, setSelectedSimulator] = useState<string | null>("solaire");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Solar simulator settings
  const [solarRates, setSolarRates] = useState<SolarRatesSettings>({
    france: 0.13,
    regions: []
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
        const { data, error } = await supabase
          .from('simulator_settings')
          .select('*')
          .eq('simulator_id', 'solaire')
          .eq('setting_key', 'tarifs_rachat_kwh')
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          console.error('Error loading settings:', error);
        }

        if (data?.setting_value) {
          const value = data.setting_value as unknown as SolarRatesSettings;
          setSolarRates({
            france: value.france ?? 0.13,
            regions: value.regions ?? []
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

  const handleSave = async () => {
    setSaving(true);
    try {
      // First try to update existing record
      const { data: existing } = await supabase
        .from('simulator_settings')
        .select('id')
        .eq('simulator_id', 'solaire')
        .eq('setting_key', 'tarifs_rachat_kwh')
        .maybeSingle();

      if (existing) {
        // Update existing
        const { error: updateError } = await supabase
          .from('simulator_settings')
          .update({ setting_value: JSON.parse(JSON.stringify(solarRates)) })
          .eq('id', existing.id);
        if (updateError) throw updateError;
      } else {
        // Insert new
        const { error: insertError } = await supabase
          .from('simulator_settings')
          .insert([{
            simulator_id: 'solaire',
            setting_key: 'tarifs_rachat_kwh',
            setting_value: JSON.parse(JSON.stringify(solarRates))
          }]);
        if (insertError) throw insertError;
      }

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

  const addRegion = () => {
    // Find a region that's not already added
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
                          <CardDescription>Configurez les tarifs de rachat kWh</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
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
                            {solarRates.regions.map((regionRate, index) => {
                              const regionLabel = REGION_OPTIONS.find(r => r.code === regionRate.region)?.label || regionRate.region;
                              return (
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
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Save button */}
                      <div className="pt-4 border-t">
                        <Button
                          onClick={handleSave}
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
