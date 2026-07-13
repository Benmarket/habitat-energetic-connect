import { BookOpen, Wrench } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface GuidesModuleNoticeProps {
  message: string;
  title?: string;
}

export const GuidesModuleNotice = ({ message, title = "Guides en refonte" }: GuidesModuleNoticeProps) => {
  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="border-2 border-dashed border-amber-300 bg-amber-50/60">
            <CardContent className="pt-10 pb-10 text-center space-y-5">
              <div className="w-16 h-16 mx-auto rounded-full bg-amber-100 flex items-center justify-center relative">
                <BookOpen className="w-8 h-8 text-amber-700" />
                <span className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow">
                  <Wrench className="w-4 h-4 text-amber-600" />
                </span>
              </div>
              <h2 className="text-2xl font-bold text-foreground">{title}</h2>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                {message}
              </p>
              <p className="text-xs text-muted-foreground/80 italic">
                Merci de votre compréhension.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default GuidesModuleNotice;
