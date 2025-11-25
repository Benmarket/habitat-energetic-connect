import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { ImageNodeView } from './ImageNodeView';

export interface CustomImageOptions {
  HTMLAttributes: Record<string, any>;
}

export interface ImageAttributes {
  src: string;
  alt: string;
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
        tag: 'div[data-custom-image]',
      },
      {
        tag: 'img[src]',
        getAttrs: (dom) => {
          if (typeof dom === 'string') return false;
          const element = dom as HTMLElement;
          return {
            src: element.getAttribute('src'),
            alt: element.getAttribute('alt') || '',
            width: element.getAttribute('width') ? parseInt(element.getAttribute('width')!) : null,
            align: 'center',
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const { src, alt, width, align } = HTMLAttributes;

    const imgStyle = [
      'max-width: 100%',
      'height: auto',
      'border-radius: 8px',
      width ? `width: ${width}px` : '',
    ].filter(Boolean).join('; ');

    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, {
        'data-custom-image': '',
        class: 'custom-image-wrapper my-4',
        style: `text-align: ${align}`,
      }),
      [
        'img',
        {
          src,
          alt,
          style: imgStyle,
        },
      ],
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
