import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Wrench, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

const MaintenanceBanner = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <Alert className="fixed top-0 left-0 right-0 z-50 rounded-none border-x-0 border-t-0 border-b-2 border-orange-500 bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50 shadow-lg">
      <div className="container mx-auto flex items-center justify-between gap-4 px-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500/10">
            <Wrench className="h-5 w-5 text-orange-600 animate-pulse" />
          </div>
          <AlertDescription className="text-sm font-medium text-orange-900">
            ⚠️ Mode maintenance activé - Vous êtes connecté en tant qu'administrateur
          </AlertDescription>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => navigate("/admin/parametres")}
            variant="default"
            size="sm"
            className="bg-orange-600 hover:bg-orange-700 text-white shadow-md"
          >
            Désactiver le mode maintenance
          </Button>
          <Button
            onClick={() => setIsVisible(false)}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-orange-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Alert>
  );
};

export default MaintenanceBanner;
