import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, FolderTree, Tags, Settings, Users, ArrowLeft, MessageCircle } from "lucide-react";
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

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
              {/* Gérer les utilisateurs */}
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <Users className="w-6 h-6 text-primary" />
                    </div>
                  </div>
                  <CardTitle>Gérer les utilisateurs</CardTitle>
                  <CardDescription>
                    Modifiez les profils et les rôles des utilisateurs
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link to="/admin/utilisateurs">
                    <Button className="w-full">
                      Accéder aux utilisateurs
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Gérer les annonceurs */}
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <Users className="w-6 h-6 text-primary" />
                    </div>
                  </div>
                  <CardTitle>Gérer les annonceurs</CardTitle>
                  <CardDescription>
                    Créez et gérez vos partenaires publicitaires
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link to="/admin/annonceurs">
                    <Button className="w-full">
                      Accéder aux annonceurs
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Gérer les annonces */}
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <FolderTree className="w-6 h-6 text-primary" />
                    </div>
                  </div>
                  <CardTitle>Gérer les annonces</CardTitle>
                  <CardDescription>
                    Pilotez vos campagnes publicitaires partenaires
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link to="/gerer-annonces">
                    <Button className="w-full">
                      Accéder aux annonces
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Support Chat */}
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-3 bg-emerald-500/10 rounded-lg">
                      <MessageCircle className="w-6 h-6 text-emerald-600" />
                    </div>
                  </div>
                  <CardTitle>Support Chat</CardTitle>
                  <CardDescription>
                    Gérez les conversations et assistez les utilisateurs en direct
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link to="/chat-support">
                    <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                      Accéder au support
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Gérer les catégories */}
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <FolderTree className="w-6 h-6 text-primary" />
                    </div>
                  </div>
                  <CardTitle>Gérer les catégories</CardTitle>
                  <CardDescription>
                    Créez et organisez les catégories pour vos contenus
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link to="/admin/categories">
                    <Button className="w-full">
                      Accéder aux catégories
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Gérer les étiquettes */}
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <Tags className="w-6 h-6 text-primary" />
                    </div>
                  </div>
                  <CardTitle>Gérer les étiquettes</CardTitle>
                  <CardDescription>
                    Créez et gérez les tags pour organiser vos articles
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link to="/admin/etiquettes">
                    <Button className="w-full">
                      Accéder aux étiquettes
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Paramètres généraux */}
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <Settings className="w-6 h-6 text-primary" />
                    </div>
                  </div>
                  <CardTitle>Paramètres généraux</CardTitle>
                  <CardDescription>
                    Configurez les paramètres globaux du site
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link to="/admin/parametres">
                    <Button className="w-full">
                      Accéder aux paramètres
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Administration;
