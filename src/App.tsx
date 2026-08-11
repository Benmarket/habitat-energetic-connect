import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { RegionProvider } from "@/hooks/useRegionContext";
import AdminGuard from "@/components/AdminGuard";
import MaintenanceMode from "@/components/MaintenanceMode";
import CookieBanner from "@/components/CookieBanner";
import { ScrollToTop } from "@/components/ScrollToTop";
import PageViewTracker from "@/components/PageViewTracker";
import MetaPixel from "@/components/MetaPixel";
import { Loader2 } from "lucide-react";

// Eagerly loaded pages (public, frequently accessed)
import Index from "./pages/Index";
import Actualites from "./pages/Actualites";
import Aides from "./pages/Aides";
import Guides from "./pages/Guides";
import ArticleDetail from "./pages/ArticleDetail";
import LegacyPost from "./pages/LegacyPost";
import LegacyBlog from "./pages/LegacyBlog";
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
const AdminConfirmation = lazy(() => import("./pages/AdminConfirmation"));
const AdminPopups = lazy(() => import("./pages/AdminPopups"));
const AdminApp = lazy(() => import("./pages/AdminApp"));
const AdminLandingPages = lazy(() => import("./pages/AdminLandingPages"));
const AdminPagesAnchors = lazy(() => import("./pages/AdminPagesAnchors"));
const AdminSimulators = lazy(() => import("./pages/AdminSimulators"));
const AdminTrackingPixels = lazy(() => import("./pages/AdminTrackingPixels"));
const AdminAdvertising = lazy(() => import("./pages/AdminAdvertising"));
const AdminAuthors = lazy(() => import("./pages/AdminAuthors"));
const AdminMediatheque = lazy(() => import("./pages/AdminMediatheque"));
const AdminArticlesAudit = lazy(() => import("./pages/AdminArticlesAudit"));
const AdminInternalReviews = lazy(() => import("./pages/AdminInternalReviews"));
const LaisserAvis = lazy(() => import("./pages/LaisserAvis"));
const AdminEmails = lazy(() => import("./pages/AdminEmails"));
const DevenirPartenaire = lazy(() => import("./pages/DevenirPartenaire"));

const Sitemap = lazy(() => import("./pages/Sitemap"));
const AdminTraficSeo = lazy(() => import("./pages/AdminTraficSeo"));
const PlanDuSite = lazy(() => import("./pages/PlanDuSite"));
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
const OffresThematique = lazy(() => import("./pages/OffresThematique"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Merci = lazy(() => import("./pages/Merci"));
const SimulateurSolaire = lazy(() => import("./pages/SimulateurSolaire"));
const SimulateurSolaireLead = lazy(() => import("./pages/SimulateurSolaireLead"));
const ServiceInstallationSolaire = lazy(() => import("./pages/services/ServiceInstallationSolaire"));
const ServicePompesAChaleur = lazy(() => import("./pages/services/ServicePompesAChaleur"));

const ServiceStockageEnergie = lazy(() => import("./pages/services/ServiceStockageEnergie"));
const ServiceAuditEnergetique = lazy(() => import("./pages/services/ServiceAuditEnergetique"));
const ServiceAmeliorationHabitat = lazy(() => import("./pages/services/ServiceAmeliorationHabitat"));
const ActivateAccount = lazy(() => import("./pages/ActivateAccount"));
const Unsubscribe = lazy(() => import("./pages/Unsubscribe"));
const DesinscriptionRegistre = lazy(() => import("./pages/DesinscriptionRegistre"));
const NewsletterUnsubscribe = lazy(() => import("./pages/NewsletterUnsubscribe"));
const NewsletterQuickSubscribe = lazy(() => import("./pages/NewsletterQuickSubscribe"));
const PasswordReset = lazy(() => import("./pages/PasswordReset"));
const Economies = lazy(() => import("./pages/Economies"));
const AdminEconomiesAccess = lazy(() => import("./pages/AdminEconomiesAccess"));

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
            <MetaPixel />
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
                  {/* Anciennes URLs du blog Wix — conservation du référencement */}
                  <Route path="/post/:legacySlug" element={<LegacyPost />} />
                  <Route path="/blog" element={<LegacyBlog />} />
                  <Route path="/blog/categories/:categorySlug" element={<LegacyBlog />} />
                  <Route path="/aides" element={<Aides />} />
                  <Route path="/aide/:slug" element={<ArticleDetail />} />
                  <Route path="/guides" element={<Guides />} />
                  <Route path="/guide/:slug" element={<GuideDetail />} />
                  <Route path="/devenir-partenaire" element={<DevenirPartenaire />} />
                  <Route path="/connexion" element={<Auth />} />

                  {/* Authenticated pages - lazy loaded */}
                  <Route path="/tableau-de-bord" element={<Dashboard />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/profil" element={<Profil />} />
                  <Route path="/economies" element={<Economies />} />
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
                  <Route path="/admin/confirmation" element={<AdminGuard allowedRoles={["super_admin"]}><AdminConfirmation /></AdminGuard>} />
                  <Route path="/admin/popups" element={<AdminGuard allowedRoles={["super_admin"]}><AdminPopups /></AdminGuard>} />
                  <Route path="/admin/landing-pages" element={<AdminGuard allowedRoles={["super_admin"]}><AdminLandingPages /></AdminGuard>} />
                  <Route path="/admin/pages-ancres" element={<AdminGuard allowedRoles={["super_admin"]}><AdminPagesAnchors /></AdminGuard>} />
                  <Route path="/admin/simulateurs" element={<AdminGuard allowedRoles={["super_admin"]}><AdminSimulators /></AdminGuard>} />
                  <Route path="/admin/pixels" element={<AdminGuard allowedRoles={["super_admin"]}><AdminTrackingPixels /></AdminGuard>} />
                  <Route path="/admin/app" element={<AdminGuard allowedRoles={["super_admin"]}><AdminApp /></AdminGuard>} />
                  <Route path="/admin/auteurs" element={<AdminGuard allowedRoles={["super_admin"]}><AdminAuthors /></AdminGuard>} />
                  <Route path="/admin/mediatheque" element={<AdminGuard allowedRoles={["super_admin"]}><AdminMediatheque /></AdminGuard>} />
                  <Route path="/admin/economies-acces" element={<AdminGuard allowedRoles={["super_admin"]}><AdminEconomiesAccess /></AdminGuard>} />
                  <Route path="/admin/articles-audit" element={<AdminGuard allowedRoles={["super_admin"]}><AdminArticlesAudit /></AdminGuard>} />
                  <Route path="/admin/avis-internes" element={<AdminGuard allowedRoles={["super_admin"]}><AdminInternalReviews /></AdminGuard>} />
                  <Route path="/admin/trafic-seo" element={<AdminGuard allowedRoles={["super_admin"]}><AdminTraficSeo /></AdminGuard>} />
                  <Route path="/admin/emails" element={<AdminGuard allowedRoles={["super_admin"]}><AdminEmails /></AdminGuard>} />
                  <Route path="/laisser-un-avis" element={<LaisserAvis />} />


                  {/* Utility pages - lazy loaded */}
                  <Route path="/installer-app" element={<InstallApp />} />
                  <Route path="/offre-partenaire/:thematique" element={<OffresThematique />} />
                  <Route path="/offre-partenaire/:advertiserSlug/:id" element={<OffrePartenaire />} />

                  {/* Service pages - lazy loaded */}
                  <Route path="/services/installation-solaire" element={<ServiceInstallationSolaire />} />
                  <Route path="/services/pompes-a-chaleur" element={<ServicePompesAChaleur />} />
                  
                  <Route path="/services/stockage-energie" element={<ServiceStockageEnergie />} />
                  <Route path="/services/audit-energetique" element={<ServiceAuditEnergetique />} />
                  <Route path="/services/amelioration-habitat" element={<ServiceAmeliorationHabitat />} />

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

                  {/* Legal - lazy loaded. /sitemap.xml is served as static file from public/ */}
                  <Route path="/plan-du-site" element={<PlanDuSite />} />
                  <Route path="/mentions-legales" element={<MentionsLegales />} />
                  <Route path="/politique-confidentialite" element={<PolitiqueConfidentialite />} />
                  <Route path="/conditions-utilisation" element={<ConditionsUtilisation />} />
                  <Route path="/faq" element={<FAQ />} />
                  <Route path="/merci" element={<Merci />} />
                  {/* Ancien simulateur solaire — déplacé en zone admin en attendant le nouveau */}
                  <Route
                    path="/admin/simulateur-solaire-pro"
                    element={
                      <AdminGuard allowedRoles={["super_admin"]}>
                        <SimulateurSolaire />
                      </AdminGuard>
                    }
                  />

                  {/* Nouveau simulateur solaire grand public (lead-gen) */}
                  <Route path="/simulateurs/solaire" element={<SimulateurSolaireLead />} />
                  <Route path="/simulateur-solaire" element={<Navigate to="/simulateurs/solaire" replace />} />

                  {/* Email lifecycle pages */}
                  <Route path="/inscription/activer" element={<ActivateAccount />} />
                  <Route path="/mot-de-passe-oublie" element={<PasswordReset />} />
                  <Route path="/reinitialiser-mot-de-passe" element={<PasswordReset />} />
                  <Route path="/desinscription" element={<Unsubscribe />} />
                  <Route path="/unsubscribe" element={<Unsubscribe />} />
                  <Route path="/desinscription-registre" element={<DesinscriptionRegistre />} />
                  <Route path="/rgpd/desinscription" element={<Navigate to="/desinscription-registre" replace />} />
                  <Route path="/newsletter/desinscription" element={<NewsletterUnsubscribe />} />
                  <Route path="/newsletter/unsubscribe" element={<Navigate to="/newsletter/desinscription" replace />} />
                  <Route path="/newsletter/inscription-rapide" element={<NewsletterQuickSubscribe />} />

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
