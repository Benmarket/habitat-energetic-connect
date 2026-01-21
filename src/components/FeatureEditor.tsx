import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, X, Pencil, Plus, GripVertical } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface FeatureEditorProps {
  features: string[];
  onFeaturesChange: (features: string[]) => void;
}

interface SortableFeatureItemProps {
  id: string;
  feature: string;
  index: number;
  isEditing: boolean;
  editingValue: string;
  onEditingValueChange: (value: string) => void;
  onStartEditing: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onRemove: () => void;
}

const SortableFeatureItem = ({
  id,
  feature,
  isEditing,
  editingValue,
  onEditingValueChange,
  onStartEditing,
  onSaveEdit,
  onCancelEdit,
  onRemove,
}: SortableFeatureItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 p-2 bg-muted rounded ${isDragging ? 'shadow-lg' : ''}`}
    >
      {isEditing ? (
        <>
          <Input
            value={editingValue}
            onChange={(e) => onEditingValueChange(e.target.value)}
            className="flex-1 h-8"
            autoFocus
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onSaveEdit();
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                onCancelEdit();
              }
            }}
          />
          <Button type="button" variant="ghost" size="sm" onClick={onSaveEdit} className="text-green-600 hover:text-green-700">
            <Check className="w-4 h-4" />
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={onCancelEdit} className="text-muted-foreground">
            <X className="w-4 h-4" />
          </Button>
        </>
      ) : (
        <>
          <button
            type="button"
            className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="w-4 h-4" />
          </button>
          <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
          <span className="flex-1">{feature}</span>
          <Button type="button" variant="ghost" size="sm" onClick={onStartEditing} className="text-muted-foreground hover:text-foreground">
            <Pencil className="w-4 h-4" />
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={onRemove} className="text-muted-foreground hover:text-destructive">
            <X className="w-4 h-4" />
          </Button>
        </>
      )}
    </div>
  );
};

export const FeatureEditor = ({ features, onFeaturesChange }: FeatureEditorProps) => {
  const [currentFeature, setCurrentFeature] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Generate stable IDs for features
  const featureIds = features.map((_, index) => `feature-${index}`);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = featureIds.indexOf(active.id as string);
      const newIndex = featureIds.indexOf(over.id as string);
      onFeaturesChange(arrayMove(features, oldIndex, newIndex));
    }
  };

  const addFeature = () => {
    if (!currentFeature.trim()) return;
    onFeaturesChange([...features, currentFeature.trim()]);
    setCurrentFeature("");
  };

  const removeFeature = (index: number) => {
    onFeaturesChange(features.filter((_, i) => i !== index));
  };

  const startEditing = (index: number) => {
    setEditingIndex(index);
    setEditingValue(features[index]);
  };

  const saveEdit = () => {
    if (editingIndex === null) return;
    if (!editingValue.trim()) {
      removeFeature(editingIndex);
    } else {
      const newFeatures = [...features];
      newFeatures[editingIndex] = editingValue.trim();
      onFeaturesChange(newFeatures);
    }
    setEditingIndex(null);
    setEditingValue("");
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditingValue("");
  };

  return (
    <div className="space-y-2">
      {/* Add new feature */}
      <div className="flex gap-2">
        <Input
          value={currentFeature}
          onChange={(e) => setCurrentFeature(e.target.value)}
          placeholder="Ajouter un avantage"
          onKeyPress={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addFeature();
            }
          }}
        />
        <Button type="button" onClick={addFeature} size="icon">
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {/* Features list with drag and drop */}
      {features.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={featureIds} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {features.map((feature, index) => (
                <SortableFeatureItem
                  key={featureIds[index]}
                  id={featureIds[index]}
                  feature={feature}
                  index={index}
                  isEditing={editingIndex === index}
                  editingValue={editingValue}
                  onEditingValueChange={setEditingValue}
                  onStartEditing={() => startEditing(index)}
                  onSaveEdit={saveEdit}
                  onCancelEdit={cancelEdit}
                  onRemove={() => removeFeature(index)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
};
