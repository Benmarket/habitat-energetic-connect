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
  borderWidth: number;
  borderColor: string;
  borderStyle: 'solid' | 'dashed' | 'dotted' | 'none';
  shadowSize: 'none' | 'sm' | 'md' | 'lg';
  hoverEffect: boolean;
  useGradient: boolean;
  gradientType: 'linear' | 'radial';
  gradientDirection: 'to-right' | 'to-left' | 'to-top' | 'to-bottom' | 'to-top-right' | 'to-bottom-right' | 'to-top-left' | 'to-bottom-left';
  gradientColor1: string;
  gradientColor2: string;
  gradientAngle: number;
  hoverGradientShift: boolean;
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
      borderWidth: {
        default: 0,
      },
      borderColor: {
        default: '#000000',
      },
      borderStyle: {
        default: 'solid',
      },
      shadowSize: {
        default: 'md',
      },
      hoverEffect: {
        default: true,
      },
      useGradient: {
        default: false,
      },
      gradientType: {
        default: 'linear',
      },
      gradientDirection: {
        default: 'to-right',
      },
      gradientColor1: {
        default: '#ec4899',
      },
      gradientColor2: {
        default: '#8b5cf6',
      },
      gradientAngle: {
        default: 90,
      },
      hoverGradientShift: {
        default: true,
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
      borderWidth,
      borderColor,
      borderStyle,
      shadowSize,
      useGradient,
      gradientType,
      gradientColor1,
      gradientColor2,
      gradientAngle,
    } = HTMLAttributes;

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
      width === 'full' ? '100%' : width === 'custom' ? `${customWidth}px` : 'auto';

    const border = borderWidth > 0 
      ? `${borderWidth}px ${borderStyle} ${borderColor}`
      : 'none';

    // Calculer le background (couleur unie ou dégradé)
    let backgroundStyle: string;
    if (useGradient) {
      if (gradientType === 'linear') {
        backgroundStyle = `background: linear-gradient(${gradientAngle}deg, ${gradientColor1}, ${gradientColor2})`;
      } else {
        backgroundStyle = `background: radial-gradient(circle at center, ${gradientColor1}, ${gradientColor2})`;
      }
    } else {
      backgroundStyle = `background-color: ${backgroundColor}`;
    }

    const buttonStyle = [
      backgroundStyle,
      `color: ${textColor}`,
      `padding: ${paddingY}px ${paddingX}px`,
      `border-radius: ${borderRadius}px`,
      `font-size: ${sizeMap[size as keyof typeof sizeMap]}`,
      `font-weight: 500`,
      `text-decoration: none`,
      `display: inline-block`,
      `transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1)`,
      `border: ${border}`,
      `cursor: pointer`,
      `width: ${widthStyle}`,
      `text-align: center`,
      `box-shadow: ${shadowMap[shadowSize as keyof typeof shadowMap]}`,
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