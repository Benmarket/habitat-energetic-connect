import { Node, mergeAttributes } from '@tiptap/core';

export interface CustomButtonOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    customButton: {
      setCustomButton: (options: { text: string; url: string; color: string }) => ReturnType;
    };
  }
}

export const CustomButton = Node.create<CustomButtonOptions>({
  name: 'customButton',

  group: 'block',

  atom: true,

  addAttributes() {
    return {
      text: {
        default: 'Cliquez ici',
      },
      url: {
        default: '#',
      },
      color: {
        default: 'primary',
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
    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, {
        'data-custom-button': '',
        class: 'custom-button-wrapper my-4',
      }),
      [
        'a',
        {
          href: HTMLAttributes.url,
          'data-button-text': HTMLAttributes.text,
          'data-button-color': HTMLAttributes.color,
          class: `custom-button-link inline-block px-6 py-3 rounded-md font-medium transition-colors ${
            HTMLAttributes.color === 'primary'
              ? 'bg-primary text-primary-foreground hover:bg-primary/90'
              : HTMLAttributes.color === 'secondary'
              ? 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              : 'bg-accent text-accent-foreground hover:bg-accent/80'
          }`,
          target: '_blank',
          rel: 'noopener noreferrer',
        },
        HTMLAttributes.text,
      ],
    ];
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
    };
  },
});
