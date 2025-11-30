import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, FolderTree, Tags, Settings, Users, ArrowLeft, MessageCircle, Bot, FileCheck, FileText, Mail, Newspaper, BookOpen, HandCoins, Megaphone, Clock, Send, MessageSquare, BarChart3, Shield, Calculator } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import TrafficDashboard from "@/components/TrafficDashboard";

const Administration = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/connexion");
    }
  }, [user, loading, navigate]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Administration | Prime Énergies</title>
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="pt-20">
          <div className="container mx-auto px-4 py-8">
            <Link 
              to="/tableau-de-bord"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour au tableau de bord
            </Link>

            <h1 className="text-3xl font-bold mb-2">Administration</h1>
            <p className="text-muted-foreground mb-8">
              Gérez les contenus et les paramètres de votre site
            </p>

            {/* Traffic Dashboard */}
            <TrafficDashboard />

            {/* 1. Gestion des Utilisateurs - ROUGE */}
            <div className="mt-12">
              <h2 className="text-2xl font-bold mb-4">Gestion des Utilisateurs</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-3 bg-red-500/10 rounded-lg">
                        <Users className="w-6 h-6 text-red-600" />
                      </div>
                    </div>
                    <CardTitle>Utilisateurs</CardTitle>
                    <CardDescription>
                      Modifiez les profils et les rôles des utilisateurs
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link to="/admin/utilisateurs">
                      <Button className="w-full bg-red-600 hover:bg-red-700">
                        Accéder
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* 2. Gestion des Contenus - BLEU CLAIR */}
            <div className="mt-12">
              <h2 className="text-2xl font-bold mb-4">Gestion des Contenus</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-3 bg-sky-500/10 rounded-lg">
                        <Newspaper className="w-6 h-6 text-sky-600" />
                      </div>
                    </div>
                    <CardTitle>Articles</CardTitle>
                    <CardDescription>
                      Gérez les actualités et articles du site
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link to="/gerer-actualites">
                      <Button className="w-full bg-sky-600 hover:bg-sky-700">
                        Accéder
                      </Button>
                    </Link>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-3 bg-sky-500/10 rounded-lg">
                        <BookOpen className="w-6 h-6 text-sky-600" />
                      </div>
                    </div>
                    <CardTitle>Guides</CardTitle>
                    <CardDescription>
                      Gérez les guides pratiques et tutoriels
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link to="/gerer-guides">
                      <Button className="w-full bg-sky-600 hover:bg-sky-700">
                        Accéder
                      </Button>
                    </Link>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-3 bg-sky-500/10 rounded-lg">
                        <HandCoins className="w-6 h-6 text-sky-600" />
                      </div>
                    </div>
                    <CardTitle>Aides</CardTitle>
                    <CardDescription>
                      Gérez les aides et subventions disponibles
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link to="/gerer-aides">
                      <Button className="w-full bg-sky-600 hover:bg-sky-700">
                        Accéder
                      </Button>
                    </Link>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-3 bg-sky-500/10 rounded-lg">
                        <FolderTree className="w-6 h-6 text-sky-600" />
                      </div>
                    </div>
                    <CardTitle>Catégories</CardTitle>
                    <CardDescription>
                      Créez et organisez les catégories pour vos contenus
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link to="/admin/categories">
                      <Button className="w-full bg-sky-600 hover:bg-sky-700">
                        Accéder
                      </Button>
                    </Link>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-3 bg-sky-500/10 rounded-lg">
                        <Tags className="w-6 h-6 text-sky-600" />
                      </div>
                    </div>
                    <CardTitle>Étiquettes</CardTitle>
                    <CardDescription>
                      Créez et gérez les tags pour organiser vos articles
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link to="/admin/etiquettes">
                      <Button className="w-full bg-sky-600 hover:bg-sky-700">
                        Accéder
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* 3. Leads & Parcours - ORANGE */}
            <div className="mt-12">
              <h2 className="text-2xl font-bold mb-4">Leads & Parcours</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-3 bg-orange-500/10 rounded-lg">
                        <Bot className="w-6 h-6 text-orange-600" />
                      </div>
                    </div>
                    <CardTitle>Chatbot / Parcours</CardTitle>
                    <CardDescription>
                      Créez et gérez les parcours de questions automatiques
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link to="/admin/chatbot">
                      <Button className="w-full bg-orange-600 hover:bg-orange-700">
                        Accéder
                      </Button>
                    </Link>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-3 bg-orange-500/10 rounded-lg">
                        <FileCheck className="w-6 h-6 text-orange-600" />
                      </div>
                    </div>
                    <CardTitle>Formulaires</CardTitle>
                    <CardDescription>
                      Collectez, exportez et connectez vos formulaires
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link to="/admin/formulaires">
                      <Button className="w-full bg-orange-600 hover:bg-orange-700">
                        Accéder
                      </Button>
                    </Link>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow opacity-60">
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-3 bg-orange-500/10 rounded-lg">
                        <Calculator className="w-6 h-6 text-orange-600" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <CardTitle>Simulateurs</CardTitle>
                      <Badge variant="secondary" className="text-xs">Bientôt</Badge>
                    </div>
                    <CardDescription>
                      Gérez et configurez les simulateurs interactifs
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full" disabled>
                      Prochainement
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* 4. Support - VERT */}
            <div className="mt-12">
              <h2 className="text-2xl font-bold mb-4">Support</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-3 bg-green-500/10 rounded-lg">
                        <MessageCircle className="w-6 h-6 text-green-600" />
                      </div>
                    </div>
                    <CardTitle>Chat Support (Live)</CardTitle>
                    <CardDescription>
                      Gérez les conversations et assistez les utilisateurs en direct
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link to="/chat-support">
                      <Button className="w-full bg-green-600 hover:bg-green-700">
                        Accéder
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* 5. Communication - VIOLET */}
            <div className="mt-12">
              <h2 className="text-2xl font-bold mb-4">Communication</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-3 bg-purple-500/10 rounded-lg">
                        <Mail className="w-6 h-6 text-purple-600" />
                      </div>
                    </div>
                    <CardTitle>Newsletter</CardTitle>
                    <CardDescription>
                      Gérez les abonnés à la newsletter
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link to="/admin/newsletter">
                      <Button className="w-full bg-purple-600 hover:bg-purple-700">
                        Accéder
                      </Button>
                    </Link>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow opacity-60">
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-3 bg-purple-500/10 rounded-lg">
                        <Send className="w-6 h-6 text-purple-600" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <CardTitle>Emailing Client</CardTitle>
                      <Badge variant="secondary" className="text-xs">Bientôt</Badge>
                    </div>
                    <CardDescription>
                      Automatisations et campagnes d'emailing clients
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full" disabled>
                      Prochainement
                    </Button>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow opacity-60">
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-3 bg-purple-500/10 rounded-lg">
                        <MessageSquare className="w-6 h-6 text-purple-600" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <CardTitle>SMS / MMS</CardTitle>
                      <Badge variant="secondary" className="text-xs">Bientôt</Badge>
                    </div>
                    <CardDescription>
                      Envoyez des messages SMS et MMS à vos clients
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full" disabled>
                      Prochainement
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* 6. Gestion des Annonceurs - JAUNE */}
            <div className="mt-12">
              <h2 className="text-2xl font-bold mb-4">Gestion des Annonceurs</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-3 bg-yellow-500/10 rounded-lg">
                        <Users className="w-6 h-6 text-yellow-600" />
                      </div>
                    </div>
                    <CardTitle>Annonceurs</CardTitle>
                    <CardDescription>
                      Créez et gérez vos partenaires publicitaires
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link to="/admin/annonceurs">
                      <Button className="w-full bg-yellow-600 hover:bg-yellow-700">
                        Accéder
                      </Button>
                    </Link>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-3 bg-yellow-500/10 rounded-lg">
                        <Megaphone className="w-6 h-6 text-yellow-600" />
                      </div>
                    </div>
                    <CardTitle>Annonces</CardTitle>
                    <CardDescription>
                      Pilotez vos campagnes publicitaires partenaires
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link to="/gerer-annonces">
                      <Button className="w-full bg-yellow-600 hover:bg-yellow-700">
                        Accéder
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* 7. Gestion des Landing Pages - TURQUOISE */}
            <div className="mt-12">
              <h2 className="text-2xl font-bold mb-4">Gestion des Landing Pages</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-3 bg-cyan-500/10 rounded-lg">
                        <FileText className="w-6 h-6 text-cyan-600" />
                      </div>
                    </div>
                    <CardTitle>Landing Pages</CardTitle>
                    <CardDescription>
                      Gérez les pages de destination et leurs formulaires
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link to="/admin/landing-pages">
                      <Button className="w-full bg-cyan-600 hover:bg-cyan-700">
                        Accéder
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* 8. Paramètres généraux - GRIS FONCÉ */}
            <div className="mt-12">
              <h2 className="text-2xl font-bold mb-4">Paramètres généraux</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-3 bg-slate-700/10 rounded-lg">
                        <Settings className="w-6 h-6 text-slate-700" />
                      </div>
                    </div>
                    <CardTitle>Paramètres généraux</CardTitle>
                    <CardDescription>
                      Configurez les paramètres globaux du site
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link to="/admin/parametres">
                      <Button className="w-full bg-slate-700 hover:bg-slate-800">
                        Accéder
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* 9. Gestion des Logs */}
            <div className="mt-12">
              <h2 className="text-2xl font-bold mb-4">Gestion des Logs</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="hover:shadow-lg transition-shadow opacity-60">
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-3 bg-slate-500/10 rounded-lg">
                        <Shield className="w-6 h-6 text-slate-600" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <CardTitle>Logs d'activité</CardTitle>
                      <Badge variant="secondary" className="text-xs">Bientôt</Badge>
                    </div>
                    <CardDescription>
                      Consultez l'historique des actions et événements
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full" disabled>
                      Prochainement
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Administration;
