import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Newspaper, BookOpen, HandCoins, Plus } from "lucide-react";

const Dashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/connexion");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchRole();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    
    if (data) setProfile(data);
  };

  const fetchRole = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();
    
    if (data) setRole(data.role);
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const isSuperAdmin = role === "super_admin";
  const isAdmin = role === "admin";
  const isModerator = role === "moderator";

  return (
    <>
      <Helmet>
        <title>Tableau de bord | Prime Énergies</title>
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="pt-20">
          <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8">Tableau de bord</h1>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardHeader>
                  <CardTitle>Profil</CardTitle>
                </CardHeader>
                <CardContent>
                  <p><strong>Email:</strong> {user.email}</p>
                  {profile && (
                    <>
                      <p><strong>Prénom:</strong> {profile.first_name}</p>
                      <p><strong>Nom:</strong> {profile.last_name}</p>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Rôle</CardTitle>
                </CardHeader>
                <CardContent>
                  {role ? (
                    <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary font-medium capitalize">
                      {role.replace("_", " ")}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Aucun rôle assigné</p>
                  )}
                </CardContent>
              </Card>

              {(isSuperAdmin || isAdmin || isModerator) && (
                <Card>
                  <CardHeader>
                    <CardTitle>Administration</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Accédez à l'espace d'administration
                    </p>
                    <Link to="/administration">
                      <Button className="w-full">
                        Accéder à l'administration
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Content Creation Cards */}
            {(isSuperAdmin || isAdmin || isModerator) && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Créer du contenu</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Newspaper className="w-6 h-6 text-primary" />
                        </div>
                        <CardTitle>Actualité</CardTitle>
                      </div>
                      <CardDescription>
                        Publier une nouvelle actualité sur les énergies renouvelables
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Link to="/gerer-actualites">
                        <Button className="w-full gap-2">
                          <Plus className="w-4 h-4" />
                          Voir tous les articles
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <BookOpen className="w-6 h-6 text-primary" />
                        </div>
                        <CardTitle>Guide</CardTitle>
                      </div>
                      <CardDescription>
                        Rédiger un guide pratique pour aider les utilisateurs
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Link to="/gerer-guides">
                        <Button className="w-full gap-2">
                          Voir tous les guides
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <HandCoins className="w-6 h-6 text-primary" />
                        </div>
                        <CardTitle>Aide & Subvention</CardTitle>
                      </div>
                      <CardDescription>
                        Informer sur les aides et subventions disponibles
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Link to="/gerer-aides">
                        <Button className="w-full gap-2">
                          Voir toutes les aides & subventions
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Dashboard;
