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
  Search, Calendar, ArrowLeft, Globe, MapPin, Power, PowerOff, AlertCircle,
  ArrowUpDown, MousePointerClick, Users, Filter
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import AdvertisementPreview from "@/components/AdvertisementPreview";
import RegionFeaturedModal from "@/components/RegionFeaturedModal";
import AdvertiserLogoUpload from "@/components/AdvertiserLogoUpload";
import { AdImageUpload } from "@/components/AdImageUpload";
import { AIDescriptionButton } from "@/components/AIDescriptionButton";
import { Helmet } from "react-helmet";
import { Popover, PopoverContent, PopoverTrigger, PopoverClose } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format, startOfDay, endOfDay, subDays, startOfMonth, endOfMonth, subMonths, startOfYear, subYears } from "date-fns";
import { cn } from "@/lib/utils";
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
  views_count: number;
  clicks_count: number;
  conversions_count: number;
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
  const [filteredStats, setFilteredStats] = useState<Map<string, { views: number; clicks: number; conversions: number }>>(new Map());
  const [loading, setLoading] = useState(true);
  
  // UI states
  const [activeTab, setActiveTab] = useState<'advertisers' | 'audiences' | 'ads'>('advertisers');
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined
  });
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [advertiserSortField, setAdvertiserSortField] = useState<'name' | 'ads'>('name');
  const [advertiserSortOrder, setAdvertiserSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // Dialogs
  const [advertiserDialogOpen, setAdvertiserDialogOpen] = useState(false);
  const [adDialogOpen, setAdDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [regionFeaturedOpen, setRegionFeaturedOpen] = useState(false);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [selectedRegionForFeatured, setSelectedRegionForFeatured] = useState<{ code: RegionCode; label: string } | null>(null);
  
  // Unfeaturing modal state
  const [unfeatureModalOpen, setUnfeatureModalOpen] = useState(false);
  const [adToUnfeature, setAdToUnfeature] = useState<Advertisement | null>(null);
  const [regionsToUnfeature, setRegionsToUnfeature] = useState<RegionCode[]>([]);
  
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
  
  // Featured ads per region
  const [featuredByRegion, setFeaturedByRegion] = useState<Map<RegionCode, string[]>>(new Map());

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

  // Fetch filtered stats when date range changes
  useEffect(() => {
    if (dateRange.from || dateRange.to) {
      fetchFilteredStats();
    } else {
      // Clear filtered stats when no date filter
      setFilteredStats(new Map());
    }
  }, [dateRange.from, dateRange.to]);

  const fetchFilteredStats = async () => {
    try {
      let query = supabase
        .from('ad_analytics')
        .select('advertisement_id, event_type');
      
      if (dateRange.from) {
        query = query.gte('created_at', startOfDay(dateRange.from).toISOString());
      }
      if (dateRange.to) {
        query = query.lte('created_at', endOfDay(dateRange.to).toISOString());
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Aggregate stats by advertisement
      const statsMap = new Map<string, { views: number; clicks: number; conversions: number }>();
      
      (data || []).forEach(event => {
        const current = statsMap.get(event.advertisement_id) || { views: 0, clicks: 0, conversions: 0 };
        
        if (event.event_type === 'view') {
          current.views++;
        } else if (event.event_type === 'click') {
          current.clicks++;
        } else if (event.event_type === 'conversion') {
          current.conversions++;
        }
        
        statsMap.set(event.advertisement_id, current);
      });
      
      setFilteredStats(statsMap);
    } catch (error) {
      console.error('Error fetching filtered stats:', error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [advertisersRes, adsRes, featuredRes] = await Promise.all([
        supabase.from("advertisers").select("*").order("created_at", { ascending: false }),
        supabase.from("advertisements").select(`*, advertiser:advertisers(id, name, is_active)`).order("created_at", { ascending: false }),
        supabase.from("ad_region_featured").select("*").order("display_order")
      ]);
      
      if (advertisersRes.error) throw advertisersRes.error;
      if (adsRes.error) throw adsRes.error;
      
      setAdvertisers(advertisersRes.data || []);
      setAdvertisements(adsRes.data || []);
      
      // Build featured map by region
      const featuredMap = new Map<RegionCode, string[]>();
      ALL_REGIONS.forEach(r => featuredMap.set(r.code, []));
      (featuredRes.data || []).forEach(f => {
        const current = featuredMap.get(f.region_code as RegionCode) || [];
        featuredMap.set(f.region_code as RegionCode, [...current, f.advertisement_id]);
      });
      setFeaturedByRegion(featuredMap);
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
  // Helper to check if an item was active during the selected date range
  const isActiveInDateRange = (createdAt: string, expiresAt?: string | null) => {
    if (!dateRange.from) return true;
    
    const created = new Date(createdAt);
    const expires = expiresAt ? new Date(expiresAt) : null;
    const rangeEnd = dateRange.to || dateRange.from;
    
    // Item was created after the range ends
    if (created > rangeEnd) return false;
    
    // Item expired before the range starts
    if (expires && expires < dateRange.from) return false;
    
    return true;
  };

  const filteredAdvertisers = useMemo(() => {
    // Count ads per advertiser
    const adCountByAdvertiser = new Map<string, number>();
    advertisements.forEach(ad => {
      const count = adCountByAdvertiser.get(ad.advertiser_id) || 0;
      adCountByAdvertiser.set(ad.advertiser_id, count + 1);
    });

    return advertisers
      .filter(a => {
        const matchesSearch = !searchQuery || 
          a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.region?.toLowerCase().includes(searchQuery.toLowerCase());
        
        return matchesSearch;
      })
      .map(a => ({
        ...a,
        isActiveInPeriod: isActiveInDateRange(a.created_at),
        adCount: adCountByAdvertiser.get(a.id) || 0
      }))
      .sort((a, b) => {
        if (advertiserSortField === 'name') {
          const comparison = a.name.localeCompare(b.name, 'fr');
          return advertiserSortOrder === 'asc' ? comparison : -comparison;
        } else {
          // Sort by ad count
          const comparison = a.adCount - b.adCount;
          return advertiserSortOrder === 'asc' ? comparison : -comparison;
        }
      });
  }, [advertisers, advertisements, searchQuery, dateRange, advertiserSortField, advertiserSortOrder]);

  const toggleAdvertiserSort = (field: 'name' | 'ads') => {
    if (advertiserSortField === field) {
      setAdvertiserSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setAdvertiserSortField(field);
      setAdvertiserSortOrder('asc');
    }
  };
  
  const filteredAds = useMemo(() => {
    const filtered = advertisements
      .filter(ad => {
        const matchesSearch = !searchQuery ||
          ad.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          ad.advertiser?.name?.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesAdvertiser = !selectedAdvertiserFilter ||
          ad.advertiser_id === selectedAdvertiserFilter;
        
        const matchesRegion = !selectedRegionFilter ||
          !ad.target_regions || ad.target_regions.length === 0 ||
          ad.target_regions.includes(selectedRegionFilter);
        
        return matchesSearch && matchesAdvertiser && matchesRegion;
      })
      .map(ad => ({
        ...ad,
        isActiveInPeriod: isActiveInDateRange(ad.created_at, ad.expires_at)
      }));
    
    // Sort by date
    return filtered.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });
  }, [advertisements, searchQuery, dateRange, selectedAdvertiserFilter, selectedRegionFilter, sortOrder]);

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
    // If already featured, open modal to select regions to unfeature
    if (ad.is_featured) {
      setAdToUnfeature(ad);
      // Get regions where this ad is featured
      const adRegions = ad.target_regions || [];
      const allFeaturedRegions = Array.from(featuredByRegion.entries())
        .filter(([_, adIds]) => adIds.includes(ad.id))
        .map(([region]) => region);
      
      // If ad has no specific regions or is featured in some regions
      if (adRegions.length === 0) {
        // Ad targets all regions - show all regions as options
        setRegionsToUnfeature(ALL_REGIONS.map(r => r.code));
      } else {
        setRegionsToUnfeature(allFeaturedRegions.length > 0 ? allFeaturedRegions : adRegions as RegionCode[]);
      }
      setUnfeatureModalOpen(true);
      return;
    }
    
    // Adding to featured
    const featuredCount = advertisements.filter(a => a.is_featured).length;
    if (featuredCount >= 3) {
      toast.error("Maximum 3 annonces en vedette");
      return;
    }
    try {
      const { error } = await supabase.from("advertisements").update({ is_featured: true }).eq("id", ad.id);
      if (error) throw error;
      toast.success("Mise en vedette");
      fetchData();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Erreur");
    }
  };

  const handleConfirmUnfeature = async () => {
    if (!adToUnfeature) return;
    
    try {
      // Remove from ad_region_featured for selected regions
      if (regionsToUnfeature.length > 0) {
        const { error: deleteFeaturedError } = await supabase
          .from("ad_region_featured")
          .delete()
          .eq("advertisement_id", adToUnfeature.id)
          .in("region_code", regionsToUnfeature);
        
        if (deleteFeaturedError) throw deleteFeaturedError;
      }
      
      // Check if there are still featured entries for this ad
      const { data: remainingFeatured } = await supabase
        .from("ad_region_featured")
        .select("id")
        .eq("advertisement_id", adToUnfeature.id);
      
      // If no more featured entries, set is_featured to false
      if (!remainingFeatured || remainingFeatured.length === 0) {
        const { error } = await supabase
          .from("advertisements")
          .update({ is_featured: false })
          .eq("id", adToUnfeature.id);
        if (error) throw error;
      }
      
      toast.success(`Annonce retirée de ${regionsToUnfeature.length} région(s)`);
      setUnfeatureModalOpen(false);
      setAdToUnfeature(null);
      setRegionsToUnfeature([]);
      fetchData();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Erreur lors du retrait");
    }
  };

  const toggleUnfeatureRegion = (region: RegionCode) => {
    setRegionsToUnfeature(prev => 
      prev.includes(region) 
        ? prev.filter(r => r !== region)
        : [...prev, region]
    );
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
              {/* Search + Filters Button */}
              <div className="flex items-center gap-3 w-full lg:w-auto">
                <div className="relative flex-1 lg:w-96">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher par nom, ID ou indicateur..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                {/* Filters button - only visible on ads tab */}
                {activeTab === 'ads' && (
                  <Dialog open={filterDialogOpen} onOpenChange={setFilterDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="gap-2 shrink-0">
                        <Filter className="w-4 h-4" />
                        Filtres
                        {(selectedAdvertiserFilter || selectedRegionFilter) && (
                          <Badge variant="secondary" className="ml-1">
                            {[selectedAdvertiserFilter, selectedRegionFilter].filter(Boolean).length}
                          </Badge>
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
                            value={selectedAdvertiserFilter || "all"} 
                            onValueChange={(v) => setSelectedAdvertiserFilter(v === "all" ? null : v)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Tous les annonceurs" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Tous les annonceurs</SelectItem>
                              {advertisers.filter(a => a.is_active).map((a) => (
                                <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        {/* Filter by region */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Région</Label>
                          <Select 
                            value={selectedRegionFilter || "all"} 
                            onValueChange={(v) => setSelectedRegionFilter(v === "all" ? null : v as RegionCode)}
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
                        
                        <div className="flex gap-3 pt-2">
                          <Button 
                            variant="outline" 
                            onClick={() => {
                              setSelectedAdvertiserFilter(null);
                              setSelectedRegionFilter(null);
                            }}
                            className="flex-1"
                            disabled={!selectedAdvertiserFilter && !selectedRegionFilter}
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
                )}
              </div>

              {/* Date picker with presets */}
              <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="gap-2 min-w-[200px] justify-start">
                    <Calendar className="w-4 h-4" />
                    {dateRange.from ? (
                      dateRange.to ? (
                        `${format(dateRange.from, "d MMM", { locale: fr })} - ${format(dateRange.to, "d MMM yyyy", { locale: fr })}`
                      ) : (
                        format(dateRange.from, "d MMM yyyy", { locale: fr })
                      )
                    ) : (
                      "Toutes les dates"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent 
                  className="w-auto p-0 bg-popover border border-border rounded-xl shadow-xl z-50" 
                  align="end"
                  sideOffset={8}
                >
                  <div className="flex rounded-xl overflow-hidden w-fit">
                    {/* Presets */}
                    <div className="border-r border-border py-3 px-2 space-y-0.5 w-[120px] bg-muted/30 shrink-0">
                      {[
                        { label: "Aujourd'hui", getValue: () => ({ from: startOfDay(new Date()), to: endOfDay(new Date()) }) },
                        { label: "Hier", getValue: () => ({ from: startOfDay(subDays(new Date(), 1)), to: endOfDay(subDays(new Date(), 1)) }) },
                        { label: "7 jours", getValue: () => ({ from: startOfDay(subDays(new Date(), 6)), to: endOfDay(new Date()) }) },
                        { label: "30 jours", getValue: () => ({ from: startOfDay(subDays(new Date(), 29)), to: endOfDay(new Date()) }) },
                        { label: "Ce mois", getValue: () => ({ from: startOfMonth(new Date()), to: endOfDay(new Date()) }) },
                        { label: "Mois dernier", getValue: () => ({ from: startOfMonth(subMonths(new Date(), 1)), to: endOfMonth(subMonths(new Date(), 1)) }) },
                        { label: "L'an dernier", getValue: () => ({ from: startOfYear(subYears(new Date(), 1)), to: endOfDay(new Date()) }) },
                        { label: "Maximum", getValue: () => ({ from: undefined, to: undefined }) },
                      ].map((preset) => {
                        // Detect active preset
                        const presetValue = preset.getValue();
                        const isActive = preset.label === "Maximum" 
                          ? !dateRange.from 
                          : (dateRange.from && presetValue.from && 
                             dateRange.from.getTime() === presetValue.from.getTime() &&
                             dateRange.to && presetValue.to &&
                             dateRange.to.getTime() === presetValue.to.getTime());
                        
                        return (
                          <Button
                            key={preset.label}
                            variant="ghost"
                            size="sm"
                            className={cn(
                              "w-full justify-start font-normal h-8 px-3 text-sm rounded-md",
                              isActive && "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
                            )}
                            onClick={() => {
                              const value = preset.getValue();
                              setDateRange(value);
                              setDatePickerOpen(false);
                            }}
                          >
                            {preset.label}
                          </Button>
                        );
                      })}
                    </div>
                    {/* Calendar */}
                    <div className="p-3">
                      <CalendarComponent
                        mode="range"
                        selected={{ from: dateRange.from, to: dateRange.to }}
                        onSelect={(range) => {
                          setDateRange({ from: range?.from, to: range?.to });
                          // Close popover when both dates are selected (range complete)
                          if (range?.from && range?.to && range.from.getTime() !== range.to.getTime()) {
                            setDatePickerOpen(false);
                          }
                        }}
                        locale={fr}
                        numberOfMonths={1}
                        className="pointer-events-auto"
                      />
                      <div className="pt-3 border-t border-border flex flex-col gap-2 mt-2">
                        {/* Info text when only one date selected */}
                        {dateRange.from && !dateRange.to && (
                          <p className="text-xs text-muted-foreground text-center">
                            Cliquez sur une 2ème date pour une période, ou appliquez pour ce jour
                          </p>
                        )}
                        <div className="flex justify-between items-center">
                          <Button
                            variant="link"
                            size="sm"
                            className="text-primary p-0 h-auto text-sm"
                            onClick={() => {
                              setDateRange({ from: undefined, to: undefined });
                              setDatePickerOpen(false);
                            }}
                          >
                            Effacer
                          </Button>
                          <div className="flex items-center gap-2">
                            {/* Show "Appliquer" button when only from is selected (single day) */}
                            {dateRange.from && !dateRange.to && (
                              <Button 
                                size="sm"
                                className="h-8"
                                onClick={() => {
                                  // Set both from and to to the same day for single day selection
                                  setDateRange({ from: dateRange.from, to: endOfDay(dateRange.from!) });
                                  setDatePickerOpen(false);
                                }}
                              >
                                Appliquer
                              </Button>
                            )}
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 rounded-full bg-muted hover:bg-muted/80"
                              onClick={() => setDatePickerOpen(false)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
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
                          <Label>Logo</Label>
                          <AdvertiserLogoUpload
                            currentLogo={advertiserForm.logo}
                            onLogoChange={(url) => setAdvertiserForm({ ...advertiserForm, logo: url })}
                          />
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
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => toggleAdvertiserSort('name')}
                      >
                        <div className="flex items-center gap-1">
                          Annonceur
                          <ArrowUpDown className={cn(
                            "w-3 h-3",
                            advertiserSortField === 'name' && "text-primary"
                          )} />
                        </div>
                      </TableHead>
                      <TableHead>Localisation</TableHead>
                      <TableHead 
                        className="text-center cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => toggleAdvertiserSort('ads')}
                      >
                        <div className="flex items-center justify-center gap-1">
                          Annonces
                          <ArrowUpDown className={cn(
                            "w-3 h-3",
                            advertiserSortField === 'ads' && "text-primary"
                          )} />
                        </div>
                      </TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAdvertisers.map((advertiser) => {
                      const isGrayed = !advertiser.is_active || !advertiser.isActiveInPeriod;
                      
                      return (
                        <TooltipProvider key={advertiser.id}>
                          <TableRow className={cn(
                            isGrayed && "opacity-50 bg-muted/30",
                            !advertiser.isActiveInPeriod && dateRange.from && "border-l-2 border-l-muted-foreground"
                          )}>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => toggleAdvertiserActive(advertiser)}
                                  className={advertiser.is_active ? "text-green-600 hover:text-green-700" : "text-muted-foreground hover:text-foreground"}
                                >
                                  {advertiser.is_active ? <Power className="w-5 h-5" /> : <PowerOff className="w-5 h-5" />}
                                </Button>
                                {!advertiser.isActiveInPeriod && dateRange.from && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <AlertCircle className="w-4 h-4 text-muted-foreground" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Cet annonceur n'a pas diffusé pendant la période sélectionnée</p>
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                              </div>
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
                        </TooltipProvider>
                      );
                    })}
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
                    const featuredCount = featuredByRegion.get(region.code)?.length || 0;
                    
                    return (
                      <Card 
                        key={region.code} 
                        className="hover:shadow-md transition-shadow"
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
                          
                          {/* Stats row */}
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <span className="text-2xl font-bold">{activeCount}</span>
                              <span className="text-muted-foreground text-sm ml-1">/ {adsCount}</span>
                            </div>
                            <Badge variant={activeCount > 0 ? "default" : "secondary"}>
                              {activeCount > 0 ? "Actif" : "Inactif"}
                            </Badge>
                          </div>
                          
                          {/* Featured indicator with free slots */}
                          <div className={cn(
                            "flex items-center justify-between mb-4 p-2 rounded-lg",
                            featuredCount < 3 
                              ? "bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800" 
                              : "bg-amber-50 dark:bg-amber-950/30"
                          )}>
                            <div className="flex items-center gap-2">
                              <Star className={`w-4 h-4 ${featuredCount > 0 ? 'text-amber-500 fill-amber-500' : 'text-muted-foreground'}`} />
                              <span className="text-sm">
                                <span className="font-medium">{featuredCount}</span>/3 en vedette
                              </span>
                            </div>
                            {featuredCount < 3 && (
                              <Badge variant="outline" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 border-green-300">
                                {3 - featuredCount} place{3 - featuredCount > 1 ? 's' : ''} libre{3 - featuredCount > 1 ? 's' : ''}
                              </Badge>
                            )}
                          </div>
                          
                          <p className="text-xs text-muted-foreground mb-4">
                            {activeCount} annonce{activeCount > 1 ? 's' : ''} active{activeCount > 1 ? 's' : ''} sur {adsCount} total
                          </p>
                          
                          {/* Actions */}
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="flex-1"
                              onClick={() => { setSelectedRegionFilter(region.code); setActiveTab('ads'); }}
                            >
                              Voir les annonces
                            </Button>
                            <Button 
                              variant="default" 
                              size="sm"
                              className="gap-1"
                              onClick={() => {
                                setSelectedRegionForFeatured(region);
                                setRegionFeaturedOpen(true);
                              }}
                            >
                              <Star className="w-3 h-3" />
                              Vedettes
                            </Button>
                          </div>
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
                        <div className="flex items-center justify-between mb-2">
                          <Label>Description *</Label>
                          <AIDescriptionButton
                            title={adForm.title}
                            advertiserName={advertisers.find(a => a.id === adForm.advertiser_id)?.name}
                            price={adForm.price}
                            features={adForm.features}
                            currentDescription={adForm.description}
                            onContentGenerated={(data) => setAdForm({ ...adForm, description: data.description, features: data.features.length > 0 ? data.features : adForm.features })}
                          />
                        </div>
                        <Textarea value={adForm.description} onChange={(e) => setAdForm({ ...adForm, description: e.target.value })} required rows={3} placeholder="Description de l'offre..." />
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

                      <AdImageUpload
                        currentImage={adForm.image}
                        onImageChange={(url) => setAdForm({ ...adForm, image: url })}
                      />

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

                      <div>
                        <Label>Texte du bouton *</Label>
                        <Input value={adForm.cta_text} onChange={(e) => setAdForm({ ...adForm, cta_text: e.target.value })} required />
                      </div>

                      <div>
                        <Label>Lien de l'offre (optionnel)</Label>
                        <Input 
                          type="url" 
                          value={adForm.cta_url} 
                          onChange={(e) => setAdForm({ ...adForm, cta_url: e.target.value })} 
                          placeholder="https://... (laisser vide si aucun lien externe)"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Si renseigné, un bouton vers ce lien sera affiché sur la page de l'offre
                        </p>
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
                      <TableHead>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1 h-8 px-2 -ml-2 font-medium"
                          onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                        >
                          Date
                          <ArrowUpDown className="w-3 h-3" />
                        </Button>
                      </TableHead>
                      <TableHead className="text-center">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="flex items-center justify-center gap-1 cursor-help">
                              <Eye className="w-3 h-3" /> Vues
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>Nombre de fois où l'annonce a été affichée</TooltipContent>
                        </Tooltip>
                      </TableHead>
                      <TableHead className="text-center">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="flex items-center justify-center gap-1 cursor-help">
                              <MousePointerClick className="w-3 h-3" /> Clics
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>Nombre de clics sur "Voir l'offre"</TooltipContent>
                        </Tooltip>
                      </TableHead>
                      <TableHead className="text-center">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="flex items-center justify-center gap-1 cursor-help">
                              <Users className="w-3 h-3" /> Conv.
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>Nombre de prospects (formulaires remplis)</TooltipContent>
                        </Tooltip>
                      </TableHead>
                      <TableHead className="text-center">Prix</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAds.map((ad) => {
                      const isAdvertiserInactive = ad.advertiser?.is_active === false;
                      const isEffectivelyDisabled = isAdvertiserInactive || ad.status !== 'active';
                      const isGrayedByDate = !ad.isActiveInPeriod && dateRange.from;
                      
                      return (
                        <TooltipProvider key={ad.id}>
                          <TableRow className={cn(
                            (isEffectivelyDisabled || isGrayedByDate) && "opacity-50 bg-muted/30",
                            isGrayedByDate && "border-l-2 border-l-muted-foreground"
                          )}>
                            <TableCell>
                              <div className="flex items-center gap-1">
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
                                {isGrayedByDate && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <AlertCircle className="w-4 h-4 text-muted-foreground" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Cette annonce n'a pas diffusé pendant la période sélectionnée</p>
                                    </TooltipContent>
                                  </Tooltip>
                                )}
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
                              <div className="text-sm text-muted-foreground">
                                {format(new Date(ad.created_at), "d MMM yyyy", { locale: fr })}
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <span className="font-medium">
                                {dateRange.from ? (filteredStats.get(ad.id)?.views || 0) : (ad.views_count || 0)}
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              <span className="font-medium">
                                {dateRange.from ? (filteredStats.get(ad.id)?.clicks || 0) : (ad.clicks_count || 0)}
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              <span className="font-medium">
                                {dateRange.from ? (filteredStats.get(ad.id)?.conversions || 0) : (ad.conversions_count || 0)}
                              </span>
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
                        </TooltipProvider>
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

          {/* Unfeature Confirmation Modal */}
          <Dialog open={unfeatureModalOpen} onOpenChange={(open) => {
            setUnfeatureModalOpen(open);
            if (!open) {
              setAdToUnfeature(null);
              setRegionsToUnfeature([]);
            }
          }}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500" />
                  Retirer des vedettes
                </DialogTitle>
              </DialogHeader>
              
              {adToUnfeature && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Sélectionnez les régions où vous souhaitez retirer "<span className="font-medium">{adToUnfeature.title}</span>" des vedettes.
                  </p>
                  
                  {(!adToUnfeature.target_regions || adToUnfeature.target_regions.length === 0) && (
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                      <p className="text-sm text-amber-800 dark:text-amber-200 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        Cette annonce cible <strong>toutes les régions</strong>. Elle sera retirée des vedettes partout si vous confirmez.
                      </p>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Régions à retirer :</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {ALL_REGIONS.map((region) => {
                        const isFeaturedInRegion = featuredByRegion.get(region.code)?.includes(adToUnfeature.id) || false;
                        const isTargetedRegion = !adToUnfeature.target_regions || 
                          adToUnfeature.target_regions.length === 0 || 
                          adToUnfeature.target_regions.includes(region.code);
                        
                        if (!isTargetedRegion && !isFeaturedInRegion) return null;
                        
                        return (
                          <div key={region.code} className="flex items-center space-x-2">
                            <Checkbox
                              id={`unfeature-${region.code}`}
                              checked={regionsToUnfeature.includes(region.code)}
                              onCheckedChange={() => toggleUnfeatureRegion(region.code)}
                            />
                            <Label htmlFor={`unfeature-${region.code}`} className="text-sm cursor-pointer flex items-center gap-1">
                              {region.label}
                              {isFeaturedInRegion && <Star className="w-3 h-3 text-amber-500 fill-amber-500" />}
                            </Label>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={() => setUnfeatureModalOpen(false)}>
                      Annuler
                    </Button>
                    <Button 
                      variant="destructive" 
                      onClick={handleConfirmUnfeature}
                      disabled={regionsToUnfeature.length === 0}
                    >
                      Confirmer le retrait
                    </Button>
                  </div>
                </div>
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
