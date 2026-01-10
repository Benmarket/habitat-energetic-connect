import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { CreatePostFormData } from "@/hooks/useCreatePost";

interface FAQSectionProps {
  formData: CreatePostFormData;
  setFormData: React.Dispatch<React.SetStateAction<CreatePostFormData>>;
}

export function FAQSection({ formData, setFormData }: FAQSectionProps) {
  return (
    <div className="space-y-2">
      <Label>Questions FAQ (Facultatif) - Optimisation SEO & GEO</Label>
      <div className="space-y-4 border rounded-md p-4 bg-muted/30">
        {formData.faq.map((item, index) => (
          <div key={index} className="space-y-2 p-3 border rounded-md bg-background">
            <div className="flex justify-between items-center">
              <Label className="text-sm font-semibold">Question {index + 1}</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFormData({
                    ...formData,
                    faq: formData.faq.filter((_, i) => i !== index)
                  });
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <Input
              placeholder="Question"
              value={item.question}
              onChange={(e) => {
                const newFaq = [...formData.faq];
                newFaq[index].question = e.target.value;
                setFormData({ ...formData, faq: newFaq });
              }}
            />
            <Textarea
              placeholder="Réponse"
              value={item.answer}
              rows={3}
              onChange={(e) => {
                const newFaq = [...formData.faq];
                newFaq[index].answer = e.target.value;
                setFormData({ ...formData, faq: newFaq });
              }}
            />
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            setFormData({
              ...formData,
              faq: [...formData.faq, { question: '', answer: '' }]
            });
          }}
          className="w-full"
        >
          + Ajouter une question FAQ
        </Button>
        <p className="text-xs text-muted-foreground">
          Les FAQ améliorent votre SEO et aident les IA à mieux référencer votre article.
        </p>
      </div>
    </div>
  );
}
