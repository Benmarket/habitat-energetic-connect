import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { RegionProvider } from "@/hooks/useRegionContext";
import AdminGuard from "@/components/AdminGuard";
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
const AdminPagesAnchors = lazy(() => import("./pages/AdminPagesAnchors"));
const AdminSimulators = lazy(() => import("./pages/AdminSimulators"));
const AdminAdvertising = lazy(() => import("./pages/AdminAdvertising"));
const AdminAuthors = lazy(() => import("./pages/AdminAuthors"));
const Sitemap = lazy(() => import("./pages/Sitemap"));
const PolitiqueConfidentialite = lazy(() => import("./pages/PolitiqueConfidentialite"));
const ConditionsUtilisation = lazy(() => import("./pages/ConditionsUtilisation"));
const MentionsLegales = lazy(() => import("./pages/MentionsLegales"));
const LandingSolaire = lazy(() => import("./pages/landing/LandingSolaire"));
const LandingSolaireRegionale = lazy(() => import("./pages/landing/LandingSolaireRegionale"));
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
const SimulateurSolaire = lazy(() => import("./pages/SimulateurSolaire"));

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
      <BrowserRouter>
        <RegionProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
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
                  <Route path="/creer-contenu" element={<AdminGuard allowedRoles={["super_admin"]}><CreatePost /></AdminGuard>} />

                  {/* Management pages - super_admin only */}
                  <Route path="/gerer-actualites" element={<AdminGuard allowedRoles={["super_admin"]}><ManageActualites /></AdminGuard>} />
                  <Route path="/gerer-guides" element={<AdminGuard allowedRoles={["super_admin"]}><ManageGuides /></AdminGuard>} />
                  <Route path="/gerer-aides" element={<AdminGuard allowedRoles={["super_admin"]}><ManageAides /></AdminGuard>} />
                  <Route path="/gerer-annonces" element={<AdminGuard allowedRoles={["super_admin"]}><ManageAnnonces /></AdminGuard>} />

                  {/* Admin pages - super_admin only */}
                  <Route path="/admin/annonceurs" element={<AdminGuard allowedRoles={["super_admin"]}><AdminAdvertising /></AdminGuard>} />
                  <Route path="/admin/annonces" element={<AdminGuard allowedRoles={["super_admin"]}><AdminAdvertising /></AdminGuard>} />
                  <Route path="/chat-support" element={<AdminGuard allowedRoles={["super_admin"]}><ChatSupport /></AdminGuard>} />
                  <Route path="/administration" element={<AdminGuard allowedRoles={["super_admin"]}><Administration /></AdminGuard>} />
                  <Route path="/admin/utilisateurs" element={<AdminGuard allowedRoles={["super_admin"]}><AdminUsers /></AdminGuard>} />
                  <Route path="/admin/categories" element={<AdminGuard allowedRoles={["super_admin"]}><AdminCategories /></AdminGuard>} />
                  <Route path="/admin/etiquettes" element={<AdminGuard allowedRoles={["super_admin"]}><AdminTags /></AdminGuard>} />
                  <Route path="/admin/parametres" element={<AdminGuard allowedRoles={["super_admin"]}><AdminSettings /></AdminGuard>} />
                  <Route path="/admin/boutons" element={<AdminGuard allowedRoles={["super_admin"]}><AdminButtons /></AdminGuard>} />
                  <Route path="/admin/bandeaux-cta" element={<AdminGuard allowedRoles={["super_admin"]}><AdminCtaBanners /></AdminGuard>} />
                  <Route path="/admin/newsletter" element={<AdminGuard allowedRoles={["super_admin"]}><AdminNewsletter /></AdminGuard>} />
                  <Route path="/admin/chatbot" element={<AdminGuard allowedRoles={["super_admin"]}><AdminChatbot /></AdminGuard>} />
                  <Route path="/admin/chat-history" element={<AdminGuard allowedRoles={["super_admin"]}><AdminChatHistory /></AdminGuard>} />
                  <Route path="/admin/formulaires" element={<AdminGuard allowedRoles={["super_admin"]}><AdminForms /></AdminGuard>} />
                  <Route path="/admin/popups" element={<AdminGuard allowedRoles={["super_admin"]}><AdminPopups /></AdminGuard>} />
                  <Route path="/admin/landing-pages" element={<AdminGuard allowedRoles={["super_admin"]}><AdminLandingPages /></AdminGuard>} />
                  <Route path="/admin/pages-ancres" element={<AdminGuard allowedRoles={["super_admin"]}><AdminPagesAnchors /></AdminGuard>} />
                  <Route path="/admin/simulateurs" element={<AdminGuard allowedRoles={["super_admin"]}><AdminSimulators /></AdminGuard>} />
                  <Route path="/admin/app" element={<AdminGuard allowedRoles={["super_admin"]}><AdminApp /></AdminGuard>} />
                  <Route path="/admin/auteurs" element={<AdminGuard allowedRoles={["super_admin"]}><AdminAuthors /></AdminGuard>} />

                  {/* Utility pages - lazy loaded */}
                  <Route path="/installer-app" element={<InstallApp />} />
                  <Route path="/offre-partenaire/:advertiserSlug/:id" element={<OffrePartenaire />} />

                  {/* Landing pages - lazy loaded */}
                  <Route path="/landing/solaire" element={<LandingSolaire />} />
                  <Route path="/landing/solaire/:region" element={<LandingSolaireRegionale />} />
                  <Route path="/landing/solaire/:region/:variant" element={<LandingSolaireRegionale />} />
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
                  <Route path="/simulateur-solaire" element={<SimulateurSolaire />} />

                  {/* Catch-all */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </MaintenanceMode>
          </TooltipProvider>
        </RegionProvider>
      </BrowserRouter>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
