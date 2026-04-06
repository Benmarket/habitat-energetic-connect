import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { ImageNodeView } from './ImageNodeView';

export interface CustomImageOptions {
  HTMLAttributes: Record<string, any>;
}

export interface ImageAttributes {
  src: string;
  alt: string;
  title: string;
  caption: string;
  width: number | null;
  align: 'left' | 'center' | 'right';
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    customImage: {
      setCustomImage: (options: ImageAttributes) => ReturnType;
      updateCustomImage: (options: Partial<ImageAttributes>) => ReturnType;
    };
  }
}

export const CustomImage = Node.create<CustomImageOptions>({
  name: 'customImage',

  group: 'block',

  atom: true,

  draggable: true,

  selectable: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
      alt: {
        default: '',
      },
      title: {
        default: '',
      },
      caption: {
        default: '',
      },
      width: {
        default: null,
      },
      align: {
        default: 'center',
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'figure[data-custom-image]',
        getAttrs: (dom) => {
          if (typeof dom === 'string') return false;
          const element = dom as HTMLElement;
          const img = element.querySelector('img');
          const legacyImage = element.querySelector('div[data-custom-image]');
          const figcaption = element.querySelector('figcaption');
          const widthAttr = img?.getAttribute('width') || element.getAttribute('data-width');
          const width = widthAttr ? parseInt(widthAttr, 10) : null;
          const align = (element.style.textAlign || 'center') as 'left' | 'center' | 'right';

          return {
            src: img?.getAttribute('src') || element.getAttribute('data-src') || legacyImage?.getAttribute('data-src') || null,
            alt: img?.getAttribute('alt') || element.getAttribute('data-alt') || legacyImage?.getAttribute('data-alt') || '',
            title: img?.getAttribute('title') || element.getAttribute('data-title') || legacyImage?.getAttribute('data-title') || '',
            caption: figcaption?.textContent?.trim() || element.getAttribute('data-caption') || legacyImage?.getAttribute('data-caption') || '',
            width,
            align: ['left', 'center', 'right'].includes(align) ? align : 'center',
          };
        },
      },
      {
        tag: 'div[data-custom-image]',
        getAttrs: (dom) => {
          if (typeof dom === 'string') return false;
          const element = dom as HTMLElement;
          const widthAttr = element.getAttribute('data-width');

          return {
            src: element.getAttribute('data-src') || null,
            alt: element.getAttribute('data-alt') || '',
            title: element.getAttribute('data-title') || '',
            caption: element.getAttribute('data-caption') || '',
            width: widthAttr ? parseInt(widthAttr, 10) : null,
            align: 'center',
          };
        },
      },
      {
        tag: 'img[src]',
        getAttrs: (dom) => {
          if (typeof dom === 'string') return false;
          const element = dom as HTMLElement;
          const figure = element.closest('figure');
          
          // Récupérer les attributs de l'image
          const src = element.getAttribute('src');
          const alt = element.getAttribute('alt') || '';
          const title = element.getAttribute('title') || '';
          const widthAttr = element.getAttribute('width');
          const width = widthAttr ? parseInt(widthAttr) : null;
          const caption = figure?.querySelector('figcaption')?.textContent?.trim() || '';
          
          // Si l'image est dans un conteneur avec text-align, récupérer l'alignement
          let align: 'left' | 'center' | 'right' = 'center';
          const parent = figure || element.parentElement;
          if (parent) {
            const textAlign = parent instanceof HTMLElement && parent.style.textAlign
              ? parent.style.textAlign
              : window.getComputedStyle(parent).textAlign;
            if (textAlign === 'left' || textAlign === 'right') {
              align = textAlign as 'left' | 'right';
            }
          }
          
          return { src, alt, title, caption, width, align };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const { src, alt, title, caption, width, align } = HTMLAttributes;

    const imgStyle = [
      'max-width: 100%',
      'height: auto',
      'border-radius: 8px',
      width ? `width: ${width}px` : '',
    ].filter(Boolean).join('; ');

    const children: any[] = [
      [
        'img',
        {
          src,
          alt,
          title: title || undefined,
          style: imgStyle,
        },
      ],
    ];

    if (caption) {
      children.push([
        'figcaption',
        {
          style: 'font-size: 0.875rem; color: #6b7280; margin-top: 0.5rem; text-align: center; font-style: italic;',
        },
        caption,
      ]);
    }

    return [
      'figure',
      mergeAttributes(this.options.HTMLAttributes, {
        'data-custom-image': '',
        class: 'custom-image-wrapper my-4',
        style: `text-align: ${align}`,
      }),
      ...children,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageNodeView);
  },

  addCommands() {
    return {
      setCustomImage:
        (options) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          });
        },
      updateCustomImage:
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
