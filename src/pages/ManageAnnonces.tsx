import { useState, useEffect } from "react";
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Megaphone, Star, Check, X, Eye, BarChart3, MousePointerClick, UserCheck, ArrowUpDown, Filter, Globe, AlertCircle, MapPin, Search } from "lucide-react";
import AdvertisementPreview from "@/components/AdvertisementPreview";
import AdStatsModal from "@/components/AdStatsModal";
import { Helmet } from "react-helmet";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

type RegionCode = 'fr' | 'corse' | 'guadeloupe' | 'martinique' | 'guyane' | 'reunion';

const ALL_REGIONS: { code: RegionCode; label: string }[] = [
  { code: 'fr', label: 'France métropolitaine' },
  { code: 'corse', label: 'Corse' },
  { code: 'guadeloupe', label: 'Guadeloupe' },
  { code: 'martinique', label: 'Martinique' },
  { code: 'guyane', label: 'Guyane' },
  { code: 'reunion', label: 'La Réunion' },
];
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
  views_count: number;
  clicks_count: number;
  conversions_count: number;
  target_regions: string[] | null;
  advertiser: {
    id: string;
    name: string;
  };
}

interface Advertiser {
  id: string;
  name: string;
  is_active: boolean;
}

interface FeaturedAdInfo {
  advertisement_id: string;
  region_code: string;
}

const ManageAnnonces = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [advertisements, setAdvertisements] = useState<Advertisement[]>([]);
  const [advertisers, setAdvertisers] = useState<Advertiser[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [statsDialogOpen, setStatsDialogOpen] = useState(false);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<Advertisement | null>(null);
  const [previewingAd, setPreviewingAd] = useState<Advertisement | null>(null);
  const [statsAd, setStatsAd] = useState<Advertisement | null>(null);
  const [currentFeature, setCurrentFeature] = useState("");
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [searchQuery, setSearchQuery] = useState("");
  
  // Featured ads by region
  const [featuredByRegion, setFeaturedByRegion] = useState<FeaturedAdInfo[]>([]);
  const [regionSelectAdId, setRegionSelectAdId] = useState<string | null>(null);
  
  // Filter states
  const [filterAdvertiserId, setFilterAdvertiserId] = useState<string | null>(null);
  const [filterRegion, setFilterRegion] = useState<RegionCode | null>(null);
  const [filterFeatured, setFilterFeatured] = useState<boolean | null>(null);
  
  const [formData, setFormData] = useState({
    advertiser_id: "",
    title: "",
    description: "",
    image: "",
    price: "",
    original_price: "",
    features: [] as string[],
    cta_text: "Voir l'offre",
    cta_url: "",
    badge_text: "",
    badge_type: "sponsored",
    is_featured: false,
    status: "active",
    expires_at: "",
    target_regions: [] as string[], // New field for target regions
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/connexion");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchAdvertisements();
      fetchAdvertisers();
      fetchFeaturedByRegion();
    }
  }, [user]);

  const fetchFeaturedByRegion = async () => {
    try {
      const { data, error } = await supabase
        .from("ad_region_featured")
        .select("advertisement_id, region_code");

      if (error) throw error;
      setFeaturedByRegion(data || []);
    } catch (error) {
      console.error("Error fetching featured by region:", error);
    }
  };

  const fetchAdvertisements = async () => {
    try {
      const { data, error } = await supabase
        .from("advertisements")
        .select(`
          *,
          advertiser:advertisers(id, name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAdvertisements(data || []);
    } catch (error) {
      console.error("Error fetching advertisements:", error);
      toast.error("Erreur lors du chargement des annonces");
    } finally {
      setLoading(false);
    }
  };

  const fetchAdvertisers = async () => {
    try {
      const { data, error } = await supabase
        .from("advertisers")
        .select("id, name, is_active")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      setAdvertisers(data || []);
    } catch (error) {
      console.error("Error fetching advertisers:", error);
    }
  };

  // Remove featured ads from regions that are no longer targeted
  const syncFeaturedWithTargetRegions = async (adId: string, newTargetRegions: string[]) => {
    const currentFeaturedRegions = getAdFeaturedRegions(adId);
    
    // If newTargetRegions is empty, it means all regions are targeted - no need to remove anything
    if (newTargetRegions.length === 0) return;
    
    // Find regions where the ad is featured but no longer targeted
    const regionsToRemove = currentFeaturedRegions.filter(
      region => !newTargetRegions.includes(region)
    );
    
    if (regionsToRemove.length > 0) {
      try {
        const { error } = await supabase
          .from("ad_region_featured")
          .delete()
          .eq("advertisement_id", adId)
          .in("region_code", regionsToRemove);
        
        if (error) throw error;
        
        toast.info(`Vedettes retirées des régions non ciblées: ${regionsToRemove.length}`);
      } catch (error) {
        console.error("Error syncing featured regions:", error);
      }
    }
  };

  // Remove all featured ads when ad becomes inactive
  const removeAllFeaturedForAd = async (adId: string) => {
    try {
      const { error } = await supabase
        .from("ad_region_featured")
        .delete()
        .eq("advertisement_id", adId);
      
      if (error) throw error;
    } catch (error) {
      console.error("Error removing featured for inactive ad:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.advertiser_id) {
      toast.error("Veuillez sélectionner un annonceur");
      return;
    }

    const adData = {
      advertiser_id: formData.advertiser_id,
      title: formData.title,
      description: formData.description,
      image: formData.image || null,
      price: parseFloat(formData.price),
      original_price: formData.original_price ? parseFloat(formData.original_price) : null,
      features: formData.features,
      cta_text: formData.cta_text,
      cta_url: formData.cta_url,
      badge_text: formData.badge_text || null,
      badge_type: formData.badge_type,
      is_featured: formData.is_featured,
      status: formData.status,
      expires_at: formData.expires_at ? new Date(formData.expires_at).toISOString() : null,
      target_regions: formData.target_regions.length > 0 ? formData.target_regions : null,
    };

    try {
      if (editingAd) {
        // Check if status changed to inactive
        if (editingAd.status === 'active' && formData.status !== 'active') {
          await removeAllFeaturedForAd(editingAd.id);
          toast.info("Vedettes retirées car l'annonce est inactive");
        }
        
        // Sync featured regions with new target regions
        await syncFeaturedWithTargetRegions(editingAd.id, formData.target_regions);
        
        const { error } = await supabase
          .from("advertisements")
          .update(adData)
          .eq("id", editingAd.id);

        if (error) throw error;
        toast.success("Annonce mise à jour avec succès");
      } else {
        const { error } = await supabase
          .from("advertisements")
          .insert([adData]);

        if (error) throw error;
        toast.success("Annonce créée avec succès");
      }

      setDialogOpen(false);
      resetForm();
      fetchAdvertisements();
      fetchFeaturedByRegion();
    } catch (error) {
      console.error("Error saving advertisement:", error);
      toast.error("Erreur lors de l'enregistrement");
    }
  };

  const handlePreview = (ad: Advertisement) => {
    setPreviewingAd(ad);
    setPreviewDialogOpen(true);
  };

  const handleStats = (ad: Advertisement) => {
    setStatsAd(ad);
    setStatsDialogOpen(true);
  };

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  // Filter and sort advertisements
  const filteredAdvertisements = advertisements.filter(ad => {
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesTitle = ad.title.toLowerCase().includes(query);
      const matchesAdvertiser = ad.advertiser?.name?.toLowerCase().includes(query);
      if (!matchesTitle && !matchesAdvertiser) return false;
    }
    
    // Filter by advertiser
    if (filterAdvertiserId && ad.advertiser_id !== filterAdvertiserId) return false;
    
    // Filter by featured - use featuredByRegion instead of is_featured
    if (filterFeatured !== null) {
      const adFeaturedRegions = getAdFeaturedRegions(ad.id);
      const isFeatured = adFeaturedRegions.length > 0;
      if (filterFeatured && !isFeatured) return false;
      if (!filterFeatured && isFeatured) return false;
    }
    
    // Filter by region - if ad has no target_regions, it's for all regions
    if (filterRegion) {
      const adRegions = ad.target_regions;
      if (adRegions && adRegions.length > 0 && !adRegions.includes(filterRegion)) {
        return false;
      }
    }
    
    return true;
  });

  const sortedAdvertisements = [...filteredAdvertisements].sort((a, b) => {
    const dateA = new Date(a.created_at).getTime();
    const dateB = new Date(b.created_at).getTime();
    return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
  });

  const activeFiltersCount = [filterAdvertiserId, filterRegion, filterFeatured].filter(f => f !== null).length;

  const clearFilters = () => {
    setFilterAdvertiserId(null);
    setFilterRegion(null);
    setFilterFeatured(null);
  };

  const handleEdit = (ad: Advertisement) => {
    setEditingAd(ad);
    setFormData({
      advertiser_id: ad.advertiser_id,
      title: ad.title,
      description: ad.description,
      image: ad.image || "",
      price: ad.price.toString(),
      original_price: ad.original_price?.toString() || "",
      features: ad.features,
      cta_text: ad.cta_text,
      cta_url: ad.cta_url,
      badge_text: ad.badge_text || "",
      badge_type: ad.badge_type,
      is_featured: ad.is_featured,
      status: ad.status,
      expires_at: ad.expires_at ? ad.expires_at.split('T')[0] : "",
      target_regions: ad.target_regions || [],
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette annonce ?")) return;

    try {
      // First remove all featured entries
      await supabase
        .from("ad_region_featured")
        .delete()
        .eq("advertisement_id", id);
      
      const { error } = await supabase
        .from("advertisements")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Annonce supprimée avec succès");
      fetchAdvertisements();
      fetchFeaturedByRegion();
    } catch (error) {
      console.error("Error deleting advertisement:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  // Get regions where an ad is featured
  const getAdFeaturedRegions = (adId: string): RegionCode[] => {
    return featuredByRegion
      .filter(f => f.advertisement_id === adId)
      .map(f => f.region_code as RegionCode);
  };

  // Get available regions for featuring (based on target_regions)
  const getAvailableRegionsForFeaturing = (ad: Advertisement): RegionCode[] => {
    // If no target_regions or empty, all regions are available
    if (!ad.target_regions || ad.target_regions.length === 0) {
      return ALL_REGIONS.map(r => r.code);
    }
    // Otherwise, only return the targeted regions
    return ad.target_regions as RegionCode[];
  };

  // Toggle featured for a specific region
  const toggleFeaturedForRegion = async (adId: string, regionCode: RegionCode, isCurrentlyFeatured: boolean) => {
    const ad = advertisements.find(a => a.id === adId);
    
    // Check if ad is active
    if (ad && ad.status !== 'active') {
      toast.error("Impossible de mettre en vedette une annonce inactive");
      return;
    }
    
    // Check if region is in target_regions (if target_regions is set)
    if (ad && ad.target_regions && ad.target_regions.length > 0 && !ad.target_regions.includes(regionCode)) {
      toast.error("Cette région n'est pas ciblée par l'annonce");
      return;
    }
    
    try {
      if (isCurrentlyFeatured) {
        // Remove from featured
        const { error } = await supabase
          .from("ad_region_featured")
          .delete()
          .eq("advertisement_id", adId)
          .eq("region_code", regionCode);

        if (error) throw error;
        toast.success(`Annonce retirée des vedettes pour ${ALL_REGIONS.find(r => r.code === regionCode)?.label}`);
      } else {
        // Check count for this region
        const regionFeaturedCount = featuredByRegion.filter(f => f.region_code === regionCode).length;
        if (regionFeaturedCount >= 3) {
          toast.error(`Maximum 3 vedettes atteint pour ${ALL_REGIONS.find(r => r.code === regionCode)?.label}`);
          return;
        }

        // Add to featured
        const { error } = await supabase
          .from("ad_region_featured")
          .insert({
            advertisement_id: adId,
            region_code: regionCode,
            display_order: regionFeaturedCount + 1
          });

        if (error) throw error;
        toast.success(`Annonce mise en vedette pour ${ALL_REGIONS.find(r => r.code === regionCode)?.label}`);
      }
      
      fetchFeaturedByRegion();
      setRegionSelectAdId(null);
    } catch (error) {
      console.error("Error toggling featured:", error);
      toast.error("Erreur lors de la mise à jour");
    }
  };

  // Handle click on featured button
  const handleFeaturedClick = (ad: Advertisement) => {
    // Block if inactive
    if (ad.status !== 'active') {
      toast.error("Activez l'annonce avant de la mettre en vedette");
      return;
    }
    
    const adFeaturedRegions = getAdFeaturedRegions(ad.id);
    
    if (filterRegion) {
      // Check if region is available for this ad
      const availableRegions = getAvailableRegionsForFeaturing(ad);
      if (!availableRegions.includes(filterRegion)) {
        toast.error("Cette annonce ne cible pas cette région");
        return;
      }
      
      // If a region filter is active, toggle directly for that region
      const isCurrentlyFeatured = adFeaturedRegions.includes(filterRegion);
      toggleFeaturedForRegion(ad.id, filterRegion, isCurrentlyFeatured);
    } else {
      // Show region selector
      setRegionSelectAdId(regionSelectAdId === ad.id ? null : ad.id);
    }
  };

  // Toggle target region in form
  const toggleTargetRegion = (regionCode: string) => {
    setFormData(prev => {
      const newRegions = prev.target_regions.includes(regionCode)
        ? prev.target_regions.filter(r => r !== regionCode)
        : [...prev.target_regions, regionCode];
      return { ...prev, target_regions: newRegions };
    });
  };

  // Select all regions
  const selectAllRegions = () => {
    setFormData(prev => ({
      ...prev,
      target_regions: [] // Empty means all regions
    }));
  };

  const addFeature = () => {
    if (!currentFeature.trim()) return;
    setFormData({
      ...formData,
      features: [...formData.features, currentFeature.trim()]
    });
    setCurrentFeature("");
  };

  const removeFeature = (index: number) => {
    setFormData({
      ...formData,
      features: formData.features.filter((_, i) => i !== index)
    });
  };

  const resetForm = () => {
    setEditingAd(null);
    setFormData({
      advertiser_id: "",
      title: "",
      description: "",
      image: "",
      price: "",
      original_price: "",
      features: [],
      cta_text: "Voir l'offre",
      cta_url: "",
      badge_text: "",
      badge_type: "sponsored",
      is_featured: false,
      status: "active",
      expires_at: "",
      target_regions: [],
    });
    setCurrentFeature("");
  };

  // Get display text for target regions
  const getTargetRegionsDisplay = (targetRegions: string[] | null): string => {
    if (!targetRegions || targetRegions.length === 0) return "Toutes";
    if (targetRegions.length === 6) return "Toutes";
    return targetRegions.length.toString();
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Count featured ads (total unique ads featured across regions)
  const uniqueFeaturedAds = new Set(featuredByRegion.map(f => f.advertisement_id));
  const featuredCount = uniqueFeaturedAds.size;

  return (
    <>
      <Helmet>
        <title>Gérer les Annonces | Prime Énergies</title>
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="container mx-auto px-4 pt-32 pb-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-4xl font-bold mb-2">Gestion des Annonces</h1>
                <p className="text-muted-foreground">
                  {advertisers.filter(a => a.is_active).length} annonceurs actifs • {featuredCount}/{advertisements.length} annonces en vedette
                </p>
              </div>
              
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => navigate("/admin/annonceurs")}
                >
                  Gérer les annonceurs
                </Button>
                <Dialog open={dialogOpen} onOpenChange={(open) => {
                  setDialogOpen(open);
                  if (!open) resetForm();
                }}>
                  <DialogTrigger asChild>
                    <Button size="lg" className="gap-2">
                      <Plus className="w-5 h-5" />
                      Nouvelle Annonce
                    </Button>
                  </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingAd ? "Modifier l'annonce" : "Créer une annonce"}
                    </DialogTitle>
                  </DialogHeader>
                  
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <Label htmlFor="advertiser_id">Annonceur *</Label>
                      <Select
                        value={formData.advertiser_id}
                        onValueChange={(value) => setFormData({ ...formData, advertiser_id: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un annonceur" />
                        </SelectTrigger>
                        <SelectContent>
                          {advertisers.map((advertiser) => (
                            <SelectItem key={advertiser.id} value={advertiser.id}>
                              {advertiser.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="title">Titre de l'offre *</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        required
                        placeholder="Ex: Kit Solaire Autoconsommation 3kWc"
                      />
                    </div>

                    <div>
                      <Label htmlFor="description">Description *</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        required
                        rows={3}
                        placeholder="Description détaillée de l'offre"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="price">Prix (€) *</Label>
                        <Input
                          id="price"
                          type="number"
                          step="0.01"
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                          required
                          placeholder="4990"
                        />
                      </div>
                      <div>
                        <Label htmlFor="original_price">Prix barré (€)</Label>
                        <Input
                          id="original_price"
                          type="number"
                          step="0.01"
                          value={formData.original_price}
                          onChange={(e) => setFormData({ ...formData, original_price: e.target.value })}
                          placeholder="6500"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="image">URL de l'image</Label>
                      <Input
                        id="image"
                        type="url"
                        value={formData.image}
                        onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>

                    {/* Target Regions Section */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          Régions ciblées
                        </Label>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm"
                          onClick={selectAllRegions}
                          className="text-xs"
                        >
                          {formData.target_regions.length === 0 ? "✓ Toutes sélectionnées" : "Sélectionner toutes"}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formData.target_regions.length === 0 
                          ? "L'annonce sera visible dans toutes les régions"
                          : `L'annonce sera visible dans ${formData.target_regions.length} région(s)`
                        }
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {ALL_REGIONS.map((region) => (
                          <div 
                            key={region.code}
                            className={`flex items-center space-x-2 p-2 rounded border cursor-pointer transition-colors ${
                              formData.target_regions.length === 0 || formData.target_regions.includes(region.code)
                                ? 'bg-primary/10 border-primary'
                                : 'bg-muted/30 border-border hover:bg-muted/50'
                            }`}
                            onClick={() => {
                              if (formData.target_regions.length === 0) {
                                // If "all" is selected, switch to specific selection
                                setFormData(prev => ({
                                  ...prev,
                                  target_regions: ALL_REGIONS.filter(r => r.code !== region.code).map(r => r.code)
                                }));
                              } else {
                                toggleTargetRegion(region.code);
                              }
                            }}
                          >
                            <Checkbox 
                              checked={formData.target_regions.length === 0 || formData.target_regions.includes(region.code)}
                              className="pointer-events-none"
                            />
                            <span className="text-sm">{region.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label>Avantages inclus</Label>
                      <div className="flex gap-2 mb-2">
                        <Input
                          value={currentFeature}
                          onChange={(e) => setCurrentFeature(e.target.value)}
                          placeholder="Ex: Installation par professionnel RGE"
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                        />
                        <Button type="button" onClick={addFeature}>
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {formData.features.map((feature, index) => (
                          <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded">
                            <Check className="w-4 h-4 text-green-600" />
                            <span className="flex-1">{feature}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFeature(index)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="cta_text">Texte du bouton *</Label>
                        <Input
                          id="cta_text"
                          value={formData.cta_text}
                          onChange={(e) => setFormData({ ...formData, cta_text: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="cta_url">URL du bouton *</Label>
                        <Input
                          id="cta_url"
                          type="url"
                          value={formData.cta_url}
                          onChange={(e) => setFormData({ ...formData, cta_url: e.target.value })}
                          required
                          placeholder="https://..."
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="badge_text">Texte du badge</Label>
                        <Input
                          id="badge_text"
                          value={formData.badge_text}
                          onChange={(e) => setFormData({ ...formData, badge_text: e.target.value })}
                          placeholder="Sponsorisé"
                        />
                      </div>
                      <div>
                        <Label htmlFor="badge_type">Type de badge</Label>
                        <Select
                          value={formData.badge_type}
                          onValueChange={(value) => setFormData({ ...formData, badge_type: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="sponsored">Sponsorisé</SelectItem>
                            <SelectItem value="new">Nouveau</SelectItem>
                            <SelectItem value="featured">En vedette</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="status">Statut</Label>
                        <Select
                          value={formData.status}
                          onValueChange={(value) => setFormData({ ...formData, status: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                            <SelectItem value="archived">Archivée</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="expires_at">Date d'expiration</Label>
                        <Input
                          id="expires_at"
                          type="date"
                          value={formData.expires_at}
                          onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                          min={new Date().toISOString().split('T')[0]}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Laisser vide pour une offre sans expiration
                        </p>
                      </div>
                    </div>

                    {/* Info about featured ads */}
                    {formData.status !== 'active' && (
                      <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 rounded-lg">
                        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <p className="text-sm">
                          Une annonce inactive ne peut pas être mise en vedette. La mise en vedette se fait depuis le tableau après création.
                        </p>
                      </div>
                    )}

                    <div className="flex gap-3 pt-4">
                      <Button type="submit" className="flex-1">
                        {editingAd ? "Mettre à jour" : "Créer"}
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setDialogOpen(false)}
                        className="flex-1"
                      >
                        Annuler
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
              </div>
            </div>
            
            {/* Search bar and Filters button */}
            <div className="flex items-center gap-4 mt-6">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par nom, ID ou indicateur..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Dialog open={filterDialogOpen} onOpenChange={setFilterDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Filter className="w-4 h-4" />
                    Filtres
                    {activeFiltersCount > 0 && (
                      <Badge variant="secondary" className="ml-1">{activeFiltersCount}</Badge>
                    )}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Filtrer les annonces</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-6 pt-4">
                    {/* Filter by advertiser */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Annonceur</Label>
                      <Select 
                        value={filterAdvertiserId || "all"} 
                        onValueChange={(v) => setFilterAdvertiserId(v === "all" ? null : v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Tous les annonceurs" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tous les annonceurs</SelectItem>
                          {advertisers.map((a) => (
                            <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Filter by region */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Région</Label>
                      <Select 
                        value={filterRegion || "all"} 
                        onValueChange={(v) => setFilterRegion(v === "all" ? null : v as RegionCode)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Toutes les régions" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Toutes les régions</SelectItem>
                          {ALL_REGIONS.map((r) => (
                            <SelectItem key={r.code} value={r.code}>{r.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Filter by featured */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Mise en avant</Label>
                      <Select 
                        value={filterFeatured === null ? "all" : filterFeatured ? "featured" : "not_featured"} 
                        onValueChange={(v) => {
                          if (v === "all") setFilterFeatured(null);
                          else if (v === "featured") setFilterFeatured(true);
                          else setFilterFeatured(false);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Toutes" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Toutes</SelectItem>
                          <SelectItem value="featured">En vedette</SelectItem>
                          <SelectItem value="not_featured">Non vedette</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex gap-3 pt-2">
                      <Button 
                        variant="outline" 
                        onClick={clearFilters}
                        className="flex-1"
                        disabled={activeFiltersCount === 0}
                      >
                        Réinitialiser
                      </Button>
                      <Button 
                        onClick={() => setFilterDialogOpen(false)}
                        className="flex-1"
                      >
                        Appliquer
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            
            {/* Active filters as tags */}
            {activeFiltersCount > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {filterAdvertiserId && (
                  <Badge variant="outline" className="gap-1 py-1.5 px-3">
                    Annonceur: {advertisers.find(a => a.id === filterAdvertiserId)?.name}
                    <button onClick={() => setFilterAdvertiserId(null)} className="ml-1 hover:text-destructive">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
                {filterRegion && (
                  <Badge variant="outline" className="gap-1 py-1.5 px-3">
                    Région: {ALL_REGIONS.find(r => r.code === filterRegion)?.label}
                    <button onClick={() => setFilterRegion(null)} className="ml-1 hover:text-destructive">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
                {filterFeatured !== null && (
                  <Badge variant="outline" className="gap-1 py-1.5 px-3">
                    {filterFeatured ? "En vedette" : "Non vedette"}
                    <button onClick={() => setFilterFeatured(null)} className="ml-1 hover:text-destructive">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
              </div>
            )}
          </div>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <Megaphone className="w-5 h-5" />
                Liste des Annonces ({sortedAdvertisements.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Image</TableHead>
                    <TableHead>Titre</TableHead>
                    <TableHead>Annonceur</TableHead>
                    <TableHead>Prix</TableHead>
                    <TableHead>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> Régions
                          </TooltipTrigger>
                          <TooltipContent>Régions ciblées par l'annonce</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={toggleSortOrder}
                    >
                      <div className="flex items-center gap-1">
                        Date
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </TableHead>
                    <TableHead className="text-center">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger className="flex items-center gap-1 mx-auto">
                            <Eye className="w-3 h-3" /> Vues
                          </TooltipTrigger>
                          <TooltipContent>Nombre de vues</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableHead>
                    <TableHead className="text-center">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger className="flex items-center gap-1 mx-auto">
                            <MousePointerClick className="w-3 h-3" /> Clics
                          </TooltipTrigger>
                          <TooltipContent>Clics sur "Voir l'offre"</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableHead>
                    <TableHead className="text-center">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger className="flex items-center gap-1 mx-auto">
                            <UserCheck className="w-3 h-3" /> Leads
                          </TooltipTrigger>
                          <TooltipContent>Formulaires soumis</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Vedette</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedAdvertisements.map((ad) => {
                    const adFeaturedRegions = getAdFeaturedRegions(ad.id);
                    const availableRegions = getAvailableRegionsForFeaturing(ad);
                    const isInactive = ad.status !== 'active';
                    
                    return (
                      <TableRow key={ad.id}>
                        <TableCell>
                          {ad.image ? (
                            <img 
                              src={ad.image} 
                              alt={ad.title}
                              className="w-16 h-16 object-cover rounded"
                            />
                          ) : (
                            <div className="w-16 h-16 bg-muted rounded flex items-center justify-center">
                              <Megaphone className="w-6 h-6 text-muted-foreground" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{ad.title}</p>
                            {ad.badge_text && (
                              <Badge variant="secondary" className="mt-1">
                                {ad.badge_text}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{ad.advertiser.name}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-bold text-green-600">
                              {ad.price.toLocaleString('fr-FR')}€
                            </p>
                            {ad.original_price && (
                              <p className="text-sm text-muted-foreground line-through">
                                {ad.original_price.toLocaleString('fr-FR')}€
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <Badge variant="outline" className="gap-1">
                                  <Globe className="w-3 h-3" />
                                  {getTargetRegionsDisplay(ad.target_regions)}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                {!ad.target_regions || ad.target_regions.length === 0 
                                  ? "Toutes les régions"
                                  : ad.target_regions.map(r => ALL_REGIONS.find(reg => reg.code === r)?.label).join(", ")
                                }
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(ad.created_at), "dd/MM/yy", { locale: fr })}
                          </span>
                        </TableCell>
                        <TableCell className="text-center font-medium">
                          {ad.views_count || 0}
                        </TableCell>
                        <TableCell className="text-center font-medium">
                          {ad.clicks_count || 0}
                        </TableCell>
                        <TableCell className="text-center font-medium">
                          {ad.conversions_count || 0}
                        </TableCell>
                        <TableCell>
                          <Badge variant={ad.status === 'active' ? 'default' : 'secondary'}>
                            {ad.status === 'active' ? 'Active' : ad.status === 'inactive' ? 'Inactive' : 'Archivée'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-2">
                            {/* Featured regions badges */}
                            {adFeaturedRegions.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-2">
                                {adFeaturedRegions.map((regionCode) => {
                                  const regionLabel = ALL_REGIONS.find(r => r.code === regionCode)?.label || regionCode;
                                  const shortLabel = regionLabel.replace('France métropolitaine', 'FR').replace('La Réunion', 'Réunion');
                                  return (
                                    <Badge 
                                      key={regionCode}
                                      variant="default"
                                      className="text-[10px] px-1.5 py-0.5 cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors"
                                      onClick={() => toggleFeaturedForRegion(ad.id, regionCode, true)}
                                      title={`Retirer de ${regionLabel}`}
                                    >
                                      {shortLabel}
                                      <X className="w-2.5 h-2.5 ml-0.5" />
                                    </Badge>
                                  );
                                })}
                              </div>
                            )}
                            
                            {/* Add featured button */}
                            <Popover 
                              open={regionSelectAdId === ad.id} 
                              onOpenChange={(open) => !open && setRegionSelectAdId(null)}
                            >
                              <PopoverTrigger asChild>
                                <Button
                                  variant={adFeaturedRegions.length > 0 ? "outline" : "ghost"}
                                  size="sm"
                                  onClick={() => handleFeaturedClick(ad)}
                                  className={`gap-1 h-7 text-xs ${isInactive ? 'opacity-50' : ''}`}
                                  disabled={isInactive && adFeaturedRegions.length === 0}
                                >
                                  {isInactive ? (
                                    <>
                                      <AlertCircle className="w-3 h-3" />
                                      Inactive
                                    </>
                                  ) : adFeaturedRegions.length > 0 ? (
                                    <>
                                      <Plus className="w-3 h-3" />
                                      Ajouter
                                    </>
                                  ) : (
                                    <>
                                      <Star className="w-3 h-3" />
                                      Mettre en vedette
                                    </>
                                  )}
                                </Button>
                              </PopoverTrigger>
                              {!filterRegion && !isInactive && (
                                <PopoverContent className="w-64 p-2" align="start">
                                  <div className="space-y-1">
                                    <p className="text-sm font-medium mb-2 px-2">
                                      {adFeaturedRegions.length > 0 ? "Ajouter à une région" : "Mettre en vedette"}
                                    </p>
                                    {availableRegions.length === 0 ? (
                                      <p className="text-sm text-muted-foreground px-2">
                                        Aucune région ciblée
                                      </p>
                                    ) : (
                                      ALL_REGIONS.filter(r => availableRegions.includes(r.code)).map((region) => {
                                        const isFeaturedInRegion = adFeaturedRegions.includes(region.code);
                                        const regionCount = featuredByRegion.filter(f => f.region_code === region.code).length;
                                        const isDisabled = !isFeaturedInRegion && regionCount >= 3;
                                        
                                        return (
                                          <Button
                                            key={region.code}
                                            variant={isFeaturedInRegion ? "secondary" : "ghost"}
                                            size="sm"
                                            className="w-full justify-between"
                                            disabled={isDisabled || isFeaturedInRegion}
                                            onClick={() => toggleFeaturedForRegion(ad.id, region.code, isFeaturedInRegion)}
                                          >
                                            <span className="flex items-center gap-2">
                                              <Globe className="w-3 h-3" />
                                              {region.label}
                                            </span>
                                            {isFeaturedInRegion && <Check className="w-4 h-4 text-primary" />}
                                            {isDisabled && !isFeaturedInRegion && <span className="text-xs text-muted-foreground">3/3</span>}
                                          </Button>
                                        );
                                      })
                                    )}
                                  </div>
                                </PopoverContent>
                              )}
                            </Popover>
                          </div>
                        </TableCell>
                         <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleStats(ad)}
                              title="Statistiques"
                              className="text-primary hover:text-primary"
                            >
                              <BarChart3 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handlePreview(ad)}
                              title="Prévisualiser"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(ad)}
                              title="Modifier"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(ad.id)}
                              title="Supprimer"
                            >
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
        </main>

        {/* Preview Dialog */}
        <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
                advertiser_name={previewingAd.advertiser.name}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Stats Modal */}
        <AdStatsModal
          open={statsDialogOpen}
          onOpenChange={setStatsDialogOpen}
          advertisement={statsAd}
        />

        <Footer />
      </div>
    </>
  );
};

export default ManageAnnonces;
