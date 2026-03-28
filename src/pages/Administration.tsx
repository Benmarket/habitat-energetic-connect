import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, FolderTree, Tags, Settings, Users, ArrowLeft, MessageCircle, Bot, FileCheck, FileText, Mail, Newspaper, BookOpen, HandCoins, Megaphone, Send, MessageSquare, Shield, Calculator, Smartphone, Layers, MousePointerClick, LayoutTemplate, BarChart3, UserCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import TrafficDashboard from "@/components/TrafficDashboard";

const Administration = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<string>("");
  const [showSidebar, setShowSidebar] = useState(false);

  const sections = [
    { id: "utilisateurs", label: "Utilisateurs", icon: Users, color: "bg-red-500" },
    { id: "contenus", label: "Contenus", icon: Newspaper, color: "bg-sky-500" },
    { id: "leads-parcours", label: "Leads & Parcours", icon: Bot, color: "bg-orange-500" },
    { id: "support", label: "Support", icon: MessageCircle, color: "bg-green-500" },
    { id: "communication", label: "Communication", icon: Mail, color: "bg-purple-500" },
    { id: "annonces", label: "Annonces", icon: Megaphone, color: "bg-amber-500" },
    { id: "landing-pages", label: "Pages & Ancres", icon: Layers, color: "bg-cyan-500" },
    { id: "app", label: "App", icon: Smartphone, color: "bg-primary" },
    { id: "parametres", label: "Paramètres", icon: Settings, color: "bg-slate-700" },
    { id: "logs", label: "Logs", icon: Shield, color: "bg-slate-500" },
  ];

  useEffect(() => {
    if (!loading && !user) {
      navigate("/connexion");
    }
  }, [user, loading, navigate]);

  // Track active section on scroll and show/hide sidebar
  useEffect(() => {
    const handleScroll = () => {
      const firstSection = document.getElementById(sections[0].id);
      if (firstSection) {
        const rect = firstSection.getBoundingClientRect();
        // Show sidebar earlier - when first section is within 400px of viewport top
        setShowSidebar(rect.top <= 400);
      }

      const sectionElements = sections.map(s => ({
        id: s.id,
        element: document.getElementById(s.id)
      }));

      for (const section of sectionElements.reverse()) {
        if (section.element) {
          const rect = section.element.getBoundingClientRect();
          if (rect.top <= 150) {
            setActiveSection(section.id);
            return;
          }
        }
      }
      setActiveSection("");
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

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
        
        {/* Mini Navigation Sidebar - Desktop Only - appears only when viewing sections */}
        <TooltipProvider delayDuration={100}>
          <div 
            className={`fixed top-1/2 -translate-y-1/2 z-40 hidden lg:flex flex-col gap-2 p-2 bg-background/80 backdrop-blur-md border rounded-2xl shadow-lg transition-all duration-300 ${
              showSidebar ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 pointer-events-none'
            }`}
            style={{ left: 'max(1rem, calc((100vw - 1280px) / 2 - 70px))' }}
          >
            {sections.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              // Get the color class for the icon
              const iconColorClass = section.color.replace('bg-', 'text-');
              return (
                <Tooltip key={section.id}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => scrollToSection(section.id)}
                      className={`
                        relative p-2.5 rounded-xl transition-all duration-300 group
                        ${isActive 
                          ? `${section.color} text-white shadow-lg` 
                          : 'hover:bg-muted'
                        }
                      `}
                    >
                      <Icon className={`w-5 h-5 ${isActive ? 'text-white' : iconColorClass}`} />
                      {isActive && (
                        <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-1 h-4 bg-white rounded-full" />
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="font-medium">
                    {section.label}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </TooltipProvider>

        <main className="pt-20">
          <div className="container mx-auto px-4 py-6 md:py-8 lg:pl-20">
            <Link 
              to="/tableau-de-bord"
              className="inline-flex items-center gap-2 text-sm md:text-base text-muted-foreground hover:text-foreground mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Retour au tableau de bord</span>
              <span className="sm:hidden">Retour</span>
            </Link>

            <div className="mb-6 md:mb-8 animate-fade-in">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 md:mb-3 bg-gradient-to-r from-primary via-purple-600 to-blue-600 bg-clip-text text-transparent">
                Administration
              </h1>
              <p className="text-sm sm:text-base md:text-lg text-muted-foreground">
                Gérez les contenus et les paramètres de votre site
              </p>
            </div>

            {/* Traffic Dashboard */}
            <TrafficDashboard />

            {/* 1. Gestion des Utilisateurs - ROUGE */}
            <div id="utilisateurs" className="mt-8 md:mt-12 animate-fade-in scroll-mt-24">
              <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
                <div className="h-1 w-8 md:w-12 bg-gradient-to-r from-red-500 to-red-600 rounded-full"></div>
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold">Gestion des Utilisateurs</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                <Card className="group hover:shadow-2xl hover:shadow-red-500/10 transition-all duration-300 border-l-4 border-l-red-500 hover:scale-[1.02] hover:-translate-y-1">
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-3 bg-gradient-to-br from-red-500/10 to-red-600/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
                        <Users className="w-6 h-6 text-red-600" />
                      </div>
                    </div>
                    <CardTitle className="group-hover:text-red-600 transition-colors">Utilisateurs</CardTitle>
                    <CardDescription>
                      Modifiez les profils et les rôles des utilisateurs
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link to="/admin/utilisateurs">
                      <Button className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-lg shadow-red-500/30">
                        Accéder
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* 2. Gestion des Contenus - BLEU CLAIR */}
            <div id="contenus" className="mt-8 md:mt-12 animate-fade-in scroll-mt-24" style={{ animationDelay: '0.1s' }}>
              <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
                <div className="h-1 w-8 md:w-12 bg-gradient-to-r from-sky-500 to-sky-600 rounded-full"></div>
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold">Gestion des Contenus</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                <Card className="group hover:shadow-2xl hover:shadow-sky-500/10 transition-all duration-300 border-l-4 border-l-sky-500 hover:scale-[1.02] hover:-translate-y-1">
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-3 bg-gradient-to-br from-sky-500/10 to-sky-600/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
                        <Newspaper className="w-6 h-6 text-sky-600" />
                      </div>
                    </div>
                    <CardTitle className="group-hover:text-sky-600 transition-colors">Articles</CardTitle>
                    <CardDescription>
                      Gérez les actualités et articles du site
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link to="/gerer-actualites">
                      <Button className="w-full bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-700 hover:to-sky-800 shadow-lg shadow-sky-500/30">
                        Accéder
                      </Button>
                    </Link>
                  </CardContent>
                </Card>

                <Card className="group hover:shadow-2xl hover:shadow-sky-500/10 transition-all duration-300 border-l-4 border-l-sky-500 hover:scale-[1.02] hover:-translate-y-1">
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-3 bg-gradient-to-br from-sky-500/10 to-sky-600/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
                        <BookOpen className="w-6 h-6 text-sky-600" />
                      </div>
                    </div>
                    <CardTitle className="group-hover:text-sky-600 transition-colors">Guides</CardTitle>
                    <CardDescription>
                      Gérez les guides pratiques et tutoriels
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link to="/gerer-guides">
                      <Button className="w-full bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-700 hover:to-sky-800 shadow-lg shadow-sky-500/30">
                        Accéder
                      </Button>
                    </Link>
                  </CardContent>
                </Card>

                <Card className="group hover:shadow-2xl hover:shadow-sky-500/10 transition-all duration-300 border-l-4 border-l-sky-500 hover:scale-[1.02] hover:-translate-y-1">
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-3 bg-gradient-to-br from-sky-500/10 to-sky-600/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
                        <HandCoins className="w-6 h-6 text-sky-600" />
                      </div>
                    </div>
                    <CardTitle className="group-hover:text-sky-600 transition-colors">Aides</CardTitle>
                    <CardDescription>
                      Gérez les aides et subventions disponibles
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link to="/gerer-aides">
                      <Button className="w-full bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-700 hover:to-sky-800 shadow-lg shadow-sky-500/30">
                        Accéder
                      </Button>
                    </Link>
                  </CardContent>
                </Card>

                <Card className="group hover:shadow-2xl hover:shadow-sky-500/10 transition-all duration-300 border-l-4 border-l-sky-500 hover:scale-[1.02] hover:-translate-y-1">
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-3 bg-gradient-to-br from-sky-500/10 to-sky-600/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
                        <FolderTree className="w-6 h-6 text-sky-600" />
                      </div>
                    </div>
                    <CardTitle className="group-hover:text-sky-600 transition-colors">Catégories</CardTitle>
                    <CardDescription>
                      Créez et organisez les catégories pour vos contenus
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link to="/admin/categories">
                      <Button className="w-full bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-700 hover:to-sky-800 shadow-lg shadow-sky-500/30">
                        Accéder
                      </Button>
                    </Link>
                  </CardContent>
                </Card>

                <Card className="group hover:shadow-2xl hover:shadow-sky-500/10 transition-all duration-300 border-l-4 border-l-sky-500 hover:scale-[1.02] hover:-translate-y-1">
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-3 bg-gradient-to-br from-sky-500/10 to-sky-600/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
                        <Tags className="w-6 h-6 text-sky-600" />
                      </div>
                    </div>
                    <CardTitle className="group-hover:text-sky-600 transition-colors">Étiquettes</CardTitle>
                    <CardDescription>
                      Créez et gérez les tags pour organiser vos articles
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link to="/admin/etiquettes">
                      <Button className="w-full bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-700 hover:to-sky-800 shadow-lg shadow-sky-500/30">
                        Accéder
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* 3. Leads & Parcours - ORANGE */}
            <div id="leads-parcours" className="mt-8 md:mt-12 animate-fade-in scroll-mt-24" style={{ animationDelay: '0.2s' }}>
              <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
                <div className="h-1 w-8 md:w-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full"></div>
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold">Leads & Parcours</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                <Card className="group hover:shadow-2xl hover:shadow-orange-500/10 transition-all duration-300 border-l-4 border-l-orange-500 hover:scale-[1.02] hover:-translate-y-1">
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-3 bg-gradient-to-br from-orange-500/10 to-orange-600/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
                        <Bot className="w-6 h-6 text-orange-600" />
                      </div>
                    </div>
                    <CardTitle className="group-hover:text-orange-600 transition-colors">Chatbot / Parcours</CardTitle>
                    <CardDescription>
                      Créez et gérez les parcours de questions automatiques
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link to="/admin/chatbot">
                      <Button className="w-full bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 shadow-lg shadow-orange-500/30">
                        Accéder
                      </Button>
                    </Link>
                  </CardContent>
                </Card>

                <Card className="group hover:shadow-2xl hover:shadow-orange-500/10 transition-all duration-300 border-l-4 border-l-orange-500 hover:scale-[1.02] hover:-translate-y-1">
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-3 bg-gradient-to-br from-orange-500/10 to-orange-600/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
                        <FileCheck className="w-6 h-6 text-orange-600" />
                      </div>
                    </div>
                    <CardTitle className="group-hover:text-orange-600 transition-colors">Formulaires</CardTitle>
                    <CardDescription>
                      Collectez, exportez et connectez vos formulaires
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link to="/admin/formulaires">
                      <Button className="w-full bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 shadow-lg shadow-orange-500/30">
                        Accéder
                      </Button>
                    </Link>
                  </CardContent>
                </Card>

                <Card className="group hover:shadow-2xl hover:shadow-orange-500/10 transition-all duration-300 border-l-4 border-l-orange-500 hover:scale-[1.02] hover:-translate-y-1">
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-3 bg-gradient-to-br from-orange-500/10 to-orange-600/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
                        <Layers className="w-6 h-6 text-orange-600" />
                      </div>
                    </div>
                    <CardTitle className="group-hover:text-orange-600 transition-colors">Pop-ups</CardTitle>
                    <CardDescription>
                      Créez et gérez les pop-ups de votre site
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link to="/admin/popups">
                      <Button className="w-full bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 shadow-lg shadow-orange-500/30">
                        Accéder
                      </Button>
                    </Link>
                  </CardContent>
                </Card>

                <Card className="group hover:shadow-2xl hover:shadow-orange-500/10 transition-all duration-300 border-l-4 border-l-orange-500 hover:scale-[1.02] hover:-translate-y-1">
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-3 bg-gradient-to-br from-orange-500/10 to-orange-600/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
                        <Calculator className="w-6 h-6 text-orange-600" />
                      </div>
                    </div>
                    <CardTitle className="group-hover:text-orange-600 transition-colors">Simulateurs</CardTitle>
                    <CardDescription>
                      Gérez et configurez les simulateurs interactifs
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link to="/admin/simulateurs">
                      <Button className="w-full bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 shadow-lg shadow-orange-500/30">
                        Accéder
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* 4. Support - VERT */}
            <div id="support" className="mt-8 md:mt-12 animate-fade-in scroll-mt-24" style={{ animationDelay: '0.3s' }}>
              <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
                <div className="h-1 w-8 md:w-12 bg-gradient-to-r from-green-500 to-green-600 rounded-full"></div>
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold">Support</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                <Card className="group hover:shadow-2xl hover:shadow-green-500/10 transition-all duration-300 border-l-4 border-l-green-500 hover:scale-[1.02] hover:-translate-y-1">
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-3 bg-gradient-to-br from-green-500/10 to-green-600/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
                        <MessageCircle className="w-6 h-6 text-green-600" />
                      </div>
                    </div>
                    <CardTitle className="group-hover:text-green-600 transition-colors">Chat Support (Live)</CardTitle>
                    <CardDescription>
                      Gérez les conversations et assistez les utilisateurs en direct
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link to="/chat-support">
                      <Button className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg shadow-green-500/30">
                        Accéder
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* 5. Communication - VIOLET */}
            <div id="communication" className="mt-8 md:mt-12 animate-fade-in scroll-mt-24" style={{ animationDelay: '0.4s' }}>
              <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
                <div className="h-1 w-8 md:w-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full"></div>
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold">Communication</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                <Card className="group hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-300 border-l-4 border-l-purple-500 hover:scale-[1.02] hover:-translate-y-1">
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-3 bg-gradient-to-br from-purple-500/10 to-purple-600/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
                        <Mail className="w-6 h-6 text-purple-600" />
                      </div>
                    </div>
                    <CardTitle className="group-hover:text-purple-600 transition-colors">Newsletter</CardTitle>
                    <CardDescription>
                      Gérez les abonnés à la newsletter
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link to="/admin/newsletter">
                      <Button className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-lg shadow-purple-500/30">
                        Accéder
                      </Button>
                    </Link>
                  </CardContent>
                </Card>

                <Card className="group relative overflow-hidden border-l-4 border-l-purple-300 hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-purple-100/30"></div>
                  <CardHeader className="relative">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-3 bg-purple-500/10 rounded-xl">
                        <Send className="w-6 h-6 text-purple-400" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-purple-400">Emailing Client</CardTitle>
                      <Badge className="text-xs bg-purple-100 text-purple-700 hover:bg-purple-100">Bientôt</Badge>
                    </div>
                    <CardDescription className="text-muted-foreground/70">
                      Automatisations et campagnes d'emailing clients
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="relative">
                    <Button className="w-full bg-purple-200 text-purple-700 cursor-not-allowed" disabled>
                      Prochainement
                    </Button>
                  </CardContent>
                </Card>

                <Card className="group relative overflow-hidden border-l-4 border-l-purple-300 hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-purple-100/30"></div>
                  <CardHeader className="relative">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-3 bg-purple-500/10 rounded-xl">
                        <MessageSquare className="w-6 h-6 text-purple-400" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-purple-400">SMS / MMS</CardTitle>
                      <Badge className="text-xs bg-purple-100 text-purple-700 hover:bg-purple-100">Bientôt</Badge>
                    </div>
                    <CardDescription className="text-muted-foreground/70">
                      Envoyez des messages SMS et MMS à vos clients
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="relative">
                    <Button className="w-full bg-purple-200 text-purple-700 cursor-not-allowed" disabled>
                      Prochainement
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* 6. Gestion des Annonces - JAUNE */}
            <div id="annonces" className="mt-8 md:mt-12 animate-fade-in scroll-mt-24" style={{ animationDelay: '0.5s' }}>
              <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
                <div className="h-1 w-8 md:w-12 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-full"></div>
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold">Gestion des Annonces</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                <Card className="group hover:shadow-2xl hover:shadow-amber-500/10 transition-all duration-300 border-l-4 border-l-amber-500 hover:scale-[1.02] hover:-translate-y-1">
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-3 bg-gradient-to-br from-amber-500/10 to-amber-600/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
                        <Megaphone className="w-6 h-6 text-amber-600" />
                      </div>
                    </div>
                    <CardTitle className="group-hover:text-amber-600 transition-colors">Annonces & Annonceurs</CardTitle>
                    <CardDescription>
                      Gérez vos campagnes publicitaires partenaires
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link to="/admin/annonces">
                      <Button className="w-full bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500 hover:from-amber-600 hover:via-yellow-600 hover:to-amber-600 shadow-lg shadow-amber-500/30">
                        Accéder
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* 7. Gestion des Pages & Ancres - TURQUOISE */}
            <div id="landing-pages" className="mt-8 md:mt-12 animate-fade-in scroll-mt-24" style={{ animationDelay: '0.6s' }}>
              <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
                <div className="h-1 w-8 md:w-12 bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-full"></div>
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold">Gestion des Pages et Ancres</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                <Card className="group hover:shadow-2xl hover:shadow-cyan-500/10 transition-all duration-300 border-l-4 border-l-cyan-500 hover:scale-[1.02] hover:-translate-y-1">
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-3 bg-gradient-to-br from-cyan-500/10 to-cyan-600/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
                        <Layers className="w-6 h-6 text-cyan-600" />
                      </div>
                    </div>
                    <CardTitle className="group-hover:text-cyan-600 transition-colors">Pages & Ancres</CardTitle>
                    <CardDescription>
                      Gérez les landing pages, pages du site et ancres de navigation
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link to="/admin/pages-ancres">
                      <Button className="w-full bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800 shadow-lg shadow-cyan-500/30">
                        Accéder
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* 8. Gestion de l'App Prime énergies - VERT PRIME */}
            <div id="app" className="mt-8 md:mt-12 animate-fade-in scroll-mt-24" style={{ animationDelay: '0.65s' }}>
              <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
                <div className="h-1 w-8 md:w-12 bg-gradient-to-r from-primary to-primary/80 rounded-full"></div>
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold">Gestion de l'App</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                <Card className="group relative overflow-hidden border-l-4 border-l-primary/30 hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10"></div>
                  <CardHeader className="relative">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-3 bg-primary/10 rounded-xl">
                        <Smartphone className="w-6 h-6 text-primary/60" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-primary/60">App Prime énergies</CardTitle>
                      <Badge className="text-xs bg-primary/10 text-primary hover:bg-primary/10">Bientôt</Badge>
                    </div>
                    <CardDescription className="text-muted-foreground/70">
                      Gérez les paramètres, notifications et contenus de l'application mobile
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="relative">
                    <Button 
                      className="w-full bg-primary/90 text-white hover:bg-primary"
                      onClick={() => navigate('/admin/app')}
                    >
                      Gérer l'App
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* 9. Paramètres généraux - GRIS FONCÉ */}
            <div id="parametres" className="mt-8 md:mt-12 mb-8 md:mb-12 animate-fade-in scroll-mt-24" style={{ animationDelay: '0.7s' }}>
              <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
                <div className="h-1 w-8 md:w-12 bg-gradient-to-r from-slate-700 to-slate-800 rounded-full"></div>
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold">Paramètres généraux</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                <Card className="group hover:shadow-2xl hover:shadow-slate-500/10 transition-all duration-300 border-l-4 border-l-slate-700 hover:scale-[1.02] hover:-translate-y-1">
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-3 bg-gradient-to-br from-slate-700/10 to-slate-800/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
                        <Settings className="w-6 h-6 text-slate-700" />
                      </div>
                    </div>
                    <CardTitle className="group-hover:text-slate-700 transition-colors">Paramètres généraux</CardTitle>
                    <CardDescription>
                      Configurez les paramètres globaux du site
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link to="/admin/parametres">
                      <Button className="w-full bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-800 hover:to-slate-900 shadow-lg shadow-slate-500/30">
                        Accéder
                      </Button>
                    </Link>
                  </CardContent>
                </Card>

                <Card className="group hover:shadow-2xl hover:shadow-slate-500/10 transition-all duration-300 border-l-4 border-l-slate-600 hover:scale-[1.02] hover:-translate-y-1">
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-3 bg-gradient-to-br from-slate-600/10 to-slate-700/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
                        <MousePointerClick className="w-6 h-6 text-slate-600" />
                      </div>
                    </div>
                    <CardTitle className="group-hover:text-slate-600 transition-colors">Gestion des boutons</CardTitle>
                    <CardDescription>
                      Créez et gérez vos boutons personnalisés pour les articles
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link to="/admin/boutons">
                      <Button className="w-full bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 shadow-lg shadow-slate-500/30">
                        Accéder
                      </Button>
                    </Link>
                  </CardContent>
                </Card>

                <Card className="group hover:shadow-2xl hover:shadow-slate-500/10 transition-all duration-300 border-l-4 border-l-slate-500 hover:scale-[1.02] hover:-translate-y-1">
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-3 bg-gradient-to-br from-slate-500/10 to-slate-600/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
                        <LayoutTemplate className="w-6 h-6 text-slate-500" />
                      </div>
                    </div>
                    <CardTitle className="group-hover:text-slate-500 transition-colors">Gestion des bandeaux CTA</CardTitle>
                    <CardDescription>
                      Créez et gérez vos bandeaux d'appel à l'action
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link to="/admin/bandeaux-cta">
                      <Button className="w-full bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 shadow-lg shadow-slate-500/30">
                        Accéder
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* 10. Gestion des Logs */}
            <div id="logs" className="mt-12 mb-12 animate-fade-in scroll-mt-24" style={{ animationDelay: '0.85s' }}>
              <div className="flex items-center gap-3 mb-6">
                <div className="h-1 w-12 bg-gradient-to-r from-slate-500 to-slate-600 rounded-full"></div>
                <h2 className="text-2xl font-bold">Gestion des Logs</h2>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="group relative overflow-hidden border-l-4 border-l-slate-300 hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300">
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 to-slate-100/30"></div>
                  <CardHeader className="relative">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-3 bg-slate-500/10 rounded-xl">
                        <Shield className="w-6 h-6 text-slate-400" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-slate-400">Logs d'activité</CardTitle>
                      <Badge className="text-xs bg-slate-100 text-slate-700 hover:bg-slate-100">Bientôt</Badge>
                    </div>
                    <CardDescription className="text-muted-foreground/70">
                      Consultez l'historique des actions et événements
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="relative">
                    <Button className="w-full bg-slate-200 text-slate-700 cursor-not-allowed" disabled>
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
