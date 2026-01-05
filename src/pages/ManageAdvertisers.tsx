import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
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
import { toast } from "sonner";
import { Plus, Edit, Trash2, Building2, MapPin, X } from "lucide-react";
import { Helmet } from "react-helmet";
import { Badge } from "@/components/ui/badge";

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

const REGIONS_FRANCE = [
  "Auvergne-Rhône-Alpes",
  "Bourgogne-Franche-Comté",
  "Bretagne",
  "Centre-Val de Loire",
  "Corse",
  "Grand Est",
  "Hauts-de-France",
  "Île-de-France",
  "Normandie",
  "Nouvelle-Aquitaine",
  "Occitanie",
  "Pays de la Loire",
  "Provence-Alpes-Côte d'Azur",
  "Guadeloupe",
  "Martinique",
  "Guyane",
  "La Réunion",
  "Mayotte"
];

const ManageAdvertisers = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [advertisers, setAdvertisers] = useState<Advertiser[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAdvertiser, setEditingAdvertiser] = useState<Advertiser | null>(null);
  const [newDepartment, setNewDepartment] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    logo: "",
    description: "",
    website: "",
    contact_email: "",
    is_active: true,
    postal_code: "",
    city: "",
    department: "",
    region: "",
    intervention_radius_km: "",
    intervention_departments: [] as string[],
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/connexion");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchAdvertisers();
    }
  }, [user]);

  const fetchAdvertisers = async () => {
    try {
      const { data, error } = await supabase
        .from("advertisers")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAdvertisers(data || []);
    } catch (error) {
      console.error("Error fetching advertisers:", error);
      toast.error("Erreur lors du chargement des annonceurs");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const dataToSubmit = {
      name: formData.name,
      logo: formData.logo || null,
      description: formData.description || null,
      website: formData.website || null,
      contact_email: formData.contact_email || null,
      is_active: formData.is_active,
      postal_code: formData.postal_code || null,
      city: formData.city || null,
      department: formData.department || null,
      region: formData.region || null,
      intervention_radius_km: formData.intervention_radius_km ? parseInt(formData.intervention_radius_km) : null,
      intervention_departments: formData.intervention_departments.length > 0 ? formData.intervention_departments : null,
    };

    try {
      if (editingAdvertiser) {
        const { error } = await supabase
          .from("advertisers")
          .update(dataToSubmit)
          .eq("id", editingAdvertiser.id);

        if (error) throw error;
        toast.success("Annonceur mis à jour avec succès");
      } else {
        const { error } = await supabase
          .from("advertisers")
          .insert([dataToSubmit]);

        if (error) throw error;
        toast.success("Annonceur créé avec succès");
      }

      setDialogOpen(false);
      resetForm();
      fetchAdvertisers();
    } catch (error) {
      console.error("Error saving advertiser:", error);
      toast.error("Erreur lors de l'enregistrement");
    }
  };

  const handleEdit = (advertiser: Advertiser) => {
    setEditingAdvertiser(advertiser);
    setFormData({
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
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cet annonceur ?")) return;

    try {
      const { error } = await supabase
        .from("advertisers")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Annonceur supprimé avec succès");
      fetchAdvertisers();
    } catch (error) {
      console.error("Error deleting advertiser:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const resetForm = () => {
    setEditingAdvertiser(null);
    setNewDepartment("");
    setFormData({
      name: "",
      logo: "",
      description: "",
      website: "",
      contact_email: "",
      is_active: true,
      postal_code: "",
      city: "",
      department: "",
      region: "",
      intervention_radius_km: "",
      intervention_departments: [],
    });
  };

  const addDepartment = () => {
    if (newDepartment && !formData.intervention_departments.includes(newDepartment)) {
      setFormData({
        ...formData,
        intervention_departments: [...formData.intervention_departments, newDepartment.padStart(2, '0')]
      });
      setNewDepartment("");
    }
  };

  const removeDepartment = (dept: string) => {
    setFormData({
      ...formData,
      intervention_departments: formData.intervention_departments.filter(d => d !== dept)
    });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Gérer les Annonceurs | Prime Énergies</title>
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="container mx-auto px-4 pt-32 pb-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold mb-2">Gestion des Annonceurs</h1>
              <p className="text-muted-foreground">Gérez vos partenaires publicitaires</p>
            </div>
            
            <Dialog open={dialogOpen} onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button size="lg" className="gap-2">
                  <Plus className="w-5 h-5" />
                  Nouvel Annonceur
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingAdvertiser ? "Modifier l'annonceur" : "Créer un annonceur"}
                  </DialogTitle>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Informations générales */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg border-b pb-2">Informations générales</h3>
                    
                    <div>
                      <Label htmlFor="name">Nom de l'entreprise *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        placeholder="Ex: SolarMax France"
                      />
                    </div>

                    <div>
                      <Label htmlFor="logo">URL du logo</Label>
                      <Input
                        id="logo"
                        type="url"
                        value={formData.logo}
                        onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                        placeholder="https://example.com/logo.png"
                      />
                    </div>

                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={3}
                        placeholder="Description de l'entreprise partenaire"
                      />
                    </div>

                    <div>
                      <Label htmlFor="website">Site web</Label>
                      <Input
                        id="website"
                        type="url"
                        value={formData.website}
                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                        placeholder="https://www.example.com"
                      />
                    </div>

                    <div>
                      <Label htmlFor="contact_email">Email de contact</Label>
                      <Input
                        id="contact_email"
                        type="email"
                        value={formData.contact_email}
                        onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                        placeholder="contact@example.com"
                      />
                    </div>
                  </div>

                  {/* Localisation */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg border-b pb-2 flex items-center gap-2">
                      <MapPin className="w-5 h-5" />
                      Localisation & Zone d'intervention
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="postal_code">Code postal (siège)</Label>
                        <Input
                          id="postal_code"
                          value={formData.postal_code}
                          onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                          placeholder="75008"
                          maxLength={5}
                        />
                      </div>
                      <div>
                        <Label htmlFor="city">Ville</Label>
                        <Input
                          id="city"
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                          placeholder="Paris"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="department">Département</Label>
                        <Input
                          id="department"
                          value={formData.department}
                          onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                          placeholder="75"
                          maxLength={3}
                        />
                      </div>
                      <div>
                        <Label htmlFor="region">Région</Label>
                        <select
                          id="region"
                          value={formData.region}
                          onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <option value="">Sélectionner...</option>
                          {REGIONS_FRANCE.map((region) => (
                            <option key={region} value={region}>{region}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="intervention_radius_km">Rayon d'intervention (km)</Label>
                      <Input
                        id="intervention_radius_km"
                        type="number"
                        value={formData.intervention_radius_km}
                        onChange={(e) => setFormData({ ...formData, intervention_radius_km: e.target.value })}
                        placeholder="100"
                        min="0"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Optionnel : rayon autour du siège
                      </p>
                    </div>

                    <div>
                      <Label>Départements couverts</Label>
                      <div className="flex gap-2 mt-2">
                        <Input
                          value={newDepartment}
                          onChange={(e) => setNewDepartment(e.target.value)}
                          placeholder="Ex: 75, 92, 93..."
                          maxLength={3}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addDepartment();
                            }
                          }}
                        />
                        <Button type="button" variant="outline" onClick={addDepartment}>
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      {formData.intervention_departments.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {formData.intervention_departments.map((dept) => (
                            <Badge key={dept} variant="secondary" className="gap-1">
                              {dept}
                              <button
                                type="button"
                                onClick={() => removeDepartment(dept)}
                                className="ml-1 hover:text-destructive"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        Liste des départements où l'installateur intervient
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                    <Label htmlFor="is_active">Annonceur actif</Label>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button type="submit" className="flex-1">
                      {editingAdvertiser ? "Mettre à jour" : "Créer"}
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

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Liste des Annonceurs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Logo</TableHead>
                    <TableHead>Nom</TableHead>
                    <TableHead>Localisation</TableHead>
                    <TableHead>Zone d'intervention</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {advertisers.map((advertiser) => (
                    <TableRow key={advertiser.id}>
                      <TableCell>
                        {advertiser.logo ? (
                          <img 
                            src={advertiser.logo} 
                            alt={advertiser.name}
                            className="w-12 h-12 object-contain rounded"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                            <Building2 className="w-6 h-6 text-muted-foreground" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{advertiser.name}</TableCell>
                      <TableCell>
                        {advertiser.city ? (
                          <div className="text-sm">
                            <div className="font-medium">{advertiser.city}</div>
                            <div className="text-muted-foreground text-xs">
                              {advertiser.postal_code} - {advertiser.region}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {advertiser.intervention_departments && advertiser.intervention_departments.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-w-[200px]">
                            {advertiser.intervention_departments.slice(0, 5).map((dept) => (
                              <Badge key={dept} variant="outline" className="text-xs">
                                {dept}
                              </Badge>
                            ))}
                            {advertiser.intervention_departments.length > 5 && (
                              <Badge variant="outline" className="text-xs">
                                +{advertiser.intervention_departments.length - 5}
                              </Badge>
                            )}
                          </div>
                        ) : advertiser.intervention_radius_km ? (
                          <span className="text-sm">{advertiser.intervention_radius_km} km</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          advertiser.is_active 
                            ? "bg-green-100 text-green-800" 
                            : "bg-gray-100 text-gray-800"
                        }`}>
                          {advertiser.is_active ? "Actif" : "Inactif"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(advertiser)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(advertiser.id)}
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

        <Footer />
      </div>
    </>
  );
};

export default ManageAdvertisers;
