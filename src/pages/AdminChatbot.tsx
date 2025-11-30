import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Power, PowerOff } from "lucide-react";
import { ChatbotFlowEditor } from "@/components/ChatbotFlowEditor";
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
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Gestion du Chatbot</h1>
          <p className="text-muted-foreground mt-2">
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
  );
};

export default AdminChatbot;
