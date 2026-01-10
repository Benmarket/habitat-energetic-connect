import { useEffect, useRef, useState } from "react";
import { CheckCircle2, FileText, Users, Award } from "lucide-react";
import maisonPrimeGif from "@/assets/maison-prime.gif";

interface Step {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

const steps: Step[] = [
  {
    id: 1,
    title: "Comprendre votre situation",
    description: "Nous analysons les caractéristiques de votre logement et votre consommation énergétique actuelle pour identifier les axes d'amélioration.",
    icon: <FileText className="w-6 h-6" />,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  {
    id: 2,
    title: "Identifier les aides disponibles",
    description: "En fonction de votre profil et de votre projet, nous recensons l'ensemble des dispositifs d'aide auxquels vous pouvez prétendre.",
    icon: <CheckCircle2 className="w-6 h-6" />,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
  },
  {
    id: 3,
    title: "Définir un projet cohérent",
    description: "Nous vous aidons à construire un projet de rénovation adapté à vos besoins, en tenant compte des contraintes techniques et budgétaires.",
    icon: <Users className="w-6 h-6" />,
    color: "text-violet-600",
    bgColor: "bg-violet-50",
  },
  {
    id: 4,
    title: "Vous accompagner dans les démarches",
    description: "De la constitution du dossier jusqu'à la réalisation des travaux, nous restons à vos côtés pour un parcours serein et structuré.",
    icon: <Award className="w-6 h-6" />,
    color: "text-amber-600",
    bgColor: "bg-amber-50",
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

      // Extended range for slower transitions + extra padding at the end for step 4
      const sectionStart = sectionTop - windowHeight * 0.3;
      // Add extra scroll space for the last step to persist longer
      const extraScrollForLastStep = windowHeight * 0.5;
      const sectionEnd = sectionTop + sectionHeight - windowHeight * 0.3 + extraScrollForLastStep;
      
      if (scrollY < sectionStart) {
        setActiveStep(0);
        return;
      }

      if (scrollY > sectionEnd) {
        setActiveStep(steps.length - 1);
        return;
      }

      // Calculate progress with weighted distribution
      // Give more scroll space to the last step
      const rawProgress = (scrollY - sectionStart) / (sectionEnd - sectionStart);
      
      // Custom step thresholds: steps 1-3 get 60% of scroll, step 4 gets 40%
      let stepIndex: number;
      if (rawProgress < 0.2) {
        stepIndex = 0;
      } else if (rawProgress < 0.4) {
        stepIndex = 1;
      } else if (rawProgress < 0.6) {
        stepIndex = 2;
      } else {
        // Step 4 takes the remaining 40% of scroll distance
        stepIndex = 3;
      }
      
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
      className="relative bg-gradient-to-br from-slate-50 via-white to-blue-50/30 py-0"
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 min-h-[800px] lg:min-h-[1000px]">
          {/* Left Column - Sticky */}
          <div className="lg:sticky lg:top-24 lg:h-fit py-16 lg:py-28 px-6 lg:px-12 flex flex-col justify-center">
            <div className="max-w-lg lg:max-w-xl">
              <h2 className="text-3xl md:text-4xl lg:text-[2.75rem] xl:text-5xl font-bold text-slate-800 leading-[1.15] mb-5">
                Votre maison, un choix{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-500 whitespace-nowrap">
                  économique et logique
                </span>
              </h2>
              <p className="text-lg lg:text-xl text-slate-600 font-medium mb-6">
                Des travaux énergétiques subventionnés pour votre habitat
              </p>
              <p className="text-slate-500 leading-relaxed text-base lg:text-lg">
                Prime Énergies vous accompagne dans un parcours simple et structuré, 
                pour comprendre les aides disponibles et construire votre projet sereinement.
              </p>
              
              {/* Illustration maison */}
              <div className="mt-8 lg:mt-10">
                <img 
                  src={maisonPrimeGif} 
                  alt="Maison avec panneaux solaires, éolienne et pompe à chaleur" 
                  className="w-full max-w-sm lg:max-w-md rounded-xl"
                />
              </div>
            </div>
          </div>

          {/* Right Column - Scrolling Steps */}
          <div className="relative py-16 lg:py-28 px-6 lg:px-12">
            {/* Vertical timeline line - Desktop only */}
            <div className="hidden lg:block absolute left-12 top-28 bottom-28 w-0.5 bg-gradient-to-b from-slate-200 via-slate-300 to-slate-200 rounded-full">
              <div
                className="absolute top-0 left-0 w-full bg-gradient-to-b from-blue-500 via-emerald-500 to-violet-500 rounded-full transition-all duration-700 ease-out"
                style={{
                  height: `${((activeStep + 1) / steps.length) * 100}%`,
                }}
              />
            </div>

            <div className="space-y-6 lg:space-y-8 lg:pl-16">
              {steps.map((step, index) => {
                const isActive = index === activeStep;
                const isPast = index < activeStep;
                const isFuture = index > activeStep;

                return (
                  <div
                    key={step.id}
                    ref={(el) => (stepsRef.current[index] = el)}
                    className={`relative transition-all duration-700 ease-out ${
                      isActive
                        ? "opacity-100 scale-100 translate-y-0"
                        : isPast
                        ? "opacity-70 scale-95 -translate-y-1"
                        : "opacity-40 scale-90 translate-y-2"
                    }`}
                  >
                    {/* Step indicator dot */}
                    <div
                      className={`hidden lg:flex absolute -left-16 top-6 w-8 h-8 rounded-full border-2 items-center justify-center transition-all duration-500 shadow-lg ${
                        isActive
                          ? "bg-gradient-to-br from-blue-500 to-blue-600 border-blue-400 text-white scale-125"
                          : isPast
                          ? "bg-emerald-500 border-emerald-400 text-white"
                          : "bg-white border-slate-300 text-slate-400"
                      }`}
                    >
                      {isPast ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <span className="text-xs font-bold">{step.id}</span>
                      )}
                    </div>

                    {/* Step content */}
                    <div
                      className={`relative overflow-hidden rounded-2xl transition-all duration-500 ${
                        isActive
                          ? "bg-white shadow-2xl shadow-blue-500/10 border-2 border-blue-100 p-8"
                          : "bg-white/80 shadow-md border border-slate-100 p-6"
                      }`}
                    >
                      {/* Active indicator glow */}
                      {isActive && (
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-emerald-500 to-violet-500" />
                      )}

                      <div className="flex items-start gap-5">
                        <div
                          className={`flex-shrink-0 rounded-xl flex items-center justify-center transition-all duration-500 ${
                            isActive
                              ? `w-16 h-16 ${step.bgColor} ${step.color}`
                              : `w-12 h-12 bg-slate-100 text-slate-400`
                          }`}
                        >
                          <div className={isActive ? "scale-110" : ""}>
                            {step.icon}
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2 lg:hidden">
                            <span
                              className={`text-xs font-bold px-2 py-1 rounded-full ${
                                isActive
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-slate-100 text-slate-500"
                              }`}
                            >
                              Étape {step.id}
                            </span>
                          </div>
                          <h3
                            className={`font-bold mb-3 transition-all duration-500 ${
                              isActive
                                ? "text-xl lg:text-2xl text-slate-800"
                                : "text-lg text-slate-600"
                            }`}
                          >
                            {step.title}
                          </h3>
                          <p
                            className={`leading-relaxed transition-all duration-500 ${
                              isActive
                                ? "text-base text-slate-600"
                                : "text-sm text-slate-400"
                            }`}
                          >
                            {step.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default InstitutionalContextSection;
