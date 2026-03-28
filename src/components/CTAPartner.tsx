import { Button } from "@/components/ui/button";
import { Briefcase, ArrowRight } from "lucide-react";

const CTAPartner = () => {
  const handleClick = () => {
    // Dispatch event to preselect the subject in contact form
    window.dispatchEvent(
      new CustomEvent("contact-preselect", {
        detail: {
          subject: "demande-partenariat",
          accountType: "professionnel",
        },
      }),
    );

    // Navigate to contact section
    const contactSection = document.getElementById("contact");
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section
      className="py-6 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 relative overflow-hidden"
    >
      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,white_1px,transparent_1px)] bg-[length:20px_20px]"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8">
          <div className="flex items-center gap-3 text-white">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <Briefcase className="w-5 h-5" />
            </div>
            <div className="text-center md:text-left">
              <span className="font-bold text-lg md:text-xl">Vous êtes un professionnel ?</span>
              <span className="hidden md:inline text-white/90 ml-2">
                Proposez votre offre sur notre site. *respect obligatoire du cahier des charges prime energies
              </span>
            </div>
          </div>

          <Button
            size="lg"
            className="bg-white text-amber-700 hover:bg-amber-50 font-bold shadow-lg hover:shadow-xl transition-all duration-300 gap-2 hover:scale-105 px-6"
            onClick={handleClick}
          >
            Devenir partenaire
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default CTAPartner;
