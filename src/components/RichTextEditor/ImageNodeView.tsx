import { NodeViewWrapper } from '@tiptap/react';
import { useState, useEffect, useRef } from 'react';
import { RefreshCw, Upload, Image as ImageIcon, Pencil, Trash2 } from 'lucide-react';

export const ImageNodeView = ({ node, updateAttributes, deleteNode, selected, editor }: any) => {
  const [isResizing, setIsResizing] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const { src, alt, title, caption, width, align } = node.attrs;

  const handleDoubleClick = () => {
    const event = new CustomEvent('edit-image', {
      detail: { attrs: node.attrs },
    });
    window.dispatchEvent(event);
  };

  const handleRegenerate = () => {
    // Get surrounding section context for smart regeneration
    const sectionContext = getSectionContext();
    const event = new CustomEvent('regenerate-image', {
      detail: { attrs: node.attrs, sectionContext },
    });
    window.dispatchEvent(event);
  };

  const handleUpload = () => {
    const event = new CustomEvent('upload-image-replace', {
      detail: { attrs: node.attrs },
    });
    window.dispatchEvent(event);
  };

  const handleMediaLibrary = () => {
    const event = new CustomEvent('medialibrary-image-replace', {
      detail: { attrs: node.attrs },
    });
    window.dispatchEvent(event);
  };

  const getSectionContext = (): string => {
    if (!editor) return '';
    try {
      // Get text content around this image for context
      const pos = editor.view.state.selection.from;
      const doc = editor.state.doc;
      const textBefore = doc.textBetween(Math.max(0, pos - 500), pos, '\n');
      const textAfter = doc.textBetween(pos, Math.min(doc.content.size, pos + 500), '\n');
      return `${textBefore}\n${textAfter}`.trim();
    } catch {
      return '';
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setStartX(e.clientX);
    setStartWidth(imgRef.current?.offsetWidth || width || 300);
  };

  useEffect(() => {
    if (!isResizing) return;
    const handleMouseMove = (e: MouseEvent) => {
      const diff = e.clientX - startX;
      const newWidth = Math.max(100, Math.min(startWidth + diff, 1200));
      updateAttributes({ width: newWidth });
    };
    const handleMouseUp = () => setIsResizing(false);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, startX, startWidth, updateAttributes]);

  const alignmentClass = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  }[align];

  if (!src) {
    return (
      <NodeViewWrapper className="my-4 text-center">
        <div className="text-muted-foreground italic">Image sans source</div>
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper
      className={`custom-image-wrapper my-4 ${alignmentClass}`}
      style={{ display: 'block' }}
    >
      <figure
        className={`relative inline-block ${selected ? 'ring-2 ring-primary ring-offset-2 rounded-lg' : ''}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <img
          ref={imgRef}
          src={src}
          alt={alt || ''}
          title={title || undefined}
          style={{
            width: width ? `${width}px` : 'auto',
            maxWidth: '100%',
            height: 'auto',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'block',
            transition: 'filter 0.2s, transform 0.2s',
            filter: isHovered ? 'brightness(0.5)' : 'none',
            transform: isHovered ? 'scale(1.01)' : 'none',
          }}
          onDoubleClick={handleDoubleClick}
          draggable={false}
        />

        {/* Hover overlay with action buttons */}
        {isHovered && !selected && (
          <div className="absolute inset-0 flex items-center justify-center gap-2 animate-in fade-in duration-200 z-10">
            <button
              onClick={handleRegenerate}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/90 hover:bg-primary text-primary-foreground text-xs font-medium rounded-md shadow-lg transition-colors"
              title="Régénérer avec l'IA"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Régénérer
            </button>
            <button
              onClick={handleUpload}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary/90 hover:bg-secondary text-secondary-foreground text-xs font-medium rounded-md shadow-lg transition-colors"
              title="Uploader une image"
            >
              <Upload className="w-3.5 h-3.5" />
              Uploader
            </button>
            <button
              onClick={handleMediaLibrary}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary/90 hover:bg-secondary text-secondary-foreground text-xs font-medium rounded-md shadow-lg transition-colors"
              title="Choisir depuis la bibliothèque"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              Bibliothèque
            </button>
          </div>
        )}

        {/* Légende sous l'image */}
        {caption && (
          <figcaption className="text-sm text-muted-foreground mt-2 text-center italic px-2">
            {caption}
          </figcaption>
        )}

        {/* Contrôles visibles en sélection */}
        {selected && (
          <>
            <div
              className="absolute top-1/2 -right-2 w-4 h-4 bg-primary rounded-full cursor-ew-resize transform -translate-y-1/2 border-2 border-background shadow-lg hover:scale-125 transition-transform"
              onMouseDown={handleMouseDown}
              title="Redimensionner l'image"
            />
            <div
              className="absolute top-1/2 -left-2 w-4 h-4 bg-primary rounded-full cursor-ew-resize transform -translate-y-1/2 border-2 border-background shadow-lg hover:scale-125 transition-transform"
              onMouseDown={handleMouseDown}
              title="Redimensionner l'image"
            />

            <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 flex gap-1 bg-background border rounded-lg shadow-lg p-1 z-20">
              <button
                onClick={() => updateAttributes({ align: 'left' })}
                className={`p-1.5 rounded hover:bg-accent transition-colors ${align === 'left' ? 'bg-accent' : ''}`}
                title="Aligner à gauche"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="17" y1="10" x2="3" y2="10" /><line x1="21" y1="6" x2="3" y2="6" /><line x1="21" y1="14" x2="3" y2="14" /><line x1="17" y1="18" x2="3" y2="18" />
                </svg>
              </button>
              <button
                onClick={() => updateAttributes({ align: 'center' })}
                className={`p-1.5 rounded hover:bg-accent transition-colors ${align === 'center' ? 'bg-accent' : ''}`}
                title="Centrer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="10" x2="6" y2="10" /><line x1="21" y1="6" x2="3" y2="6" /><line x1="21" y1="14" x2="3" y2="14" /><line x1="18" y1="18" x2="6" y2="18" />
                </svg>
              </button>
              <button
                onClick={() => updateAttributes({ align: 'right' })}
                className={`p-1.5 rounded hover:bg-accent transition-colors ${align === 'right' ? 'bg-accent' : ''}`}
                title="Aligner à droite"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="21" y1="10" x2="7" y2="10" /><line x1="21" y1="6" x2="3" y2="6" /><line x1="21" y1="14" x2="3" y2="14" /><line x1="21" y1="18" x2="7" y2="18" />
                </svg>
              </button>
              <div className="w-px bg-border mx-1" />
              <button
                onClick={handleRegenerate}
                className="p-1.5 rounded hover:bg-accent transition-colors text-primary"
                title="Régénérer l'image"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={handleDoubleClick}
                className="p-1.5 rounded hover:bg-accent transition-colors"
                title="Modifier l'image"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={deleteNode}
                className="p-1.5 rounded hover:bg-destructive hover:text-destructive-foreground transition-colors"
                title="Supprimer l'image"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </>
        )}
      </figure>
    </NodeViewWrapper>
  );
};
