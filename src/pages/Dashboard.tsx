import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Newspaper, BookOpen, HandCoins, Plus, Megaphone, ShieldCheck, Sparkles } from "lucide-react";

const Dashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);
  const [hasPermissions, setHasPermissions] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/connexion");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchRole();
      fetchPermissions();
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

  const fetchPermissions = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("user_permissions")
      .select("permission_id")
      .eq("user_id", user.id);
    
    setHasPermissions(data && data.length > 0);
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
  const shouldShowRoleCard = isSuperAdmin || isAdmin || isModerator || hasPermissions;

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
                  <p className="mb-3"><strong>Email:</strong> {user.email}</p>
                  {profile && (
                    <>
                      <div className="mb-3">
                        <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium mb-2"
                             style={{
                               backgroundColor: profile.account_type === 'professionnel' ? 'hsl(var(--primary) / 0.1)' : 'hsl(var(--secondary) / 0.1)',
                               color: profile.account_type === 'professionnel' ? 'hsl(var(--primary))' : 'hsl(var(--secondary-foreground))'
                             }}>
                          {profile.account_type === 'professionnel' ? 'Professionnel' : 'Particulier'}
                        </div>
                      </div>
                      
                      {profile.account_type === 'professionnel' ? (
                        <>
                          <p className="mb-2">
                            <strong>Société:</strong> {profile.company_name || 'Non renseignée'}
                          </p>
                          <p>
                            <strong>Nom du contact:</strong> {[profile.first_name, profile.last_name].filter(Boolean).join(' ') || 'Non renseigné'}
                          </p>
                        </>
                      ) : (
                        <p>
                          <strong>Nom complet:</strong> {[profile.first_name, profile.last_name].filter(Boolean).join(' ') || 'Non renseigné'}
                        </p>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>

              {shouldShowRoleCard && (
                <Card>
                  <CardHeader>
                    <CardTitle>Rôle</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {role ? (
                      <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary font-medium capitalize">
                        {role.replace("_", " ")}
                      </div>
                    ) : hasPermissions ? (
                      <div className="inline-flex items-center px-3 py-1 rounded-full bg-secondary/10 text-secondary-foreground font-medium">
                        Contributeur
                      </div>
                    ) : (
                      <p className="text-muted-foreground">Aucun rôle assigné</p>
                    )}
                  </CardContent>
                </Card>
              )}

              {(isSuperAdmin || isAdmin || isModerator) && (
                <Card className="relative overflow-hidden border-purple-500/50 bg-gradient-to-br from-purple-500/10 via-purple-600/5 to-background shadow-lg hover:shadow-purple-500/20 transition-all duration-300 hover:scale-[1.02]">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl" />
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-600/10 rounded-full blur-2xl" />
                  
                  <CardHeader className="relative">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg shadow-purple-500/30">
                        <ShieldCheck className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-purple-600 dark:text-purple-400">Administration</CardTitle>
                        <Sparkles className="w-4 h-4 text-purple-500 animate-pulse" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="relative">
                    <p className="text-sm text-muted-foreground mb-4">
                      Accédez à l'espace d'administration et gérez votre plateforme
                    </p>
                    <Link to="/administration">
                      <Button className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-300">
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
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
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

                  <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Megaphone className="w-6 h-6 text-primary" />
                        </div>
                        <CardTitle>Annonceurs</CardTitle>
                      </div>
                      <CardDescription>
                        Gérer les annonces et communications publicitaires
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Link to="/gerer-annonces">
                        <Button className="w-full gap-2">
                          Voir toutes les annonces
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
