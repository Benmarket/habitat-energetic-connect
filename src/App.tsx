import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Actualites from "./pages/Actualites";
import ArticleDetail from "./pages/ArticleDetail";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import CreatePost from "./pages/CreatePost";
import AdminCategories from "./pages/AdminCategories";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/actualites" element={<Actualites />} />
            <Route path="/actualites/:categorySlug/:slug" element={<ArticleDetail />} />
            <Route path="/connexion" element={<Auth />} />
            <Route path="/tableau-de-bord" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/creer-contenu" element={<CreatePost />} />
            <Route path="/admin/categories" element={<AdminCategories />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
