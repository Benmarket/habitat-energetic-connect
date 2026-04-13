import { useEffect, useState } from "react";

import guarantee25Years from "@/assets/guarantee-25-years.png";
import heroToiturePlate from "@/assets/landing/hero-toiture-plate.jpg";
import heroToitureTuiles from "@/assets/landing/hero-toiture-tuiles.jpg";
import macaronPrix from "@/assets/landing/macaron-prix.png";
import marqueFrancaise from "@/assets/landing/marque-francaise.png";
import onduleur from "@/assets/landing/onduleur.png";

const heroSlides = [
  {
    src: heroToitureTuiles,
    alt: "Maison avec panneaux solaires sur toiture en tuiles",
  },
  {
    src: heroToiturePlate,
    alt: "Maison avec installation solaire sur toiture plate",
  },
];

export const SolarHeroVisual = () => {
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const interval = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % heroSlides.length);
    }, 3000);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-4 lg:gap-6">
      <div className="relative flex-shrink-0">
        <img
          src={macaronPrix}
          alt="À partir de 35€/mois, primes déduites"
          className="absolute -top-4 -left-4 w-24 h-24 lg:w-28 lg:h-28 object-contain z-10"
        />

        <div className="relative h-44 w-[13rem] overflow-hidden md:h-52 md:w-[16rem] lg:h-64 lg:w-[22rem]">
          {heroSlides.map((slide, index) => (
            <img
              key={slide.src}
              src={slide.src}
              alt={slide.alt}
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
                index === activeSlide ? "opacity-100" : "opacity-0"
              }`}
            />
          ))}
        </div>

        <img
          src={onduleur}
          alt="Onduleur Hoymiles"
          className="absolute bottom-0 right-0 translate-x-[10%] translate-y-1/4 h-20 lg:h-28 object-contain"
        />
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <img src={marqueFrancaise} alt="Marque Française" className="h-10 lg:h-11 object-contain" />
          <img src={guarantee25Years} alt="Garantie 25 ans" className="w-16 h-16 lg:w-20 lg:h-20" />
        </div>

        <h2 className="text-lg lg:text-xl font-extrabold leading-tight">
          Propriétaire d&apos;une maison individuelle ?
        </h2>

        <p className="text-sm lg:text-base text-muted-foreground leading-relaxed">
          Passez <strong className="text-foreground">à l&apos;énergie solaire</strong> et faites d&apos;importantes
          économies sur votre <strong className="text-foreground">facture électrique.</strong>
        </p>
      </div>
    </div>
  );
};

export default SolarHeroVisual;