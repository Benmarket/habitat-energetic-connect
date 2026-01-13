import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
  Plus, Edit, Trash2, Building2, Megaphone, Star, Check, X, Eye, 
  Search, Calendar, ArrowLeft, Globe, MapPin, Power, PowerOff
} from "lucide-react";
import AdvertisementPreview from "@/components/AdvertisementPreview";
import { Helmet } from "react-helmet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Checkbox } from "@/components/ui/checkbox";

// Types
type RegionCode = 'fr' | 'corse' | 'guadeloupe' | 'martinique' | 'guyane' | 'reunion';

interface Advertiser {
  id: string;
  name: string;
  logo: string | null;
  description: string | null;
  website: string | null;
  contact_email: string | null;
  is_active: boolean;
  created_at: string;
  postal_code: string | null;
  city: string | null;
  department: string | null;
  region: string | null;
  intervention_radius_km: number | null;
  intervention_departments: string[] | null;
}

interface Advertisement {
  id: string;
  advertiser_id: string;
  title: string;
  description: string;
  image: string | null;
  price: number;
  original_price: number | null;
  features: string[];
  cta_text: string;
  cta_url: string;
  badge_text: string | null;
  badge_type: string;
  is_featured: boolean;
  status: string;
  expires_at: string | null;
  created_at: string;
  target_regions: string[] | null;
  advertiser?: {
    id: string;
    name: string;
    is_active: boolean;
  };
}

const ALL_REGIONS: { code: RegionCode; label: string }[] = [
  { code: 'fr', label: 'France métropolitaine' },
  { code: 'corse', label: 'Corse' },
  { code: 'guadeloupe', label: 'Guadeloupe' },
  { code: 'martinique', label: 'Martinique' },
  { code: 'guyane', label: 'Guyane' },
  { code: 'reunion', label: 'La Réunion' },
];

const REGIONS_FRANCE = [
  "Auvergne-Rhône-Alpes", "Bourgogne-Franche-Comté", "Bretagne", "Centre-Val de Loire",
  "Corse", "Grand Est", "Hauts-de-France", "Île-de-France", "Normandie",
  "Nouvelle-Aquitaine", "Occitanie", "Pays de la Loire", "Provence-Alpes-Côte d'Azur",
  "Guadeloupe", "Martinique", "Guyane", "La Réunion", "Mayotte"
];

const AdminAdvertising = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  
  // Data states
  const [advertisers, setAdvertisers] = useState<Advertiser[]>([]);
  const [advertisements, setAdvertisements] = useState<Advertisement[]>([]);
  const [loading, setLoading] = useState(true);
  
  // UI states
  const [activeTab, setActiveTab] = useState<'advertisers' | 'audiences' | 'ads'>('advertisers');
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined
  });
  
  // Dialogs
  const [advertiserDialogOpen, setAdvertiserDialogOpen] = useState(false);
  const [adDialogOpen, setAdDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  
  // Editing states
  const [editingAdvertiser, setEditingAdvertiser] = useState<Advertiser | null>(null);
  const [editingAd, setEditingAd] = useState<Advertisement | null>(null);
  const [previewingAd, setPreviewingAd] = useState<Advertisement | null>(null);
  
  // Form states - Advertiser
  const [newDepartment, setNewDepartment] = useState("");
  const [advertiserForm, setAdvertiserForm] = useState({
    name: "", logo: "", description: "", website: "", contact_email: "",
    is_active: true, postal_code: "", city: "", department: "", region: "",
    intervention_radius_km: "", intervention_departments: [] as string[],
  });
  
  // Form states - Ad
  const [currentFeature, setCurrentFeature] = useState("");
  const [adForm, setAdForm] = useState({
    advertiser_id: "", title: "", description: "", image: "",
    price: "", original_price: "", features: [] as string[],
    cta_text: "Voir l'offre", cta_url: "", badge_text: "", badge_type: "sponsored",
    is_featured: false, status: "active", expires_at: "", target_regions: [] as RegionCode[],
  });
  
  // Filter states
  const [selectedAdvertiserFilter, setSelectedAdvertiserFilter] = useState<string | null>(null);
  const [selectedRegionFilter, setSelectedRegionFilter] = useState<RegionCode | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/connexion");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [advertisersRes, adsRes] = await Promise.all([
        supabase.from("advertisers").select("*").order("created_at", { ascending: false }),
        supabase.from("advertisements").select(`*, advertiser:advertisers(id, name, is_active)`).order("created_at", { ascending: false })
      ]);
      
      if (advertisersRes.error) throw advertisersRes.error;
      if (adsRes.error) throw adsRes.error;
      
      setAdvertisers(advertisersRes.data || []);
      setAdvertisements(adsRes.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  // ====== COMPUTED VALUES ======
  
  // Compute ads by region (audiences)
  const adsByRegion = useMemo(() => {
    const regionMap = new Map<RegionCode, { ads: Advertisement[]; activeCount: number }>();
    
    ALL_REGIONS.forEach(r => {
      const adsForRegion = advertisements.filter(ad => {
        // If no target_regions, ad is for all regions
        if (!ad.target_regions || ad.target_regions.length === 0) return true;
        return ad.target_regions.includes(r.code);
      });
      
      const activeCount = adsForRegion.filter(ad => 
        ad.status === 'active' && ad.advertiser?.is_active !== false
      ).length;
      
      regionMap.set(r.code, { ads: adsForRegion, activeCount });
    });
    
    return regionMap;
  }, [advertisements]);
  
  // Filter based on search and date
  const filteredAdvertisers = useMemo(() => {
    return advertisers.filter(a => {
      const matchesSearch = !searchQuery || 
        a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.region?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesDate = !dateRange.from || 
        new Date(a.created_at) >= dateRange.from;
        
      return matchesSearch && matchesDate;
    });
  }, [advertisers, searchQuery, dateRange]);
  
  const filteredAds = useMemo(() => {
    return advertisements.filter(ad => {
      const matchesSearch = !searchQuery ||
        ad.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ad.advertiser?.name?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesDate = !dateRange.from ||
        new Date(ad.created_at) >= dateRange.from;
      
      const matchesAdvertiser = !selectedAdvertiserFilter ||
        ad.advertiser_id === selectedAdvertiserFilter;
      
      const matchesRegion = !selectedRegionFilter ||
        !ad.target_regions || ad.target_regions.length === 0 ||
        ad.target_regions.includes(selectedRegionFilter);
      
      return matchesSearch && matchesDate && matchesAdvertiser && matchesRegion;
    });
  }, [advertisements, searchQuery, dateRange, selectedAdvertiserFilter, selectedRegionFilter]);

  // ====== ADVERTISER HANDLERS ======
  
  const handleSubmitAdvertiser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = {
      name: advertiserForm.name,
      logo: advertiserForm.logo || null,
      description: advertiserForm.description || null,
      website: advertiserForm.website || null,
      contact_email: advertiserForm.contact_email || null,
      is_active: advertiserForm.is_active,
      postal_code: advertiserForm.postal_code || null,
      city: advertiserForm.city || null,
      department: advertiserForm.department || null,
      region: advertiserForm.region || null,
      intervention_radius_km: advertiserForm.intervention_radius_km ? parseInt(advertiserForm.intervention_radius_km) : null,
      intervention_departments: advertiserForm.intervention_departments.length > 0 ? advertiserForm.intervention_departments : null,
    };

    try {
      if (editingAdvertiser) {
        const { error } = await supabase.from("advertisers").update(data).eq("id", editingAdvertiser.id);
        if (error) throw error;
        toast.success("Annonceur mis à jour");
      } else {
        const { error } = await supabase.from("advertisers").insert([data]);
        if (error) throw error;
        toast.success("Annonceur créé");
      }
      setAdvertiserDialogOpen(false);
      resetAdvertiserForm();
      fetchData();
    } catch (error) {
      console.error("Error saving advertiser:", error);
      toast.error("Erreur lors de l'enregistrement");
    }
  };

  const handleEditAdvertiser = (advertiser: Advertiser) => {
    setEditingAdvertiser(advertiser);
    setAdvertiserForm({
      name: advertiser.name,
      logo: advertiser.logo || "",
      description: advertiser.description || "",
      website: advertiser.website || "",
      contact_email: advertiser.contact_email || "",
      is_active: advertiser.is_active,
      postal_code: advertiser.postal_code || "",
      city: advertiser.city || "",
      department: advertiser.department || "",
      region: advertiser.region || "",
      intervention_radius_km: advertiser.intervention_radius_km?.toString() || "",
      intervention_departments: advertiser.intervention_departments || [],
    });
    setAdvertiserDialogOpen(true);
  };

  const handleDeleteAdvertiser = async (id: string) => {
    if (!confirm("Supprimer cet annonceur ? Toutes ses annonces seront également supprimées.")) return;
    try {
      const { error } = await supabase.from("advertisers").delete().eq("id", id);
      if (error) throw error;
      toast.success("Annonceur supprimé");
      fetchData();
    } catch (error) {
      console.error("Error deleting advertiser:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const toggleAdvertiserActive = async (advertiser: Advertiser) => {
    try {
      const { error } = await supabase.from("advertisers").update({ is_active: !advertiser.is_active }).eq("id", advertiser.id);
      if (error) throw error;
      toast.success(advertiser.is_active ? "Annonceur désactivé (toutes ses annonces sont maintenant masquées)" : "Annonceur activé");
      fetchData();
    } catch (error) {
      console.error("Error toggling advertiser:", error);
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const resetAdvertiserForm = () => {
    setEditingAdvertiser(null);
    setNewDepartment("");
    setAdvertiserForm({
      name: "", logo: "", description: "", website: "", contact_email: "",
      is_active: true, postal_code: "", city: "", department: "", region: "",
      intervention_radius_km: "", intervention_departments: [],
    });
  };

  const addDepartment = () => {
    if (newDepartment && !advertiserForm.intervention_departments.includes(newDepartment)) {
      setAdvertiserForm({
        ...advertiserForm,
        intervention_departments: [...advertiserForm.intervention_departments, newDepartment.padStart(2, '0')]
      });
      setNewDepartment("");
    }
  };

  const removeDepartment = (dept: string) => {
    setAdvertiserForm({
      ...advertiserForm,
      intervention_departments: advertiserForm.intervention_departments.filter(d => d !== dept)
    });
  };

  // ====== AD HANDLERS ======
  
  const handleSubmitAd = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!adForm.advertiser_id) {
      toast.error("Veuillez sélectionner un annonceur");
      return;
    }

    const data = {
      advertiser_id: adForm.advertiser_id,
      title: adForm.title,
      description: adForm.description,
      image: adForm.image || null,
      price: parseFloat(adForm.price),
      original_price: adForm.original_price ? parseFloat(adForm.original_price) : null,
      features: adForm.features,
      cta_text: adForm.cta_text,
      cta_url: adForm.cta_url,
      badge_text: adForm.badge_text || null,
      badge_type: adForm.badge_type,
      is_featured: adForm.is_featured,
      status: adForm.status,
      expires_at: adForm.expires_at ? new Date(adForm.expires_at).toISOString() : null,
      target_regions: adForm.target_regions.length > 0 ? adForm.target_regions : null,
    };

    try {
      if (editingAd) {
        const { error } = await supabase.from("advertisements").update(data).eq("id", editingAd.id);
        if (error) throw error;
        toast.success("Annonce mise à jour");
      } else {
        const { error } = await supabase.from("advertisements").insert([data]);
        if (error) throw error;
        toast.success("Annonce créée");
      }
      setAdDialogOpen(false);
      resetAdForm();
      fetchData();
    } catch (error) {
      console.error("Error saving ad:", error);
      toast.error("Erreur lors de l'enregistrement");
    }
  };

  const handleEditAd = (ad: Advertisement) => {
    setEditingAd(ad);
    setAdForm({
      advertiser_id: ad.advertiser_id,
      title: ad.title,
      description: ad.description,
      image: ad.image || "",
      price: ad.price?.toString() || "",
      original_price: ad.original_price?.toString() || "",
      features: ad.features || [],
      cta_text: ad.cta_text,
      cta_url: ad.cta_url,
      badge_text: ad.badge_text || "",
      badge_type: ad.badge_type || "sponsored",
      is_featured: ad.is_featured,
      status: ad.status,
      expires_at: ad.expires_at ? ad.expires_at.split('T')[0] : "",
      target_regions: (ad.target_regions || []) as RegionCode[],
    });
    setAdDialogOpen(true);
  };

  const handleDeleteAd = async (id: string) => {
    if (!confirm("Supprimer cette annonce ?")) return;
    try {
      const { error } = await supabase.from("advertisements").delete().eq("id", id);
      if (error) throw error;
      toast.success("Annonce supprimée");
      fetchData();
    } catch (error) {
      console.error("Error deleting ad:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const toggleAdFeatured = async (ad: Advertisement) => {
    const featuredCount = advertisements.filter(a => a.is_featured).length;
    if (!ad.is_featured && featuredCount >= 3) {
      toast.error("Maximum 3 annonces en vedette");
      return;
    }
    try {
      const { error } = await supabase.from("advertisements").update({ is_featured: !ad.is_featured }).eq("id", ad.id);
      if (error) throw error;
      toast.success(ad.is_featured ? "Retirée de la vedette" : "Mise en vedette");
      fetchData();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Erreur");
    }
  };

  const toggleAdStatus = async (ad: Advertisement) => {
    const newStatus = ad.status === 'active' ? 'paused' : 'active';
    try {
      const { error } = await supabase.from("advertisements").update({ status: newStatus }).eq("id", ad.id);
      if (error) throw error;
      toast.success(newStatus === 'active' ? "Annonce activée" : "Annonce mise en pause");
      fetchData();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Erreur");
    }
  };

  const resetAdForm = () => {
    setEditingAd(null);
    setCurrentFeature("");
    setAdForm({
      advertiser_id: "", title: "", description: "", image: "",
      price: "", original_price: "", features: [],
      cta_text: "Voir l'offre", cta_url: "", badge_text: "", badge_type: "sponsored",
      is_featured: false, status: "active", expires_at: "", target_regions: [],
    });
  };

  const addFeature = () => {
    if (!currentFeature.trim()) return;
    setAdForm({ ...adForm, features: [...adForm.features, currentFeature.trim()] });
    setCurrentFeature("");
  };

  const removeFeature = (index: number) => {
    setAdForm({ ...adForm, features: adForm.features.filter((_, i) => i !== index) });
  };

  const toggleAdRegion = (region: RegionCode) => {
    const newRegions = adForm.target_regions.includes(region)
      ? adForm.target_regions.filter(r => r !== region)
      : [...adForm.target_regions, region];
    setAdForm({ ...adForm, target_regions: newRegions });
  };

  // Get count of ads for an advertiser
  const getAdvertiserAdsCount = (advertiserId: string) => {
    return advertisements.filter(ad => ad.advertiser_id === advertiserId).length;
  };

  const getActiveAdsCount = (advertiserId: string) => {
    return advertisements.filter(ad => ad.advertiser_id === advertiserId && ad.status === 'active').length;
  };

  // ====== RENDER ======

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const featuredCount = advertisements.filter(ad => ad.is_featured).length;
  const activeAdvertisers = advertisers.filter(a => a.is_active).length;

  return (
    <>
      <Helmet>
        <title>Gestion des Annonces | Prime Énergies</title>
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="container mx-auto px-4 pt-32 pb-8">
          <Link 
            to="/administration"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à l'administration
          </Link>

          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Gestion des Annonces</h1>
            <p className="text-muted-foreground">
              {activeAdvertisers} annonceur{activeAdvertisers > 1 ? 's' : ''} actif{activeAdvertisers > 1 ? 's' : ''} • {featuredCount}/3 annonces en vedette
            </p>
          </div>

          {/* Toolbar: Search, Date, Tabs */}
          <div className="bg-card border rounded-lg p-4 mb-6">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              {/* Search */}
              <div className="relative w-full lg:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par nom, ID ou indicateur..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Date picker */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Calendar className="w-4 h-4" />
                    {dateRange.from ? format(dateRange.from, "d MMM yyyy", { locale: fr }) : "Sélectionner dates"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <CalendarComponent
                    mode="range"
                    selected={{ from: dateRange.from, to: dateRange.to }}
                    onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                    locale={fr}
                  />
                  {dateRange.from && (
                    <div className="p-2 border-t">
                      <Button variant="ghost" size="sm" onClick={() => setDateRange({ from: undefined, to: undefined })}>
                        Effacer
                      </Button>
                    </div>
                  )}
                </PopoverContent>
              </Popover>
            </div>

            {/* Tabs */}
            <div className="mt-4">
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
                <TabsList className="grid w-full max-w-md grid-cols-3">
                  <TabsTrigger value="advertisers" className="gap-2">
                    <Building2 className="w-4 h-4" />
                    Annonceurs
                  </TabsTrigger>
                  <TabsTrigger value="audiences" className="gap-2">
                    <Globe className="w-4 h-4" />
                    Audiences
                  </TabsTrigger>
                  <TabsTrigger value="ads" className="gap-2">
                    <Megaphone className="w-4 h-4" />
                    Annonces
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'advertisers' && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Liste des Annonceurs ({filteredAdvertisers.length})
                </CardTitle>
                <Dialog open={advertiserDialogOpen} onOpenChange={(open) => {
                  setAdvertiserDialogOpen(open);
                  if (!open) resetAdvertiserForm();
                }}>
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <Plus className="w-4 h-4" />
                      Nouvel Annonceur
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{editingAdvertiser ? "Modifier l'annonceur" : "Créer un annonceur"}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmitAdvertiser} className="space-y-6">
                      <div className="space-y-4">
                        <h3 className="font-semibold border-b pb-2">Informations générales</h3>
                        <div>
                          <Label>Nom *</Label>
                          <Input value={advertiserForm.name} onChange={(e) => setAdvertiserForm({ ...advertiserForm, name: e.target.value })} required placeholder="Nom de l'entreprise" />
                        </div>
                        <div>
                          <Label>URL du logo</Label>
                          <Input type="url" value={advertiserForm.logo} onChange={(e) => setAdvertiserForm({ ...advertiserForm, logo: e.target.value })} placeholder="https://..." />
                        </div>
                        <div>
                          <Label>Description</Label>
                          <Textarea value={advertiserForm.description} onChange={(e) => setAdvertiserForm({ ...advertiserForm, description: e.target.value })} rows={3} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Site web</Label>
                            <Input type="url" value={advertiserForm.website} onChange={(e) => setAdvertiserForm({ ...advertiserForm, website: e.target.value })} />
                          </div>
                          <div>
                            <Label>Email de contact</Label>
                            <Input type="email" value={advertiserForm.contact_email} onChange={(e) => setAdvertiserForm({ ...advertiserForm, contact_email: e.target.value })} />
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <h3 className="font-semibold border-b pb-2 flex items-center gap-2">
                          <MapPin className="w-5 h-5" />
                          Localisation
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Code postal</Label>
                            <Input value={advertiserForm.postal_code} onChange={(e) => setAdvertiserForm({ ...advertiserForm, postal_code: e.target.value })} maxLength={5} />
                          </div>
                          <div>
                            <Label>Ville</Label>
                            <Input value={advertiserForm.city} onChange={(e) => setAdvertiserForm({ ...advertiserForm, city: e.target.value })} />
                          </div>
                        </div>
                        <div>
                          <Label>Région</Label>
                          <select
                            value={advertiserForm.region}
                            onChange={(e) => setAdvertiserForm({ ...advertiserForm, region: e.target.value })}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          >
                            <option value="">Sélectionner...</option>
                            {REGIONS_FRANCE.map((r) => <option key={r} value={r}>{r}</option>)}
                          </select>
                        </div>
                        <div>
                          <Label>Départements couverts</Label>
                          <div className="flex gap-2 mt-2">
                            <Input
                              value={newDepartment}
                              onChange={(e) => setNewDepartment(e.target.value)}
                              placeholder="Ex: 75, 92..."
                              maxLength={3}
                              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addDepartment(); } }}
                            />
                            <Button type="button" variant="outline" onClick={addDepartment}>
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                          {advertiserForm.intervention_departments.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                              {advertiserForm.intervention_departments.map((dept) => (
                                <Badge key={dept} variant="secondary" className="gap-1">
                                  {dept}
                                  <button type="button" onClick={() => removeDepartment(dept)} className="ml-1 hover:text-destructive">
                                    <X className="w-3 h-3" />
                                  </button>
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch id="is_active" checked={advertiserForm.is_active} onCheckedChange={(checked) => setAdvertiserForm({ ...advertiserForm, is_active: checked })} />
                        <Label htmlFor="is_active">Annonceur actif</Label>
                      </div>

                      <div className="flex gap-3 pt-4">
                        <Button type="submit" className="flex-1">{editingAdvertiser ? "Mettre à jour" : "Créer"}</Button>
                        <Button type="button" variant="outline" onClick={() => setAdvertiserDialogOpen(false)} className="flex-1">Annuler</Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Statut</TableHead>
                      <TableHead>Annonceur</TableHead>
                      <TableHead>Localisation</TableHead>
                      <TableHead className="text-center">Annonces</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAdvertisers.map((advertiser) => (
                      <TableRow key={advertiser.id} className={!advertiser.is_active ? "opacity-50" : ""}>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleAdvertiserActive(advertiser)}
                            className={advertiser.is_active ? "text-green-600 hover:text-green-700" : "text-muted-foreground hover:text-foreground"}
                          >
                            {advertiser.is_active ? <Power className="w-5 h-5" /> : <PowerOff className="w-5 h-5" />}
                          </Button>
                        </TableCell>
                        <TableCell>
                          <div 
                            className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => { setSelectedAdvertiserFilter(advertiser.id); setActiveTab('ads'); }}
                          >
                            {advertiser.logo && (
                              <img src={advertiser.logo} alt={advertiser.name} className="w-10 h-10 rounded-lg object-cover" />
                            )}
                            <div>
                              <div className="font-medium hover:text-primary transition-colors">{advertiser.name}</div>
                              {advertiser.website && (
                                <a 
                                  href={advertiser.website} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="text-xs text-muted-foreground hover:underline"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {advertiser.website}
                                </a>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {advertiser.city && <span>{advertiser.city}</span>}
                            {advertiser.region && <span className="text-muted-foreground"> • {advertiser.region}</span>}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex flex-col items-center">
                            <span className="font-medium">{getActiveAdsCount(advertiser.id)}</span>
                            <span className="text-xs text-muted-foreground">/ {getAdvertiserAdsCount(advertiser.id)} total</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => { setSelectedAdvertiserFilter(advertiser.id); setActiveTab('ads'); }}>
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleEditAdvertiser(advertiser)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteAdvertiser(advertiser.id)} className="text-destructive hover:text-destructive">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {activeTab === 'audiences' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Audiences par Région
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {ALL_REGIONS.map((region) => {
                    const data = adsByRegion.get(region.code);
                    const adsCount = data?.ads.length || 0;
                    const activeCount = data?.activeCount || 0;
                    
                    return (
                      <Card 
                        key={region.code} 
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => { setSelectedRegionFilter(region.code); setActiveTab('ads'); }}
                      >
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-primary/10 rounded-lg">
                                <Globe className="w-5 h-5 text-primary" />
                              </div>
                              <div>
                                <h3 className="font-semibold">{region.label}</h3>
                                <p className="text-xs text-muted-foreground">{region.code.toUpperCase()}</p>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-2xl font-bold">{activeCount}</span>
                              <span className="text-muted-foreground text-sm ml-1">/ {adsCount}</span>
                            </div>
                            <Badge variant={activeCount > 0 ? "default" : "secondary"}>
                              {activeCount > 0 ? "Actif" : "Inactif"}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            {activeCount} annonce{activeCount > 1 ? 's' : ''} active{activeCount > 1 ? 's' : ''} sur {adsCount} total
                          </p>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'ads' && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Megaphone className="w-5 h-5" />
                    Liste des Annonces ({filteredAds.length})
                  </CardTitle>
                  {(selectedAdvertiserFilter || selectedRegionFilter) && (
                    <div className="flex gap-2 mt-2">
                      {selectedAdvertiserFilter && (
                        <Badge variant="outline" className="gap-1">
                          Annonceur: {advertisers.find(a => a.id === selectedAdvertiserFilter)?.name}
                          <button onClick={() => setSelectedAdvertiserFilter(null)}><X className="w-3 h-3" /></button>
                        </Badge>
                      )}
                      {selectedRegionFilter && (
                        <Badge variant="outline" className="gap-1">
                          Région: {ALL_REGIONS.find(r => r.code === selectedRegionFilter)?.label}
                          <button onClick={() => setSelectedRegionFilter(null)}><X className="w-3 h-3" /></button>
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
                <Dialog open={adDialogOpen} onOpenChange={(open) => {
                  setAdDialogOpen(open);
                  if (!open) resetAdForm();
                }}>
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <Plus className="w-4 h-4" />
                      Nouvelle Annonce
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{editingAd ? "Modifier l'annonce" : "Créer une annonce"}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmitAd} className="space-y-6">
                      <div>
                        <Label>Annonceur *</Label>
                        <Select value={adForm.advertiser_id} onValueChange={(v) => setAdForm({ ...adForm, advertiser_id: v })}>
                          <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                          <SelectContent>
                            {advertisers.filter(a => a.is_active).map((a) => (
                              <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Titre *</Label>
                        <Input value={adForm.title} onChange={(e) => setAdForm({ ...adForm, title: e.target.value })} required placeholder="Titre de l'offre" />
                      </div>

                      <div>
                        <Label>Description *</Label>
                        <Textarea value={adForm.description} onChange={(e) => setAdForm({ ...adForm, description: e.target.value })} required rows={3} />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Prix (€) *</Label>
                          <Input type="number" step="0.01" value={adForm.price} onChange={(e) => setAdForm({ ...adForm, price: e.target.value })} required />
                        </div>
                        <div>
                          <Label>Prix barré (€)</Label>
                          <Input type="number" step="0.01" value={adForm.original_price} onChange={(e) => setAdForm({ ...adForm, original_price: e.target.value })} />
                        </div>
                      </div>

                      <div>
                        <Label>URL de l'image</Label>
                        <Input type="url" value={adForm.image} onChange={(e) => setAdForm({ ...adForm, image: e.target.value })} />
                      </div>

                      <div>
                        <Label>Avantages</Label>
                        <div className="flex gap-2 mb-2">
                          <Input value={currentFeature} onChange={(e) => setCurrentFeature(e.target.value)} placeholder="Ajouter un avantage" onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())} />
                          <Button type="button" onClick={addFeature}><Plus className="w-4 h-4" /></Button>
                        </div>
                        {adForm.features.length > 0 && (
                          <div className="space-y-2">
                            {adForm.features.map((f, i) => (
                              <div key={i} className="flex items-center gap-2 p-2 bg-muted rounded">
                                <Check className="w-4 h-4 text-green-600" />
                                <span className="flex-1">{f}</span>
                                <Button type="button" variant="ghost" size="sm" onClick={() => removeFeature(i)}><X className="w-4 h-4" /></Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Texte du bouton *</Label>
                          <Input value={adForm.cta_text} onChange={(e) => setAdForm({ ...adForm, cta_text: e.target.value })} required />
                        </div>
                        <div>
                          <Label>URL du bouton *</Label>
                          <Input type="url" value={adForm.cta_url} onChange={(e) => setAdForm({ ...adForm, cta_url: e.target.value })} required />
                        </div>
                      </div>

                      {/* Audiences (Régions) */}
                      <div>
                        <Label className="flex items-center gap-2 mb-3">
                          <Globe className="w-4 h-4" />
                          Audiences (Régions ciblées)
                        </Label>
                        <p className="text-xs text-muted-foreground mb-3">
                          Laissez vide pour cibler toutes les régions
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {ALL_REGIONS.map((region) => (
                            <div key={region.code} className="flex items-center space-x-2">
                              <Checkbox
                                id={`region-${region.code}`}
                                checked={adForm.target_regions.includes(region.code)}
                                onCheckedChange={() => toggleAdRegion(region.code)}
                              />
                              <Label htmlFor={`region-${region.code}`} className="text-sm cursor-pointer">
                                {region.label}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Statut</Label>
                          <Select value={adForm.status} onValueChange={(v) => setAdForm({ ...adForm, status: v })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">Actif</SelectItem>
                              <SelectItem value="paused">En pause</SelectItem>
                              <SelectItem value="expired">Expiré</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Date d'expiration</Label>
                          <Input type="date" value={adForm.expires_at} onChange={(e) => setAdForm({ ...adForm, expires_at: e.target.value })} />
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch id="is_featured" checked={adForm.is_featured} onCheckedChange={(v) => setAdForm({ ...adForm, is_featured: v })} />
                        <Label htmlFor="is_featured">Mettre en vedette</Label>
                      </div>

                      <div className="flex gap-3 pt-4">
                        <Button type="submit" className="flex-1">{editingAd ? "Mettre à jour" : "Créer"}</Button>
                        <Button type="button" variant="outline" onClick={() => setAdDialogOpen(false)} className="flex-1">Annuler</Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Statut</TableHead>
                      <TableHead>Annonce</TableHead>
                      <TableHead>Annonceur</TableHead>
                      <TableHead>Audiences</TableHead>
                      <TableHead className="text-center">Prix</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAds.map((ad) => {
                      const isAdvertiserInactive = ad.advertiser?.is_active === false;
                      const isEffectivelyDisabled = isAdvertiserInactive || ad.status !== 'active';
                      
                      return (
                        <TableRow key={ad.id} className={isEffectivelyDisabled ? "opacity-50" : ""}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => toggleAdStatus(ad)}
                                disabled={isAdvertiserInactive}
                                className={ad.status === 'active' && !isAdvertiserInactive ? "text-green-600 hover:text-green-700" : "text-muted-foreground hover:text-foreground"}
                              >
                                {ad.status === 'active' && !isAdvertiserInactive ? <Power className="w-5 h-5" /> : <PowerOff className="w-5 h-5" />}
                              </Button>
                              {ad.is_featured && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {ad.image && <img src={ad.image} alt="" className="w-12 h-12 rounded-lg object-cover" />}
                              <div>
                                <div className="font-medium">{ad.title}</div>
                                <div className="text-xs text-muted-foreground truncate max-w-[200px]">{ad.description}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span>{ad.advertiser?.name}</span>
                              {isAdvertiserInactive && (
                                <Badge variant="destructive" className="text-xs">Inactif</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {(!ad.target_regions || ad.target_regions.length === 0) ? (
                                <Badge variant="outline">Toutes</Badge>
                              ) : (
                                ad.target_regions.slice(0, 2).map(r => (
                                  <Badge key={r} variant="secondary" className="text-xs">{r.toUpperCase()}</Badge>
                                ))
                              )}
                              {ad.target_regions && ad.target_regions.length > 2 && (
                                <Badge variant="secondary" className="text-xs">+{ad.target_regions.length - 2}</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="font-medium">{ad.price?.toLocaleString('fr-FR')} €</div>
                            {ad.original_price && (
                              <div className="text-xs text-muted-foreground line-through">{ad.original_price?.toLocaleString('fr-FR')} €</div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="icon" onClick={() => { setPreviewingAd(ad); setPreviewDialogOpen(true); }}>
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => toggleAdFeatured(ad)}>
                                <Star className={`w-4 h-4 ${ad.is_featured ? "text-yellow-500 fill-yellow-500" : ""}`} />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleEditAd(ad)}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDeleteAd(ad.id)} className="text-destructive hover:text-destructive">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Preview Dialog */}
          <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Aperçu de l'annonce</DialogTitle>
              </DialogHeader>
              {previewingAd && (
                <AdvertisementPreview
                  title={previewingAd.title}
                  description={previewingAd.description}
                  image={previewingAd.image}
                  price={previewingAd.price}
                  original_price={previewingAd.original_price}
                  features={previewingAd.features}
                  cta_text={previewingAd.cta_text}
                  cta_url={previewingAd.cta_url}
                  badge_text={previewingAd.badge_text}
                  badge_type={previewingAd.badge_type}
                />
              )}
            </DialogContent>
          </Dialog>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default AdminAdvertising;
