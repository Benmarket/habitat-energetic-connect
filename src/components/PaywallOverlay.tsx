import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Lock, UserPlus, LogIn } from "lucide-react";
import { Link } from "react-router-dom";
import { GuideDownloadModal } from "./GuideDownloadModal";

interface PaywallOverlayProps {
  percentRemaining?: number;
  onSignupClick?: () => void;
}

export const PaywallOverlay = ({ 
  percentRemaining = 70,
  onSignupClick 
}: PaywallOverlayProps) => {
  const [modalOpen, setModalOpen] = useState(false);

  const handleSignupClick = () => {
    if (onSignupClick) {
      onSignupClick();
    } else {
      setModalOpen(true);
    }
  };

  return (
    <>
      <div className="relative">
        {/* Gradient blur overlay - positioned to overlap the cut content */}
        <div 
          className="absolute inset-x-0 -top-48 h-72 z-10"
          style={{
            background: 'linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.7) 30%, rgba(255,255,255,0.95) 60%, white 100%)',
            backdropFilter: 'blur(2px)',
            WebkitBackdropFilter: 'blur(2px)',
          }}
        />
        
        {/* Content overlay card */}
        <div className="relative z-20 flex items-center justify-center pt-8 pb-16">
          <div className="bg-white border-2 border-primary/20 rounded-2xl shadow-2xl p-8 max-w-md mx-4 text-center animate-fade-in">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock className="w-8 h-8 text-primary" />
            </div>
            
            <h3 className="text-2xl font-bold text-foreground mb-3">
              Contenu réservé aux membres
            </h3>
            
            <p className="text-muted-foreground mb-6">
              Il vous reste <span className="font-semibold text-primary">{percentRemaining}%</span> de ce guide à découvrir.
              <br />
              Inscrivez-vous gratuitement pour y accéder.
            </p>

            <div className="space-y-3">
              <Button 
                size="lg" 
                className="w-full gap-2 text-lg py-6"
                onClick={handleSignupClick}
              >
                <UserPlus className="w-5 h-5" />
                S'inscrire gratuitement
              </Button>
              
              <Link to="/connexion" className="block">
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="w-full gap-2"
                >
                  <LogIn className="w-5 h-5" />
                  Déjà membre ? Connectez-vous
                </Button>
              </Link>
            </div>

            <p className="text-xs text-muted-foreground mt-6">
              Accédez à tous nos guides premium, conseils d'experts et économisez sur vos travaux de rénovation.
            </p>
          </div>
        </div>
      </div>

      <GuideDownloadModal 
        open={modalOpen} 
        onOpenChange={setModalOpen}
        title="Inscription"
      />
    </>
  );
};
