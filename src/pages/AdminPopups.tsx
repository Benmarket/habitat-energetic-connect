import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Edit, Trash2, Eye, Loader2, Layers, FileText, Megaphone, Maximize, X, Save, Copy } from "lucide-react";
import { Helmet } from "react-helmet";
import PopupPreview from "@/components/PopupPreview";

type FormConfig = {
  id: string;
  name: string;
  form_identifier: string;
};

type Popup = {
  id: string;
  name: string;
  is_active: boolean;
  target_page: string;
  form_id: string | null;
  delay_seconds: number;
  frequency: string;
  template: string;
  title: string | null;
  subtitle: string | null;
  background_image: string | null;
  background_color: string;
  text_color: string;
  accent_color: string;
  overlay_opacity: number;
  size: string;
  position: string;
  animation: string;
  badge_text: string | null;
  badge_color: string;
  show_close_button: boolean;
  close_button_style: string;
  is_custom_template: boolean;
  custom_template_name: string | null;
  created_at: string;
  updated_at: string;
};

type PopupTemplate = {
  id: string;
  name: string;
  template: string;
  background_color: string;
  text_color: string;
  accent_color: string;
  overlay_opacity: number;
  size: string;
  position: string;
  animation: string;
  badge_color: string;
  show_close_button: boolean;
  close_button_style: string;
};

const TEMPLATES = [
  { id: "lead_capture", name: "Capture de leads", icon: FileText, description: "Formulaire de contact classique" },
  { id: "promotion", name: "Promotion", icon: Megaphone, description: "Offre promotionnelle avec badge" },
  { id: "information", name: "Information", icon: Layers, description: "Message informatif simple" },
  { id: "fullscreen", name: "Plein écran", icon: Maximize, description: "Pop-up immersif en plein écran" },
];

const POSITIONS = [
  { id: "center", name: "Centre" },
  { id: "bottom-right", name: "Bas droite" },
  { id: "bottom-left", name: "Bas gauche" },
  { id: "top-right", name: "Haut droite" },
  { id: "top-left", name: "Haut gauche" },
];

const SIZES = [
  { id: "small", name: "Petit" },
  { id: "medium", name: "Moyen" },
  { id: "large", name: "Grand" },
  { id: "fullscreen", name: "Plein écran" },
];

const ANIMATIONS = [
  { id: "fade", name: "Fondu" },
  { id: "slide-up", name: "Glissement haut" },
  { id: "slide-down", name: "Glissement bas" },
  { id: "scale", name: "Zoom" },
  { id: "none", name: "Aucune" },
];

const FREQUENCIES = [
  { id: "session", name: "Une fois par session" },
  { id: "once", name: "Une seule fois (jamais réaffiché)" },
  { id: "always", name: "À chaque visite" },
];

const PAGES = [
  { id: "/", name: "Accueil" },
  { id: "/actualites", name: "Actualités" },
  { id: "/guides", name: "Guides" },
  { id: "/aides", name: "Aides" },
  { id: "/forum", name: "Forum" },
];

const defaultPopupData: Omit<Popup, "id" | "created_at" | "updated_at"> = {
  name: "",
  is_active: false,
  target_page: "/",
  form_id: null,
  delay_seconds: 3,
  frequency: "session",
  template: "lead_capture",
  title: "",
  subtitle: "",
  background_image: null,
  background_color: "#ffffff",
  text_color: "#1f2937",
  accent_color: "#10b981",
  overlay_opacity: 50,
  size: "medium",
  position: "center",
  animation: "fade",
  badge_text: null,
  badge_color: "#ef4444",
  show_close_button: true,
  close_button_style: "icon",
  is_custom_template: false,
  custom_template_name: null,
};

export default function AdminPopups() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [editingPopup, setEditingPopup] = useState<Popup | null>(null);
  const [popupData, setPopupData] = useState(defaultPopupData);
  const [activeTab, setActiveTab] = useState("general");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/connexion");
    }
  }, [user, authLoading, navigate]);

  // Fetch popups
  const { data: popups, isLoading: loadingPopups } = useQuery({
    queryKey: ["popups"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("popups")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Popup[];
    },
  });

  // Fetch forms for selection
  const { data: forms } = useQuery({
    queryKey: ["form-configurations-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("form_configurations")
        .select("id, name, form_identifier")
        .order("name");
      if (error) throw error;
      return data as FormConfig[];
    },
  });

  // Fetch custom templates
  const { data: customTemplates } = useQuery({
    queryKey: ["popup-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("popup_templates")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as PopupTemplate[];
    },
  });

  // Create/Update popup mutation
  const savePopupMutation = useMutation({
    mutationFn: async (data: typeof popupData & { id?: string }) => {
      // Check if target page already has an active popup
      if (data.is_active) {
        const { data: existingPopups, error: checkError } = await supabase
          .from("popups")
          .select("id, name")
          .eq("target_page", data.target_page)
          .eq("is_active", true)
          .neq("id", data.id || "00000000-0000-0000-0000-000000000000");
        
        if (checkError) throw checkError;
        if (existingPopups && existingPopups.length > 0) {
          throw new Error(`Un pop-up actif existe déjà sur cette page: "${existingPopups[0].name}"`);
        }
      }

      if (data.id) {
        const { id, ...updateData } = data;
        const { error } = await supabase
          .from("popups")
          .update(updateData)
          .eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("popups")
          .insert([data]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["popups"] });
      toast({ title: editingPopup ? "Pop-up mis à jour" : "Pop-up créé avec succès" });
      closeEditor();
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete popup mutation
  const deletePopupMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("popups").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["popups"] });
      toast({ title: "Pop-up supprimé" });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Toggle active status
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active, target_page }: { id: string; is_active: boolean; target_page: string }) => {
      if (is_active) {
        // Check if target page already has an active popup
        const { data: existingPopups, error: checkError } = await supabase
          .from("popups")
          .select("id, name")
          .eq("target_page", target_page)
          .eq("is_active", true)
          .neq("id", id);
        
        if (checkError) throw checkError;
        if (existingPopups && existingPopups.length > 0) {
          throw new Error(`Un pop-up actif existe déjà sur cette page: "${existingPopups[0].name}"`);
        }
      }

      const { error } = await supabase
        .from("popups")
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["popups"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Save as custom template
  const saveTemplateMutation = useMutation({
    mutationFn: async (name: string) => {
      const templateData = {
        name,
        user_id: user?.id,
        template: popupData.template,
        background_color: popupData.background_color,
        text_color: popupData.text_color,
        accent_color: popupData.accent_color,
        overlay_opacity: popupData.overlay_opacity,
        size: popupData.size,
        position: popupData.position,
        animation: popupData.animation,
        badge_color: popupData.badge_color,
        show_close_button: popupData.show_close_button,
        close_button_style: popupData.close_button_style,
      };
      
      const { error } = await supabase.from("popup_templates").insert([templateData]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["popup-templates"] });
      toast({ title: "Template sauvegardé" });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const openEditor = (popup?: Popup) => {
    if (popup) {
      setEditingPopup(popup);
      setPopupData({
        name: popup.name,
        is_active: popup.is_active,
        target_page: popup.target_page,
        form_id: popup.form_id,
        delay_seconds: popup.delay_seconds,
        frequency: popup.frequency,
        template: popup.template,
        title: popup.title || "",
        subtitle: popup.subtitle || "",
        background_image: popup.background_image,
        background_color: popup.background_color,
        text_color: popup.text_color,
        accent_color: popup.accent_color,
        overlay_opacity: popup.overlay_opacity,
        size: popup.size,
        position: popup.position,
        animation: popup.animation,
        badge_text: popup.badge_text,
        badge_color: popup.badge_color,
        show_close_button: popup.show_close_button,
        close_button_style: popup.close_button_style,
        is_custom_template: popup.is_custom_template,
        custom_template_name: popup.custom_template_name,
      });
    } else {
      setEditingPopup(null);
      setPopupData(defaultPopupData);
    }
    setActiveTab("general");
    setIsEditorOpen(true);
  };

  const closeEditor = () => {
    setIsEditorOpen(false);
    setEditingPopup(null);
    setPopupData(defaultPopupData);
  };

  const handleSave = () => {
    if (!popupData.name.trim()) {
      toast({
        title: "Erreur",
        description: "Le nom du pop-up est requis",
        variant: "destructive",
      });
      return;
    }

    savePopupMutation.mutate({
      ...popupData,
      id: editingPopup?.id,
    });
  };

  const applyTemplate = (template: PopupTemplate) => {
    setPopupData(prev => ({
      ...prev,
      template: template.template,
      background_color: template.background_color,
      text_color: template.text_color,
      accent_color: template.accent_color,
      overlay_opacity: template.overlay_opacity,
      size: template.size,
      position: template.position,
      animation: template.animation,
      badge_color: template.badge_color,
      show_close_button: template.show_close_button,
      close_button_style: template.close_button_style,
      is_custom_template: true,
      custom_template_name: template.name,
    }));
    toast({ title: `Template "${template.name}" appliqué` });
  };

  const handleSaveAsTemplate = () => {
    const name = prompt("Nom du template :");
    if (name) {
      saveTemplateMutation.mutate(name);
    }
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
        <title>Gestion des Pop-ups | Administration</title>
      </Helmet>

      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        
        <main className="flex-1 pt-20">
          <div className="container mx-auto px-4 py-6 md:py-8">
            <button 
              onClick={() => navigate("/administration")}
              className="inline-flex items-center gap-2 text-sm md:text-base text-muted-foreground hover:text-foreground mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Retour à l'administration</span>
            </button>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
                  Gestion des Pop-ups
                </h1>
                <p className="text-muted-foreground mt-1">
                  Créez et gérez les pop-ups de votre site (1 pop-up max par page)
                </p>
              </div>
              <Button 
                onClick={() => openEditor()}
                className="bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 shadow-lg"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nouveau Pop-up
              </Button>
            </div>

            {/* Popups List */}
            <Card>
              <CardHeader>
                <CardTitle>Pop-ups configurés</CardTitle>
                <CardDescription>
                  Liste de tous les pop-ups créés. Un seul pop-up peut être actif par page.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingPopups ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : !popups || popups.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Layers className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Aucun pop-up configuré</p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => openEditor()}
                    >
                      Créer votre premier pop-up
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nom</TableHead>
                          <TableHead>Page cible</TableHead>
                          <TableHead>Template</TableHead>
                          <TableHead>Formulaire</TableHead>
                          <TableHead>Délai</TableHead>
                          <TableHead>Actif</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {popups.map((popup) => {
                          const template = TEMPLATES.find(t => t.id === popup.template);
                          const form = forms?.find(f => f.id === popup.form_id);
                          const page = PAGES.find(p => p.id === popup.target_page);
                          
                          return (
                            <TableRow key={popup.id}>
                              <TableCell className="font-medium">{popup.name}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{page?.name || popup.target_page}</Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary">{template?.name || popup.template}</Badge>
                              </TableCell>
                              <TableCell>
                                {form ? (
                                  <span className="text-sm text-muted-foreground">{form.name}</span>
                                ) : (
                                  <span className="text-sm text-muted-foreground italic">Aucun</span>
                                )}
                              </TableCell>
                              <TableCell>{popup.delay_seconds}s</TableCell>
                              <TableCell>
                                <Switch
                                  checked={popup.is_active}
                                  onCheckedChange={(checked) => 
                                    toggleActiveMutation.mutate({ 
                                      id: popup.id, 
                                      is_active: checked,
                                      target_page: popup.target_page 
                                    })
                                  }
                                />
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={() => {
                                      setPopupData({
                                        name: popup.name,
                                        is_active: popup.is_active,
                                        target_page: popup.target_page,
                                        form_id: popup.form_id,
                                        delay_seconds: popup.delay_seconds,
                                        frequency: popup.frequency,
                                        template: popup.template,
                                        title: popup.title || "",
                                        subtitle: popup.subtitle || "",
                                        background_image: popup.background_image,
                                        background_color: popup.background_color,
                                        text_color: popup.text_color,
                                        accent_color: popup.accent_color,
                                        overlay_opacity: popup.overlay_opacity,
                                        size: popup.size,
                                        position: popup.position,
                                        animation: popup.animation,
                                        badge_text: popup.badge_text,
                                        badge_color: popup.badge_color,
                                        show_close_button: popup.show_close_button,
                                        close_button_style: popup.close_button_style,
                                        is_custom_template: popup.is_custom_template,
                                        custom_template_name: popup.custom_template_name,
                                      });
                                      setIsPreviewOpen(true);
                                    }}
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={() => openEditor(popup)}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    className="text-destructive hover:text-destructive"
                                    onClick={() => {
                                      if (window.confirm("Supprimer ce pop-up ?")) {
                                        deletePopupMutation.mutate(popup.id);
                                      }
                                    }}
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
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>

        <Footer />
      </div>

      {/* Editor Dialog */}
      <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPopup ? "Modifier le pop-up" : "Créer un pop-up"}
            </DialogTitle>
            <DialogDescription>
              Configurez l'apparence et le comportement du pop-up
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="general">Général</TabsTrigger>
              <TabsTrigger value="template">Template</TabsTrigger>
              <TabsTrigger value="style">Style</TabsTrigger>
              <TabsTrigger value="behavior">Comportement</TabsTrigger>
            </TabsList>

            {/* General Tab */}
            <TabsContent value="general" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom du pop-up *</Label>
                  <Input
                    id="name"
                    value={popupData.name}
                    onChange={(e) => setPopupData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Pop-up Newsletter"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="target_page">Page cible</Label>
                  <Select
                    value={popupData.target_page}
                    onValueChange={(value) => setPopupData(prev => ({ ...prev, target_page: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAGES.map((page) => (
                        <SelectItem key={page.id} value={page.id}>
                          {page.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Titre</Label>
                  <Input
                    id="title"
                    value={popupData.title || ""}
                    onChange={(e) => setPopupData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Ex: Restez informé !"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subtitle">Sous-titre</Label>
                  <Input
                    id="subtitle"
                    value={popupData.subtitle || ""}
                    onChange={(e) => setPopupData(prev => ({ ...prev, subtitle: e.target.value }))}
                    placeholder="Ex: Inscrivez-vous à notre newsletter"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="form_id">Formulaire associé</Label>
                <Select
                  value={popupData.form_id || "none"}
                  onValueChange={(value) => setPopupData(prev => ({ ...prev, form_id: value === "none" ? null : value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un formulaire" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucun formulaire</SelectItem>
                    {forms?.map((form) => (
                      <SelectItem key={form.id} value={form.id}>
                        {form.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Les formulaires sont créés dans la section "Formulaires" de l'administration
                </p>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label>Pop-up actif</Label>
                  <p className="text-sm text-muted-foreground">
                    Activer ce pop-up sur la page cible
                  </p>
                </div>
                <Switch
                  checked={popupData.is_active}
                  onCheckedChange={(checked) => setPopupData(prev => ({ ...prev, is_active: checked }))}
                />
              </div>
            </TabsContent>

            {/* Template Tab */}
            <TabsContent value="template" className="space-y-4 mt-4">
              <div>
                <Label className="text-base font-semibold">Templates prédéfinis</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                  {TEMPLATES.map((template) => {
                    const Icon = template.icon;
                    return (
                      <button
                        key={template.id}
                        type="button"
                        onClick={() => setPopupData(prev => ({ 
                          ...prev, 
                          template: template.id,
                          size: template.id === "fullscreen" ? "fullscreen" : prev.size
                        }))}
                        className={`p-4 border-2 rounded-lg text-center transition-all hover:shadow-md ${
                          popupData.template === template.id 
                            ? "border-primary bg-primary/5" 
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <Icon className="w-8 h-8 mx-auto mb-2 text-primary" />
                        <p className="font-medium text-sm">{template.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">{template.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {customTemplates && customTemplates.length > 0 && (
                <div>
                  <Label className="text-base font-semibold">Mes templates personnalisés</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                    {customTemplates.map((template) => (
                      <button
                        key={template.id}
                        type="button"
                        onClick={() => applyTemplate(template)}
                        className="p-4 border-2 rounded-lg text-center transition-all hover:shadow-md border-border hover:border-primary/50"
                      >
                        <Copy className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                        <p className="font-medium text-sm">{template.name}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <Button variant="outline" onClick={handleSaveAsTemplate} className="mt-4">
                <Save className="w-4 h-4 mr-2" />
                Sauvegarder comme template
              </Button>
            </TabsContent>

            {/* Style Tab */}
            <TabsContent value="style" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="size">Taille</Label>
                  <Select
                    value={popupData.size}
                    onValueChange={(value) => setPopupData(prev => ({ ...prev, size: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SIZES.map((size) => (
                        <SelectItem key={size.id} value={size.id}>
                          {size.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="position">Position</Label>
                  <Select
                    value={popupData.position}
                    onValueChange={(value) => setPopupData(prev => ({ ...prev, position: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {POSITIONS.map((position) => (
                        <SelectItem key={position.id} value={position.id}>
                          {position.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="background_color">Fond</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={popupData.background_color}
                      onChange={(e) => setPopupData(prev => ({ ...prev, background_color: e.target.value }))}
                      className="w-12 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={popupData.background_color}
                      onChange={(e) => setPopupData(prev => ({ ...prev, background_color: e.target.value }))}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="text_color">Texte</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={popupData.text_color}
                      onChange={(e) => setPopupData(prev => ({ ...prev, text_color: e.target.value }))}
                      className="w-12 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={popupData.text_color}
                      onChange={(e) => setPopupData(prev => ({ ...prev, text_color: e.target.value }))}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accent_color">Accent</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={popupData.accent_color}
                      onChange={(e) => setPopupData(prev => ({ ...prev, accent_color: e.target.value }))}
                      className="w-12 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={popupData.accent_color}
                      onChange={(e) => setPopupData(prev => ({ ...prev, accent_color: e.target.value }))}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="badge_color">Badge</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={popupData.badge_color}
                      onChange={(e) => setPopupData(prev => ({ ...prev, badge_color: e.target.value }))}
                      className="w-12 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={popupData.badge_color}
                      onChange={(e) => setPopupData(prev => ({ ...prev, badge_color: e.target.value }))}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Opacité de l'overlay: {popupData.overlay_opacity}%</Label>
                <Slider
                  value={[popupData.overlay_opacity]}
                  onValueChange={([value]) => setPopupData(prev => ({ ...prev, overlay_opacity: value }))}
                  min={0}
                  max={100}
                  step={5}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="animation">Animation d'entrée</Label>
                <Select
                  value={popupData.animation}
                  onValueChange={(value) => setPopupData(prev => ({ ...prev, animation: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ANIMATIONS.map((anim) => (
                      <SelectItem key={anim.id} value={anim.id}>
                        {anim.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="badge_text">Texte du badge (optionnel)</Label>
                  <Input
                    id="badge_text"
                    value={popupData.badge_text || ""}
                    onChange={(e) => setPopupData(prev => ({ ...prev, badge_text: e.target.value || null }))}
                    placeholder="Ex: Offre limitée !"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="background_image">Image de fond (URL)</Label>
                  <Input
                    id="background_image"
                    value={popupData.background_image || ""}
                    onChange={(e) => setPopupData(prev => ({ ...prev, background_image: e.target.value || null }))}
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label>Afficher le bouton fermer</Label>
                  <p className="text-sm text-muted-foreground">
                    Permet à l'utilisateur de fermer le pop-up
                  </p>
                </div>
                <Switch
                  checked={popupData.show_close_button}
                  onCheckedChange={(checked) => setPopupData(prev => ({ ...prev, show_close_button: checked }))}
                />
              </div>
            </TabsContent>

            {/* Behavior Tab */}
            <TabsContent value="behavior" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Délai avant affichage: {popupData.delay_seconds} seconde(s)</Label>
                <Slider
                  value={[popupData.delay_seconds]}
                  onValueChange={([value]) => setPopupData(prev => ({ ...prev, delay_seconds: value }))}
                  min={0}
                  max={30}
                  step={1}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="frequency">Fréquence d'affichage</Label>
                <Select
                  value={popupData.frequency}
                  onValueChange={(value) => setPopupData(prev => ({ ...prev, frequency: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FREQUENCIES.map((freq) => (
                      <SelectItem key={freq.id} value={freq.id}>
                        {freq.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {popupData.frequency === "session" && "Le pop-up sera affiché une fois par session de navigation"}
                  {popupData.frequency === "once" && "Le pop-up ne sera affiché qu'une seule fois (stocké en localStorage)"}
                  {popupData.frequency === "always" && "Le pop-up sera affiché à chaque visite de la page"}
                </p>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-between gap-2 mt-6 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => setIsPreviewOpen(true)}
            >
              <Eye className="w-4 h-4 mr-2" />
              Prévisualiser
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={closeEditor}>
                Annuler
              </Button>
              <Button 
                onClick={handleSave}
                disabled={savePopupMutation.isPending}
                className="bg-gradient-to-r from-pink-600 to-rose-600"
              >
                {savePopupMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingPopup ? "Mettre à jour" : "Créer"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-6xl max-h-[95vh] p-0 overflow-hidden">
          <div className="relative w-full h-[85vh]">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-50 bg-background/80 backdrop-blur"
              onClick={() => setIsPreviewOpen(false)}
            >
              <X className="w-5 h-5" />
            </Button>
            <PopupPreview popup={popupData} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}