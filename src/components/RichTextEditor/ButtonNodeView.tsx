import { NodeViewWrapper } from '@tiptap/react';
import { NodeViewProps } from '@tiptap/core';
import { ButtonAttributes } from './CustomButton';

export const ButtonNodeView = ({ node, selected, editor, getPos }: NodeViewProps) => {
  const attrs = node.attrs as ButtonAttributes;

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

  const widthStyle =
    attrs.width === 'full' ? '100%' : attrs.width === 'custom' ? `${attrs.customWidth}px` : 'auto';

  const border = attrs.borderWidth > 0 
    ? `${attrs.borderWidth}px ${attrs.borderStyle} ${attrs.borderColor}`
    : 'none';

  const buttonStyle: React.CSSProperties = {
    backgroundColor: attrs.backgroundColor,
    color: attrs.textColor,
    padding: `${attrs.paddingY}px ${attrs.paddingX}px`,
    borderRadius: `${attrs.borderRadius}px`,
    fontSize: sizeMap[attrs.size],
    fontWeight: 500,
    textDecoration: 'none',
    display: 'inline-block',
    transition: 'all 0.2s ease',
    border,
    cursor: 'pointer',
    width: widthStyle,
    textAlign: 'center',
    boxShadow: selected ? '0 0 0 3px rgba(59, 130, 246, 0.5)' : shadowMap[attrs.shadowSize],
  };

  const handleDoubleClick = () => {
    if (typeof getPos === 'function') {
      const pos = getPos();
      editor.commands.setNodeSelection(pos);
      
      const event = new CustomEvent('edit-button', {
        detail: { attrs, pos },
      });
      window.dispatchEvent(event);
    }
  };

  return (
    <NodeViewWrapper
      className="custom-button-wrapper my-4"
      style={{ textAlign: attrs.align }}
      data-custom-button
    >
      <a
        href={attrs.url}
        style={buttonStyle}
        onClick={(e) => e.preventDefault()}
        onDoubleClick={handleDoubleClick}
        onMouseEnter={(e) => {
          if (attrs.hoverEffect) {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 10px 20px -5px rgba(0, 0, 0, 0.2)';
          }
        }}
        onMouseLeave={(e) => {
          if (attrs.hoverEffect) {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = selected 
              ? '0 0 0 3px rgba(59, 130, 246, 0.5)' 
              : shadowMap[attrs.shadowSize];
          }
        }}
        title="Double-cliquez pour modifier"
      >
        {attrs.text}
      </a>
    </NodeViewWrapper>
  );
};