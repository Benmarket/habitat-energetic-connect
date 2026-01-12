import { Button } from "@/components/ui/button";
import { Briefcase, Building2, Sparkles } from "lucide-react";

const CTAPartner = () => {
  const handleClick = () => {
    // Dispatch event to preselect the subject in contact form
    window.dispatchEvent(new CustomEvent('contact-preselect', {
      detail: {
        subject: 'aide-dossier-subvention',
        accountType: 'professionnel'
      }
    }));
    
    // Navigate to contact section
    const contactSection = document.getElementById('contact');
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="devenir-partenaire" className="py-10 bg-gradient-to-b from-background via-green-50/40 to-background relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-10 left-1/4 w-48 h-48 bg-green-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-10 right-1/4 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Header Badge - Style cohérent avec Offres Partenaires */}
          <div className="inline-flex items-center gap-2 md:gap-3 mb-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 px-4 md:px-6 py-2 md:py-3 rounded-full backdrop-blur-sm border-2 border-green-500/30 shadow-lg shadow-green-500/20 hover:shadow-xl hover:shadow-green-500/30 transition-all duration-300 hover:scale-105">
            <div className="p-1.5 md:p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg shadow-lg">
              <Building2 className="w-4 h-4 md:w-5 md:h-5 text-white" />
            </div>
            <h2 className="text-xl md:text-2xl lg:text-3xl font-extrabold bg-gradient-to-r from-green-600 via-emerald-500 to-green-600 bg-clip-text text-transparent whitespace-nowrap">
              Vous êtes un professionnel ?
            </h2>
          </div>
          
          <p className="text-sm md:text-base text-muted-foreground mb-6 max-w-2xl mx-auto leading-relaxed">
            Proposez vos offres sur Prime Énergies et touchez plus de clients qualifiés
          </p>
          
          {/* Decorative divider */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="h-1 w-12 bg-gradient-to-r from-transparent via-green-500 to-transparent rounded-full"></div>
          </div>
          
          <Button 
            size="lg"
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold text-base shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40 transition-all duration-300 gap-2 hover:scale-105 px-8 py-5"
            onClick={handleClick}
          >
            <Briefcase className="w-5 h-5" />
            Devenir partenaire
            <Sparkles className="w-4 h-4 opacity-70" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default CTAPartner;
