import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Newspaper, BookOpen, HandCoins, Plus, Megaphone, ShieldCheck, Sparkles, FileText, Mail, User, Building2, BadgeCheck, MessageSquare, Calculator, Lock, ArrowRight } from "lucide-react";
import { usePageMaintenance } from "@/hooks/usePageMaintenance";
import { PageMaintenance } from "@/components/PageMaintenance";

const Dashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);
  const [hasPermissions, setHasPermissions] = useState(false);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [newsletterCount, setNewsletterCount] = useState(0);
  const { isUnderMaintenance, isLoading: maintenanceLoading } = usePageMaintenance('dashboard');
  
  // New states for user sections
  const [aides, setAides] = useState<any[]>([]);
  const [articles, setArticles] = useState<any[]>([]);
  const [isForumEnabled, setIsForumEnabled] = useState(true);
  const [forumStats, setForumStats] = useState({ topicsCount: 0, postsCount: 0, recentTopics: [] as any[] });

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
      fetchAides();
      fetchArticles();
      fetchForumActivity();
      fetchForumEnabledSetting();
    }
  }, [user]);

  const fetchForumEnabledSetting = async () => {
    const { data } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "header_footer")
      .maybeSingle();
    
    if (data?.value) {
      const value = data.value as any;
      setIsForumEnabled(value.memberMenuShowForum ?? true);
    }
  };

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

  const fetchAides = async () => {
    const { data } = await supabase
      .from("posts")
      .select("id, title, slug, excerpt")
      .eq("content_type", "aide")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(3);
    
    if (data) setAides(data);
  };

  const fetchArticles = async () => {
    const { data } = await supabase
      .from("posts")
      .select("id, title, slug, excerpt, featured_image")
      .eq("content_type", "actualite")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(3);
    
    if (data) setArticles(data);
  };

  const fetchForumActivity = async () => {
    if (!user) return;
    
    // Fetch topics count
    const { count: topicsCount } = await supabase
      .from("forum_topics")
      .select("*", { count: "exact", head: true })
      .eq("author_id", user.id);
    
    // Fetch posts count
    const { count: postsCount } = await supabase
      .from("forum_posts")
      .select("*", { count: "exact", head: true })
      .eq("author_id", user.id);
    
    // Fetch recent topics where user participated
    const { data: userTopics } = await supabase
      .from("forum_topics")
      .select("id, title, slug, created_at")
      .eq("author_id", user.id)
      .order("created_at", { ascending: false })
      .limit(3);
    
    const { data: userPostTopics } = await supabase
      .from("forum_posts")
      .select("topic_id, forum_topics(id, title, slug, created_at)")
      .eq("author_id", user.id)
      .order("created_at", { ascending: false })
      .limit(3);
    
    // Merge and deduplicate topics
    const allTopics = [...(userTopics || [])];
    userPostTopics?.forEach(post => {
      const topic = post.forum_topics as any;
      if (topic && !allTopics.find(t => t.id === topic.id)) {
        allTopics.push(topic);
      }
    });
    
    // Sort by date and take first 3
    const recentTopics = allTopics
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 3);
    
    setForumStats({
      topicsCount: topicsCount || 0,
      postsCount: postsCount || 0,
      recentTopics
    });
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

  if (loading || maintenanceLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show maintenance page if this page is disabled
  if (isUnderMaintenance) {
    return <PageMaintenance pageName="Tableau de bord" description="Le tableau de bord est actuellement en maintenance. Nous travaillons pour vous offrir une meilleure expérience. Veuillez réessayer ultérieurement." />;
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

            {/* ===== USER SECTIONS (visible to all users) ===== */}
            
            {/* Aides & Subventions Section */}
            <div className="space-y-6 mt-8 animate-fade-in" style={{ animationDelay: '0.5s' }}>
              <div className="flex items-center gap-3 mb-6">
                <div className="h-1 w-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"></div>
                <h2 className="text-2xl font-bold">Aides & Subventions disponibles</h2>
              </div>
              
              {aides.length > 0 ? (
                <div className="grid md:grid-cols-3 gap-6">
                  {aides.map((aide) => (
                    <Card key={aide.id} className="group hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 border-l-4 border-l-blue-500 hover:scale-[1.02] hover:-translate-y-1">
                      <CardHeader>
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-3 bg-gradient-to-br from-blue-500/10 to-blue-600/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
                            <HandCoins className="w-6 h-6 text-blue-600" />
                          </div>
                        </div>
                        <CardTitle className="text-lg group-hover:text-blue-600 transition-colors line-clamp-2">
                          {aide.title}
                        </CardTitle>
                        {aide.excerpt && (
                          <CardDescription className="line-clamp-2">
                            {aide.excerpt}
                          </CardDescription>
                        )}
                      </CardHeader>
                      <CardContent>
                        <Link to={`/aides/${aide.slug}`}>
                          <Button variant="outline" className="w-full border-blue-500/30 text-blue-600 hover:bg-blue-50 hover:border-blue-500">
                            Voir l'aide <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="border-dashed border-2 border-blue-200 bg-blue-50/30">
                  <CardContent className="py-8 text-center">
                    <HandCoins className="w-12 h-12 text-blue-400 mx-auto mb-3" />
                    <p className="text-muted-foreground">Aucune aide disponible pour le moment</p>
                  </CardContent>
                </Card>
              )}
              
              <div className="flex justify-center">
                <Link to="/aides">
                  <Button variant="outline" className="border-blue-500/30 text-blue-600 hover:bg-blue-50">
                    Voir toutes les aides <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Forum & Simulations Row */}
            <div className={`grid gap-6 mt-8 ${isForumEnabled ? 'md:grid-cols-2' : 'grid-cols-1'}`}>
              {/* Forum Activity Section */}
              {isForumEnabled && (
                <Card className="group hover:shadow-2xl hover:shadow-teal-500/10 transition-all duration-300 border-l-4 border-l-teal-500 animate-fade-in" style={{ animationDelay: '0.6s' }}>
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-3 bg-gradient-to-br from-teal-500/10 to-teal-600/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
                        <MessageSquare className="w-6 h-6 text-teal-600" />
                      </div>
                    </div>
                    <CardTitle className="group-hover:text-teal-600 transition-colors">Mon activité Forum</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {forumStats.topicsCount > 0 || forumStats.postsCount > 0 ? (
                      <>
                        <div className="flex gap-4">
                          <div className="flex-1 p-3 bg-teal-50 rounded-lg text-center">
                            <p className="text-2xl font-bold text-teal-600">{forumStats.topicsCount}</p>
                            <p className="text-xs text-muted-foreground">Sujets créés</p>
                          </div>
                          <div className="flex-1 p-3 bg-teal-50 rounded-lg text-center">
                            <p className="text-2xl font-bold text-teal-600">{forumStats.postsCount}</p>
                            <p className="text-xs text-muted-foreground">Réponses postées</p>
                          </div>
                        </div>
                        
                        {forumStats.recentTopics.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground mb-2">Derniers sujets :</p>
                            <div className="space-y-2">
                              {forumStats.recentTopics.map((topic) => (
                                <Link
                                  key={topic.id}
                                  to={`/forum/topic/${topic.slug}`}
                                  className="block p-2 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors text-sm truncate"
                                >
                                  {topic.title}
                                </Link>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-muted-foreground mb-2">Vous n'avez pas encore participé au forum</p>
                      </div>
                    )}
                    
                    <Link to="/forum">
                      <Button className="w-full bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 shadow-lg shadow-teal-500/30">
                        {forumStats.topicsCount > 0 || forumStats.postsCount > 0 ? 'Accéder au forum' : 'Découvrir le forum'}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )}

              {/* Simulations Placeholder Section */}
              <Card className="group relative overflow-hidden border-l-4 border-l-emerald-500 animate-fade-in" style={{ animationDelay: '0.7s' }}>
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-emerald-600/10" />
                <div className="absolute top-2 right-2">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 border border-emerald-200">
                    <Lock className="w-3 h-3" />
                    Bientôt disponible
                  </span>
                </div>
                
                <CardHeader className="relative">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-3 bg-gradient-to-br from-emerald-500/10 to-emerald-600/20 rounded-xl">
                      <Calculator className="w-6 h-6 text-emerald-600" />
                    </div>
                  </div>
                  <CardTitle className="text-emerald-700">Mes Simulations</CardTitle>
                </CardHeader>
                <CardContent className="relative space-y-4">
                  <p className="text-muted-foreground">
                    Simulez vos économies d'énergie et votre impact environnemental grâce à nos outils de calcul personnalisés.
                  </p>
                  
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-1 text-xs rounded-full bg-emerald-100/50 text-emerald-700">Classe énergétique</span>
                    <span className="px-2 py-1 text-xs rounded-full bg-emerald-100/50 text-emerald-700">Économies solaires</span>
                    <span className="px-2 py-1 text-xs rounded-full bg-emerald-100/50 text-emerald-700">Pompe à chaleur</span>
                  </div>
                  
                  <Button disabled className="w-full bg-emerald-600/50 cursor-not-allowed">
                    Accéder aux simulateurs
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Articles recommandés Section */}
            <div className="space-y-6 mt-8 animate-fade-in" style={{ animationDelay: '0.8s' }}>
              <div className="flex items-center gap-3 mb-6">
                <div className="h-1 w-12 bg-gradient-to-r from-green-500 to-green-600 rounded-full"></div>
                <h2 className="text-2xl font-bold">Articles recommandés</h2>
              </div>
              
              {articles.length > 0 ? (
                <div className="grid md:grid-cols-3 gap-6">
                  {articles.map((article) => (
                    <Card key={article.id} className="group hover:shadow-2xl hover:shadow-green-500/10 transition-all duration-300 border-l-4 border-l-green-500 hover:scale-[1.02] hover:-translate-y-1 overflow-hidden">
                      {article.featured_image && (
                        <div className="h-32 overflow-hidden">
                          <img
                            src={article.featured_image}
                            alt={article.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        </div>
                      )}
                      <CardHeader>
                        <CardTitle className="text-lg group-hover:text-green-600 transition-colors line-clamp-2">
                          {article.title}
                        </CardTitle>
                        {article.excerpt && (
                          <CardDescription className="line-clamp-2">
                            {article.excerpt}
                          </CardDescription>
                        )}
                      </CardHeader>
                      <CardContent>
                        <Link to={`/actualites/${article.slug}`}>
                          <Button variant="outline" className="w-full border-green-500/30 text-green-600 hover:bg-green-50 hover:border-green-500">
                            Lire l'article <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="border-dashed border-2 border-green-200 bg-green-50/30">
                  <CardContent className="py-8 text-center">
                    <Newspaper className="w-12 h-12 text-green-400 mx-auto mb-3" />
                    <p className="text-muted-foreground">Aucun article disponible pour le moment</p>
                  </CardContent>
                </Card>
              )}
              
              <div className="flex justify-center">
                <Link to="/actualites">
                  <Button variant="outline" className="border-green-500/30 text-green-600 hover:bg-green-50">
                    Voir toutes les actualités <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Dashboard;
