import { useEffect, useRef, useState } from "react";
import { CheckCircle2, FileText, Users, Award } from "lucide-react";

interface Step {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const steps: Step[] = [
  {
    id: 1,
    title: "Comprendre votre situation",
    description: "Nous analysons les caractéristiques de votre logement et votre consommation énergétique actuelle pour identifier les axes d'amélioration.",
    icon: <FileText className="w-6 h-6" />,
  },
  {
    id: 2,
    title: "Identifier les aides disponibles",
    description: "En fonction de votre profil et de votre projet, nous recensons l'ensemble des dispositifs d'aide auxquels vous pouvez prétendre.",
    icon: <CheckCircle2 className="w-6 h-6" />,
  },
  {
    id: 3,
    title: "Définir un projet cohérent",
    description: "Nous vous aidons à construire un projet de rénovation adapté à vos besoins, en tenant compte des contraintes techniques et budgétaires.",
    icon: <Users className="w-6 h-6" />,
  },
  {
    id: 4,
    title: "Vous accompagner dans les démarches",
    description: "De la constitution du dossier jusqu'à la réalisation des travaux, nous restons à vos côtés pour un parcours serein et structuré.",
    icon: <Award className="w-6 h-6" />,
  },
];

const InstitutionalContextSection = () => {
  const [activeStep, setActiveStep] = useState(0);
  const sectionRef = useRef<HTMLDivElement>(null);
  const stepsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return;

      const sectionTop = sectionRef.current.offsetTop;
      const sectionHeight = sectionRef.current.offsetHeight;
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;

      // Calculate progress through the section
      const sectionStart = sectionTop - windowHeight * 0.5;
      const sectionEnd = sectionTop + sectionHeight - windowHeight;
      
      if (scrollY < sectionStart) {
        setActiveStep(0);
        return;
      }

      if (scrollY > sectionEnd) {
        setActiveStep(steps.length - 1);
        return;
      }

      // Calculate which step should be active
      const progress = (scrollY - sectionStart) / (sectionEnd - sectionStart);
      const stepIndex = Math.min(
        Math.floor(progress * steps.length),
        steps.length - 1
      );
      setActiveStep(stepIndex);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section
      ref={sectionRef}
      id="parcours"
      className="relative bg-white py-0"
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 min-h-[600px] lg:min-h-[800px]">
          {/* Left Column - Sticky */}
          <div className="lg:sticky lg:top-24 lg:h-fit py-12 lg:py-24 px-6 lg:px-12 flex flex-col justify-center">
            <div className="max-w-md">
              <h2 className="text-3xl lg:text-4xl font-bold text-slate-800 leading-tight mb-4">
                Votre maison, un choix économique et logique
              </h2>
              <p className="text-lg text-slate-600 font-medium mb-6">
                Des travaux énergétiques subventionnés pour votre habitat
              </p>
              <p className="text-slate-500 leading-relaxed">
                Prime Énergies vous accompagne dans un parcours simple et structuré, 
                pour comprendre les aides disponibles et construire votre projet sereinement.
              </p>

              {/* Progress indicator for mobile */}
              <div className="flex gap-2 mt-8 lg:hidden">
                {steps.map((_, index) => (
                  <div
                    key={index}
                    className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                      index <= activeStep ? "bg-slate-700" : "bg-slate-200"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Scrolling Steps */}
          <div className="relative py-12 lg:py-24 px-6 lg:px-12 bg-slate-50/50">
            {/* Vertical timeline line - Desktop only */}
            <div className="hidden lg:block absolute left-12 top-24 bottom-24 w-px bg-slate-200">
              <div
                className="absolute top-0 left-0 w-full bg-slate-400 transition-all duration-500 ease-out"
                style={{
                  height: `${((activeStep + 1) / steps.length) * 100}%`,
                }}
              />
            </div>

            <div className="space-y-8 lg:space-y-16 lg:pl-12">
              {steps.map((step, index) => (
                <div
                  key={step.id}
                  ref={(el) => (stepsRef.current[index] = el)}
                  className={`relative transition-all duration-500 ease-out ${
                    index <= activeStep
                      ? "opacity-100 translate-y-0"
                      : "opacity-40 translate-y-4"
                  }`}
                >
                  {/* Step indicator dot */}
                  <div
                    className={`hidden lg:flex absolute -left-12 top-0 w-6 h-6 rounded-full border-2 items-center justify-center transition-all duration-300 ${
                      index <= activeStep
                        ? "bg-slate-700 border-slate-700 text-white"
                        : "bg-white border-slate-300 text-slate-400"
                    }`}
                  >
                    <span className="text-xs font-semibold">{step.id}</span>
                  </div>

                  {/* Step content */}
                  <div
                    className={`bg-white rounded-xl p-6 shadow-sm border transition-all duration-300 ${
                      index <= activeStep
                        ? "border-slate-200 shadow-md"
                        : "border-slate-100"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center transition-colors duration-300 ${
                          index <= activeStep
                            ? "bg-slate-100 text-slate-700"
                            : "bg-slate-50 text-slate-400"
                        }`}
                      >
                        {step.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-2 lg:hidden">
                          <span className="text-xs font-semibold text-slate-400">
                            Étape {step.id}
                          </span>
                        </div>
                        <h3 className="text-lg font-semibold text-slate-800 mb-2">
                          {step.title}
                        </h3>
                        <p className="text-slate-500 text-sm leading-relaxed">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default InstitutionalContextSection;
