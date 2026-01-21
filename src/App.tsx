import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { RegionProvider } from "@/hooks/useRegionContext";
import MaintenanceMode from "@/components/MaintenanceMode";
import CookieBanner from "@/components/CookieBanner";
import { ScrollToTop } from "@/components/ScrollToTop";
import PageViewTracker from "@/components/PageViewTracker";
import { Loader2 } from "lucide-react";

// Eagerly loaded pages (public, frequently accessed)
import Index from "./pages/Index";
import Actualites from "./pages/Actualites";
import Aides from "./pages/Aides";
import Guides from "./pages/Guides";
import ArticleDetail from "./pages/ArticleDetail";
import GuideDetail from "./pages/GuideDetail";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

// Lazy loaded components (heavy or admin-only)
const ChatBot = lazy(() => import("@/components/ChatBot").then(m => ({ default: m.ChatBot })));
const SitePopup = lazy(() => import("./components/SitePopup"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Profil = lazy(() => import("./pages/Profil"));
const CreatePost = lazy(() => import("./pages/CreatePost"));
const ManageActualites = lazy(() => import("./pages/ManageActualites"));
const ManageGuides = lazy(() => import("./pages/ManageGuides"));
const ManageAides = lazy(() => import("./pages/ManageAides"));
const ManageAnnonces = lazy(() => import("./pages/ManageAnnonces"));
const ManageAdvertisers = lazy(() => import("./pages/ManageAdvertisers"));
const ChatSupport = lazy(() => import("./pages/ChatSupport"));
const Administration = lazy(() => import("./pages/Administration"));
const AdminUsers = lazy(() => import("./pages/AdminUsers"));
const AdminCategories = lazy(() => import("./pages/AdminCategories"));
const AdminTags = lazy(() => import("./pages/AdminTags"));
const AdminSettings = lazy(() => import("./pages/AdminSettings"));
const AdminButtons = lazy(() => import("./pages/AdminButtons"));
const AdminCtaBanners = lazy(() => import("./pages/AdminCtaBanners"));
const AdminNewsletter = lazy(() => import("./pages/AdminNewsletter"));
const AdminChatbot = lazy(() => import("./pages/AdminChatbot"));
const AdminChatHistory = lazy(() => import("./pages/AdminChatHistory"));
const AdminForms = lazy(() => import("./pages/AdminForms"));
const AdminPopups = lazy(() => import("./pages/AdminPopups"));
const AdminApp = lazy(() => import("./pages/AdminApp"));
const AdminLandingPages = lazy(() => import("./pages/AdminLandingPages"));
const AdminSimulators = lazy(() => import("./pages/AdminSimulators"));
const AdminAdvertising = lazy(() => import("./pages/AdminAdvertising"));
const Sitemap = lazy(() => import("./pages/Sitemap"));
const PolitiqueConfidentialite = lazy(() => import("./pages/PolitiqueConfidentialite"));
const ConditionsUtilisation = lazy(() => import("./pages/ConditionsUtilisation"));
const MentionsLegales = lazy(() => import("./pages/MentionsLegales"));
const LandingSolaire = lazy(() => import("./pages/landing/LandingSolaire"));
const LandingIsolation = lazy(() => import("./pages/landing/LandingIsolation"));
const LandingPompeAChaleur = lazy(() => import("./pages/landing/LandingPompeAChaleur"));
const LandingRenovationGlobale = lazy(() => import("./pages/landing/LandingRenovationGlobale"));
const Forum = lazy(() => import("./pages/forum/Forum"));
const ForumCategory = lazy(() => import("./pages/forum/ForumCategory"));
const ForumTopic = lazy(() => import("./pages/forum/ForumTopic"));
const NewTopic = lazy(() => import("./pages/forum/NewTopic"));
const InstallApp = lazy(() => import("./pages/InstallApp"));
const OffrePartenaire = lazy(() => import("./pages/OffrePartenaire"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Merci = lazy(() => import("./pages/Merci"));

const queryClient = new QueryClient();

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <Loader2 className="w-8 h-8 animate-spin text-primary" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <RegionProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ScrollToTop />
            <PageViewTracker />
            <MaintenanceMode>
              <Suspense fallback={null}>
                <ChatBot />
                <SitePopup />
              </Suspense>
              <CookieBanner />
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  {/* Public pages - eagerly loaded */}
                  <Route path="/" element={<Index />} />
                  <Route path="/actualites" element={<Actualites />} />
                  <Route path="/actualites/:categorySlug/:slug" element={<ArticleDetail />} />
                  <Route path="/aides" element={<Aides />} />
                  <Route path="/aide/:slug" element={<ArticleDetail />} />
                  <Route path="/guides" element={<Guides />} />
                  <Route path="/guide/:slug" element={<GuideDetail />} />
                  <Route path="/connexion" element={<Auth />} />

                  {/* Authenticated pages - lazy loaded */}
                  <Route path="/tableau-de-bord" element={<Dashboard />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/profil" element={<Profil />} />
                  <Route path="/creer-contenu" element={<CreatePost />} />

                  {/* Management pages - lazy loaded */}
                  <Route path="/gerer-actualites" element={<ManageActualites />} />
                  <Route path="/gerer-guides" element={<ManageGuides />} />
                  <Route path="/gerer-aides" element={<ManageAides />} />
                  <Route path="/gerer-annonces" element={<ManageAnnonces />} />

                  {/* Admin pages - lazy loaded */}
                  <Route path="/admin/annonceurs" element={<AdminAdvertising />} />
                  <Route path="/admin/annonces" element={<AdminAdvertising />} />
                  <Route path="/chat-support" element={<ChatSupport />} />
                  <Route path="/administration" element={<Administration />} />
                  <Route path="/admin/utilisateurs" element={<AdminUsers />} />
                  <Route path="/admin/categories" element={<AdminCategories />} />
                  <Route path="/admin/etiquettes" element={<AdminTags />} />
                  <Route path="/admin/parametres" element={<AdminSettings />} />
                  <Route path="/admin/boutons" element={<AdminButtons />} />
                  <Route path="/admin/bandeaux-cta" element={<AdminCtaBanners />} />
                  <Route path="/admin/newsletter" element={<AdminNewsletter />} />
                  <Route path="/admin/chatbot" element={<AdminChatbot />} />
                  <Route path="/admin/chat-history" element={<AdminChatHistory />} />
                  <Route path="/admin/formulaires" element={<AdminForms />} />
                  <Route path="/admin/popups" element={<AdminPopups />} />
                  <Route path="/admin/landing-pages" element={<AdminLandingPages />} />
                  <Route path="/admin/simulateurs" element={<AdminSimulators />} />
                  <Route path="/admin/app" element={<AdminApp />} />

                  {/* Utility pages - lazy loaded */}
                  <Route path="/installer-app" element={<InstallApp />} />
                  <Route path="/offre-partenaire/:advertiserSlug/:id" element={<OffrePartenaire />} />

                  {/* Landing pages - lazy loaded */}
                  <Route path="/landing/solaire" element={<LandingSolaire />} />
                  <Route path="/landing/isolation" element={<LandingIsolation />} />
                  <Route path="/landing/pompe-a-chaleur" element={<LandingPompeAChaleur />} />
                  <Route path="/landing/renovation-globale" element={<LandingRenovationGlobale />} />

                  {/* Forum pages - lazy loaded */}
                  <Route path="/forum" element={<Forum />} />
                  <Route path="/forum/categorie/:slug" element={<ForumCategory />} />
                  <Route path="/forum/categorie/:slug/nouveau" element={<NewTopic />} />
                  <Route path="/forum/sujet/:slug" element={<ForumTopic />} />
                  <Route path="/forum/nouveau-sujet" element={<NewTopic />} />

                  {/* Legal & sitemap - lazy loaded */}
                  <Route path="/sitemap.xml" element={<Sitemap />} />
                  <Route path="/mentions-legales" element={<MentionsLegales />} />
                  <Route path="/politique-confidentialite" element={<PolitiqueConfidentialite />} />
                  <Route path="/conditions-utilisation" element={<ConditionsUtilisation />} />
                  <Route path="/faq" element={<FAQ />} />
                  <Route path="/merci" element={<Merci />} />

                  {/* Catch-all */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </MaintenanceMode>
          </BrowserRouter>
        </TooltipProvider>
      </RegionProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
