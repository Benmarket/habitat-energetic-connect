import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { Image as ImageIcon, AlignLeft, AlignCenter, AlignRight } from "lucide-react";
import { MediaLibrary } from "@/components/MediaLibrary";

interface ImageAttrs {
  src: string;
  alt: string;
  title: string;
  caption: string;
  width: number | null;
  align: 'left' | 'center' | 'right';
}

interface ImageEditorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (attrs: ImageAttrs) => void;
  initialAttrs?: Partial<ImageAttrs>;
}

export const ImageEditorModal = ({ open, onOpenChange, onSave, initialAttrs }: ImageEditorModalProps) => {
  const [src, setSrc] = useState(initialAttrs?.src || '');
  const [alt, setAlt] = useState(initialAttrs?.alt || '');
  const [title, setTitle] = useState(initialAttrs?.title || '');
  const [caption, setCaption] = useState(initialAttrs?.caption || '');
  const [width, setWidth] = useState<number | null>(initialAttrs?.width || null);
  const [align, setAlign] = useState<'left' | 'center' | 'right'>(initialAttrs?.align || 'center');
  const [mediaLibraryOpen, setMediaLibraryOpen] = useState(false);

  useEffect(() => {
    if (open && initialAttrs) {
      setSrc(initialAttrs.src || '');
      setAlt(initialAttrs.alt || '');
      setTitle(initialAttrs.title || '');
      setCaption(initialAttrs.caption || '');
      setWidth(initialAttrs.width || null);
      setAlign(initialAttrs.align || 'center');
    }
  }, [open, initialAttrs]);

  const handleSave = () => {
    onSave({ src, alt, title, caption, width, align });
    onOpenChange(false);
  };

  const handleSelectImage = (url: string, altText: string) => {
    setSrc(url);
    if (!alt) setAlt(altText);
    setMediaLibraryOpen(false);
  };

  const handleResetWidth = () => {
    setWidth(null);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-primary" />
              Modifier l'image
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Aperçu de l'image */}
            {src && (
              <div className="border rounded-lg p-4 bg-muted/30">
                <figure className={`text-${align}`}>
                  <img
                    src={src}
                    alt={alt}
                    title={title}
                    style={{
                      width: width ? `${width}px` : 'auto',
                      maxWidth: '100%',
                      height: 'auto',
                      borderRadius: '8px',
                      display: 'inline-block',
                    }}
                  />
                  {caption && (
                    <figcaption className="text-sm text-muted-foreground mt-2 text-center italic">
                      {caption}
                    </figcaption>
                  )}
                </figure>
              </div>
            )}

            {/* Source de l'image */}
            <div className="space-y-2">
              <Label>Source de l'image</Label>
              <div className="flex gap-2">
                <Input
                  value={src}
                  onChange={(e) => setSrc(e.target.value)}
                  placeholder="URL de l'image"
                  className="flex-1"
                />
                <Button
                  type="button"
                  onClick={() => setMediaLibraryOpen(true)}
                  variant="outline"
                >
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Choisir
                </Button>
              </div>
            </div>

            {/* Titre de l'image */}
            <div className="space-y-2">
              <Label htmlFor="title">Titre de l'image</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Titre affiché au survol de l'image"
              />
              <p className="text-xs text-muted-foreground">
                Apparaît au survol de l'image (attribut title)
              </p>
            </div>

            {/* Texte alternatif */}
            <div className="space-y-2">
              <Label htmlFor="alt">Description / Texte alternatif (SEO)</Label>
              <Input
                id="alt"
                value={alt}
                onChange={(e) => setAlt(e.target.value)}
                placeholder="Description de l'image pour le référencement"
              />
              <p className="text-xs text-muted-foreground">
                Utilisé par les moteurs de recherche et les lecteurs d'écran
              </p>
            </div>

            {/* Légende */}
            <div className="space-y-2">
              <Label htmlFor="caption">Légende</Label>
              <Textarea
                id="caption"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Légende visible sous l'image (ex: Source, crédit photo, contexte...)"
                rows={2}
              />
              <p className="text-xs text-muted-foreground">
                Texte affiché en dessous de l'image, visible par les lecteurs
              </p>
            </div>

            {/* Largeur */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Largeur: {width ? `${width}px` : 'Auto'}</Label>
                {width && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleResetWidth}
                  >
                    Réinitialiser
                  </Button>
                )}
              </div>
              <Slider
                value={[width || 600]}
                onValueChange={([value]) => setWidth(value)}
                min={100}
                max={1200}
                step={10}
                disabled={!src}
              />
              <p className="text-xs text-muted-foreground">
                Ajustez la largeur de l'image (100px - 1200px)
              </p>
            </div>

            {/* Alignement */}
            <div className="space-y-2">
              <Label>Alignement</Label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  type="button"
                  variant={align === 'left' ? 'default' : 'outline'}
                  onClick={() => setAlign('left')}
                  className="gap-2"
                >
                  <AlignLeft className="w-4 h-4" />
                  Gauche
                </Button>
                <Button
                  type="button"
                  variant={align === 'center' ? 'default' : 'outline'}
                  onClick={() => setAlign('center')}
                  className="gap-2"
                >
                  <AlignCenter className="w-4 h-4" />
                  Centre
                </Button>
                <Button
                  type="button"
                  variant={align === 'right' ? 'default' : 'outline'}
                  onClick={() => setAlign('right')}
                  className="gap-2"
                >
                  <AlignRight className="w-4 h-4" />
                  Droite
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="button" onClick={handleSave} disabled={!src}>
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <MediaLibrary
        open={mediaLibraryOpen}
        onOpenChange={setMediaLibraryOpen}
        onSelect={handleSelectImage}
      />
    </>
  );
};
