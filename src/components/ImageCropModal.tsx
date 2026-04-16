import { useState, useRef, useCallback } from "react";
import ReactCrop, { type Crop, type PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
import { RotateCcw, Check, X, Maximize } from "lucide-react";

interface ImageCropModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageSrc: string;
  originalImageSrc?: string;
  onCropComplete: (croppedDataUrl: string) => void;
  onRestoreOriginal?: () => void;
  aspectRatio?: number;
}

function getCroppedCanvas(
  image: HTMLImageElement,
  crop: PixelCrop
): string {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No 2d context");

  // Simply extract the cropped region at its natural size
  const outW = Math.round(crop.width);
  const outH = Math.round(crop.height);

  canvas.width = outW;
  canvas.height = outH;

  ctx.drawImage(
    image,
    crop.x, crop.y, crop.width, crop.height,
    0, 0, outW, outH
  );

  return canvas.toDataURL("image/jpeg", 0.92);
}

const ImageCropModal = ({
  open,
  onOpenChange,
  imageSrc,
  originalImageSrc,
  onCropComplete,
  onRestoreOriginal,
  aspectRatio = 4 / 3,
}: ImageCropModalProps) => {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [saving, setSaving] = useState(false);
  const [confirmRestoreOpen, setConfirmRestoreOpen] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const onImageLoad = useCallback(() => {
    // Start with a centered crop covering 80% of the image
    if (!imgRef.current) return;
    const { naturalWidth, naturalHeight } = imgRef.current;
    const imgAspect = naturalWidth / naturalHeight;

    let cropW: number, cropH: number;
    if (imgAspect > aspectRatio) {
      cropH = 90;
      cropW = (cropH / 100) * (naturalHeight / naturalWidth) * aspectRatio * 100;
    } else {
      cropW = 90;
      cropH = (cropW / 100) * (naturalWidth / naturalHeight) / aspectRatio * 100;
    }
    cropW = Math.min(cropW, 95);
    cropH = Math.min(cropH, 95);

    setCrop({
      unit: "%",
      x: (100 - cropW) / 2,
      y: (100 - cropH) / 2,
      width: cropW,
      height: cropH,
    });
  }, [aspectRatio]);

  const handleReset = () => {
    onImageLoad();
  };

  const handleSelectAll = () => {
    setCrop({ unit: "%", x: 0, y: 0, width: 100, height: 100 });
  };

  const handleSave = async () => {
    if (!completedCrop || !imgRef.current) return;
    setSaving(true);
    try {
      const dataUrl = getCroppedCanvas(imgRef.current, completedCrop);
      onCropComplete(dataUrl);
      onOpenChange(false);
    } catch (err) {
      console.error("Crop error:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl p-0 gap-0 overflow-hidden">
          <DialogHeader className="px-5 py-3 border-b">
            <DialogTitle className="text-base">Recadrer l'image</DialogTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Tirez les bords ou les coins pour rogner. Le résultat sera adapté au format 4:3 de la landing page.
            </p>
          </DialogHeader>

          <div className="relative w-full bg-black/90 flex items-center justify-center overflow-hidden" style={{ maxHeight: "60vh" }}>
            <ReactCrop
              crop={crop}
              onChange={(c) => setCrop(c)}
              onComplete={(c) => setCompletedCrop(c)}
              className="max-h-[60vh]"
              ruleOfThirds
            >
              <img
                ref={imgRef}
                src={imageSrc}
                alt="Image à recadrer"
                onLoad={onImageLoad}
                crossOrigin="anonymous"
                style={{ maxHeight: "60vh", maxWidth: "100%" }}
              />
            </ReactCrop>
          </div>

          <div className="px-5 py-4 border-t bg-muted/30">
            <div className="flex items-end justify-between gap-4">
              <div className="flex items-end gap-3">
                {originalImageSrc && onRestoreOriginal ? (
                  <button
                    type="button"
                    onClick={() => setConfirmRestoreOpen(true)}
                    className="flex flex-col items-start gap-1 rounded-md border border-border bg-background/80 p-1.5 transition hover:border-primary hover:bg-background"
                    title="Restaurer l'image originale"
                  >
                    <img
                      src={originalImageSrc}
                      alt="Image originale"
                      className="h-14 w-14 rounded object-cover border border-border"
                      loading="lazy"
                    />
                    <span className="text-[10px] text-muted-foreground px-0.5">Originale</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={handleReset} className="gap-1.5 text-xs">
                      <RotateCcw className="w-3.5 h-3.5" />
                      Réinitialiser
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleSelectAll} className="gap-1.5 text-xs">
                      <Maximize className="w-3.5 h-3.5" />
                      Tout sélectionner
                    </Button>
                  </div>
                )}

                {originalImageSrc && onRestoreOriginal ? (
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={handleReset} className="gap-1.5 text-xs">
                      <RotateCcw className="w-3.5 h-3.5" />
                      Réinitialiser
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleSelectAll} className="gap-1.5 text-xs">
                      <Maximize className="w-3.5 h-3.5" />
                      Tout sélectionner
                    </Button>
                  </div>
                ) : null}
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="gap-1.5 text-xs">
                  <X className="w-3.5 h-3.5" />
                  Annuler
                </Button>
                <Button size="sm" onClick={handleSave} disabled={saving || !completedCrop} className="gap-1.5 text-xs">
                  <Check className="w-3.5 h-3.5" />
                  {saving ? "Traitement..." : "Appliquer le recadrage"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmRestoreOpen} onOpenChange={setConfirmRestoreOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restaurer l'image originale ?</AlertDialogTitle>
            <AlertDialogDescription>
              L'image recadrée actuelle sera remplacée par la version originale enregistrée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={onRestoreOriginal}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Restaurer l'originale
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ImageCropModal;
