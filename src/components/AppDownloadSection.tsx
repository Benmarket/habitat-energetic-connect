import { Smartphone, TrendingUp, BarChart3, Apple } from "lucide-react";
import { Button } from "./ui/button";

const AppDownloadSection = () => {
  return (
    <section className="py-12 bg-gradient-to-br from-primary/5 via-background to-primary/10 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />
      <div className="absolute top-10 -right-20 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-10 -left-20 w-80 h-80 bg-accent/10 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center max-w-6xl mx-auto">
          {/* Left: Content */}
          <div className="space-y-4 animate-fade-in">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-sm font-semibold">
              <Smartphone className="w-4 h-4" />
              Nouveau
            </div>
            
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground">
              Téléchargez l'app{" "}
              <span className="text-primary">Prime Énergies</span>
            </h2>
            
            <p className="text-base text-muted-foreground leading-relaxed">
              Suivez vos économies d'énergie en temps réel, gérez votre tableau de bord 
              et accédez à tous nos services directement depuis votre smartphone.
            </p>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-sm">Économies en temps réel</h3>
                  <p className="text-sm text-muted-foreground">
                    Visualisez vos économies d'énergie avec des graphiques détaillés
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <BarChart3 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-sm">Tableau de bord personnalisé</h3>
                  <p className="text-sm text-muted-foreground">
                    Accédez à toutes vos informations et statistiques en un coup d'œil
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white shadow-lg hover:shadow-xl transition-all duration-300 group"
              >
                <Apple className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                App Store
              </Button>
              
              <Button 
                size="lg" 
                variant="outline"
                className="border-2 hover:bg-primary/5 transition-all duration-300 group"
              >
                <svg 
                  className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" 
                  viewBox="0 0 24 24" 
                  fill="currentColor"
                >
                  <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.916V2.73a1 1 0 0 1 .609-.916zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 0 1 0 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.802 8.99l-2.303 2.303-8.635-8.635z"/>
                </svg>
                Google Play
              </Button>
            </div>
          </div>

          {/* Right: App Mockup */}
          <div className="relative animate-fade-in lg:scale-95" style={{ animationDelay: "0.2s" }}>
            <div className="relative mx-auto max-w-sm">
              {/* Phone mockup with dashboard */}
              <div className="relative z-20 bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2.5rem] p-3 shadow-2xl border-[6px] border-slate-900">
                <div className="bg-background rounded-[2rem] overflow-hidden shadow-inner">
                  {/* Phone notch */}
                  <div className="h-5 bg-gradient-to-b from-primary/10 to-transparent relative">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-5 bg-slate-900 rounded-b-2xl" />
                  </div>
                  
                  {/* App content preview */}
                  <div className="p-4 space-y-3">
                    {/* User header */}
                    <div className="flex items-center gap-2 pb-3 border-b border-border">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-sm">
                        BM
                      </div>
                      <div>
                        <p className="font-semibold text-xs">Ben Market</p>
                        <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                          particulier
                        </span>
                      </div>
                    </div>

                    {/* Dashboard preview */}
                    <div className="space-y-2">
                      <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                        Tableau de bord
                      </h3>
                      
                      {/* Stats cards */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-2 rounded-lg">
                          <p className="text-[10px] text-muted-foreground">Économies</p>
                          <p className="text-base font-bold text-primary">2 450€</p>
                        </div>
                        <div className="bg-gradient-to-br from-accent/10 to-accent/5 p-2 rounded-lg">
                          <p className="text-[10px] text-muted-foreground">CO₂ évité</p>
                          <p className="text-base font-bold text-accent">3.2t</p>
                        </div>
                      </div>

                      {/* Chart preview */}
                      <div className="bg-card p-2 rounded-lg border border-border">
                        <p className="text-[10px] text-muted-foreground mb-1.5">Économies réalisées</p>
                        <div className="flex items-end gap-1 h-12">
                          <div className="w-full bg-gradient-to-t from-primary to-primary/50 rounded-t" style={{ height: '60%' }} />
                          <div className="w-full bg-gradient-to-t from-primary to-primary/50 rounded-t" style={{ height: '80%' }} />
                          <div className="w-full bg-gradient-to-t from-primary to-primary/50 rounded-t" style={{ height: '45%' }} />
                          <div className="w-full bg-gradient-to-t from-primary to-primary/50 rounded-t" style={{ height: '90%' }} />
                          <div className="w-full bg-gradient-to-t from-primary to-primary/50 rounded-t" style={{ height: '70%' }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating elements */}
              <div className="absolute -top-3 -right-3 bg-primary text-white p-3 rounded-xl shadow-xl animate-float z-30">
                <TrendingUp className="w-5 h-5" />
              </div>
              
              <div className="absolute -bottom-3 -left-3 bg-accent text-white p-3 rounded-xl shadow-xl animate-float z-30" style={{ animationDelay: "1s" }}>
                <BarChart3 className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AppDownloadSection;
