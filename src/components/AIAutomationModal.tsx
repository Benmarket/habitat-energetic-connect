import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Bot, Trash2, Clock, Edit } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Automation {
  id: string;
  name: string;
  instructions: string;
  frequency_cron: string;
  is_active: boolean;
  last_run_at: string | null;
  next_run_at: string | null;
}

interface AIAutomationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const frequencyOptions = [
  { label: "Tous les lundis à 8h", value: "0 8 * * 1", description: "Chaque lundi matin" },
  { label: "Tous les jours à 8h", value: "0 8 * * *", description: "Quotidien" },
  { label: "Tous les mercredis à 14h", value: "0 14 * * 3", description: "Milieu de semaine" },
  { label: "Tous les vendredis à 18h", value: "0 18 * * 5", description: "Fin de semaine" },
  { label: "Toutes les heures", value: "0 * * * *", description: "Très fréquent" },
];

export function AIAutomationModal({ open, onOpenChange }: AIAutomationModalProps) {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingAutomation, setEditingAutomation] = useState<Automation | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    instructions: "",
    frequency_cron: "0 8 * * 1",
  });

  useEffect(() => {
    if (open) {
      fetchAutomations();
    }
  }, [open]);

  const fetchAutomations = async () => {
    try {
      const { data, error } = await supabase
        .from("article_automations")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAutomations(data || []);
    } catch (error) {
      console.error("Error fetching automations:", error);
      toast.error("Erreur lors du chargement des automatisations");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = async (id: string, currentState: boolean) => {
    try {
      const { error } = await supabase
        .from("article_automations")
        .update({ is_active: !currentState })
        .eq("id", id);

      if (error) throw error;

      setAutomations((prev) =>
        prev.map((auto) =>
          auto.id === id ? { ...auto, is_active: !currentState } : auto
        )
      );

      toast.success(
        !currentState ? "Automatisation activée" : "Automatisation désactivée"
      );
    } catch (error) {
      console.error("Error toggling automation:", error);
      toast.error("Erreur lors de la modification");
    }
  };

  const handleSaveAutomation = async () => {
    if (!formData.name || !formData.instructions) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      if (editingAutomation) {
        const { error } = await supabase
          .from("article_automations")
          .update({
            name: formData.name,
            instructions: formData.instructions,
            frequency_cron: formData.frequency_cron,
          })
          .eq("id", editingAutomation.id);

        if (error) throw error;
        toast.success("Automatisation modifiée");
      } else {
        const { error } = await supabase
          .from("article_automations")
          .insert({
            user_id: user.id,
            name: formData.name,
            instructions: formData.instructions,
            frequency_cron: formData.frequency_cron,
          });

        if (error) throw error;
        toast.success("Automatisation créée");
      }

      setFormData({ name: "", instructions: "", frequency_cron: "0 8 * * 1" });
      setIsEditing(false);
      setEditingAutomation(null);
      fetchAutomations();
    } catch (error) {
      console.error("Error saving automation:", error);
      toast.error("Erreur lors de la sauvegarde");
    }
  };

  const handleEdit = (automation: Automation) => {
    setEditingAutomation(automation);
    setFormData({
      name: automation.name,
      instructions: automation.instructions,
      frequency_cron: automation.frequency_cron,
    });
    setIsEditing(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette automatisation ?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("article_automations")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setAutomations((prev) => prev.filter((auto) => auto.id !== id));
      toast.success("Automatisation supprimée");
    } catch (error) {
      console.error("Error deleting automation:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[85vh] flex flex-col">
        <DialogHeader className="flex-shrink-0 pb-4">
          <DialogTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5" />
            Programmer la diffusion d'articles IA
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full pr-4">
            <div className="space-y-6 pb-4">
              {/* Add/Edit Form */}
              {isEditing && (
                <div className="p-4 border rounded-lg bg-muted/50 space-y-4">
                  <h3 className="font-semibold">
                    {editingAutomation ? "Modifier l'automatisation" : "Nouvelle automatisation"}
                  </h3>

                  <div className="space-y-2">
                    <Label>Nom de l'automatisation</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="Ex: Articles énergies renouvelables"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Fréquence</Label>
                    <Select
                      value={formData.frequency_cron}
                      onValueChange={(value) =>
                        setFormData({ ...formData, frequency_cron: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {frequencyOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <div>
                              <div className="font-medium">{option.label}</div>
                              <div className="text-xs text-muted-foreground">
                                {option.description}
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Consigne générale</Label>
                    <Textarea
                      value={formData.instructions}
                      onChange={(e) =>
                        setFormData({ ...formData, instructions: e.target.value })
                      }
                      placeholder="Ex: Publie un article sur les énergies renouvelables en te basant sur l'actualité et citant des sources dans l'article."
                      rows={6}
                      className="resize-none"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleSaveAutomation}>
                      {editingAutomation ? "Modifier" : "Créer"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false);
                        setEditingAutomation(null);
                        setFormData({
                          name: "",
                          instructions: "",
                          frequency_cron: "0 8 * * 1",
                        });
                      }}
                    >
                      Annuler
                    </Button>
                  </div>
                </div>
              )}

              {/* Add Button */}
              {!isEditing && (
                <Button
                  onClick={() => setIsEditing(true)}
                  variant="outline"
                  className="w-full gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Ajouter une automatisation
                </Button>
              )}

              {/* Automations List */}
              <div className="space-y-4">
                {isLoading ? (
                  <p className="text-center text-muted-foreground">Chargement...</p>
                ) : automations.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Aucune automatisation configurée
                  </p>
                ) : (
                  automations.map((automation) => (
                    <div
                      key={automation.id}
                      className="p-4 border rounded-lg space-y-3 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold">{automation.name}</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {automation.instructions}
                          </p>
                        </div>
                        <Switch
                          checked={automation.is_active}
                          onCheckedChange={() =>
                            handleToggleActive(automation.id, automation.is_active)
                          }
                        />
                      </div>

                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {frequencyOptions.find(
                            (f) => f.value === automation.frequency_cron
                          )?.label || automation.frequency_cron}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(automation)}
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Modifier
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(automation.id)}
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Supprimer
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
