import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, KeyRound, MessageCircle, Mail } from "lucide-react";

interface Props {
  reason: "tenant" | "apartment" | "both";
  onReset: () => void;
}

const TITLES: Record<Props["reason"], string> = {
  tenant: "Espace réservé aux propriétaires",
  apartment: "Espace réservé aux maisons individuelles",
  both: "Espace réservé aux propriétaires de maison",
};

const BlockedAccess = ({ reason, onReset }: Props) => {
  return (
    <Card className="max-w-2xl mx-auto p-8 md:p-12 text-center space-y-6">
      <div className="flex justify-center gap-4">
        {(reason === "apartment" || reason === "both") && (
          <div className="w-16 h-16 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center">
            <Building2 className="w-8 h-8" />
          </div>
        )}
        {(reason === "tenant" || reason === "both") && (
          <div className="w-16 h-16 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center">
            <KeyRound className="w-8 h-8" />
          </div>
        )}
      </div>
      <h1 className="text-2xl md:text-3xl font-bold">{TITLES[reason]}</h1>
      <p className="text-muted-foreground leading-relaxed">
        L'espace <strong>« Mes économies »</strong> nécessite d'être <strong>propriétaire d'une maison individuelle</strong>.
        En effet, les aides à la rénovation énergétique et les installations (panneaux solaires, pompe à chaleur, isolation extérieure…)
        ne peuvent être engagées qu'avec l'accord du propriétaire et concernent prioritairement les logements individuels.
      </p>
      <p className="text-sm text-muted-foreground">
        Si vous êtes locataire, parlez-en à votre propriétaire. Si vous êtes en copropriété, des dispositifs collectifs existent
        — contactez-nous pour en discuter.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button asChild variant="default">
          <Link to="/forum">
            <MessageCircle className="w-4 h-4 mr-2" />
            Poser une question au forum
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/#contact">
            <Mail className="w-4 h-4 mr-2" />
            Nous contacter
          </Link>
        </Button>
        <Button variant="ghost" onClick={onReset}>
          Modifier mes réponses
        </Button>
      </div>
    </Card>
  );
};

export default BlockedAccess;
