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
import { toast } from "sonner";
import { Plus, Edit, Trash2, Megaphone, Star, Check, X, Eye } from "lucide-react";
import AdvertisementPreview from "@/components/AdvertisementPreview";
import { Helmet } from "react-helmet";

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

const ManageAnnonces = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [advertisements, setAdvertisements] = useState<Advertisement[]>([]);
  const [advertisers, setAdvertisers] = useState<Advertiser[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<Advertisement | null>(null);
  const [previewingAd, setPreviewingAd] = useState<Advertisement | null>(null);
  const [currentFeature, setCurrentFeature] = useState("");
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
    }
  }, [user]);

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
    };

    try {
      if (editingAd) {
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
    } catch (error) {
      console.error("Error saving advertisement:", error);
      toast.error("Erreur lors de l'enregistrement");
    }
  };

  const handlePreview = (ad: Advertisement) => {
    setPreviewingAd(ad);
    setPreviewDialogOpen(true);
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
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette annonce ?")) return;

    try {
      const { error } = await supabase
        .from("advertisements")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Annonce supprimée avec succès");
      fetchAdvertisements();
    } catch (error) {
      console.error("Error deleting advertisement:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const toggleFeatured = async (id: string, currentStatus: boolean) => {
    // Check if we already have 3 featured ads
    const featuredCount = advertisements.filter(ad => ad.is_featured).length;
    if (!currentStatus && featuredCount >= 3) {
      toast.error("Vous ne pouvez mettre en avant que 3 annonces maximum");
      return;
    }

    try {
      const { error } = await supabase
        .from("advertisements")
        .update({ is_featured: !currentStatus })
        .eq("id", id);

      if (error) throw error;
      toast.success(currentStatus ? "Annonce retirée de la mise en avant" : "Annonce mise en avant");
      fetchAdvertisements();
    } catch (error) {
      console.error("Error toggling featured:", error);
      toast.error("Erreur lors de la mise à jour");
    }
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
    });
    setCurrentFeature("");
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const featuredCount = advertisements.filter(ad => ad.is_featured).length;

  return (
    <>
      <Helmet>
        <title>Gérer les Annonces | Prime Énergies</title>
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="container mx-auto px-4 pt-32 pb-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold mb-2">Gestion des Annonces</h1>
              <p className="text-muted-foreground">
                Gérez vos annonces publicitaires • {featuredCount}/3 en vedette
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

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="is_featured"
                        checked={formData.is_featured}
                        onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                        disabled={!editingAd && featuredCount >= 3}
                      />
                      <Label htmlFor="is_featured">
                        Mettre en avant sur l'accueil {!editingAd && featuredCount >= 3 && "(max atteint)"}
                      </Label>
                    </div>

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

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Megaphone className="w-5 h-5" />
                Liste des Annonces
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
                    <TableHead>Statut</TableHead>
                    <TableHead>Vedette</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {advertisements.map((ad) => (
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
                        <Badge variant={ad.status === 'active' ? 'default' : 'secondary'}>
                          {ad.status === 'active' ? 'Active' : ad.status === 'inactive' ? 'Inactive' : 'Archivée'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant={ad.is_featured ? "default" : "outline"}
                          size="sm"
                          onClick={() => toggleFeatured(ad.id, ad.is_featured)}
                          disabled={!ad.is_featured && featuredCount >= 3}
                        >
                          <Star className={`w-4 h-4 ${ad.is_featured ? 'fill-current' : ''}`} />
                        </Button>
                      </TableCell>
                       <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
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
                  ))}
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

        <Footer />
      </div>
    </>
  );
};

export default ManageAnnonces;
