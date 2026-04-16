import { useEffect, useState } from "react";

import guarantee25Years from "@/assets/guarantee-25-years.png";
import heroToiturePlate from "@/assets/landing/hero-toiture-plate.jpg";
import heroToitureTuiles from "@/assets/landing/hero-toiture-tuiles.jpg";
import heroToitureArdoise from "@/assets/landing/hero-toiture-ardoise.jpg";
import heroVillaSolaire from "@/assets/landing/hero-villa-solaire.jpg";
import heroSolaireTropical from "@/assets/landing/hero-solaire-tropical.jpg";
import heroInstallationPose from "@/assets/landing/hero-installation-pose.jpg";
import realisationAccompagnement from "@/assets/landing/realisation-accompagnement.png";
import realisationFamille from "@/assets/landing/realisation-famille.png";
import realisationTropicale from "@/assets/landing/realisation-tropicale.png";
import macaronPrix from "@/assets/landing/macaron-prix.png";
import marqueFrancaise from "@/assets/landing/marque-francaise.png";
import onduleur from "@/assets/landing/onduleur.png";

const defaultHeroSlides: { src: string; alt: string; caption?: string }[] = [
  { src: heroToitureTuiles, alt: "Maison avec panneaux solaires sur toiture en tuiles" },
  { src: heroToiturePlate, alt: "Maison avec installation solaire sur toiture plate" },
  { src: heroToitureArdoise, alt: "Installation solaire sur toiture en ardoise" },
  { src: heroVillaSolaire, alt: "Villa méditerranéenne avec panneaux solaires" },
  { src: heroSolaireTropical, alt: "Maison tropicale équipée de panneaux solaires" },
  { src: heroInstallationPose, alt: "Technicien installant des panneaux solaires" },
  { src: realisationAccompagnement, alt: "Accompagnement installation solaire" },
  { src: realisationFamille, alt: "Famille avec installation solaire" },
  { src: realisationTropicale, alt: "Installation solaire en milieu tropical" },
];

export { defaultHeroSlides };

interface SolarHeroVisualProps {
  customSlides?: { src: string; alt: string; caption?: string }[];
}

export const SolarHeroVisual = ({ customSlides }: SolarHeroVisualProps = {}) => {
  const slides = customSlides && customSlides.length > 0 ? customSlides : defaultHeroSlides;
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const interval = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % slides.length);
    }, 3000);

    return () => window.clearInterval(interval);
  }, [slides.length]);

  return (
    <div className="flex flex-col gap-5 h-full justify-center">
      {/* Image slideshow - taller */}
      <div className="relative flex-shrink-0">
        <img
          src={macaronPrix}
          alt="À partir de 35€/mois, primes déduites"
          className="absolute -top-5 -left-5 w-28 h-28 lg:w-36 lg:h-36 object-contain z-10 drop-shadow-lg"
        />

        <div className="relative h-52 w-full overflow-hidden rounded-xl md:h-60 lg:h-72">
          {slides.map((slide, index) => (
            <div
              key={slide.src}
              className={`absolute inset-0 transition-opacity duration-700 ${
                index === activeSlide ? "opacity-100" : "opacity-0"
              }`}
            >
              <img
                src={slide.src}
                alt={slide.alt}
                className="h-full w-full object-cover"
              />
              {slide.caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-3 pb-2 pt-5">
                  <span className="text-white text-xs font-medium drop-shadow-md">
                    📍 {slide.caption}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        <img
          src={onduleur}
          alt="Onduleur Hoymiles"
          className="absolute bottom-0 right-0 translate-x-[10%] translate-y-1/4 h-20 lg:h-28 object-contain"
        />
      </div>

      {/* Logos + text below image */}
      <div className="flex items-start gap-5 mt-2">
        <div className="flex items-center gap-3 flex-shrink-0">
          <img src={marqueFrancaise} alt="Marque Française" className="h-10 lg:h-12 object-contain" />
          <img src={guarantee25Years} alt="Garantie 25 ans" className="w-16 h-16 lg:w-20 lg:h-20" />
        </div>

        <div className="flex flex-col gap-1">
          <h2 className="text-lg lg:text-xl font-extrabold leading-tight">
            Propriétaire d&apos;une maison individuelle ?
          </h2>
          <p className="text-sm lg:text-base text-muted-foreground leading-relaxed">
            Passez <strong className="text-foreground">à l&apos;énergie solaire</strong> et faites d&apos;importantes
            économies sur votre <strong className="text-foreground">facture électrique.</strong>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SolarHeroVisual;