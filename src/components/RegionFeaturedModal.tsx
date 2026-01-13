import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Star, GripVertical, Save, Loader2 } from "lucide-react";
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

type RegionCode = 'fr' | 'corse' | 'guadeloupe' | 'martinique' | 'guyane' | 'reunion';

interface Advertisement {
  id: string;
  title: string;
  advertiser?: {
    name: string;
  };
  status: string;
  target_regions: string[] | null;
}

interface RegionFeaturedModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  regionCode: RegionCode;
  regionLabel: string;
  advertisements: Advertisement[];
  onSave: () => void;
}

interface FeaturedAd {
  id: string;
  advertisement_id: string;
  display_order: number;
}

interface SortableItemProps {
  id: string;
  ad: Advertisement;
  order: number;
  onRemove: () => void;
}

function SortableItem({ id, ad, order, onRemove }: SortableItemProps) {
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
      className="flex items-center gap-3 p-3 bg-card border rounded-lg"
    >
      <button {...attributes} {...listeners} className="cursor-grab hover:bg-muted p-1 rounded">
        <GripVertical className="w-4 h-4 text-muted-foreground" />
      </button>
      <Badge variant="outline" className="w-6 h-6 flex items-center justify-center p-0">
        {order}
      </Badge>
      <div className="flex-1">
        <p className="font-medium text-sm">{ad.title}</p>
        <p className="text-xs text-muted-foreground">{ad.advertiser?.name}</p>
      </div>
      <Button variant="ghost" size="sm" onClick={onRemove} className="text-destructive hover:text-destructive">
        Retirer
      </Button>
    </div>
  );
}

export default function RegionFeaturedModal({
  open,
  onOpenChange,
  regionCode,
  regionLabel,
  advertisements,
  onSave,
}: RegionFeaturedModalProps) {
  const [featuredIds, setFeaturedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (open) {
      fetchFeaturedAds();
    }
  }, [open, regionCode]);

  const fetchFeaturedAds = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("ad_region_featured")
        .select("advertisement_id, display_order")
        .eq("region_code", regionCode)
        .order("display_order");

      if (error) throw error;
      setFeaturedIds((data || []).map(d => d.advertisement_id));
    } catch (error) {
      console.error("Error fetching featured ads:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter ads available for this region
  const availableAds = advertisements.filter(ad => {
    if (ad.status !== 'active') return false;
    if (!ad.target_regions || ad.target_regions.length === 0) return true;
    return ad.target_regions.includes(regionCode);
  });

  const featuredAds = featuredIds
    .map(id => availableAds.find(ad => ad.id === id))
    .filter(Boolean) as Advertisement[];

  const nonFeaturedAds = availableAds.filter(ad => !featuredIds.includes(ad.id));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setFeaturedIds((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over.id as string);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const addToFeatured = (adId: string) => {
    if (featuredIds.length >= 3) {
      toast.error("Maximum 3 annonces en vedette par région");
      return;
    }
    setFeaturedIds([...featuredIds, adId]);
  };

  const removeFromFeatured = (adId: string) => {
    setFeaturedIds(featuredIds.filter(id => id !== adId));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Delete existing featured for this region
      const { error: deleteError } = await supabase
        .from("ad_region_featured")
        .delete()
        .eq("region_code", regionCode);

      if (deleteError) throw deleteError;

      // Insert new featured ads
      if (featuredIds.length > 0) {
        const inserts = featuredIds.map((adId, index) => ({
          advertisement_id: adId,
          region_code: regionCode,
          display_order: index,
        }));

        const { error: insertError } = await supabase
          .from("ad_region_featured")
          .insert(inserts);

        if (insertError) throw insertError;
      }

      toast.success(`Mises en avant pour ${regionLabel} enregistrées`);
      onSave();
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving featured ads:", error);
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-500" />
            Mises en avant - {regionLabel}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Featured ads section */}
            <div>
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                Annonces en vedette ({featuredIds.length}/3)
              </h3>
              
              {featuredAds.length > 0 ? (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext items={featuredIds} strategy={verticalListSortingStrategy}>
                    <div className="space-y-2">
                      {featuredAds.map((ad, index) => (
                        <SortableItem
                          key={ad.id}
                          id={ad.id}
                          ad={ad}
                          order={index + 1}
                          onRemove={() => removeFromFeatured(ad.id)}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              ) : (
                <div className="text-center py-6 text-muted-foreground bg-muted/30 rounded-lg">
                  <p>Aucune annonce en vedette pour cette région</p>
                  <p className="text-sm">Sélectionnez jusqu'à 3 annonces ci-dessous</p>
                </div>
              )}
            </div>

            {/* Available ads section */}
            <div>
              <h3 className="font-medium mb-3">Annonces disponibles ({nonFeaturedAds.length})</h3>
              <ScrollArea className="h-[200px] border rounded-lg p-2">
                {nonFeaturedAds.length > 0 ? (
                  <div className="space-y-2">
                    {nonFeaturedAds.map((ad) => (
                      <div
                        key={ad.id}
                        className="flex items-center gap-3 p-2 hover:bg-muted/50 rounded cursor-pointer"
                        onClick={() => addToFeatured(ad.id)}
                      >
                        <Checkbox
                          checked={false}
                          disabled={featuredIds.length >= 3}
                        />
                        <div className="flex-1">
                          <p className="font-medium text-sm">{ad.title}</p>
                          <p className="text-xs text-muted-foreground">{ad.advertiser?.name}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={featuredIds.length >= 3}
                        >
                          Ajouter
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-4">
                    Toutes les annonces sont déjà en vedette
                  </p>
                )}
              </ScrollArea>
            </div>

            {/* Save button */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button onClick={handleSave} disabled={saving} className="gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Enregistrer
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
