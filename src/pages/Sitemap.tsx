import { useEffect } from "react";

const Sitemap = () => {
  useEffect(() => {
    // Redirect to the edge function sitemap
    const sitemapUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-sitemap`;
    window.location.href = sitemapUrl;
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <p className="text-muted-foreground">Génération du sitemap...</p>
      </div>
    </div>
  );
};

export default Sitemap;
