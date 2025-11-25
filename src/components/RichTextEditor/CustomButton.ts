import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { ButtonNodeView } from './ButtonNodeView';

export interface CustomButtonOptions {
  HTMLAttributes: Record<string, any>;
}

export interface ButtonAttributes {
  text: string;
  url: string;
  backgroundColor: string;
  textColor: string;
  size: 'small' | 'medium' | 'large';
  width: 'auto' | 'full' | 'custom';
  customWidth: number;
  align: 'left' | 'center' | 'right';
  borderRadius: number;
  paddingX: number;
  paddingY: number;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    customButton: {
      setCustomButton: (options: ButtonAttributes) => ReturnType;
      updateCustomButton: (options: Partial<ButtonAttributes>) => ReturnType;
    };
  }
}

export const CustomButton = Node.create<CustomButtonOptions>({
  name: 'customButton',

  group: 'block',

  atom: true,

  draggable: true,

  selectable: true,

  addAttributes() {
    return {
      text: {
        default: 'Cliquez ici',
      },
      url: {
        default: '#',
      },
      backgroundColor: {
        default: '#10b981',
      },
      textColor: {
        default: '#ffffff',
      },
      size: {
        default: 'medium',
      },
      width: {
        default: 'auto',
      },
      customWidth: {
        default: 200,
      },
      align: {
        default: 'center',
      },
      borderRadius: {
        default: 6,
      },
      paddingX: {
        default: 24,
      },
      paddingY: {
        default: 12,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-custom-button]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const {
      text,
      url,
      backgroundColor,
      textColor,
      size,
      width,
      customWidth,
      align,
      borderRadius,
      paddingX,
      paddingY,
    } = HTMLAttributes;

    const sizeMap = {
      small: '14px',
      medium: '16px',
      large: '18px',
    };

    const widthStyle =
      width === 'full' ? '100%' : width === 'custom' ? `${customWidth}px` : 'auto';

    const buttonStyle = [
      `background-color: ${backgroundColor}`,
      `color: ${textColor}`,
      `padding: ${paddingY}px ${paddingX}px`,
      `border-radius: ${borderRadius}px`,
      `font-size: ${sizeMap[size as keyof typeof sizeMap]}`,
      `font-weight: 500`,
      `text-decoration: none`,
      `display: inline-block`,
      `transition: all 0.2s`,
      `border: none`,
      `cursor: pointer`,
      `width: ${widthStyle}`,
      `text-align: center`,
    ].join('; ');

    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, {
        'data-custom-button': '',
        class: 'custom-button-wrapper my-4',
        style: `text-align: ${align}`,
      }),
      [
        'a',
        {
          href: url,
          style: buttonStyle,
          target: '_blank',
          rel: 'noopener noreferrer',
          'data-button-text': text,
          'data-button-color': backgroundColor,
        },
        text,
      ],
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ButtonNodeView);
  },

  addCommands() {
    return {
      setCustomButton:
        (options) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          });
        },
      updateCustomButton:
        (options) =>
        ({ commands, state }) => {
          const { selection } = state;
          const node = state.doc.nodeAt(selection.from);
          
          if (node?.type.name === this.name) {
            return commands.updateAttributes(this.name, options);
          }
          
          return false;
        },
    };
  },
});