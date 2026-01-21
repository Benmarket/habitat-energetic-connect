import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, X, Pencil, Plus } from "lucide-react";

interface FeatureEditorProps {
  features: string[];
  onFeaturesChange: (features: string[]) => void;
}

export const FeatureEditor = ({ features, onFeaturesChange }: FeatureEditorProps) => {
  const [currentFeature, setCurrentFeature] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState("");

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
      // If empty, remove the feature
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

      {/* Features list */}
      {features.length > 0 && (
        <div className="space-y-2">
          {features.map((feature, index) => (
            <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded">
              {editingIndex === index ? (
                <>
                  <Input
                    value={editingValue}
                    onChange={(e) => setEditingValue(e.target.value)}
                    className="flex-1 h-8"
                    autoFocus
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        saveEdit();
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") {
                        cancelEdit();
                      }
                    }}
                  />
                  <Button type="button" variant="ghost" size="sm" onClick={saveEdit} className="text-green-600 hover:text-green-700">
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={cancelEdit} className="text-muted-foreground">
                    <X className="w-4 h-4" />
                  </Button>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span className="flex-1">{feature}</span>
                  <Button type="button" variant="ghost" size="sm" onClick={() => startEditing(index)} className="text-muted-foreground hover:text-foreground">
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeFeature(index)} className="text-muted-foreground hover:text-destructive">
                    <X className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
