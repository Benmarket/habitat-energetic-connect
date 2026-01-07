import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { RichTextEditor } from "@/components/RichTextEditor";
import { 
  Plus, 
  Trash2, 
  GripVertical, 
  ChevronUp, 
  ChevronDown,
  List,
  FileText
} from "lucide-react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export interface GuideSection {
  id: string;
  title: string;
  content: string;
}

interface GuideSectionsEditorProps {
  sections: GuideSection[];
  onChange: (sections: GuideSection[]) => void;
}

const SortableSectionItem = ({ 
  section, 
  index, 
  onUpdate, 
  onDelete, 
  onMoveUp, 
  onMoveDown, 
  isFirst, 
  isLast,
  totalSections 
}: { 
  section: GuideSection; 
  index: number;
  onUpdate: (id: string, field: 'title' | 'content', value: string) => void;
  onDelete: (id: string) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  isFirst: boolean;
  isLast: boolean;
  totalSections: number;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card className={`border-2 ${isDragging ? 'border-primary shadow-lg' : 'border-border'}`}>
        <CardContent className="p-4 space-y-4">
          {/* Header de la section */}
          <div className="flex items-center gap-3">
            <div 
              {...attributes} 
              {...listeners}
              className="cursor-grab hover:bg-muted p-1 rounded"
            >
              <GripVertical className="w-5 h-5 text-muted-foreground" />
            </div>
            
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
              {index + 1}
            </div>
            
            <div className="flex-1">
              <Input
                value={section.title}
                onChange={(e) => onUpdate(section.id, 'title', e.target.value)}
                placeholder={`Titre de la section ${index + 1}`}
                className="font-semibold text-lg border-0 bg-transparent px-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
            
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => onMoveUp(index)}
                disabled={isFirst}
                className="h-8 w-8"
              >
                <ChevronUp className="w-4 h-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => onMoveDown(index)}
                disabled={isLast}
                className="h-8 w-8"
              >
                <ChevronDown className="w-4 h-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => onDelete(section.id)}
                disabled={totalSections <= 1}
                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          {/* Contenu de la section */}
          <div className="pl-11">
            <RichTextEditor
              content={section.content}
              onChange={(content) => onUpdate(section.id, 'content', content)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export const GuideSectionsEditor = ({ sections, onChange }: GuideSectionsEditorProps) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const generateId = () => `section-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const addSection = () => {
    const newSection: GuideSection = {
      id: generateId(),
      title: "",
      content: ""
    };
    onChange([...sections, newSection]);
  };

  const updateSection = (id: string, field: 'title' | 'content', value: string) => {
    onChange(sections.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const deleteSection = (id: string) => {
    if (sections.length > 1) {
      onChange(sections.filter(s => s.id !== id));
    }
  };

  const moveSection = (fromIndex: number, toIndex: number) => {
    if (toIndex >= 0 && toIndex < sections.length) {
      const newSections = [...sections];
      const [movedSection] = newSections.splice(fromIndex, 1);
      newSections.splice(toIndex, 0, movedSection);
      onChange(newSections);
    }
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    
    if (active.id !== over.id) {
      const oldIndex = sections.findIndex(s => s.id === active.id);
      const newIndex = sections.findIndex(s => s.id === over.id);
      onChange(arrayMove(sections, oldIndex, newIndex));
    }
  };

  // Générer le sommaire à partir des sections
  const tableOfContents = sections
    .filter(s => s.title.trim())
    .map((s, i) => ({ number: i + 1, title: s.title }));

  return (
    <div className="space-y-6">
      {/* Sommaire dynamique */}
      <div className="bg-muted/30 border border-border rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <List className="w-5 h-5 text-primary" />
          <Label className="font-semibold text-lg">Sommaire du guide</Label>
        </div>
        
        {tableOfContents.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">
            Le sommaire s'affichera ici une fois que vous aurez ajouté des titres à vos sections
          </p>
        ) : (
          <ol className="space-y-1 pl-1">
            {tableOfContents.map((item) => (
              <li 
                key={item.number}
                className="flex items-center gap-2 text-sm text-foreground hover:text-primary transition-colors"
              >
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary font-medium text-xs">
                  {item.number}
                </span>
                <span className="flex-1">{item.title}</span>
              </li>
            ))}
          </ol>
        )}
        
        <p className="text-xs text-muted-foreground mt-3">
          Le sommaire est généré automatiquement à partir des titres de vos sections
        </p>
      </div>

      {/* Sections éditables */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            <Label className="font-semibold text-lg">Sections du guide</Label>
          </div>
          <span className="text-sm text-muted-foreground">
            {sections.length} section{sections.length > 1 ? 's' : ''}
          </span>
        </div>
        
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={sections.map(s => s.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-4">
              {sections.map((section, index) => (
                <SortableSectionItem
                  key={section.id}
                  section={section}
                  index={index}
                  onUpdate={updateSection}
                  onDelete={deleteSection}
                  onMoveUp={(i) => moveSection(i, i - 1)}
                  onMoveDown={(i) => moveSection(i, i + 1)}
                  isFirst={index === 0}
                  isLast={index === sections.length - 1}
                  totalSections={sections.length}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        <Button
          type="button"
          variant="outline"
          onClick={addSection}
          className="w-full mt-4 gap-2 border-dashed border-2 hover:border-primary hover:bg-primary/5"
        >
          <Plus className="w-4 h-4" />
          Ajouter une section
        </Button>
      </div>
    </div>
  );
};
