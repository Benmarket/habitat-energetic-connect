import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Newspaper } from "lucide-react";
import { Link } from "react-router-dom";

const InstallerFinderSection = () => {
  const [postalCode, setPostalCode] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Functionality will be added later
    console.log("Searching for postal code:", postalCode);
  };

  return (
    <section id="installateurs" className="relative py-16 md:py-20 lg:py-24 pb-12 md:pb-16 overflow-hidden">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1509391366360-2e959784a276?w=1920&h=1080&fit=crop')",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/80 via-blue-800/70 to-green-900/60"></div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-5xl mx-auto text-center mb-12">
          <h2 className="text-xl md:text-3xl lg:text-4xl font-bold text-white mb-4 leading-tight">
            Votre portail de confiance pour les énergies renouvelables
          </h2>
          <p className="text-sm md:text-lg lg:text-xl text-white/95 font-light">
            Découvrez les meilleures offres et installez vos équipements avec les meilleurs professionnels locaux
          </p>
        </div>

        {/* Search Card */}
        <Card className="max-w-3xl mx-auto mb-8 shadow-2xl border-none">
          <CardContent className="p-8">
            <h3 className="text-2xl font-bold text-center mb-6">
              Trouvez un installateur près de chez vous
            </h3>
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
              <Input
                type="text"
                placeholder="Code postal"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                className="flex-1 h-14 text-lg px-6"
                maxLength={5}
              />
              <Button 
                type="submit"
                size="lg"
                className="h-14 px-8 bg-green-600 hover:bg-green-700 text-white font-semibold text-lg shadow-lg hover:shadow-xl transition-all"
              >
                Je découvre les offres
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-2xl mx-auto">
          <Button
            size="lg"
            className="w-full sm:w-auto h-14 px-8 bg-green-600 hover:bg-green-700 text-white font-semibold text-lg shadow-lg hover:shadow-xl transition-all gap-3"
          >
            <Search className="w-5 h-5" />
            Trouver un installateur
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="w-full sm:w-auto h-14 px-8 bg-white/95 hover:bg-white border-2 border-green-600/30 hover:border-green-600 text-foreground font-semibold text-lg shadow-lg hover:shadow-xl transition-all gap-3"
          >
            <Link to="/actualites">
              <Newspaper className="w-5 h-5" />
              Lire les actualités
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default InstallerFinderSection;
