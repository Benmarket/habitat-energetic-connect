import { ClipboardCheck, HardHat, Plug, PiggyBank } from "lucide-react";

const steps = [
  {
    icon: ClipboardCheck,
    number: "01",
    title: "Étude & Éligibilité",
    description: "Un conseiller analyse votre toiture, votre consommation et vos droits aux aides. Devis gratuit et sans engagement.",
    color: "bg-emerald-500",
  },
  {
    icon: HardHat,
    number: "02",
    title: "Installation par un pro RGE",
    description: "Nos installateurs certifiés RGE posent vos panneaux en 1 à 2 jours. Nous gérons 100% des démarches administratives.",
    color: "bg-blue-500",
  },
  {
    icon: Plug,
    number: "03",
    title: "Mise en service & Raccordement",
    description: "Raccordement Enedis, mise en service de l'onduleur et activation du contrat de revente du surplus EDF OA.",
    color: "bg-amber-500",
  },
  {
    icon: PiggyBank,
    number: "04",
    title: "Économies immédiates",
    description: "Dès le premier jour, vous produisez votre propre électricité et réduisez votre facture jusqu'à 70%.",
    color: "bg-primary",
  },
];

interface SolarHowItWorksProps {
  onCtaClick?: () => void;
}

const SolarHowItWorks = ({ onCtaClick }: SolarHowItWorksProps) => {
  return (
    <section className="py-12 lg:py-20 bg-card">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-12 lg:mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
            Simple & rapide
          </span>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-extrabold">
            Comment ça marche <span className="text-primary">?</span>
          </h2>
          <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
            De l'étude à la mise en service, nous gérons tout pour vous.
          </p>
        </div>

        {/* Desktop timeline */}
        <div className="hidden lg:block relative">
          {/* Connector line */}
          <div className="absolute top-16 left-[10%] right-[10%] h-1 bg-gradient-to-r from-emerald-500 via-blue-500 via-amber-500 to-primary rounded-full" />

          <div className="grid grid-cols-4 gap-6 relative">
            {steps.map((step, i) => (
              <div key={i} className="flex flex-col items-center text-center group">
                {/* Circle with icon */}
                <div className={`relative z-10 w-32 h-32 rounded-full ${step.color} flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-300`}>
                  <step.icon className="w-14 h-14 text-white" strokeWidth={1.5} />
                  <span className="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-card border-4 border-current text-foreground flex items-center justify-center text-sm font-black shadow-md">
                    {step.number}
                  </span>
                </div>

                <h3 className="text-lg font-bold mt-6 mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed px-2">{step.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile/Tablet */}
        <div className="lg:hidden space-y-6">
          {steps.map((step, i) => (
            <div key={i} className="flex gap-5 items-start">
              <div className="flex flex-col items-center flex-shrink-0">
                <div className={`w-16 h-16 rounded-full ${step.color} flex items-center justify-center shadow-lg`}>
                  <step.icon className="w-8 h-8 text-white" strokeWidth={1.5} />
                </div>
                {i < steps.length - 1 && (
                  <div className="w-0.5 h-12 bg-border mt-2" />
                )}
              </div>
              <div className="pt-2">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Étape {step.number}</span>
                <h3 className="text-lg font-bold mt-1 mb-1">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        {onCtaClick && (
          <div className="flex justify-center mt-10">
            <button
              onClick={onCtaClick}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-10 py-3 rounded-full shadow-xl transition-all hover:shadow-2xl hover:scale-105 text-lg"
            >
              Démarrer mon projet solaire →
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default SolarHowItWorks;
