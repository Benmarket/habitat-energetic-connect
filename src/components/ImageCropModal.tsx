import { useState, useRef, useCallback } from "react";
import ReactCrop, { type Crop, type PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RotateCcw, Check, X, Maximize } from "lucide-react";

interface ImageCropModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageSrc: string;
  onCropComplete: (croppedDataUrl: string) => void;
  aspectRatio?: number;
}

function getCroppedCanvas(
  image: HTMLImageElement,
  crop: PixelCrop,
  targetAspect: number
): string {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No 2d context");

  // The cropped region from the source
  const sx = crop.x;
  const sy = crop.y;
  const sw = crop.width;
  const sh = crop.height;

  // Output: fit into target aspect ratio (4:3 for LP)
  // The cropped content is placed inside, padded if needed
  const cropAspect = sw / sh;
  let outW: number, outH: number, dx: number, dy: number, dw: number, dh: number;

  if (Math.abs(cropAspect - targetAspect) < 0.01) {
    // Already matches — direct mapping
    outW = Math.min(sw, 1200);
    outH = Math.round(outW / targetAspect);
    dx = 0; dy = 0; dw = outW; dh = outH;
  } else if (cropAspect > targetAspect) {
    // Wider than target — fit by width, letterbox top/bottom
    outW = Math.min(sw, 1200);
    outH = Math.round(outW / targetAspect);
    dw = outW;
    dh = Math.round(outW / cropAspect);
    dx = 0;
    dy = Math.round((outH - dh) / 2);
  } else {
    // Taller than target — fit by height, pillarbox left/right
    outH = Math.min(sh, 900);
    outW = Math.round(outH * targetAspect);
    dh = outH;
    dw = Math.round(outH * cropAspect);
    dx = Math.round((outW - dw) / 2);
    dy = 0;
  }

  canvas.width = outW;
  canvas.height = outH;

  // Fill with a subtle background in case of letterbox/pillarbox
  ctx.fillStyle = "#111";
  ctx.fillRect(0, 0, outW, outH);

  ctx.drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh);

  return canvas.toDataURL("image/jpeg", 0.92);
}

const ImageCropModal = ({
  open,
  onOpenChange,
  imageSrc,
  onCropComplete,
  aspectRatio = 4 / 3,
}: ImageCropModalProps) => {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [saving, setSaving] = useState(false);
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
      const dataUrl = getCroppedCanvas(imgRef.current, completedCrop, aspectRatio);
      onCropComplete(dataUrl);
      onOpenChange(false);
    } catch (err) {
      console.error("Crop error:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-5 py-3 border-b">
          <DialogTitle className="text-base">Recadrer l'image</DialogTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Tirez les bords ou les coins pour rogner. Le résultat sera adapté au format 4:3 de la landing page.
          </p>
        </DialogHeader>

        {/* Crop area */}
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

        {/* Controls */}
        <div className="px-5 py-4 border-t bg-muted/30">
          <div className="flex items-center justify-between">
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
  );
};

export default ImageCropModal;
