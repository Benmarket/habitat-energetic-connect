import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface GuideDownloadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  guideTitle?: string;
}

export const GuideDownloadModal = ({
  open,
  onOpenChange,
  title = "Télécharger ce guide",
  guideTitle,
}: GuideDownloadModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        
        <div className="py-8 text-center">
          {guideTitle && (
            <p className="text-sm text-muted-foreground mb-4">
              {guideTitle}
            </p>
          )}
          
          <div className="p-8 border-2 border-dashed border-primary/30 rounded-lg bg-primary/5">
            <p className="text-lg font-medium text-primary">
              Form à insérer
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Le formulaire sera configuré ici
            </p>
          </div>
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
