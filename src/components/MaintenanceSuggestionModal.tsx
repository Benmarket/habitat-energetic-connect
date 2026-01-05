import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle, Wrench } from "lucide-react";

interface MaintenanceSuggestionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccept: () => void;
  onCancel: () => void;
}

const MaintenanceSuggestionModal = ({
  open,
  onOpenChange,
  onAccept,
  onCancel,
}: MaintenanceSuggestionModalProps) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/30">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
            <AlertDialogTitle>Toutes les bandes désactivées</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-left space-y-3">
            <p>
              Vous êtes sur le point de désactiver toutes les bandes de la page d'accueil. 
              Cela rendra la page d'accueil vide pour vos visiteurs.
            </p>
            <p className="font-medium text-foreground">
              Souhaitez-vous plutôt activer le mode maintenance du site ?
            </p>
            <p className="text-sm text-muted-foreground">
              Le mode maintenance affichera un message personnalisé à vos visiteurs 
              pendant que vous travaillez sur votre site.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:gap-0">
          <AlertDialogCancel onClick={onCancel}>
            Annuler
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={onAccept}
            className="bg-amber-600 hover:bg-amber-700"
          >
            <Wrench className="w-4 h-4 mr-2" />
            Activer le mode maintenance
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default MaintenanceSuggestionModal;
