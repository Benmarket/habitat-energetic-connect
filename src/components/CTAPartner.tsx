import { Button } from "@/components/ui/button";
import { Briefcase } from "lucide-react";

const CTAPartner = () => {
  return (
    <section id="devenir-partenaire" className="py-16 bg-green-50/50">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">
            Vous êtes un professionnel ?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Proposez vos offres sur Prime Énergies et touchez plus de clients qualifiés
          </p>
          <Button 
            size="lg"
            className="h-14 px-8 bg-green-600 hover:bg-green-700 text-white font-semibold text-lg shadow-lg hover:shadow-xl transition-all gap-3"
          >
            <Briefcase className="w-5 h-5" />
            Devenir partenaire
          </Button>
        </div>
      </div>
    </section>
  );
};

export default CTAPartner;
