import { useState, useEffect } from 'react';
import { useNavigate, Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star, Plus, Trash2, Edit, Save, X, ArrowLeft, Loader2, Waves, Box, Sparkles, Minus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CtaBanner {
  id: string;
  name: string;
  description: string | null;
  template_style: 'wave' | 'geometric' | 'gradient' | 'minimal';
  background_color: string;
  secondary_color: string;
  text_color: string;
  accent_color: string;
  title: string;
  subtitle: string | null;
  is_favorite: boolean;
  favorite_order: number | null;
}

const TEMPLATE_STYLES = [
  { id: 'wave', name: 'Vagues', icon: Waves, description: 'Design fluide avec courbes' },
  { id: 'geometric', name: 'Géométrique', icon: Box, description: 'Formes angulaires modernes' },
  { id: 'gradient', name: 'Dégradé', icon: Sparkles, description: 'Transition de couleurs' },
  { id: 'minimal', name: 'Minimal', icon: Minus, description: 'Simple et épuré' },
];

const createDefaultBanners = async (userId: string) => {
  const defaultBanners = [
    { 
      user_id: userId, 
      name: 'CTA Solaire', 
      description: 'Bandeau pour promouvoir le solaire',
      template_style: 'wave',
      background_color: '#10b981',
      secondary_color: '#059669',
      text_color: '#ffffff',
      accent_color: '#fbbf24',
      title: 'Passez au solaire dès maintenant !',
      subtitle: 'Économisez jusqu\'à 70% sur votre facture d\'électricité',
      is_favorite: true,
      favorite_order: 1
    },
    { 
      user_id: userId, 
      name: 'CTA Rénovation', 
      description: 'Bandeau rénovation énergétique',
      template_style: 'geometric',
      background_color: '#3b82f6',
      secondary_color: '#1d4ed8',
      text_color: '#ffffff',
      accent_color: '#f59e0b',
      title: 'Rénovez votre logement',
      subtitle: 'Bénéficiez des aides de l\'État',
      is_favorite: true,
      favorite_order: 2
    },
    { 
      user_id: userId, 
      name: 'CTA Urgence', 
      description: 'Bandeau pour offres limitées',
      template_style: 'gradient',
      background_color: '#ef4444',
      secondary_color: '#dc2626',
      text_color: '#ffffff',
      accent_color: '#fbbf24',
      title: 'Offre limitée !',
      subtitle: 'Ne manquez pas cette opportunité',
      is_favorite: true,
      favorite_order: 3
    },
    { 
      user_id: userId, 
      name: 'CTA Simple', 
      description: 'Bandeau minimal',
      template_style: 'minimal',
      background_color: '#1f2937',
      secondary_color: '#374151',
      text_color: '#ffffff',
      accent_color: '#10b981',
      title: 'Demandez votre étude gratuite',
      subtitle: null,
      is_favorite: false,
      favorite_order: null
    },
  ];

  const { error } = await supabase.from('cta_banners').insert(defaultBanners);
  if (error) throw error;
};

const AdminCtaBanners = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [banners, setBanners] = useState<CtaBanner[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingBanner, setEditingBanner] = useState<CtaBanner | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<CtaBanner>>({
    name: '',
    description: '',
    template_style: 'wave',
    background_color: '#10b981',
    secondary_color: '#059669',
    text_color: '#ffffff',
    accent_color: '#fbbf24',
    title: '',
    subtitle: '',
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/connexion");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      loadBanners();
    }
  }, [user]);

  const loadBanners = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let { data, error } = await supabase
        .from('cta_banners')
        .select('*')
        .eq('user_id', user.id)
        .order('is_favorite', { ascending: false })
        .order('favorite_order', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!data || data.length === 0) {
        await createDefaultBanners(user.id);
        const { data: newData, error: newError } = await supabase
          .from('cta_banners')
          .select('*')
          .eq('user_id', user.id)
          .order('is_favorite', { ascending: false })
          .order('favorite_order', { ascending: true, nullsFirst: false })
          .order('created_at', { ascending: false });
        
        if (newError) throw newError;
        data = newData;
      }

      setBanners(data as CtaBanner[]);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (banner: CtaBanner) => {
    const favorites = banners.filter(b => b.is_favorite);
    
    if (!banner.is_favorite && favorites.length >= 5) {
      toast({
        title: "Limite atteinte",
        description: "Vous pouvez avoir maximum 5 bandeaux favoris",
        variant: "destructive"
      });
      return;
    }

    const newFavoriteStatus = !banner.is_favorite;
    const newOrder = newFavoriteStatus ? favorites.length + 1 : null;

    const { error } = await supabase
      .from('cta_banners')
      .update({ is_favorite: newFavoriteStatus, favorite_order: newOrder })
      .eq('id', banner.id);

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      loadBanners();
      toast({
        title: newFavoriteStatus ? "Ajouté aux favoris" : "Retiré des favoris",
      });
    }
  };

  const deleteBanner = async (id: string) => {
    const { error } = await supabase.from('cta_banners').delete().eq('id', id);

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      loadBanners();
      toast({ title: "Supprimé", description: "Le bandeau a été supprimé" });
    }
  };

  const handleSave = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (editingBanner) {
      const { error } = await supabase
        .from('cta_banners')
        .update({
          name: formData.name,
          description: formData.description,
          template_style: formData.template_style,
          background_color: formData.background_color,
          secondary_color: formData.secondary_color,
          text_color: formData.text_color,
          accent_color: formData.accent_color,
          title: formData.title,
          subtitle: formData.subtitle,
        })
        .eq('id', editingBanner.id);

      if (error) {
        toast({ title: "Erreur", description: error.message, variant: "destructive" });
      } else {
        loadBanners();
        setEditorOpen(false);
        setEditingBanner(null);
        toast({ title: "Modifié", description: "Le bandeau a été mis à jour" });
      }
    } else {
      const { error } = await supabase
        .from('cta_banners')
        .insert({
          user_id: user.id,
          name: formData.name || 'Nouveau bandeau',
          description: formData.description,
          template_style: formData.template_style,
          background_color: formData.background_color,
          secondary_color: formData.secondary_color,
          text_color: formData.text_color,
          accent_color: formData.accent_color,
          title: formData.title || 'Titre du bandeau',
          subtitle: formData.subtitle,
        });

      if (error) {
        toast({ title: "Erreur", description: error.message, variant: "destructive" });
      } else {
        loadBanners();
        setEditorOpen(false);
        toast({ title: "Créé", description: "Le nouveau bandeau a été créé" });
      }
    }
  };

  const openEditor = (banner?: CtaBanner) => {
    if (banner) {
      setEditingBanner(banner);
      setFormData({
        name: banner.name,
        description: banner.description || '',
        template_style: banner.template_style,
        background_color: banner.background_color,
        secondary_color: banner.secondary_color,
        text_color: banner.text_color,
        accent_color: banner.accent_color,
        title: banner.title,
        subtitle: banner.subtitle || '',
      });
    } else {
      setEditingBanner(null);
      setFormData({
        name: '',
        description: '',
        template_style: 'wave',
        background_color: '#10b981',
        secondary_color: '#059669',
        text_color: '#ffffff',
        accent_color: '#fbbf24',
        title: '',
        subtitle: '',
      });
    }
    setEditorOpen(true);
  };

  const renderBannerPreview = (banner: CtaBanner | Partial<CtaBanner>) => {
    const style = banner.template_style || 'wave';
    
    const getBackgroundStyle = () => {
      switch (style) {
        case 'wave':
          return {
            background: `linear-gradient(135deg, ${banner.background_color} 0%, ${banner.secondary_color} 100%)`,
          };
        case 'geometric':
          return {
            background: banner.background_color,
            backgroundImage: `linear-gradient(45deg, ${banner.secondary_color} 25%, transparent 25%), 
                              linear-gradient(-45deg, ${banner.secondary_color} 25%, transparent 25%), 
                              linear-gradient(45deg, transparent 75%, ${banner.secondary_color} 75%), 
                              linear-gradient(-45deg, transparent 75%, ${banner.secondary_color} 75%)`,
            backgroundSize: '20px 20px',
            backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
          };
        case 'gradient':
          return {
            background: `linear-gradient(90deg, ${banner.background_color} 0%, ${banner.secondary_color} 50%, ${banner.accent_color} 100%)`,
          };
        case 'minimal':
          return {
            background: banner.background_color,
            borderLeft: `4px solid ${banner.accent_color}`,
          };
        default:
          return { background: banner.background_color };
      }
    };

    return (
      <div 
        className="rounded-lg p-6 text-center relative overflow-hidden"
        style={getBackgroundStyle()}
      >
        {style === 'wave' && (
          <svg 
            className="absolute bottom-0 left-0 right-0 opacity-20" 
            viewBox="0 0 1440 120" 
            preserveAspectRatio="none"
            style={{ height: '40px', width: '100%' }}
          >
            <path 
              fill={banner.secondary_color}
              d="M0,60 C360,120 1080,0 1440,60 L1440,120 L0,120 Z"
            />
          </svg>
        )}
        <h3 
          className="text-xl font-bold mb-2 relative z-10"
          style={{ color: banner.text_color }}
        >
          {banner.title || 'Titre du bandeau'}
        </h3>
        {banner.subtitle && (
          <p 
            className="text-sm opacity-90 relative z-10"
            style={{ color: banner.text_color }}
          >
            {banner.subtitle}
          </p>
        )}
        <div 
          className="mt-4 inline-block px-4 py-2 rounded-lg font-medium text-sm relative z-10"
          style={{ 
            backgroundColor: banner.accent_color,
            color: banner.background_color 
          }}
        >
          Bouton CTA
        </div>
      </div>
    );
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Gestion des bandeaux CTA | Prime Énergies</title>
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="pt-20">
          <div className="container mx-auto px-4 py-8 max-w-6xl">
            <Link 
              to="/administration"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour à l'administration
            </Link>

            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold">Gestion des bandeaux CTA</h1>
                <p className="text-muted-foreground mt-1">
                  Créez et gérez vos bandeaux d'appel à l'action ({banners.length}/50)
                </p>
              </div>
              <Button
                onClick={() => openEditor()}
                disabled={banners.length >= 50}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Nouveau bandeau
              </Button>
            </div>

            {/* Editor Panel */}
            {editorOpen && (
              <Card className="mb-8 border-primary">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold">
                      {editingBanner ? 'Modifier le bandeau' : 'Créer un bandeau'}
                    </h2>
                    <Button variant="ghost" size="icon" onClick={() => setEditorOpen(false)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Form */}
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="name">Nom du bandeau</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="Ex: CTA Solaire"
                        />
                      </div>

                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={formData.description || ''}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          placeholder="Description optionnelle"
                          rows={2}
                        />
                      </div>

                      <div>
                        <Label htmlFor="template_style">Style du template</Label>
                        <Select
                          value={formData.template_style}
                          onValueChange={(value) => setFormData({ ...formData, template_style: value as CtaBanner['template_style'] })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TEMPLATE_STYLES.map((style) => (
                              <SelectItem key={style.id} value={style.id}>
                                <div className="flex items-center gap-2">
                                  <style.icon className="w-4 h-4" />
                                  <span>{style.name}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="title">Titre</Label>
                        <Input
                          id="title"
                          value={formData.title}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          placeholder="Titre accrocheur"
                        />
                      </div>

                      <div>
                        <Label htmlFor="subtitle">Sous-titre</Label>
                        <Input
                          id="subtitle"
                          value={formData.subtitle || ''}
                          onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                          placeholder="Sous-titre optionnel"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="background_color">Couleur principale</Label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              id="background_color"
                              value={formData.background_color}
                              onChange={(e) => setFormData({ ...formData, background_color: e.target.value })}
                              className="w-10 h-10 rounded cursor-pointer"
                            />
                            <Input
                              value={formData.background_color}
                              onChange={(e) => setFormData({ ...formData, background_color: e.target.value })}
                              className="flex-1"
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="secondary_color">Couleur secondaire</Label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              id="secondary_color"
                              value={formData.secondary_color}
                              onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                              className="w-10 h-10 rounded cursor-pointer"
                            />
                            <Input
                              value={formData.secondary_color}
                              onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                              className="flex-1"
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="text_color">Couleur du texte</Label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              id="text_color"
                              value={formData.text_color}
                              onChange={(e) => setFormData({ ...formData, text_color: e.target.value })}
                              className="w-10 h-10 rounded cursor-pointer"
                            />
                            <Input
                              value={formData.text_color}
                              onChange={(e) => setFormData({ ...formData, text_color: e.target.value })}
                              className="flex-1"
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="accent_color">Couleur d'accent</Label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              id="accent_color"
                              value={formData.accent_color}
                              onChange={(e) => setFormData({ ...formData, accent_color: e.target.value })}
                              className="w-10 h-10 rounded cursor-pointer"
                            />
                            <Input
                              value={formData.accent_color}
                              onChange={(e) => setFormData({ ...formData, accent_color: e.target.value })}
                              className="flex-1"
                            />
                          </div>
                        </div>
                      </div>

                      <Button onClick={handleSave} className="w-full gap-2">
                        <Save className="w-4 h-4" />
                        {editingBanner ? 'Enregistrer les modifications' : 'Créer le bandeau'}
                      </Button>
                    </div>

                    {/* Preview */}
                    <div>
                      <Label className="mb-3 block">Aperçu</Label>
                      {renderBannerPreview(formData)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Banners List */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-4">
                {banners.map((banner) => (
                  <Card key={banner.id} className="hover:border-primary/50 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex flex-col lg:flex-row gap-4">
                        {/* Preview */}
                        <div className="lg:w-1/2">
                          {renderBannerPreview(banner)}
                        </div>

                        {/* Info & Actions */}
                        <div className="lg:w-1/2 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-lg">{banner.name}</h3>
                              {banner.is_favorite && (
                                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              )}
                            </div>
                            {banner.description && (
                              <p className="text-sm text-muted-foreground mb-2">{banner.description}</p>
                            )}
                            <div className="flex items-center gap-2">
                              {TEMPLATE_STYLES.find(s => s.id === banner.template_style)?.icon && (
                                <span className="text-xs bg-muted px-2 py-1 rounded flex items-center gap-1">
                                  {(() => {
                                    const StyleIcon = TEMPLATE_STYLES.find(s => s.id === banner.template_style)?.icon;
                                    return StyleIcon ? <StyleIcon className="w-3 h-3" /> : null;
                                  })()}
                                  {TEMPLATE_STYLES.find(s => s.id === banner.template_style)?.name}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 mt-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleFavorite(banner)}
                              title={banner.is_favorite ? "Retirer des favoris" : "Ajouter aux favoris"}
                            >
                              <Star className={`w-4 h-4 ${banner.is_favorite ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditor(banner)}
                              className="gap-1"
                            >
                              <Edit className="w-4 h-4" />
                              Modifier
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => deleteBanner(banner.id)}
                              className="gap-1"
                            >
                              <Trash2 className="w-4 h-4" />
                              Supprimer
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {banners.length === 0 && !loading && (
                  <div className="text-center py-12 text-muted-foreground">
                    <Waves className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Aucun bandeau CTA créé</p>
                    <p className="text-sm">Cliquez sur "Nouveau bandeau" pour commencer</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default AdminCtaBanners;