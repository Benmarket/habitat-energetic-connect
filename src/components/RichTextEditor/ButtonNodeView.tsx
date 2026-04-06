import { NodeViewWrapper } from '@tiptap/react';
import { NodeViewProps } from '@tiptap/core';
import { ButtonAttributes } from './CustomButton';
import { useState, useRef } from 'react';

export const ButtonNodeView = ({ node, selected, editor, getPos }: NodeViewProps) => {
  const attrs = node.attrs as ButtonAttributes;
  const [isHovered, setIsHovered] = useState(false);
  const lastClickTime = useRef(0);

  const sizeMap = {
    small: '14px',
    medium: '16px',
    large: '18px',
  };

  const shadowMap = {
    none: 'none',
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  };

  const getBackground = (isHover: boolean = false) => {
    if (!attrs.useGradient) {
      return attrs.backgroundColor;
    }

    const angle = attrs.gradientAngle;
    const color1 = attrs.gradientColor1;
    const color2 = attrs.gradientColor2;

    if (attrs.gradientType === 'linear') {
      // Animation de shift au hover
      if (isHover && attrs.hoverGradientShift) {
        const shiftedAngle = (angle + 45) % 360;
        return `linear-gradient(${shiftedAngle}deg, ${color1}, ${color2})`;
      }
      return `linear-gradient(${angle}deg, ${color1}, ${color2})`;
    } else {
      // Radial gradient
      if (isHover && attrs.hoverGradientShift) {
        return `radial-gradient(circle at 30% 30%, ${color1}, ${color2})`;
      }
      return `radial-gradient(circle at center, ${color1}, ${color2})`;
    }
  };

  const widthStyle =
    attrs.width === 'full' ? '100%' : attrs.width === 'custom' ? `${attrs.customWidth}px` : 'auto';

  const border = attrs.borderWidth > 0 
    ? `${attrs.borderWidth}px ${attrs.borderStyle} ${attrs.borderColor}`
    : 'none';

  const buttonStyle: React.CSSProperties = {
    background: getBackground(isHovered),
    color: attrs.textColor,
    padding: `${attrs.paddingY}px ${attrs.paddingX}px`,
    borderRadius: `${attrs.borderRadius}px`,
    fontSize: sizeMap[attrs.size],
    fontWeight: 500,
    textDecoration: 'none',
    display: 'inline-block',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    border,
    cursor: 'pointer',
    width: widthStyle,
    textAlign: 'center',
    boxShadow: selected ? '0 0 0 3px rgba(59, 130, 246, 0.5)' : shadowMap[attrs.shadowSize],
    position: 'relative',
    overflow: 'hidden',
    whiteSpace: 'normal',
    wordBreak: 'break-word',
    maxWidth: '100%',
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
      
      // Utiliser setTimeout pour éviter les conflits avec la fermeture du modal
      setTimeout(() => {
        const event = new CustomEvent('edit-button', {
          detail: { attrs, pos },
        });
        window.dispatchEvent(event);
      }, 10);
    }
  };

  return (
    <NodeViewWrapper
      className="custom-button-wrapper my-4"
      style={{ textAlign: attrs.align }}
      data-custom-button
    >
      <span
        style={buttonStyle}
        onClick={handleClick}
        onMouseEnter={(e) => {
          setIsHovered(true);
          if (attrs.hoverEffect) {
            e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
            e.currentTarget.style.boxShadow = '0 12px 24px -6px rgba(0, 0, 0, 0.25)';
            if (attrs.useGradient && attrs.hoverGradientShift) {
              e.currentTarget.style.background = getBackground(true);
            }
          }
        }}
        onMouseLeave={(e) => {
          setIsHovered(false);
          if (attrs.hoverEffect) {
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
            e.currentTarget.style.boxShadow = selected 
              ? '0 0 0 3px rgba(59, 130, 246, 0.5)' 
              : shadowMap[attrs.shadowSize];
            e.currentTarget.style.background = getBackground(false);
          }
        }}
        title="Cliquez pour modifier le bouton"
        role="button"
        tabIndex={0}
      >
        {attrs.text}
      </span>
    </NodeViewWrapper>
  );
};