import { NodeViewWrapper } from '@tiptap/react';
import { useState, useEffect, useRef } from 'react';

export const ImageNodeView = ({ node, updateAttributes, deleteNode, selected }: any) => {
  const [isResizing, setIsResizing] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(0);
  const imgRef = useRef<HTMLImageElement>(null);

  const { src, alt, title, caption, width, align } = node.attrs;

  const handleDoubleClick = () => {
    const event = new CustomEvent('edit-image', {
      detail: { attrs: node.attrs },
    });
    window.dispatchEvent(event);
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

    const handleMouseUp = () => {
      setIsResizing(false);
    };

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
      <figure className={`relative inline-block ${selected ? 'ring-2 ring-primary ring-offset-2 rounded-lg' : ''}`}>
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
          }}
          onDoubleClick={handleDoubleClick}
          draggable={false}
        />

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

            <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 flex gap-1 bg-background border rounded-lg shadow-lg p-1">
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
                onClick={handleDoubleClick}
                className="p-1.5 rounded hover:bg-accent transition-colors"
                title="Modifier l'image"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
                </svg>
              </button>
              <button
                onClick={deleteNode}
                className="p-1.5 rounded hover:bg-destructive hover:text-destructive-foreground transition-colors"
                title="Supprimer l'image"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </button>
            </div>
          </>
        )}
      </figure>
    </NodeViewWrapper>
  );
};
