import { NodeViewWrapper } from '@tiptap/react';
import { NodeViewProps } from '@tiptap/core';
import { CtaBannerAttributes } from './CustomCtaBanner';
import { useState, useRef } from 'react';

export const CtaBannerNodeView = ({ node, selected, editor, getPos }: NodeViewProps) => {
  const attrs = node.attrs as CtaBannerAttributes;
  const [isHovered, setIsHovered] = useState(false);
  const lastClickTime = useRef(0);

  const getBackgroundStyle = (): React.CSSProperties => {
    switch (attrs.templateStyle) {
      case 'wave':
        return {
          background: `linear-gradient(135deg, ${attrs.backgroundColor} 0%, ${attrs.secondaryColor} 100%)`,
        };
      case 'geometric':
        return {
          background: attrs.backgroundColor,
          backgroundImage: `linear-gradient(45deg, ${attrs.secondaryColor} 25%, transparent 25%), 
                            linear-gradient(-45deg, ${attrs.secondaryColor} 25%, transparent 25%)`,
          backgroundSize: '20px 20px',
        };
      case 'gradient':
        return {
          background: `linear-gradient(90deg, ${attrs.backgroundColor} 0%, ${attrs.secondaryColor} 50%, ${attrs.accentColor} 100%)`,
        };
      case 'minimal':
        return {
          background: attrs.backgroundColor,
          borderLeft: `4px solid ${attrs.accentColor}`,
        };
      default:
        return { background: attrs.backgroundColor };
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Éviter les clics multiples rapides
    const now = Date.now();
    if (now - lastClickTime.current < 300) {
      return;
    }
    lastClickTime.current = now;
    
    if (typeof getPos === 'function') {
      const pos = getPos();
      editor.commands.setNodeSelection(pos);
      
      setTimeout(() => {
        const event = new CustomEvent('edit-cta-banner', {
          detail: { attrs, pos },
        });
        window.dispatchEvent(event);
      }, 10);
    }
  };

  return (
    <NodeViewWrapper
      className="custom-cta-banner-wrapper my-8"
      data-cta-banner={attrs.bannerId}
    >
      <div
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          ...getBackgroundStyle(),
          borderRadius: '12px',
          overflow: 'hidden',
          cursor: 'pointer',
          outline: selected ? '3px solid rgba(59, 130, 246, 0.5)' : isHovered ? '2px solid rgba(59, 130, 246, 0.3)' : 'none',
          transition: 'outline 0.2s ease',
        }}
        title="Cliquez pour modifier le bandeau"
      >
        <div style={{ padding: '32px', textAlign: 'center', position: 'relative' }}>
          <h3 style={{ 
            color: attrs.textColor, 
            fontSize: '24px', 
            fontWeight: 700, 
            marginBottom: '8px',
            margin: 0,
            marginBlockEnd: '8px'
          }}>
            {attrs.title}
          </h3>
          {attrs.subtitle && (
            <p style={{ 
              color: attrs.textColor, 
              opacity: 0.9, 
              marginBottom: '16px',
              margin: 0,
              marginBlockEnd: '16px'
            }}>
              {attrs.subtitle}
            </p>
          )}
          <span
            style={{
              display: 'inline-block',
              padding: '12px 24px',
              background: attrs.buttonBackground,
              color: attrs.buttonTextColor,
              fontWeight: 500,
              borderRadius: `${attrs.buttonBorderRadius}px`,
              textDecoration: 'none',
            }}
          >
            {attrs.buttonText}
          </span>
        </div>
      </div>
    </NodeViewWrapper>
  );
};
