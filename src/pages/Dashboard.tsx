import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Newspaper, BookOpen, HandCoins, Plus, Megaphone, ShieldCheck, Sparkles, FileText, Mail, User, Building2, BadgeCheck } from "lucide-react";

const Dashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);
  const [hasPermissions, setHasPermissions] = useState(false);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [newsletterCount, setNewsletterCount] = useState(0);

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
      fetchNewsletterCount();
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
      .select(`
        permission_id,
        permissions (
          code,
          name,
          description
        )
      `)
      .eq("user_id", user.id);
    
    if (data && data.length > 0) {
      setHasPermissions(true);
      setPermissions(data.map(p => p.permissions).filter(Boolean));
    }
  };

  const fetchNewsletterCount = async () => {
    const { count } = await supabase
      .from("newsletter_subscribers")
      .select("*", { count: "exact", head: true })
      .eq("status", "active");
    
    setNewsletterCount(count || 0);
  };

  const getPermissionIcon = (code: string) => {
    if (code.includes('actualite')) return Newspaper;
    if (code.includes('guide')) return BookOpen;
    if (code.includes('aide')) return HandCoins;
    if (code.includes('annonce')) return Megaphone;
    return FileText;
  };

  const getPermissionLabel = (code: string) => {
    if (code === 'poster_actualite') return 'Actualités';
    if (code === 'poster_guide') return 'Guides';
    if (code === 'poster_aide') return 'Aides';
    if (code === 'poster_annonce') return 'Annonces';
    return code;
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
  const hasActualitePermission = permissions.some(p => p.code === 'poster_actualite');
  const canAccessNewsletter = isSuperAdmin || isAdmin || isModerator || hasActualitePermission;
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
            <div className="mb-8 animate-fade-in">
              <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-primary via-purple-600 to-blue-600 bg-clip-text text-transparent">
                Tableau de bord
              </h1>
              <p className="text-lg text-muted-foreground">
                Bienvenue sur votre espace personnel
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {/* Profile Card */}
              <Card className="group hover:shadow-2xl hover:shadow-slate-500/10 transition-all duration-300 border-l-4 border-l-slate-600 hover:scale-[1.02] hover:-translate-y-1 animate-fade-in">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-3 bg-gradient-to-br from-slate-600/10 to-slate-700/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
                      {profile?.account_type === 'professionnel' ? (
                        <Building2 className="w-6 h-6 text-slate-700" />
                      ) : (
                        <User className="w-6 h-6 text-slate-700" />
                      )}
                    </div>
                  </div>
                  <CardTitle className="group-hover:text-slate-700 transition-colors">Profil</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <p className="text-sm">{user.email}</p>
                  </div>
                  
                  {profile && (
                    <>
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-gradient-to-r from-primary/10 to-primary/5 text-primary border border-primary/20">
                        <BadgeCheck className="w-3.5 h-3.5" />
                        {profile.account_type === 'professionnel' ? 'Professionnel' : 'Particulier'}
                      </div>
                      
                      <div className="pt-2 space-y-2">
                        {profile.account_type === 'professionnel' ? (
                          <>
                            {profile.company_name && (
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Société</p>
                                <p className="font-medium">{profile.company_name}</p>
                              </div>
                            )}
                            {(profile.first_name || profile.last_name) && (
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Nom du contact</p>
                                <p className="font-medium">
                                  {[profile.first_name, profile.last_name].filter(Boolean).join(' ')}
                                </p>
                              </div>
                            )}
                          </>
                        ) : (
                          <>
                            {(profile.first_name || profile.last_name) && (
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Nom complet</p>
                                <p className="font-medium">
                                  {[profile.first_name, profile.last_name].filter(Boolean).join(' ')}
                                </p>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Role & Permissions Card */}
              {shouldShowRoleCard && (
                <Card className="group hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 border-l-4 border-l-indigo-600 hover:scale-[1.02] hover:-translate-y-1 animate-fade-in" style={{ animationDelay: '0.1s' }}>
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-3 bg-gradient-to-br from-indigo-600/10 to-indigo-700/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
                        <ShieldCheck className="w-6 h-6 text-indigo-600" />
                      </div>
                    </div>
                    <CardTitle className="group-hover:text-indigo-600 transition-colors">Rôle & Permissions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {role && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Rôle</p>
                        <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-gradient-to-r from-indigo-600/10 to-indigo-500/10 text-indigo-700 font-medium capitalize text-sm border border-indigo-500/20">
                          {role.replace("_", " ")}
                        </div>
                      </div>
                    )}
                    
                    {permissions.length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Permissions</p>
                        <div className="flex flex-wrap gap-2">
                          {permissions.map((permission) => {
                            const Icon = getPermissionIcon(permission.code);
                            return (
                              <div
                                key={permission.code}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary/50 text-secondary-foreground text-sm font-medium border border-secondary/20 hover:bg-secondary/70 hover:scale-105 transition-all"
                                title={permission.description || permission.name}
                              >
                                <Icon className="w-3.5 h-3.5" />
                                <span>{getPermissionLabel(permission.code)}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Administration Card */}
              {(isSuperAdmin || isAdmin || isModerator) && (
                <Card className="group relative overflow-hidden border-l-4 border-l-purple-600 hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl" />
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-600/10 rounded-full blur-2xl" />
                  
                  <CardHeader className="relative">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg shadow-purple-500/30 group-hover:scale-110 transition-transform duration-300">
                        <ShieldCheck className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-500 animate-pulse" />
                      </div>
                    </div>
                    <CardTitle className="text-purple-600 dark:text-purple-400 group-hover:text-purple-700 transition-colors">Administration</CardTitle>
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
              <div className="space-y-6 animate-fade-in" style={{ animationDelay: '0.3s' }}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-1 w-12 bg-gradient-to-r from-primary to-purple-600 rounded-full"></div>
                  <h2 className="text-2xl font-bold">Créer du contenu</h2>
                </div>
                
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Actualité Card - Vert */}
                  <Card className="group hover:shadow-2xl hover:shadow-green-500/10 transition-all duration-300 border-l-4 border-l-green-500 hover:scale-[1.02] hover:-translate-y-1">
                    <CardHeader>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-3 bg-gradient-to-br from-green-500/10 to-green-600/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
                          <Newspaper className="w-6 h-6 text-green-600" />
                        </div>
                      </div>
                      <CardTitle className="group-hover:text-green-600 transition-colors">Actualité</CardTitle>
                      <CardDescription>
                        Publier une nouvelle actualité sur les énergies renouvelables
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Link to="/gerer-actualites">
                        <Button className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg shadow-green-500/30">
                          Voir les articles
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>

                  {/* Guide Card - Orange */}
                  <Card className="group hover:shadow-2xl hover:shadow-orange-500/10 transition-all duration-300 border-l-4 border-l-orange-500 hover:scale-[1.02] hover:-translate-y-1">
                    <CardHeader>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-3 bg-gradient-to-br from-orange-500/10 to-orange-600/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
                          <BookOpen className="w-6 h-6 text-orange-600" />
                        </div>
                      </div>
                      <CardTitle className="group-hover:text-orange-600 transition-colors">Guide</CardTitle>
                      <CardDescription>
                        Rédiger un guide pratique pour aider les utilisateurs
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Link to="/gerer-guides">
                        <Button className="w-full bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 shadow-lg shadow-orange-500/30">
                          Voir les guides
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>

                  {/* Aide Card - Bleu */}
                  <Card className="group hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 border-l-4 border-l-blue-500 hover:scale-[1.02] hover:-translate-y-1">
                    <CardHeader>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-3 bg-gradient-to-br from-blue-500/10 to-blue-600/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
                          <HandCoins className="w-6 h-6 text-blue-600" />
                        </div>
                      </div>
                      <CardTitle className="group-hover:text-blue-600 transition-colors">Aide & Subvention</CardTitle>
                      <CardDescription>
                        Informer sur les aides et subventions disponibles
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Link to="/gerer-aides">
                        <Button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-500/30">
                          Voir les aides
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>

                  {/* Annonces Card - Jaune Amber */}
                  <Card className="group hover:shadow-2xl hover:shadow-amber-500/10 transition-all duration-300 border-l-4 border-l-amber-500 hover:scale-[1.02] hover:-translate-y-1">
                    <CardHeader>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-3 bg-gradient-to-br from-amber-500/10 to-amber-600/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
                          <Megaphone className="w-6 h-6 text-amber-600" />
                        </div>
                      </div>
                      <CardTitle className="group-hover:text-amber-600 transition-colors">Annonceurs</CardTitle>
                      <CardDescription>
                        Gérer les annonces et communications publicitaires
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Link to="/gerer-annonces">
                        <Button className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-lg shadow-amber-500/30">
                          Voir les annonces
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Newsletter Card */}
            {canAccessNewsletter && (
              <div className="space-y-6 mt-8 animate-fade-in" style={{ animationDelay: '0.4s' }}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-1 w-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full"></div>
                  <h2 className="text-2xl font-bold">Communication</h2>
                </div>
                
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <Card className="group hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-300 border-l-4 border-l-purple-500 hover:scale-[1.02] hover:-translate-y-1">
                    <CardHeader>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-3 bg-gradient-to-br from-purple-500/10 to-purple-600/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
                          <Mail className="w-6 h-6 text-purple-600" />
                        </div>
                      </div>
                      <CardTitle className="group-hover:text-purple-600 transition-colors">Newsletter</CardTitle>
                      <CardDescription>
                        Gérer les abonnés à la newsletter
                        <span className="block mt-1 font-semibold text-purple-600">
                          {newsletterCount} abonnés actifs
                        </span>
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Link to="/admin/newsletter">
                        <Button className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-lg shadow-purple-500/30">
                          Voir les abonnés
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
