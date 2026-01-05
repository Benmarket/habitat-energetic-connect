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
import { CheckCircle2 } from "lucide-react";

export interface ChangeItem {
  category: string;
  changes: string[];
}

interface ConfirmChangesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  changes: ChangeItem[];
  onConfirm: () => void;
  isLoading?: boolean;
}

const ConfirmChangesModal = ({
  open,
  onOpenChange,
  changes,
  onConfirm,
  isLoading = false,
}: ConfirmChangesModalProps) => {
  const totalChanges = changes.reduce((acc, item) => acc + item.changes.length, 0);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-primary" />
            Confirmer les modifications
          </AlertDialogTitle>
          <AlertDialogDescription>
            Vous êtes sur le point d'enregistrer {totalChanges} modification{totalChanges > 1 ? 's' : ''}.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {changes.map((item, index) => (
            <div key={index} className="space-y-2">
              <h4 className="font-medium text-sm text-foreground">{item.category}</h4>
              <ul className="space-y-1 pl-4">
                {item.changes.map((change, changeIndex) => (
                  <li 
                    key={changeIndex} 
                    className="text-sm text-muted-foreground flex items-start gap-2"
                  >
                    <span className="text-primary mt-1">•</span>
                    <span>{change}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Annuler</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isLoading}>
            {isLoading ? "Enregistrement..." : "Confirmer"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ConfirmChangesModal;
