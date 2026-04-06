import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import TextAlign from '@tiptap/extension-text-align';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableCell } from '@tiptap/extension-table-cell';
import { CustomButton } from './CustomButton';
import { CustomImage } from './CustomImage';
import { CustomCtaBanner } from './CustomCtaBanner';
import { ButtonEditorModal } from './ButtonEditorModal';
import { ImageEditorModal } from './ImageEditorModal';
import { CtaBannerSelector } from './CtaBannerSelector';
import { CtaBannerEditorModal } from './CtaBannerEditorModal';
import { FavoriteButtonsBar } from '@/components/FavoriteButtonsBar';
import { FavoriteCtaBannersBar } from './FavoriteCtaBannersBar';
import { MediaLibrary } from '@/components/MediaLibrary';
import { ImageRegenerateModal } from '@/components/ImageRegenerateModal';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading2,
  Heading3,
  Image as ImageIcon,
  MousePointerClick,
  LayoutTemplate,
  TableIcon,
  Undo,
  Redo,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
}

export const RichTextEditor = ({ content, onChange }: RichTextEditorProps) => {
  const [mediaLibraryOpen, setMediaLibraryOpen] = useState(false);
  const [buttonDialogOpen, setButtonDialogOpen] = useState(false);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [ctaBannerSelectorOpen, setCtaBannerSelectorOpen] = useState(false);
  const [ctaBannerEditorOpen, setCtaBannerEditorOpen] = useState(false);
  const [editingButton, setEditingButton] = useState<any>(null);
  const [editingImage, setEditingImage] = useState<any>(null);
  const [editingCtaBanner, setEditingCtaBanner] = useState<any>(null);
  const [ctaBannerDraft, setCtaBannerDraft] = useState<any>(null);
  const [htmlContent, setHtmlContent] = useState(content);
  const [activeTab, setActiveTab] = useState<string>('visual');

  // Image regeneration/replacement state
  const [regenModalOpen, setRegenModalOpen] = useState(false);
  const [regenContext, setRegenContext] = useState('');
  const [regenTargetSrc, setRegenTargetSrc] = useState('');
  const [replaceMediaLibOpen, setReplaceMediaLibOpen] = useState(false);
  const [replaceTargetSrc, setReplaceTargetSrc] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadTargetSrcRef = useRef('');

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline hover:text-primary/80',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right', 'justify'],
      }),
      TextStyle,
      Color,
      Table.configure({
        resizable: false,
        HTMLAttributes: {
          class: 'article-data-table',
        },
      }),
      TableRow,
      TableHeader,
      TableCell,
      CustomButton,
      CustomImage,
      CustomCtaBanner,
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

  // Écouter les événements de clic sur les boutons, images et bannières CTA
  useEffect(() => {
    let isProcessingEvent = false;
    
    const handleEditButton = (event: any) => {
      if (buttonDialogOpen || isProcessingEvent) return;
      isProcessingEvent = true;
      
      const { attrs, pos } = event.detail;
      setEditingButton({ attrs, pos });
      setButtonDialogOpen(true);
      
      setTimeout(() => { isProcessingEvent = false; }, 300);
    };

    const handleEditImage = (event: any) => {
      if (imageDialogOpen || isProcessingEvent) return;
      isProcessingEvent = true;
      
      const { attrs } = event.detail;
      setEditingImage(attrs);
      setImageDialogOpen(true);
      
      setTimeout(() => { isProcessingEvent = false; }, 300);
    };

    const handleEditCtaBanner = (event: any) => {
      // Protection contre les événements multiples
      if (ctaBannerEditorOpen || isProcessingEvent) return;
      isProcessingEvent = true;

      const { attrs, pos } = event.detail;
      setCtaBannerDraft(null);
      setEditingCtaBanner({ attrs, pos });
      setCtaBannerEditorOpen(true);
      
      // Reset après un délai suffisant
      setTimeout(() => { isProcessingEvent = false; }, 500);
    };

    window.addEventListener('edit-button', handleEditButton);
    window.addEventListener('edit-image', handleEditImage);
    window.addEventListener('edit-cta-banner', handleEditCtaBanner);
    return () => {
      window.removeEventListener('edit-button', handleEditButton);
      window.removeEventListener('edit-image', handleEditImage);
      window.removeEventListener('edit-cta-banner', handleEditCtaBanner);
    };
  }, [buttonDialogOpen, imageDialogOpen, ctaBannerEditorOpen]);

  // Inline image regeneration/upload/library events
  useEffect(() => {
    const handleRegenerate = (event: any) => {
      const { attrs, sectionContext } = event.detail;
      setRegenTargetSrc(attrs.src);
      setRegenContext(sectionContext || '');
      setRegenModalOpen(true);
    };

    const handleUploadReplace = (event: any) => {
      const { attrs } = event.detail;
      uploadTargetSrcRef.current = attrs.src;
      fileInputRef.current?.click();
    };

    const handleMediaLibReplace = (event: any) => {
      const { attrs } = event.detail;
      setReplaceTargetSrc(attrs.src);
      setReplaceMediaLibOpen(true);
    };

    window.addEventListener('regenerate-image', handleRegenerate);
    window.addEventListener('upload-image-replace', handleUploadReplace);
    window.addEventListener('medialibrary-image-replace', handleMediaLibReplace);
    return () => {
      window.removeEventListener('regenerate-image', handleRegenerate);
      window.removeEventListener('upload-image-replace', handleUploadReplace);
      window.removeEventListener('medialibrary-image-replace', handleMediaLibReplace);
    };
  }, []);

  const replaceImageSrc = (oldSrc: string, newSrc: string) => {
    if (!editor) return;
    const { state } = editor;
    state.doc.descendants((node, pos) => {
      if (node.type.name === 'customImage' && node.attrs.src === oldSrc) {
        editor.commands.setNodeSelection(pos);
        editor.commands.updateCustomImage({ ...node.attrs, src: newSrc });
        return false;
      }
    });
  };

  const handleInlineFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const targetSrc = uploadTargetSrcRef.current;
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;
      if (!userId) { toast.error("Non connecté"); return; }

      const ext = file.name.split('.').pop();
      const filename = `inline-${Date.now()}.${ext}`;
      const storagePath = `${userId}/${filename}`;

      const { error: uploadError } = await supabase.storage
        .from('media').upload(storagePath, file, { contentType: file.type });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(storagePath);
      await supabase.from('media').insert({
        user_id: userId, filename, storage_path: publicUrl,
        alt_text: file.name, mime_type: file.type, file_size: file.size,
      });

      replaceImageSrc(targetSrc, publicUrl);
      toast.success("Image remplacée !");
    } catch (err: any) {
      toast.error(err.message || "Erreur upload");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (!editor) {
    return null;
  }

  const addImage = (url: string, alt: string) => {
    if (url && editor) {
      editor.chain().focus().setCustomImage({ src: url, alt, title: '', caption: '', width: null, align: 'center' }).run();
      setMediaLibraryOpen(false);
    }
  };

  const updateImage = (attrs: any) => {
    if (editor && editingImage) {
      // Trouver et mettre à jour l'image
      const { state } = editor;
      let imagePos: number | null = null;
      
      state.doc.descendants((node, pos) => {
        if (node.type.name === 'customImage' && node.attrs.src === editingImage.src) {
          imagePos = pos;
          return false;
        }
      });

      if (imagePos !== null) {
        editor.commands.setNodeSelection(imagePos);
        editor.commands.updateCustomImage(attrs);
      }
    }
    setEditingImage(null);
    setImageDialogOpen(false);
  };

  const addButton = (config: any) => {
    if (editingButton) {
      // Mise à jour d'un bouton existant
      editor?.commands.setNodeSelection(editingButton.pos);
      editor?.commands.updateCustomButton(config);
    } else {
      // Ajout d'un nouveau bouton
      editor?.chain().focus().setCustomButton(config).run();
    }
    setEditingButton(null);
    setButtonDialogOpen(false);
  };

  const handleButtonDialogClose = (open: boolean) => {
    if (!open) {
      setEditingButton(null);
    }
    setButtonDialogOpen(open);
  };

  const handleFavoriteButtonSelect = (config: any) => {
    // Insérer le bouton favori dans l'éditeur
    editor?.chain().focus().setCustomButton(config).run();
  };

  const handleOpenButtonDialog = () => {
    setEditingButton(null);
    setButtonDialogOpen(true);
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

  const insertCtaBanner = (attrs: any) => {
    if (!editor) return false;
    return editor
      .chain()
      .focus()
      .insertContent({ type: 'customCtaBanner', attrs })
      .run();
  };

  const handleCtaBannerInsert = (bannerAttrs: any) => {
    insertCtaBanner(bannerAttrs);
    setCtaBannerSelectorOpen(false);
  };

  const handleFavoriteCtaBannerSelect = (bannerAttrs: any) => {
    // Ouvrir le mini menu de paramétrage AVANT insertion
    setEditingCtaBanner(null);
    setCtaBannerDraft(bannerAttrs);
    setCtaBannerEditorOpen(true);
  };

  const addCtaBanner = (config: any) => {
    if (!editor) return;

    if (editingCtaBanner) {
      // Mise à jour d'une bannière existante
      editor.commands.setNodeSelection(editingCtaBanner.pos);
      // Ne modifie que l'instance dans le contenu
      (editor.commands as any).updateCustomCtaBanner?.(config) ??
        editor.commands.updateAttributes('customCtaBanner', config);
    } else {
      // Ajout d'une nouvelle bannière
      insertCtaBanner(config);
    }

    setEditingCtaBanner(null);
    setCtaBannerDraft(null);
    setCtaBannerEditorOpen(false);
  };

  return (
    <div className="border rounded-md">
      <FavoriteButtonsBar onSelectButton={handleFavoriteButtonSelect} />
      <FavoriteCtaBannersBar onSelectBanner={handleFavoriteCtaBannerSelect} />
      
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
          onClick={handleOpenButtonDialog}
          title="Insérer un bouton"
        >
          <MousePointerClick className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setCtaBannerSelectorOpen(true)}
          title="Insérer un bandeau CTA"
        >
          <LayoutTemplate className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
          title="Insérer un tableau"
        >
          <TableIcon className="w-4 h-4" />
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
              className="prose prose-sm max-w-none p-4 min-h-[300px] focus:outline-none prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-ul:text-foreground prose-ol:text-foreground prose-li:text-foreground [&_.ProseMirror]:caret-foreground [&_.ProseMirror]:focus:caret-primary"
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

      <ButtonEditorModal
        open={buttonDialogOpen}
        onOpenChange={(open) => {
          setButtonDialogOpen(open);
          if (!open) {
            setEditingButton(null);
          }
        }}
        onSave={addButton}
        initialConfig={editingButton?.attrs}
      />

      <ImageEditorModal
        open={imageDialogOpen}
        onOpenChange={(open) => {
          setImageDialogOpen(open);
          if (!open) {
            setEditingImage(null);
          }
        }}
        onSave={updateImage}
        initialAttrs={editingImage}
      />

      <CtaBannerSelector
        open={ctaBannerSelectorOpen}
        onClose={() => setCtaBannerSelectorOpen(false)}
        onInsert={handleCtaBannerInsert}
      />

      <CtaBannerEditorModal
        open={ctaBannerEditorOpen}
        onOpenChange={(open) => {
          setCtaBannerEditorOpen(open);
          if (!open) {
            setEditingCtaBanner(null);
            setCtaBannerDraft(null);
          }
        }}
        onSave={addCtaBanner}
        initialConfig={editingCtaBanner?.attrs ?? ctaBannerDraft}
        isEditing={!!editingCtaBanner}
      />
    </div>
  );
};
