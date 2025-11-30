import ecologiqueImg from "@/assets/why-solar/ecologique.png";
import factureEdfImg from "@/assets/why-solar/facture-edf-new.png";
import appliPvImg from "@/assets/why-solar/appli-pv.jpg";
import smartphoneImg from "@/assets/why-solar/utilise-smartphone.png";

const WhySolarSection = () => {
  const benefits = [
    {
      image: ecologiqueImg,
      title: "Écologique",
      description: "Le panneau solaire, utilise la lumière du soleil pour produire de l'électricité sans émissions nocives. C'est une solution écologique qui contribue à la préservation de l'environnement."
    },
    {
      image: factureEdfImg,
      title: "Économique",
      description: "Avec votre installation solaire vous pouvez réaliser jusqu'à 70% d'économies sur votre facture d'énergie. Les panneaux solaires sont actuellement la solution la plus efficace pour faire des économies d'énergies."
    },
    {
      image: smartphoneImg,
      title: "Maîtrise",
      description: "Avec des panneaux solaires, vous maîtrisez votre consommation électrique. En produisant votre propre énergie, vous devenez autonome, réduisez votre dépendance aux fournisseurs et contrôlez votre consommation."
    },
    {
      image: appliPvImg,
      title: "Connecté",
      description: "Vous pouvez contrôler la production de votre installation photovoltaïque directement depuis votre smartphone via l'application."
    }
  ];

  return (
    <section className="relative py-16 lg:py-20 bg-background overflow-hidden">
      <div className="container mx-auto px-4">
        {/* Title */}
        <h2 className="text-3xl lg:text-4xl font-extrabold text-center mb-12 lg:mb-16">
          Pourquoi <span className="text-primary">l'énergie solaire ?</span>
        </h2>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6 max-w-7xl mx-auto">
          {benefits.map((benefit, index) => (
            <div key={index} className="flex flex-col items-center text-center">
              {/* Image Circle */}
              <div className="w-32 h-32 lg:w-40 lg:h-40 rounded-full bg-muted flex items-center justify-center mb-6 overflow-hidden">
                <img 
                  src={benefit.image} 
                  alt={benefit.title}
                  className={`w-full h-full ${
                    index === 1 ? 'object-cover scale-[2.5]' : 
                    'object-cover'
                  }`}
                />
              </div>
              
              {/* Title */}
              <h3 className="text-xl lg:text-2xl font-bold text-primary mb-4">
                {benefit.title}
              </h3>
              
              {/* Description */}
              <p className="text-sm lg:text-base text-foreground leading-relaxed">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Wave decoration at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-24 lg:h-32">
        <svg
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          className="w-full h-full"
        >
          <path
            d="M0,60 C300,100 600,20 900,60 C1050,80 1150,90 1200,60 L1200,120 L0,120 Z"
            fill="hsl(var(--primary))"
            opacity="0.3"
          />
        </svg>
      </div>
    </section>
  );
};

export default WhySolarSection;
