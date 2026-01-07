import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { ButtonNodeView } from './ButtonNodeView';

export interface CustomButtonOptions {
  HTMLAttributes: Record<string, any>;
}

export interface ButtonAttributes {
  text: string;
  url: string;
  destinationType: 'external' | 'internal' | 'popup' | 'anchor';
  popupId?: string;
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
        default: '#contact',
      },
      destinationType: {
        default: 'anchor',
      },
      popupId: {
        default: null,
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
        getAttrs: (element) => {
          if (typeof element === 'string') return false;
          const dom = element as HTMLElement;

          const get = (k: string) => dom.getAttribute(k);
          const a = dom.querySelector('a') as HTMLAnchorElement | null;

          const urlRaw = (get('data-url') ?? a?.getAttribute('href') ?? '#contact').trim();
          const derivedDestinationType = urlRaw.startsWith('http')
            ? 'external'
            : urlRaw.startsWith('#')
              ? 'anchor'
              : 'internal';

          const num = (v: string | null, fallback: number) => {
            const n = Number(v);
            return Number.isFinite(n) ? n : fallback;
          };

          return {
            text: (get('data-text') ?? a?.getAttribute('data-button-text') ?? a?.textContent ?? 'Cliquez ici').trim(),
            url: urlRaw,
            destinationType: ((get('data-destination-type') ?? a?.getAttribute('data-destination-type')) as any) ?? derivedDestinationType,
            popupId: get('data-popup-id') ?? a?.getAttribute('data-popup-id') ?? null,

            backgroundColor: (get('data-background-color') ?? a?.getAttribute('data-button-color') ?? '#10b981').trim(),
            textColor: (get('data-text-color') ?? '#ffffff').trim(),

            size: (get('data-size') as any) ?? 'medium',
            width: (get('data-width') as any) ?? 'auto',
            customWidth: num(get('data-custom-width'), 200),
            align: (get('data-align') as any) ?? 'center',

            borderRadius: num(get('data-border-radius'), 6),
            paddingX: num(get('data-padding-x'), 24),
            paddingY: num(get('data-padding-y'), 12),
            borderWidth: num(get('data-border-width'), 0),
            borderColor: (get('data-border-color') ?? '#000000').trim(),
            borderStyle: (get('data-border-style') as any) ?? 'solid',

            shadowSize: (get('data-shadow-size') as any) ?? 'md',
            hoverEffect: (get('data-hover-effect') ?? 'true') === 'true',

            useGradient: (get('data-use-gradient') ?? 'false') === 'true',
            gradientType: (get('data-gradient-type') as any) ?? 'linear',
            gradientDirection: (get('data-gradient-direction') as any) ?? 'to-right',
            gradientColor1: (get('data-gradient-color1') ?? '#ec4899').trim(),
            gradientColor2: (get('data-gradient-color2') ?? '#8b5cf6').trim(),
            gradientAngle: num(get('data-gradient-angle'), 90),
            hoverGradientShift: (get('data-hover-gradient-shift') ?? 'true') === 'true',
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const {
      text,
      url,
      destinationType,
      popupId,
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
      hoverEffect,
      useGradient,
      gradientType,
      gradientDirection,
      gradientColor1,
      gradientColor2,
      gradientAngle,
      hoverGradientShift,
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

    // Determine target and rel based on destination type
    const isExternal = destinationType === 'external';
    const targetAttr = isExternal ? '_blank' : undefined;
    const relAttr = isExternal ? 'noopener noreferrer' : undefined;

    // For popups, use data attribute
    const dataPopupId = destinationType === 'popup' ? popupId : undefined;

    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, {
        'data-custom-button': '',
        'data-text': text,
        'data-url': url,
        'data-destination-type': destinationType,
        'data-popup-id': popupId ?? '',
        'data-background-color': backgroundColor,
        'data-text-color': textColor,
        'data-size': size,
        'data-width': width,
        'data-custom-width': customWidth,
        'data-align': align,
        'data-border-radius': borderRadius,
        'data-padding-x': paddingX,
        'data-padding-y': paddingY,
        'data-border-width': borderWidth,
        'data-border-color': borderColor,
        'data-border-style': borderStyle,
        'data-shadow-size': shadowSize,
        'data-hover-effect': String(hoverEffect),
        'data-use-gradient': String(useGradient),
        'data-gradient-type': gradientType,
        'data-gradient-direction': gradientDirection,
        'data-gradient-color1': gradientColor1,
        'data-gradient-color2': gradientColor2,
        'data-gradient-angle': gradientAngle,
        'data-hover-gradient-shift': String(hoverGradientShift),
        class: 'custom-button-wrapper my-4',
        style: `text-align: ${align}`,
      }),
      [
        'a',
        {
          href: url,
          style: buttonStyle,
          ...(targetAttr && { target: targetAttr }),
          ...(relAttr && { rel: relAttr }),
          'data-button-text': text,
          'data-button-color': backgroundColor,
          'data-destination-type': destinationType,
          ...(dataPopupId && { 'data-popup-id': dataPopupId }),
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