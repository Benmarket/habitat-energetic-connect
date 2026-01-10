import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Power, PowerOff, ArrowLeft, MessageCircle } from "lucide-react";
import { ChatbotFlowEditor } from "@/components/ChatbotFlowEditor";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type ChatbotFlow = {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  tree_structure: any;
  created_at: string;
  updated_at: string;
};

const AdminChatbot = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedFlow, setSelectedFlow] = useState<ChatbotFlow | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    is_active: false,
  });
  const [flowStructure, setFlowStructure] = useState<any>({
    start_node: "node_1",
    nodes: {
      node_1: {
        type: "question",
        question: "Votre question ici",
        answer_type: "buttons",
        options: [
          { label: "Option 1", next_node: "node_2" },
          { label: "Option 2", next_node: "node_3" }
        ]
      }
    }
  });

  // Fetch global chatbot enabled status
  const { data: chatbotEnabled, isLoading: isLoadingEnabled } = useQuery({
    queryKey: ["chatbot-enabled"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "chatbot_enabled")
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return data?.value === true;
    },
  });

  // Toggle global chatbot status
  const toggleGlobalChatbotMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      const { data: existing } = await supabase
        .from("site_settings")
        .select("id")
        .eq("key", "chatbot_enabled")
        .single();

      if (existing) {
        const { error } = await supabase
          .from("site_settings")
          .update({ value: enabled, updated_at: new Date().toISOString() })
          .eq("key", "chatbot_enabled");
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("site_settings")
          .insert({ key: "chatbot_enabled", value: enabled, is_public: true });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chatbot-enabled"] });
      toast({ title: chatbotEnabled ? "Chatbot désactivé du site" : "Chatbot activé sur le site" });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Fetch chatbot flows
  const { data: flows, isLoading } = useQuery({
    queryKey: ["chatbot-flows"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chatbot_flows")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as ChatbotFlow[];
    },
  });

  // Create flow mutation
  const createFlowMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase.from("chatbot_flows").insert([{
        ...data,
        tree_structure: flowStructure
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chatbot-flows"] });
      toast({ title: "Parcours créé avec succès" });
      setIsCreateModalOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Erreur lors de la création",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update flow mutation
  const updateFlowMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { error } = await supabase
        .from("chatbot_flows")
        .update({
          ...data,
          tree_structure: flowStructure
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chatbot-flows"] });
      toast({ title: "Parcours mis à jour avec succès" });
      setIsEditModalOpen(false);
      setSelectedFlow(null);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Erreur lors de la mise à jour",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete flow mutation
  const deleteFlowMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("chatbot_flows").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chatbot-flows"] });
      toast({ title: "Parcours supprimé avec succès" });
      setIsDeleteDialogOpen(false);
      setSelectedFlow(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erreur lors de la suppression",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Toggle active status
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("chatbot_flows")
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chatbot-flows"] });
      toast({ title: "Statut mis à jour avec succès" });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur lors du changement de statut",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      is_active: false,
    });
    setFlowStructure({
      start_node: "node_1",
      nodes: {
        node_1: {
          type: "question",
          question: "Votre question ici",
          answer_type: "buttons",
          options: [
            { label: "Option 1", next_node: "node_2" },
            { label: "Option 2", next_node: "node_3" }
          ]
        }
      }
    });
  };

  const handleCreate = () => {
    if (!formData.name) {
      toast({
        title: "Nom requis",
        description: "Veuillez saisir un nom pour le parcours",
        variant: "destructive",
      });
      return;
    }
    createFlowMutation.mutate({
      name: formData.name,
      description: formData.description || null,
      is_active: formData.is_active,
    });
  };

  const handleUpdate = () => {
    if (!selectedFlow) return;
    if (!formData.name) {
      toast({
        title: "Nom requis",
        description: "Veuillez saisir un nom pour le parcours",
        variant: "destructive",
      });
      return;
    }
    updateFlowMutation.mutate({
      id: selectedFlow.id,
      data: {
        name: formData.name,
        description: formData.description || null,
        is_active: formData.is_active,
      },
    });
  };

  const openEditModal = (flow: ChatbotFlow) => {
    setSelectedFlow(flow);
    setFormData({
      name: flow.name,
      description: flow.description || "",
      is_active: flow.is_active,
    });
    setFlowStructure(flow.tree_structure);
    setIsEditModalOpen(true);
  };

  const openDeleteDialog = (flow: ChatbotFlow) => {
    setSelectedFlow(flow);
    setIsDeleteDialogOpen(true);
  };

  // Load structure into editor when modal opens
  useEffect(() => {
    if (isEditModalOpen && selectedFlow) {
      setFlowStructure(selectedFlow.tree_structure);
    }
  }, [isEditModalOpen, selectedFlow]);

  return (
    <>
      <Helmet>
        <title>Gestion du Chatbot | Prime Énergies</title>
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="pt-20">
          <div className="container mx-auto py-8 px-4">
            <Link 
              to="/administration"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour à l'administration
            </Link>
      {/* Global chatbot status card */}
      <Card className="mb-8 border-2 border-blue-200 dark:border-blue-800">
        <CardHeader className="pb-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${chatbotEnabled ? 'bg-green-100 dark:bg-green-900' : 'bg-gray-100 dark:bg-gray-800'}`}>
                <MessageCircle className={`h-6 w-6 ${chatbotEnabled ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`} />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  Chatbot sur le site
                  {chatbotEnabled ? (
                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full dark:bg-green-900 dark:text-green-300">
                      Actif
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-full dark:bg-gray-800 dark:text-gray-300">
                      Désactivé
                    </span>
                  )}
                </CardTitle>
                <CardDescription className="mt-1">
                  {chatbotEnabled 
                    ? "Le bouton d'assistance en ligne est visible sur toutes les pages du site" 
                    : "Le chatbot est masqué pour les visiteurs du site"}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                id="global-chatbot-toggle"
                checked={chatbotEnabled ?? false}
                onCheckedChange={(checked) => toggleGlobalChatbotMutation.mutate(checked)}
                disabled={isLoadingEnabled || toggleGlobalChatbotMutation.isPending}
              />
              <Label htmlFor="global-chatbot-toggle" className="sr-only">
                Activer/Désactiver le chatbot
              </Label>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold">Parcours de conversation</h2>
          <p className="text-muted-foreground mt-1">
            Créez et gérez les parcours de questions automatiques du chatbot
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nouveau parcours
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12">Chargement...</div>
      ) : (
        <div className="grid gap-4">
          {flows?.map((flow) => (
            <Card key={flow.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {flow.name}
                      {flow.is_active ? (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full">
                          Actif
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-full">
                          Inactif
                        </span>
                      )}
                    </CardTitle>
                    {flow.description && (
                      <CardDescription>{flow.description}</CardDescription>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        toggleActiveMutation.mutate({
                          id: flow.id,
                          is_active: !flow.is_active,
                        })
                      }
                    >
                      {flow.is_active ? (
                        <PowerOff className="w-4 h-4" />
                      ) : (
                        <Power className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditModal(flow)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openDeleteDialog(flow)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Créé le {new Date(flow.created_at).toLocaleDateString("fr-FR")}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Créer un nouveau parcours</DialogTitle>
            <DialogDescription>
              Définissez le nom, la description et la structure de l'arbre de décision
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom du parcours</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Qualification prospects isolation"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Description du parcours"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_active: checked })
                }
              />
              <Label htmlFor="is_active">Activer ce parcours</Label>
            </div>
            <div className="space-y-2">
              <Label>Éditeur visuel du parcours</Label>
              <ChatbotFlowEditor
                initialStructure={flowStructure}
                onSave={setFlowStructure}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateModalOpen(false);
                resetForm();
              }}
            >
              Annuler
            </Button>
            <Button onClick={handleCreate}>Créer le parcours</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier le parcours</DialogTitle>
            <DialogDescription>
              Modifiez le nom, la description ou la structure de l'arbre
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nom du parcours</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Input
                id="edit-description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_active: checked })
                }
              />
              <Label htmlFor="edit-is_active">Activer ce parcours</Label>
            </div>
            <div className="space-y-2">
              <Label>Éditeur visuel du parcours</Label>
              <ChatbotFlowEditor
                initialStructure={flowStructure}
                onSave={setFlowStructure}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditModalOpen(false);
                setSelectedFlow(null);
                resetForm();
              }}
            >
              Annuler
            </Button>
            <Button onClick={handleUpdate}>Enregistrer les modifications</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer le parcours "{selectedFlow?.name}" ?
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedFlow(null)}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedFlow && deleteFlowMutation.mutate(selectedFlow.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default AdminChatbot;
