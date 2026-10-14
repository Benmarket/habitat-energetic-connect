import { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { usePageMaintenance } from "@/hooks/usePageMaintenance";
import { PageMaintenance } from "@/components/PageMaintenance";

/** Bloque toutes les pages du forum quand il est désactivé dans le panel. */
const ForumGate = ({ children }: { children: ReactNode }) => {
  const { isUnderMaintenance, isLoading } = usePageMaintenance("forum");
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  if (isUnderMaintenance) {
    return (
      <PageMaintenance
        pageName="Forum de discussion"
        description="Le forum de discussion est actuellement en maintenance. Veuillez réessayer ultérieurement."
      />
    );
  }
  return <>{children}</>;
};

export default ForumGate;
