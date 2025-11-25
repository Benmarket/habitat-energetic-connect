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

  const widthStyle =
    attrs.width === 'full' ? '100%' : attrs.width === 'custom' ? `${attrs.customWidth}px` : 'auto';

  const buttonStyle: React.CSSProperties = {
    backgroundColor: attrs.backgroundColor,
    color: attrs.textColor,
    padding: `${attrs.paddingY}px ${attrs.paddingX}px`,
    borderRadius: `${attrs.borderRadius}px`,
    fontSize: sizeMap[attrs.size],
    fontWeight: 500,
    textDecoration: 'none',
    display: 'inline-block',
    transition: 'all 0.2s',
    border: 'none',
    cursor: 'pointer',
    width: widthStyle,
    textAlign: 'center',
    boxShadow: selected ? '0 0 0 2px #3b82f6' : 'none',
  };

  const handleDoubleClick = () => {
    if (typeof getPos === 'function') {
      const pos = getPos();
      editor.commands.setNodeSelection(pos);
      
      // Émettre un événement personnalisé pour ouvrir la modale d'édition
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
        title="Double-cliquez pour modifier"
      >
        {attrs.text}
      </a>
    </NodeViewWrapper>
  );
};