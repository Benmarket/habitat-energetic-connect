import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import Header from "@/components/Header";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Pencil, X, Check, ArrowLeft, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface UserProfile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  created_at: string;
  role?: string;
}

const AdminUsers = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    first_name: "",
    last_name: "",
    role: "user",
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/connexion");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchUsers();
    }
  }, [user]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Récupérer les profils
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // Récupérer les rôles
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      // Combiner les données
      const usersWithRoles = profiles?.map((profile) => {
        const userRole = roles?.find((r) => r.user_id === profile.id);
        return {
          ...profile,
          role: userRole?.role || "user",
        };
      });

      setUsers(usersWithRoles || []);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les utilisateurs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (user: UserProfile) => {
    setEditingId(user.id);
    setEditForm({
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      role: user.role || "user",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({
      first_name: "",
      last_name: "",
      role: "user",
    });
  };

  const saveUser = async (userId: string) => {
    try {
      // Mettre à jour le profil
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          first_name: editForm.first_name,
          last_name: editForm.last_name,
        })
        .eq("id", userId);

      if (profileError) throw profileError;

      // Mettre à jour le rôle
      const { error: roleError } = await supabase
        .from("user_roles")
        .update({ role: editForm.role as "admin" | "moderator" | "super_admin" | "user" })
        .eq("user_id", userId);

      if (roleError) throw roleError;

      toast({
        title: "Succès",
        description: "Utilisateur mis à jour",
      });

      setEditingId(null);
      fetchUsers();
    } catch (error: any) {
      console.error("Error updating user:", error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de mettre à jour l'utilisateur",
        variant: "destructive",
      });
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "super_admin":
        return "default";
      case "admin":
        return "secondary";
      case "moderator":
        return "outline";
      default:
        return "outline";
    }
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      super_admin: "Super Admin",
      admin: "Admin",
      moderator: "Modérateur",
      user: "Utilisateur",
    };
    return labels[role] || role;
  };

  return (
    <>
      <Helmet>
        <title>Gérer les utilisateurs | Administration</title>
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="pt-20">
          <div className="container mx-auto px-4 py-8">
            <Link 
              to="/administration"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour à l'administration
            </Link>

            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Gérer les utilisateurs</h1>
                <p className="text-muted-foreground">
                  Modifiez les profils et les rôles des utilisateurs
                </p>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Liste des utilisateurs ({users.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : users.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Aucun utilisateur pour le moment
                  </p>
                ) : (
                  <div className="space-y-4">
                    {users.map((userProfile) => (
                      <div
                        key={userProfile.id}
                        className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        {editingId === userProfile.id ? (
                          // Mode édition
                          <div className="space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="first_name">Prénom</Label>
                                <Input
                                  id="first_name"
                                  value={editForm.first_name}
                                  onChange={(e) =>
                                    setEditForm({ ...editForm, first_name: e.target.value })
                                  }
                                  placeholder="Prénom"
                                />
                              </div>
                              <div>
                                <Label htmlFor="last_name">Nom</Label>
                                <Input
                                  id="last_name"
                                  value={editForm.last_name}
                                  onChange={(e) =>
                                    setEditForm({ ...editForm, last_name: e.target.value })
                                  }
                                  placeholder="Nom"
                                />
                              </div>
                            </div>
                            <div>
                              <Label htmlFor="role">Rôle</Label>
                              <Select
                                value={editForm.role}
                                onValueChange={(value) =>
                                  setEditForm({ ...editForm, role: value })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="user">Utilisateur</SelectItem>
                                  <SelectItem value="moderator">Modérateur</SelectItem>
                                  <SelectItem value="admin">Admin</SelectItem>
                                  <SelectItem value="super_admin">Super Admin</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => saveUser(userProfile.id)}
                              >
                                <Check className="w-4 h-4 mr-2" />
                                Enregistrer
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={cancelEdit}
                              >
                                <X className="w-4 h-4 mr-2" />
                                Annuler
                              </Button>
                            </div>
                          </div>
                        ) : (
                          // Mode affichage
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="font-semibold text-lg">
                                  {userProfile.first_name && userProfile.last_name
                                    ? `${userProfile.first_name} ${userProfile.last_name}`
                                    : userProfile.email}
                                </h3>
                                <Badge variant={getRoleBadgeVariant(userProfile.role || "user")}>
                                  {getRoleLabel(userProfile.role || "user")}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {userProfile.email}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Inscrit le{" "}
                                {new Date(userProfile.created_at).toLocaleDateString("fr-FR")}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => startEdit(userProfile)}
                            >
                              <Pencil className="w-4 h-4 mr-2" />
                              Modifier
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </>
  );
};

export default AdminUsers;
