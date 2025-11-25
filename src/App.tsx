import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import MaintenanceMode from "@/components/MaintenanceMode";
import Index from "./pages/Index";
import Actualites from "./pages/Actualites";
import ArticleDetail from "./pages/ArticleDetail";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import CreatePost from "./pages/CreatePost";
import ManageActualites from "./pages/ManageActualites";
import ManageGuides from "./pages/ManageGuides";
import ManageAides from "./pages/ManageAides";
import Administration from "./pages/Administration";
import AdminUsers from "./pages/AdminUsers";
import AdminCategories from "./pages/AdminCategories";
import AdminTags from "./pages/AdminTags";
import AdminSettings from "./pages/AdminSettings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <MaintenanceMode>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/actualites" element={<Actualites />} />
              <Route path="/actualites/:categorySlug/:slug" element={<ArticleDetail />} />
              <Route path="/connexion" element={<Auth />} />
              <Route path="/tableau-de-bord" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/creer-contenu" element={<CreatePost />} />
              <Route path="/gerer-actualites" element={<ManageActualites />} />
              <Route path="/gerer-guides" element={<ManageGuides />} />
              <Route path="/gerer-aides" element={<ManageAides />} />
              <Route path="/administration" element={<Administration />} />
              <Route path="/admin/utilisateurs" element={<AdminUsers />} />
              <Route path="/admin/categories" element={<AdminCategories />} />
              <Route path="/admin/etiquettes" element={<AdminTags />} />
              <Route path="/admin/parametres" element={<AdminSettings />} />
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
