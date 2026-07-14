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
import panneauPV from "@/assets/landing/panneau-photovoltaique.png";
import { normalizeHeroSlides, type HeroSlideData } from "@/utils/heroSlides";

const defaultHeroSlides: HeroSlideData[] = [
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
  customSlides?: HeroSlideData[];
  badgeSrc?: string;
}

export const SolarHeroVisual = ({ customSlides, badgeSrc }: SolarHeroVisualProps) => {
  const slides = customSlides && customSlides.length > 0
    ? normalizeHeroSlides(customSlides)
    : defaultHeroSlides;
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
    <div className="flex flex-col gap-5 h-full justify-center w-full min-w-0">
      {/* Image slideshow - taller */}
      <div className="relative flex-shrink-0">
        <img
          src={badgeSrc || macaronPrix}
          alt="À partir de 35€/mois, primes déduites"
          className="absolute -top-3 -left-2 w-20 h-20 sm:-top-5 sm:-left-5 sm:w-28 sm:h-28 lg:w-36 lg:h-36 object-contain z-10 drop-shadow-lg"
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

        {/* Panneau + onduleur superposés en bas à droite - taille réduite en mobile */}
        <div className="absolute bottom-0 right-0 translate-x-[5%] translate-y-1/4 lg:translate-x-[10%] z-10">
          <img
            src={panneauPV}
            alt="Panneau photovoltaïque"
            className="h-16 sm:h-20 lg:h-36 object-contain"
          />
          <img
            src={onduleur}
            alt="Onduleur Hoymiles"
            className="absolute bottom-0 right-0 h-9 sm:h-12 lg:h-20 object-contain translate-x-[15%] translate-y-[10%]"
          />
        </div>
      </div>

      {/* Logos + text below image */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-5 mt-2 min-w-0">
        <div className="flex items-center gap-3 flex-shrink-0">
          <img src={marqueFrancaise} alt="Marque Française" className="h-9 lg:h-12 w-auto max-w-[110px] object-contain" />
          <img src={guarantee25Years} alt="Garantie 25 ans" className="w-14 h-14 lg:w-20 lg:h-20 object-contain" />
        </div>

        <div className="flex flex-col gap-1 min-w-0 text-center sm:text-left">
          <h2 className="text-base lg:text-xl font-extrabold leading-tight">
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