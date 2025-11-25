import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface SchedulePublishModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: string;
  currentScheduledDate?: string | null;
  onScheduled: () => void;
}

export function SchedulePublishModal({
  open,
  onOpenChange,
  postId,
  currentScheduledDate,
  onScheduled,
}: SchedulePublishModalProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    currentScheduledDate ? new Date(currentScheduledDate) : undefined
  );
  const [selectedTime, setSelectedTime] = useState(
    currentScheduledDate
      ? format(new Date(currentScheduledDate), "HH:mm")
      : "08:00"
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSchedule = async () => {
    if (!selectedDate) {
      toast.error("Veuillez sélectionner une date");
      return;
    }

    setIsSubmitting(true);
    try {
      const [hours, minutes] = selectedTime.split(":").map(Number);
      const scheduledDateTime = new Date(selectedDate);
      scheduledDateTime.setHours(hours, minutes, 0, 0);

      const { error } = await supabase
        .from("posts")
        .update({ scheduled_publish_at: scheduledDateTime.toISOString() })
        .eq("id", postId);

      if (error) throw error;

      toast.success("Publication programmée avec succès");
      onScheduled();
      onOpenChange(false);
    } catch (error) {
      console.error("Error scheduling post:", error);
      toast.error("Erreur lors de la programmation");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveSchedule = async () => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("posts")
        .update({ scheduled_publish_at: null })
        .eq("id", postId);

      if (error) throw error;

      toast.success("Programmation annulée");
      onScheduled();
      onOpenChange(false);
    } catch (error) {
      console.error("Error removing schedule:", error);
      toast.error("Erreur lors de l'annulation");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" />
            Programmer la diffusion
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label>Date de publication</Label>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={(date) => date < new Date()}
              locale={fr}
              className="rounded-md border"
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Heure de publication
            </Label>
            <Input
              type="time"
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              className="w-full"
            />
          </div>

          {selectedDate && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium">
                L'article sera publié le{" "}
                {format(selectedDate, "d MMMM yyyy", { locale: fr })} à{" "}
                {selectedTime}
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          {currentScheduledDate && (
            <Button
              variant="outline"
              onClick={handleRemoveSchedule}
              disabled={isSubmitting}
            >
              Annuler la programmation
            </Button>
          )}
          <Button onClick={handleSchedule} disabled={isSubmitting || !selectedDate}>
            {isSubmitting ? "Programmation..." : "Programmer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
