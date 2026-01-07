import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { CtaBannerNodeView } from './CtaBannerNodeView';

export interface CtaBannerAttributes {
  bannerId: string;
  templateStyle: string;
  backgroundColor: string;
  secondaryColor: string;
  textColor: string;
  accentColor: string;
  title: string;
  subtitle: string;
  buttonText: string;
  buttonUrl: string;
  buttonBackground: string;
  buttonTextColor: string;
  buttonBorderRadius: number;
  popupId: string | null;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    customCtaBanner: {
      setCustomCtaBanner: (options: Partial<CtaBannerAttributes>) => ReturnType;
      updateCustomCtaBanner: (options: Partial<CtaBannerAttributes>) => ReturnType;
    };
  }
}

export const CustomCtaBanner = Node.create({
  name: 'customCtaBanner',

  group: 'block',

  atom: true,

  draggable: true,

  addAttributes() {
    return {
      bannerId: {
        default: '',
      },
      templateStyle: {
        default: 'wave',
      },
      backgroundColor: {
        default: '#10b981',
      },
      secondaryColor: {
        default: '#059669',
      },
      textColor: {
        default: '#ffffff',
      },
      accentColor: {
        default: '#34d399',
      },
      title: {
        default: 'Titre du bandeau',
      },
      subtitle: {
        default: '',
      },
      buttonText: {
        default: 'En savoir plus',
      },
      buttonUrl: {
        default: '#contact',
      },
      buttonBackground: {
        default: '#ffffff',
      },
      buttonTextColor: {
        default: '#10b981',
      },
      buttonBorderRadius: {
        default: 6,
      },
      popupId: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-cta-banner]',
        getAttrs: (element) => {
          if (typeof element === 'string') return false;
          const dom = element as HTMLElement;
          return {
            bannerId: dom.getAttribute('data-cta-banner') || '',
            templateStyle: dom.getAttribute('data-template-style') || 'wave',
            backgroundColor: dom.getAttribute('data-bg-color') || '#10b981',
            secondaryColor: dom.getAttribute('data-secondary-color') || '#059669',
            textColor: dom.getAttribute('data-text-color') || '#ffffff',
            accentColor: dom.getAttribute('data-accent-color') || '#34d399',
            title: dom.getAttribute('data-title') || 'Titre',
            subtitle: dom.getAttribute('data-subtitle') || '',
            buttonText: dom.getAttribute('data-button-text') || 'En savoir plus',
            buttonUrl: dom.getAttribute('data-button-url') || '#contact',
            buttonBackground: dom.getAttribute('data-button-bg') || '#ffffff',
            buttonTextColor: dom.getAttribute('data-button-text-color') || '#10b981',
            buttonBorderRadius: parseInt(dom.getAttribute('data-button-radius') || '6', 10),
            popupId: dom.getAttribute('data-popup-id') || null,
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const attrs = HTMLAttributes as CtaBannerAttributes;
    
    return [
      'div',
      mergeAttributes({
        'data-cta-banner': attrs.bannerId,
        'data-template-style': attrs.templateStyle,
        'data-bg-color': attrs.backgroundColor,
        'data-secondary-color': attrs.secondaryColor,
        'data-text-color': attrs.textColor,
        'data-accent-color': attrs.accentColor,
        'data-title': attrs.title,
        'data-subtitle': attrs.subtitle,
        'data-button-text': attrs.buttonText,
        'data-button-url': attrs.buttonUrl,
        'data-button-bg': attrs.buttonBackground,
        'data-button-text-color': attrs.buttonTextColor,
        'data-button-radius': attrs.buttonBorderRadius,
        'data-popup-id': attrs.popupId || '',
        class: 'cta-banner-wrapper my-8',
        style: `border-radius: 12px; overflow: hidden;`,
      }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(CtaBannerNodeView);
  },

  addCommands() {
    return {
      setCustomCtaBanner:
        (options) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          });
        },
      updateCustomCtaBanner:
        (options) =>
        ({ commands, state }) => {
          const { selection } = state;
          const node = state.doc.nodeAt(selection.from);
          if (node?.type.name !== this.name) return false;

          return commands.updateAttributes(this.name, options);
        },
    };
  },
});
