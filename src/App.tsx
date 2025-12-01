import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import MaintenanceMode from "@/components/MaintenanceMode";
import { ChatBot } from "@/components/ChatBot";
import CookieBanner from "@/components/CookieBanner";
import { ScrollToTop } from "@/components/ScrollToTop";
import Index from "./pages/Index";
import Actualites from "./pages/Actualites";
import Aides from "./pages/Aides";
import Guides from "./pages/Guides";
import ArticleDetail from "./pages/ArticleDetail";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Profil from "./pages/Profil";
import CreatePost from "./pages/CreatePost";
import ManageActualites from "./pages/ManageActualites";
import ManageGuides from "./pages/ManageGuides";
import ManageAides from "./pages/ManageAides";
import ManageAnnonces from "./pages/ManageAnnonces";
import ManageAdvertisers from "./pages/ManageAdvertisers";
import ChatSupport from "./pages/ChatSupport";
import Administration from "./pages/Administration";
import AdminUsers from "./pages/AdminUsers";
import AdminCategories from "./pages/AdminCategories";
import AdminTags from "./pages/AdminTags";
import AdminSettings from "./pages/AdminSettings";
import AdminNewsletter from "./pages/AdminNewsletter";
import AdminChatbot from "./pages/AdminChatbot";
import AdminForms from "./pages/AdminForms";
import AdminApp from "./pages/AdminApp";
import NotFound from "./pages/NotFound";
import Sitemap from "./pages/Sitemap";
import PolitiqueConfidentialite from "./pages/PolitiqueConfidentialite";
import ConditionsUtilisation from "./pages/ConditionsUtilisation";
import MentionsLegales from "./pages/MentionsLegales";
import AdminLandingPages from "./pages/AdminLandingPages";
import LandingSolaire from "./pages/landing/LandingSolaire";
import LandingIsolation from "./pages/landing/LandingIsolation";
import LandingPompeAChaleur from "./pages/landing/LandingPompeAChaleur";
import LandingRenovationGlobale from "./pages/landing/LandingRenovationGlobale";
import Forum from "./pages/forum/Forum";
import ForumCategory from "./pages/forum/ForumCategory";
import ForumTopic from "./pages/forum/ForumTopic";
import NewTopic from "./pages/forum/NewTopic";
import InstallApp from "./pages/InstallApp";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <MaintenanceMode>
            <ChatBot />
            <CookieBanner />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/actualites" element={<Actualites />} />
              <Route path="/actualites/:categorySlug/:slug" element={<ArticleDetail />} />
              <Route path="/aides" element={<Aides />} />
              <Route path="/aide/:slug" element={<ArticleDetail />} />
              <Route path="/guides" element={<Guides />} />
              <Route path="/guide/:slug" element={<ArticleDetail />} />
              <Route path="/connexion" element={<Auth />} />
              <Route path="/tableau-de-bord" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/profil" element={<Profil />} />
              <Route path="/creer-contenu" element={<CreatePost />} />
              <Route path="/gerer-actualites" element={<ManageActualites />} />
              <Route path="/gerer-guides" element={<ManageGuides />} />
              <Route path="/gerer-aides" element={<ManageAides />} />
              <Route path="/gerer-annonces" element={<ManageAnnonces />} />
              <Route path="/admin/annonceurs" element={<ManageAdvertisers />} />
              <Route path="/chat-support" element={<ChatSupport />} />
              <Route path="/administration" element={<Administration />} />
              <Route path="/admin/utilisateurs" element={<AdminUsers />} />
              <Route path="/admin/categories" element={<AdminCategories />} />
              <Route path="/admin/etiquettes" element={<AdminTags />} />
              <Route path="/admin/parametres" element={<AdminSettings />} />
              <Route path="/admin/newsletter" element={<AdminNewsletter />} />
              <Route path="/admin/chatbot" element={<AdminChatbot />} />
              <Route path="/admin/formulaires" element={<AdminForms />} />
              <Route path="/admin/landing-pages" element={<AdminLandingPages />} />
              <Route path="/admin/app" element={<AdminApp />} />
              <Route path="/installer-app" element={<InstallApp />} />
              <Route path="/landing/solaire" element={<LandingSolaire />} />
              <Route path="/landing/isolation" element={<LandingIsolation />} />
              <Route path="/landing/pompe-a-chaleur" element={<LandingPompeAChaleur />} />
              <Route path="/landing/renovation-globale" element={<LandingRenovationGlobale />} />
              <Route path="/forum" element={<Forum />} />
              <Route path="/forum/categorie/:slug" element={<ForumCategory />} />
              <Route path="/forum/categorie/:slug/nouveau" element={<NewTopic />} />
              <Route path="/forum/sujet/:slug" element={<ForumTopic />} />
              <Route path="/forum/nouveau-sujet" element={<NewTopic />} />
              <Route path="/sitemap.xml" element={<Sitemap />} />
              <Route path="/mentions-legales" element={<MentionsLegales />} />
              <Route path="/politique-confidentialite" element={<PolitiqueConfidentialite />} />
              <Route path="/conditions-utilisation" element={<ConditionsUtilisation />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </MaintenanceMode>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
