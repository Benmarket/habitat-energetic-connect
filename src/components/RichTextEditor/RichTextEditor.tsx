import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import TextAlign from '@tiptap/extension-text-align';
import { CustomButton } from './CustomButton';
import { MediaLibrary } from '@/components/MediaLibrary';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Link as LinkIcon,
  MousePointerClick,
  Undo,
  Redo,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
} from 'lucide-react';
import { useState, useEffect } from 'react';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
}

export const RichTextEditor = ({ content, onChange }: RichTextEditorProps) => {
  const [mediaLibraryOpen, setMediaLibraryOpen] = useState(false);
  const [buttonDialogOpen, setButtonDialogOpen] = useState(false);
  const [buttonText, setButtonText] = useState('');
  const [buttonUrl, setButtonUrl] = useState('');
  const [buttonColor, setButtonColor] = useState('primary');
  const [htmlContent, setHtmlContent] = useState(content);
  const [activeTab, setActiveTab] = useState<string>('visual');

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-lg max-w-full h-auto my-4',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline hover:text-primary/80',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph', 'image'],
        alignments: ['left', 'center', 'right', 'justify'],
      }),
      TextStyle,
      Color,
      CustomButton,
    ],
    content,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      setHtmlContent(html);
      onChange(html);
    },
  });

  // Mettre à jour l'éditeur quand le contenu change de l'extérieur
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
      setHtmlContent(content);
    }
  }, [content, editor]);

  if (!editor) {
    return null;
  }

  const addImage = (url: string, alt: string) => {
    if (url && editor) {
      editor.chain().focus().setImage({ src: url, alt }).run();
      setMediaLibraryOpen(false);
    }
  };

  const addButton = () => {
    if (buttonText && buttonUrl) {
      editor.chain().focus().setCustomButton({
        text: buttonText,
        url: buttonUrl,
        color: buttonColor,
      }).run();
      setButtonText('');
      setButtonUrl('');
      setButtonColor('primary');
      setButtonDialogOpen(false);
    }
  };

  const handleHtmlChange = (html: string) => {
    setHtmlContent(html);
    if (editor && activeTab === 'html') {
      editor.commands.setContent(html);
      onChange(html);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === 'html' && editor) {
      setHtmlContent(editor.getHTML());
    }
  };

  const wordCount = editor?.state.doc.textContent.split(/\s+/).filter(word => word.length > 0).length || 0;

  return (
    <div className="border rounded-md">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <div className="flex items-center justify-between border-b px-2 py-1 bg-muted/30">
          <TabsList className="h-9">
            <TabsTrigger value="visual" className="text-xs">Visuel</TabsTrigger>
            <TabsTrigger value="html" className="text-xs">HTML</TabsTrigger>
          </TabsList>
          <div className="text-xs text-muted-foreground px-3">
            {wordCount} {wordCount === 1 ? 'mot' : 'mots'}
          </div>
        </div>

        <TabsContent value="visual" className="m-0 border-0">
          {/* Toolbar */}
          <div className="flex flex-wrap gap-1 p-2 border-b bg-muted/30">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive('bold') ? 'bg-accent' : ''}
        >
          <Bold className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive('italic') ? 'bg-accent' : ''}
        >
          <Italic className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={editor.isActive('heading', { level: 2 }) ? 'bg-accent' : ''}
        >
          <Heading2 className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={editor.isActive('heading', { level: 3 }) ? 'bg-accent' : ''}
        >
          <Heading3 className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive('bulletList') ? 'bg-accent' : ''}
        >
          <List className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive('orderedList') ? 'bg-accent' : ''}
        >
          <ListOrdered className="w-4 h-4" />
        </Button>
        
        <div className="w-px h-8 bg-border mx-1" />
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={editor.isActive({ textAlign: 'left' }) ? 'bg-accent' : ''}
        >
          <AlignLeft className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={editor.isActive({ textAlign: 'center' }) ? 'bg-accent' : ''}
        >
          <AlignCenter className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={editor.isActive({ textAlign: 'right' }) ? 'bg-accent' : ''}
        >
          <AlignRight className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          className={editor.isActive({ textAlign: 'justify' }) ? 'bg-accent' : ''}
        >
          <AlignJustify className="w-4 h-4" />
        </Button>
        
        <div className="w-px h-8 bg-border mx-1" />
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setMediaLibraryOpen(true)}
        >
          <ImageIcon className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setButtonDialogOpen(true)}
        >
          <MousePointerClick className="w-4 h-4" />
        </Button>
        
        <div className="w-px h-8 bg-border mx-1" />
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
        >
          <Undo className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
        >
          <Redo className="w-4 h-4" />
        </Button>
      </div>

          {/* Editor Content */}
          <ScrollArea className="h-[500px]">
            <EditorContent
              editor={editor}
              className="prose prose-sm max-w-none p-4 min-h-[300px] focus:outline-none prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-ul:text-foreground prose-ol:text-foreground prose-li:text-foreground"
            />
          </ScrollArea>
        </TabsContent>

        <TabsContent value="html" className="m-0 border-0">
          <ScrollArea className="h-[500px]">
            <Textarea
              value={htmlContent}
              onChange={(e) => handleHtmlChange(e.target.value)}
              className="min-h-[500px] font-mono text-xs p-4 border-0 rounded-none resize-none focus-visible:ring-0"
              placeholder="Code HTML de votre article..."
              spellCheck={false}
            />
          </ScrollArea>
          <div className="p-2 border-t bg-muted/30 text-xs text-muted-foreground">
            <p>💡 Modifiez le HTML directement. Les changements seront synchronisés avec l'éditeur visuel.</p>
          </div>
        </TabsContent>
      </Tabs>

      <MediaLibrary
        open={mediaLibraryOpen}
        onOpenChange={setMediaLibraryOpen}
        onSelect={(url, alt) => addImage(url, alt)}
      />

      {/* Button Dialog */}
      <Dialog open={buttonDialogOpen} onOpenChange={setButtonDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un bouton personnalisé</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="button-text">Texte du bouton</Label>
              <Input
                id="button-text"
                placeholder="Cliquez ici"
                value={buttonText}
                onChange={(e) => setButtonText(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="button-url">Lien du bouton</Label>
              <Input
                id="button-url"
                placeholder="https://..."
                value={buttonUrl}
                onChange={(e) => setButtonUrl(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="button-color">Couleur du bouton</Label>
              <Select value={buttonColor} onValueChange={setButtonColor}>
                <SelectTrigger id="button-color">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="primary">Primaire</SelectItem>
                  <SelectItem value="secondary">Secondaire</SelectItem>
                  <SelectItem value="accent">Accent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setButtonDialogOpen(false)}>
              Annuler
            </Button>
            <Button type="button" onClick={addButton}>
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
