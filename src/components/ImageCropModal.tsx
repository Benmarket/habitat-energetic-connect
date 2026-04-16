import { useState, useRef, useCallback, useMemo } from "react";
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

function getCroppedCanvas(image: HTMLImageElement, crop: PixelCrop): string {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No 2d context");

  const renderedWidth = image.width;
  const renderedHeight = image.height;
  const naturalWidth = image.naturalWidth;
  const naturalHeight = image.naturalHeight;

  const scaleX = naturalWidth / renderedWidth;
  const scaleY = naturalHeight / renderedHeight;

  const sx = Math.round(crop.x * scaleX);
  const sy = Math.round(crop.y * scaleY);
  const sw = Math.round(crop.width * scaleX);
  const sh = Math.round(crop.height * scaleY);

  canvas.width = sw;
  canvas.height = sh;

  ctx.drawImage(image, sx, sy, sw, sh, 0, 0, sw, sh);

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
    if (!imgRef.current) return;

    const { naturalWidth, naturalHeight } = imgRef.current;
    const imgAspect = naturalWidth / naturalHeight;

    let cropW: number;
    let cropH: number;

    if (imgAspect > aspectRatio) {
      cropH = 90;
      cropW = (cropH * aspectRatio) / imgAspect;
    } else {
      cropW = 90;
      cropH = (cropW / aspectRatio) * imgAspect;
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
    if (!imgRef.current) return;

    const { naturalWidth, naturalHeight } = imgRef.current;
    const imgAspect = naturalWidth / naturalHeight;

    let width = 100;
    let height = 100;

    if (imgAspect > aspectRatio) {
      width = (100 * aspectRatio) / imgAspect;
    } else {
      height = (100 / aspectRatio) * imgAspect;
    }

    setCrop({
      unit: "%",
      x: (100 - width) / 2,
      y: (100 - height) / 2,
      width,
      height,
    });
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

  const previewStyle = useMemo(() => {
    if (!crop) return undefined;

    const width = Math.max(crop.width, 0.1);
    const height = Math.max(crop.height, 0.1);
    const scaleX = 100 / width;
    const scaleY = 100 / height;

    return {
      width: `${scaleX * 100}%`,
      height: `${scaleY * 100}%`,
      maxWidth: "none",
      transform: `translate(-${crop.x * scaleX}%, -${crop.y * scaleY}%)`,
      transformOrigin: "top left",
    } as const;
  }, [crop]);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl p-0 gap-0 overflow-hidden">
          <DialogHeader className="px-5 py-3 border-b">
            <DialogTitle className="text-base">Recadrer l'image</DialogTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              La zone pointillée correspond au rendu final de l’image sur la bande de la landing page.
            </p>
          </DialogHeader>

          <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div
              className="relative w-full bg-black/90 flex items-center justify-center overflow-hidden"
              style={{ maxHeight: "60vh", minHeight: "420px" }}
            >
              <ReactCrop
                crop={crop}
                onChange={(c) => setCrop(c)}
                onComplete={(c) => setCompletedCrop(c)}
                className="max-h-[60vh]"
                aspect={aspectRatio}
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

            <div className="border-l bg-muted/20 p-4 space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                  Aperçu bande landing page
                </p>
                <div className="rounded-xl border border-border bg-background p-3 shadow-sm">
                  <div className="overflow-hidden rounded-xl border border-border bg-muted/40 aspect-[9/4] relative">
                    {previewStyle ? (
                      <img
                        src={imageSrc}
                        alt="Aperçu du rendu final"
                        className="absolute inset-0 object-cover"
                        style={previewStyle}
                      />
                    ) : (
                      <div className="absolute inset-0 bg-muted" />
                    )}
                  </div>
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    Aperçu sans badges ni éléments superposés.
                  </p>
                </div>
              </div>

              {originalImageSrc && onRestoreOriginal ? (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                    Image originale
                  </p>
                  <button
                    type="button"
                    onClick={() => setConfirmRestoreOpen(true)}
                    className="flex flex-col items-start gap-1 rounded-md border border-border bg-background p-1.5 transition hover:border-primary hover:bg-background/90"
                    title="Restaurer l'image originale"
                  >
                    <img
                      src={originalImageSrc}
                      alt="Image originale"
                      className="h-16 w-16 rounded object-cover border border-border"
                      loading="lazy"
                    />
                    <span className="text-[10px] text-muted-foreground px-0.5">Restaurer l’originale</span>
                  </button>
                </div>
              ) : null}
            </div>
          </div>

          <div className="px-5 py-4 border-t bg-muted/30">
            <div className="flex items-center justify-between gap-4">
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
