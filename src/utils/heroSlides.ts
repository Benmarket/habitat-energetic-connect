import heroToiturePlate from "@/assets/landing/hero-toiture-plate.jpg";
import heroToitureTuiles from "@/assets/landing/hero-toiture-tuiles.jpg";
import heroToitureArdoise from "@/assets/landing/hero-toiture-ardoise.jpg";
import heroVillaSolaire from "@/assets/landing/hero-villa-solaire.jpg";
import heroSolaireTropical from "@/assets/landing/hero-solaire-tropical.jpg";
import heroInstallationPose from "@/assets/landing/hero-installation-pose.jpg";
import realisationAccompagnement from "@/assets/landing/realisation-accompagnement.png";
import realisationFamille from "@/assets/landing/realisation-famille.png";
import realisationTropicale from "@/assets/landing/realisation-tropicale.png";

export const HERO_BAND_ASPECT_RATIO = 9 / 4;

export interface HeroSlideData {
  src: string;
  alt: string;
  caption?: string;
  originalSrc?: string;
}

const HERO_SRC_MATCHERS: Array<{ match: string[]; src: string }> = [
  { match: ["hero-toiture-tuiles"], src: heroToitureTuiles },
  { match: ["hero-toiture-plate"], src: heroToiturePlate },
  { match: ["hero-toiture-ardoise"], src: heroToitureArdoise },
  { match: ["hero-villa-solaire"], src: heroVillaSolaire },
  { match: ["hero-solaire-tropical"], src: heroSolaireTropical },
  { match: ["hero-installation-pose"], src: heroInstallationPose },
  { match: ["realisation-accompagnement"], src: realisationAccompagnement },
  { match: ["realisation-famille"], src: realisationFamille },
  { match: ["realisation-tropicale"], src: realisationTropicale },
];

export function normalizeHeroSrc(src?: string): string {
  if (!src) return "";

  const cleanSrc = src.split("?")[0];
  const lowerSrc = cleanSrc.toLowerCase();
  const matched = HERO_SRC_MATCHERS.find(({ match }) => match.some((token) => lowerSrc.includes(token)));

  return matched?.src || src;
}

export function normalizeHeroSlide<T extends HeroSlideData>(slide: T): T {
  return {
    ...slide,
    src: normalizeHeroSrc(slide.src),
    originalSrc: slide.originalSrc ? normalizeHeroSrc(slide.originalSrc) : undefined,
  };
}

export function normalizeHeroSlides<T extends HeroSlideData>(slides?: T[] | null): T[] {
  return (slides || []).map((slide) => normalizeHeroSlide(slide));
}
