import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Edit, Trash2, Download, ExternalLink, Eye, Loader2, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, Search, Filter } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";

type FormConfig = {
  id: string;
  name: string;
  form_identifier: string;
  description: string | null;
  webhook_url: string | null;
  webhook_enabled: boolean;
  fields_schema: any;
  created_at: string;
  updated_at: string;
};

type FormSubmission = {
  id: string;
  form_id: string;
  data: any;
  submitted_at: string;
  ip_address: string | null;
  user_agent: string | null;
  is_read: boolean;
  status: "new" | "in_progress" | "processed" | "converted";
};

export default function AdminForms() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedForm, setSelectedForm] = useState<FormConfig | null>(null);
  const [isSubmissionsOpen, setIsSubmissionsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    form_identifier: "",
    description: "",
    webhook_url: "",
    webhook_enabled: false,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const formsPerPage = 10;
  const [submissionsPage, setSubmissionsPage] = useState(1);
  const submissionsPerPage = 50;
  const [sortColumn, setSortColumn] = useState<string>("submitted_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubmissions, setSelectedSubmissions] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Fetch forms with pagination
  const { data: formsData, isLoading: loadingForms } = useQuery({
    queryKey: ["form-configurations", currentPage],
    queryFn: async () => {
      const from = (currentPage - 1) * formsPerPage;
      const to = from + formsPerPage - 1;

      const { data, error, count } = await supabase
        .from("form_configurations")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(from, to);
      
      if (error) throw error;
      return { forms: data as FormConfig[], totalCount: count || 0 };
    },
  });

  const forms = formsData?.forms || [];
  const totalPages = Math.ceil((formsData?.totalCount || 0) / formsPerPage);

  // Fetch unread submissions count for all forms
  const { data: unreadCounts } = useQuery({
    queryKey: ["unread-submissions-count"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("form_submissions")
        .select("form_id, is_read");
      
      if (error) throw error;
      
      // Count unread submissions per form
      const counts: Record<string, number> = {};
      data.forEach((submission: any) => {
        if (!submission.is_read) {
          counts[submission.form_id] = (counts[submission.form_id] || 0) + 1;
        }
      });
      
      return counts;
    },
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Fetch submissions for selected form
  const { data: submissions, isLoading: loadingSubmissions } = useQuery({
    queryKey: ["form-submissions", selectedForm?.id],
    queryFn: async () => {
      if (!selectedForm) return [];
      const { data, error } = await supabase
        .from("form_submissions")
        .select("*")
        .eq("form_id", selectedForm.id)
        .order("submitted_at", { ascending: false });
      if (error) throw error;
      return data as FormSubmission[];
    },
    enabled: !!selectedForm,
  });

  // Create form mutation
  const createFormMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from("form_configurations").insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["form-configurations"] });
      toast({ title: "Formulaire créé avec succès" });
      setIsCreateOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update form mutation
  const updateFormMutation = useMutation({
    mutationFn: async (data: typeof formData & { id: string }) => {
      const { id, ...updateData } = data;
      const { error } = await supabase
        .from("form_configurations")
        .update(updateData)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["form-configurations"] });
      toast({ title: "Formulaire mis à jour avec succès" });
      setIsEditOpen(false);
      setSelectedForm(null);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete form mutation
  const deleteFormMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("form_configurations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["form-configurations"] });
      toast({ title: "Formulaire supprimé avec succès" });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete submission mutation
  const deleteSubmissionMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("form_submissions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["form-submissions"] });
      toast({ title: "Soumission supprimée avec succès" });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update submission status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("form_submissions")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["form-submissions"] });
      toast({ title: "Statut mis à jour" });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      form_identifier: "",
      description: "",
      webhook_url: "",
      webhook_enabled: false,
    });
  };

  const handleEdit = (form: FormConfig) => {
    setSelectedForm(form);
    setFormData({
      name: form.name,
      form_identifier: form.form_identifier,
      description: form.description || "",
      webhook_url: form.webhook_url || "",
      webhook_enabled: form.webhook_enabled,
    });
    setIsEditOpen(true);
  };

  const handleViewSubmissions = async (form: FormConfig) => {
    setSelectedForm(form);
    setIsSubmissionsOpen(true);
    setSubmissionsPage(1); // Reset to first page
    setSortColumn("submitted_at"); // Reset sort
    setSortDirection("desc");
    setSearchTerm(""); // Reset search
    setSelectedSubmissions(new Set()); // Reset selection
    setStatusFilter("all"); // Reset status filter
    
    // Marquer toutes les soumissions de ce formulaire comme lues
    const { error } = await supabase
      .from("form_submissions")
      .update({ is_read: true })
      .eq("form_id", form.id)
      .eq("is_read", false);
    
    if (error) {
      console.error("Erreur lors du marquage des soumissions comme lues:", error);
    } else {
      // Rafraîchir les compteurs
      queryClient.invalidateQueries({ queryKey: ["unread-submissions-count"] });
    }
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const toggleSubmissionSelection = (submissionId: string) => {
    const newSelected = new Set(selectedSubmissions);
    if (newSelected.has(submissionId)) {
      newSelected.delete(submissionId);
    } else {
      newSelected.add(submissionId);
    }
    setSelectedSubmissions(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedSubmissions.size === paginatedSubmissions.length) {
      setSelectedSubmissions(new Set());
    } else {
      const allIds = new Set(paginatedSubmissions.map(sub => sub.id));
      setSelectedSubmissions(allIds);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedSubmissions.size === 0) return;
    
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer ${selectedSubmissions.size} soumission(s) ?`)) {
      return;
    }

    try {
      const deletePromises = Array.from(selectedSubmissions).map(id =>
        supabase.from("form_submissions").delete().eq("id", id)
      );
      
      await Promise.all(deletePromises);
      
      queryClient.invalidateQueries({ queryKey: ["form-submissions"] });
      setSelectedSubmissions(new Set());
      
      toast({
        title: "Succès",
        description: `${selectedSubmissions.size} soumission(s) supprimée(s)`,
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de la suppression",
        variant: "destructive",
      });
    }
  };

  const handleBulkExport = () => {
    if (selectedSubmissions.size === 0) return;

    const selectedData = sortedSubmissions.filter(sub => selectedSubmissions.has(sub.id));
    
    if (selectedData.length === 0) {
      toast({
        title: "Aucune donnée",
        description: "Aucune soumission sélectionnée à exporter",
        variant: "destructive",
      });
      return;
    }

    // Get all unique field names
    const allFields = new Set<string>();
    selectedData.forEach((sub) => {
      Object.keys(sub.data).forEach((key) => allFields.add(key));
    });

    // Create CSV header
    const headers = ["Date de soumission", "ID", ...Array.from(allFields)];
    const csvContent = [
      headers.join(","),
      ...selectedData.map((sub) => {
        const row = [
          new Date(sub.submitted_at).toLocaleString("fr-FR"),
          sub.id,
          ...Array.from(allFields).map((field) => {
            const value = sub.data[field] || "";
            return typeof value === "string" && (value.includes(",") || value.includes('"'))
              ? `"${value.replace(/"/g, '""')}"`
              : value;
          }),
        ];
        return row.join(",");
      }),
    ].join("\n");

    // Download CSV
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `${selectedForm?.form_identifier}_selection_${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({ 
      title: "Export réussi", 
      description: `${selectedData.length} soumission(s) exportée(s) en CSV` 
    });
  };

  // Get status badge variant and label
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "new":
        return { variant: "default" as const, label: "Nouveau", color: "bg-blue-500" };
      case "in_progress":
        return { variant: "secondary" as const, label: "En cours", color: "bg-orange-500" };
      case "processed":
        return { variant: "outline" as const, label: "Traité", color: "bg-green-500" };
      case "converted":
        return { variant: "outline" as const, label: "Converti", color: "bg-violet-500" };
      default:
        return { variant: "default" as const, label: status, color: "bg-gray-500" };
    }
  };

  // Filter submissions based on search term and status
  const filteredSubmissions = submissions ? submissions.filter((submission) => {
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const dataString = JSON.stringify(submission.data).toLowerCase();
      if (!dataString.includes(searchLower)) return false;
    }
    
    // Status filter
    if (statusFilter !== "all" && submission.status !== statusFilter) {
      return false;
    }
    
    return true;
  }) : [];

  const sortedSubmissions = filteredSubmissions.length > 0 ? [...filteredSubmissions].sort((a, b) => {
    let aValue = sortColumn === "submitted_at" ? a.submitted_at : a.data[sortColumn];
    let bValue = sortColumn === "submitted_at" ? b.submitted_at : b.data[sortColumn];
    
    if (sortColumn === "submitted_at") {
      aValue = new Date(aValue).getTime();
      bValue = new Date(bValue).getTime();
    }
    
    if (sortDirection === "asc") {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  }) : [];

  const paginatedSubmissions = sortedSubmissions.slice(
    (submissionsPage - 1) * submissionsPerPage,
    submissionsPage * submissionsPerPage
  );
  
  const totalSubmissionsPages = Math.ceil(sortedSubmissions.length / submissionsPerPage);

  // Get all field names from submissions
  const getFieldNames = (): string[] => {
    if (!submissions || submissions.length === 0) return [];
    const fields = new Set<string>();
    submissions.forEach((sub) => {
      Object.keys(sub.data).forEach((key) => fields.add(key));
    });
    return Array.from(fields);
  };

  const handleExportCSV = () => {
    if (!submissions || submissions.length === 0) {
      toast({
        title: "Aucune donnée",
        description: "Aucune soumission à exporter",
        variant: "destructive",
      });
      return;
    }

    // Get all unique field names
    const allFields = new Set<string>();
    submissions.forEach((sub) => {
      Object.keys(sub.data).forEach((key) => allFields.add(key));
    });

    // Create CSV header
    const headers = ["Date de soumission", "ID", ...Array.from(allFields)];
    const csvContent = [
      headers.join(","),
      ...submissions.map((sub) => {
        const row = [
          new Date(sub.submitted_at).toLocaleString("fr-FR"),
          sub.id,
          ...Array.from(allFields).map((field) => {
            const value = sub.data[field] || "";
            // Escape commas and quotes in values
            return typeof value === "string" && (value.includes(",") || value.includes('"'))
              ? `"${value.replace(/"/g, '""')}"`
              : value;
          }),
        ];
        return row.join(",");
      }),
    ].join("\n");

    // Download CSV
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `${selectedForm?.form_identifier}_${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({ title: "Export réussi", description: "Les données ont été exportées en CSV" });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-4">
          <Button variant="outline" size="sm" onClick={() => navigate("/administration")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour à l'administration
          </Button>
        </div>
        
        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold">Gestion des Formulaires</h1>
            <p className="text-muted-foreground">
              Configurez vos formulaires, exportez les données et connectez-les à vos outils
            </p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nouveau formulaire
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Créer un nouveau formulaire</DialogTitle>
                <DialogDescription>
                  Configurez un nouveau formulaire pour collecter des données
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Nom du formulaire</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Contact, Inscription, Demande de devis..."
                  />
                </div>
                <div>
                  <Label htmlFor="identifier">Identifiant unique</Label>
                  <Input
                    id="identifier"
                    value={formData.form_identifier}
                    onChange={(e) =>
                      setFormData({ ...formData, form_identifier: e.target.value })
                    }
                    placeholder="contact-form, signup-form..."
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Utilisez cet identifiant dans votre code pour connecter le formulaire
                  </p>
                </div>
                <div>
                  <Label htmlFor="description">Description (optionnel)</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Décrivez l'usage de ce formulaire..."
                  />
                </div>
                <div>
                  <Label htmlFor="webhook">URL Webhook (optionnel)</Label>
                  <Input
                    id="webhook"
                    value={formData.webhook_url}
                    onChange={(e) => setFormData({ ...formData, webhook_url: e.target.value })}
                    placeholder="https://hooks.zapier.com/..."
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Zapier, Make, Google Sheets, CRM... Recevez les données en temps réel
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="webhook-enabled"
                    checked={formData.webhook_enabled}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, webhook_enabled: checked })
                    }
                  />
                  <Label htmlFor="webhook-enabled">Activer le webhook</Label>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Annuler
                  </Button>
                  <Button
                    onClick={() => createFormMutation.mutate(formData)}
                    disabled={
                      !formData.name || !formData.form_identifier || createFormMutation.isPending
                    }
                  >
                    {createFormMutation.isPending && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    Créer
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {loadingForms ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : forms && forms.length > 0 ? (
          <div className="grid gap-4">
            {forms.map((form) => (
              <Card key={form.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {form.name}
                        {form.webhook_enabled && (
                          <Badge variant="secondary" className="ml-2">
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Webhook actif
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription>
                        Identifiant: <code className="text-xs">{form.form_identifier}</code>
                      </CardDescription>
                      {form.description && (
                        <p className="text-sm text-muted-foreground mt-2">{form.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleViewSubmissions(form)}
                        className="relative"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Soumissions
                        {unreadCounts && unreadCounts[form.id] > 0 && (
                          <Badge 
                            variant="destructive" 
                            className="ml-2 h-5 min-w-5 rounded-full px-1.5 text-xs font-bold"
                          >
                            {unreadCounts[form.id]}
                          </Badge>
                        )}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleEdit(form)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (
                            window.confirm(
                              "Êtes-vous sûr de vouloir supprimer ce formulaire et toutes ses soumissions ?"
                            )
                          ) {
                            deleteFormMutation.mutate(form.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
            
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 px-2">
                <div className="text-sm text-muted-foreground">
                  Page {currentPage} sur {totalPages} ({formsData?.totalCount} formulaire{(formsData?.totalCount || 0) > 1 ? 's' : ''})
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Précédent
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Suivant
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">Aucun formulaire configuré</p>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Créer votre premier formulaire
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Edit Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Modifier le formulaire</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Nom du formulaire</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-identifier">Identifiant unique</Label>
                <Input
                  id="edit-identifier"
                  value={formData.form_identifier}
                  onChange={(e) => setFormData({ ...formData, form_identifier: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-webhook">URL Webhook</Label>
                <Input
                  id="edit-webhook"
                  value={formData.webhook_url}
                  onChange={(e) => setFormData({ ...formData, webhook_url: e.target.value })}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-webhook-enabled"
                  checked={formData.webhook_enabled}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, webhook_enabled: checked })
                  }
                />
                <Label htmlFor="edit-webhook-enabled">Activer le webhook</Label>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                  Annuler
                </Button>
                <Button
                  onClick={() =>
                    selectedForm &&
                    updateFormMutation.mutate({ ...formData, id: selectedForm.id })
                  }
                  disabled={updateFormMutation.isPending}
                >
                  {updateFormMutation.isPending && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Enregistrer
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Submissions Dialog */}
        <Dialog open={isSubmissionsOpen} onOpenChange={setIsSubmissionsOpen}>
          <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <div className="flex items-center justify-between">
                <DialogTitle>Soumissions - {selectedForm?.name}</DialogTitle>
                <div className="flex gap-2">
                  {selectedSubmissions.size > 0 && (
                    <>
                      <Button variant="outline" size="sm" onClick={handleBulkExport}>
                        <Download className="h-4 w-4 mr-2" />
                        Exporter ({selectedSubmissions.size})
                      </Button>
                      <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Supprimer ({selectedSubmissions.size})
                      </Button>
                    </>
                  )}
                  <Button variant="outline" size="sm" onClick={handleExportCSV}>
                    <Download className="h-4 w-4 mr-2" />
                    Exporter tout
                  </Button>
                </div>
              </div>
              <DialogDescription className="text-left">
                {sortedSubmissions.length} soumission(s) {searchTerm && `trouvée(s) sur ${submissions?.length || 0}`}
                {selectedSubmissions.size > 0 && ` • ${selectedSubmissions.size} sélectionnée(s)`}
              </DialogDescription>
              
              {/* Search and filters */}
              <div className="flex gap-2 mt-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher par email, nom, téléphone..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setSubmissionsPage(1);
                    }}
                    className="pl-9"
                  />
                </div>
                <Select value={statusFilter} onValueChange={(value) => {
                  setStatusFilter(value);
                  setSubmissionsPage(1);
                }}>
                  <SelectTrigger className="w-[180px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Tous les statuts" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="new">Nouveau</SelectItem>
                    <SelectItem value="in_progress">En cours</SelectItem>
                    <SelectItem value="processed">Traité</SelectItem>
                    <SelectItem value="converted">Converti</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </DialogHeader>
            
            {loadingSubmissions ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : sortedSubmissions.length > 0 ? (
              <div className="flex-1 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">
                        <input
                          type="checkbox"
                          checked={selectedSubmissions.size === paginatedSubmissions.length && paginatedSubmissions.length > 0}
                          onChange={toggleSelectAll}
                          className="cursor-pointer h-4 w-4"
                        />
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50 whitespace-nowrap"
                        onClick={() => handleSort("submitted_at")}
                      >
                        <div className="flex items-center gap-1">
                          Date
                          {sortColumn === "submitted_at" ? (
                            sortDirection === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                          ) : (
                            <ArrowUpDown className="h-3 w-3 opacity-30" />
                          )}
                        </div>
                      </TableHead>
                      {getFieldNames().map((field) => (
                        <TableHead 
                          key={field}
                          className="cursor-pointer hover:bg-muted/50 whitespace-nowrap"
                          onClick={() => handleSort(field)}
                        >
                          <div className="flex items-center gap-1">
                            {field}
                            {sortColumn === field ? (
                              sortDirection === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                            ) : (
                              <ArrowUpDown className="h-3 w-3 opacity-30" />
                            )}
                          </div>
                        </TableHead>
                      ))}
                      <TableHead className="w-[150px]">Statut</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedSubmissions.map((submission) => (
                      <TableRow key={submission.id} className="hover:bg-muted/30">
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedSubmissions.has(submission.id)}
                            onChange={() => toggleSubmissionSelection(submission.id)}
                            className="cursor-pointer h-4 w-4"
                          />
                        </TableCell>
                        <TableCell className="font-mono text-xs whitespace-nowrap">
                          {new Date(submission.submitted_at).toLocaleString("fr-FR")}
                        </TableCell>
                        {getFieldNames().map((field) => (
                          <TableCell key={field} className="max-w-[200px] truncate">
                            {typeof submission.data[field] === "object" 
                              ? JSON.stringify(submission.data[field]) 
                              : String(submission.data[field] || "-")}
                          </TableCell>
                        ))}
                        <TableCell>
                          <Select 
                            value={submission.status} 
                            onValueChange={(value) => 
                              updateStatusMutation.mutate({ id: submission.id, status: value })
                            }
                          >
                            <SelectTrigger className="w-[140px] h-8">
                              <SelectValue>
                                <Badge className={getStatusBadge(submission.status).color}>
                                  {getStatusBadge(submission.status).label}
                                </Badge>
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="new">
                                <Badge className="bg-blue-500">Nouveau</Badge>
                              </SelectItem>
                              <SelectItem value="in_progress">
                                <Badge className="bg-orange-500">En cours</Badge>
                              </SelectItem>
                              <SelectItem value="processed">
                                <Badge className="bg-green-500">Traité</Badge>
                              </SelectItem>
                              <SelectItem value="converted">
                                <Badge className="bg-violet-500">Converti</Badge>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (
                                window.confirm(
                                  "Êtes-vous sûr de vouloir supprimer cette soumission ?"
                                )
                              ) {
                                deleteSubmissionMutation.mutate(submission.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {totalSubmissionsPages > 1 && (
                  <div className="flex items-center justify-between px-2 py-4 border-t">
                    <div className="text-sm text-muted-foreground">
                      Page {submissionsPage} sur {totalSubmissionsPages}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSubmissionsPage((p) => Math.max(1, p - 1))}
                        disabled={submissionsPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Précédent
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSubmissionsPage((p) => Math.min(totalSubmissionsPages, p + 1))}
                        disabled={submissionsPage === totalSubmissionsPages}
                      >
                        Suivant
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm ? "Aucun résultat pour cette recherche" : "Aucune soumission pour ce formulaire"}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
      <Footer />
    </div>
  );
}
