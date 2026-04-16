import { Star } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import Autoplay from "embla-carousel-autoplay";
import { useEffect, useState } from "react";
import { useScrollReveal, revealClass } from "@/hooks/useScrollReveal";

// Avatars
import avatarMarieB from "@/assets/avatars/solar-marie-b.jpg";
import avatarPaulD from "@/assets/avatars/solar-paul-d.jpg";
import avatarSylvieR from "@/assets/avatars/solar-sylvie-r.jpg";
import avatarThomasG from "@/assets/avatars/solar-thomas-g.jpg";
import avatarIsabelleMarc from "@/assets/avatars/solar-isabelle-marc.jpg";
import avatarFredericM from "@/assets/avatars/solar-frederic-m.jpg";
import avatarNathalieJ from "@/assets/avatars/solar-nathalie-j.jpg";
import avatarSebastienH from "@/assets/avatars/solar-sebastien-h.jpg";
import avatarAntoineC from "@/assets/avatars/solar-antoine-c.jpg";
import avatarFabienneL from "@/assets/avatars/solar-fabienne-l.jpg";
import avatarCarlosB from "@/assets/avatars/solar-carlos-b.jpg";
import avatarFrancescaM from "@/assets/avatars/solar-francesca-m.jpg";
import avatarMarieClaireF from "@/assets/avatars/solar-marie-claire-f.jpg";

interface Review {
  id: number;
  name: string;
  initials: string;
  avatar: string;
  date: string;
  rating: number;
  text: string;
  installation: string;
}

const allReviews: Record<string, Review[]> = {
  france: [
    { id: 1, name: "Marie B.", initials: "MB", avatar: avatarMarieB, date: "mai 2024", rating: 5, text: "J'ai bénéficié du programme Eco PTZ et je suis passée à l'énergie solaire. Très satisfaite de la qualité d'installation et du suivi. Ma facture a diminué de 65% dès le premier mois.", installation: "6 kWc – Toiture tuiles" },
    { id: 2, name: "Paul D.", initials: "PD", avatar: avatarPaulD, date: "févr. 2024", rating: 5, text: "Prise de contact rapide, dossier de financement monté en 48h et installation au top ! Les panneaux sont très discrets et la production dépasse les prévisions.", installation: "9 kWc – Toiture plate" },
    { id: 3, name: "Sylvie R.", initials: "SR", avatar: avatarSylvieR, date: "janv. 2024", rating: 5, text: "Pratique et efficace, je contrôle ma production depuis l'application. En 8 mois, j'ai déjà économisé plus de 1 200€. Le surplus est revendu automatiquement à EDF.", installation: "6 kWc – Toiture ardoise" },
    { id: 4, name: "Thomas G.", initials: "TG", avatar: avatarThomasG, date: "mars 2024", rating: 5, text: "Installation réalisée en une journée par une équipe très pro. Le rendement est excellent, surtout l'été. Je produis plus que je ne consomme !", installation: "9 kWc – Toiture tuiles" },
    { id: 5, name: "Isabelle & Marc L.", initials: "IL", avatar: avatarIsabelleMarc, date: "avril 2024", rating: 5, text: "Nous hésitions depuis longtemps, mais le conseiller nous a vraiment rassurés. Les démarches administratives ont été gérées de A à Z. Un vrai soulagement.", installation: "6 kWc – Toiture tuiles" },
    { id: 6, name: "Frédéric M.", initials: "FM", avatar: avatarFredericM, date: "déc. 2023", rating: 5, text: "Investissement amorti en 7 ans selon les projections. La prime autoconsommation et l'Eco-PTZ rendent le projet très accessible. Zéro regret !", installation: "3 kWc – Toiture plate" },
    { id: 7, name: "Nathalie J.", initials: "NJ", avatar: avatarNathalieJ, date: "juin 2024", rating: 5, text: "Service professionnel et conseils avisés. Mon installation solaire fonctionne parfaitement depuis 3 mois. Très bon retour sur investissement !", installation: "6 kWc – Toiture tôle" },
    { id: 8, name: "Antoine C.", initials: "AC", avatar: avatarAntoineC, date: "juil. 2024", rating: 5, text: "Notre maison est autonome à 80% grâce aux panneaux solaires. L'ensoleillement fait le reste ! Économie de 120€/mois sur la facture.", installation: "9 kWc – Toiture tuiles" },
  ],
  martinique: [
    { id: 1, name: "Nathalie J.", initials: "NJ", avatar: avatarNathalieJ, date: "mai 2024", rating: 5, text: "En Martinique, le soleil ne manque pas ! Mon installation produit plus que prévu, je revends le surplus. Très satisfaite du suivi et de l'accompagnement.", installation: "6 kWc – Toiture tôle" },
    { id: 2, name: "Sébastien H.", initials: "SH", avatar: avatarSebastienH, date: "mars 2024", rating: 5, text: "L'équipe a été réactive et professionnelle. Installation terminée en une journée. Je vois déjà la différence sur ma facture EDF, c'est impressionnant.", installation: "9 kWc – Toiture béton" },
    { id: 3, name: "Marie B.", initials: "MB", avatar: avatarMarieB, date: "janv. 2024", rating: 5, text: "Le dossier d'aides a été monté rapidement. L'installation est impeccable et résiste bien aux conditions climatiques martiniquaises. Merci Prime Énergies !", installation: "6 kWc – Toiture tuiles" },
    { id: 4, name: "Carlos B.", initials: "CB", avatar: avatarCarlosB, date: "avril 2024", rating: 5, text: "Avec le coût de l'électricité ici, le solaire est une évidence. Mon installation me fait économiser plus de 150€/mois. L'appli de suivi est très pratique.", installation: "9 kWc – Toiture tôle" },
    { id: 5, name: "Fabienne L.", initials: "FL", avatar: avatarFabienneL, date: "févr. 2024", rating: 4, text: "Installation cyclone-résistante, ce qui était ma principale inquiétude. L'équipe a su me rassurer et le résultat est parfait. Je recommande à tous les Martiniquais.", installation: "6 kWc – Toiture béton" },
    { id: 6, name: "Thomas G.", initials: "TG", avatar: avatarThomasG, date: "juin 2024", rating: 5, text: "Panneaux posés en une matinée, mise en service l'après-midi. Le rendement dépasse mes attentes malgré la saison des pluies.", installation: "6 kWc – Toiture tôle" },
    { id: 7, name: "Sylvie R.", initials: "SR", avatar: avatarSylvieR, date: "juil. 2024", rating: 5, text: "Le suivi post-installation est top. Je suis ma production en temps réel. En 4 mois, j'ai déjà économisé plus de 800€.", installation: "9 kWc – Toiture béton" },
    { id: 8, name: "Paul D.", initials: "PD", avatar: avatarPaulD, date: "août 2024", rating: 5, text: "Les aides DOM combinées aux primes nationales rendent le projet très abordable. L'installation a été faite avec soin.", installation: "9 kWc – Toiture tôle" },
  ],
  guadeloupe: [
    { id: 1, name: "Sébastien H.", initials: "SH", avatar: avatarSebastienH, date: "mars 2024", rating: 5, text: "Avec le climat guadeloupéen, le solaire c'est une évidence. Mon installation tourne à plein régime et j'économise plus de 140€ chaque mois.", installation: "9 kWc – Toiture tôle" },
    { id: 2, name: "Fabienne L.", initials: "FL", avatar: avatarFabienneL, date: "févr. 2024", rating: 5, text: "Du premier contact à la mise en service, tout a été fluide. Les panneaux sont discrets et la production est excellente même pendant l'hivernage.", installation: "6 kWc – Toiture béton" },
    { id: 3, name: "Paul D.", initials: "PD", avatar: avatarPaulD, date: "janv. 2024", rating: 5, text: "Très bon accompagnement pour les démarches. L'installation fonctionne parfaitement depuis 6 mois. Ma facture EDF a été divisée par 3 !", installation: "6 kWc – Toiture tuiles" },
    { id: 4, name: "Nathalie J.", initials: "NJ", avatar: avatarNathalieJ, date: "avril 2024", rating: 5, text: "J'avais peur de l'impact des cyclones mais les fixations sont renforcées. Après la saison, tout est intact et la production n'a pas baissé.", installation: "9 kWc – Toiture tôle" },
    { id: 5, name: "Carlos B.", initials: "CB", avatar: avatarCarlosB, date: "mai 2024", rating: 4, text: "Le prix de l'électricité en Guadeloupe rend le solaire indispensable. Retour sur investissement prévu en 5 ans grâce aux aides DOM majorées.", installation: "6 kWc – Toiture béton" },
    { id: 6, name: "Marie-Claire F.", initials: "MF", avatar: avatarMarieClaireF, date: "juin 2024", rating: 5, text: "Installation impeccable et équipe professionnelle. Je recommande sans hésitation pour tous les Guadeloupéens.", installation: "9 kWc – Toiture tôle" },
    { id: 7, name: "Thomas G.", initials: "TG", avatar: avatarThomasG, date: "juil. 2024", rating: 5, text: "Dossier bouclé en 10 jours, installation en 2 jours. Résultat : 160€/mois d'économies dès le premier mois.", installation: "9 kWc – Toiture béton" },
    { id: 8, name: "Sylvie R.", initials: "SR", avatar: avatarSylvieR, date: "août 2024", rating: 5, text: "Avec le surplus revendu à EDF, mon installation se rembourse toute seule. Excellent investissement.", installation: "6 kWc – Toiture tôle" },
  ],
  guyane: [
    { id: 1, name: "Carlos B.", initials: "CB", avatar: avatarCarlosB, date: "mars 2024", rating: 5, text: "En Guyane, le photovoltaïque est la meilleure solution. Installation rapide et pro, je suis ravi. Ma production couvre 85% de ma consommation.", installation: "9 kWc – Toiture tôle" },
    { id: 2, name: "Marie-Claire F.", initials: "MF", avatar: avatarMarieClaireF, date: "févr. 2024", rating: 5, text: "Le suivi post-installation est top. Je suis ma production en temps réel sur l'appli. En 4 mois, j'ai déjà économisé plus de 800€.", installation: "6 kWc – Toiture béton" },
    { id: 3, name: "Sébastien H.", initials: "SH", avatar: avatarSebastienH, date: "janv. 2024", rating: 5, text: "Les aides DOM combinées aux primes nationales rendent le projet très abordable. L'installation a été faite avec soin, adaptation aux conditions tropicales.", installation: "9 kWc – Toiture tôle" },
    { id: 4, name: "Nathalie J.", initials: "NJ", avatar: avatarNathalieJ, date: "avril 2024", rating: 4, text: "Seul bémol : il faut nettoyer les panneaux plus souvent à cause de l'humidité. Mais l'équipe m'a donné tous les conseils. Production excellente !", installation: "6 kWc – Toiture béton" },
    { id: 5, name: "Fabienne L.", initials: "FL", avatar: avatarFabienneL, date: "mai 2024", rating: 5, text: "Accompagnement au top du début à la fin. Les panneaux sont parfaitement adaptés au climat guyanais.", installation: "9 kWc – Toiture tôle" },
    { id: 6, name: "Paul D.", initials: "PD", avatar: avatarPaulD, date: "juin 2024", rating: 5, text: "Très bonne expérience. L'installation est robuste et la production constante malgré la saison des pluies.", installation: "6 kWc – Toiture béton" },
    { id: 7, name: "Thomas G.", initials: "TG", avatar: avatarThomasG, date: "juil. 2024", rating: 5, text: "Mon installation couvre 90% de mes besoins. L'équipe technique a fait un travail remarquable.", installation: "9 kWc – Toiture tôle" },
    { id: 8, name: "Marie B.", initials: "MB", avatar: avatarMarieB, date: "août 2024", rating: 5, text: "Le retour sur investissement est rapide grâce aux aides. Très satisfaite de l'accompagnement Prime Énergies.", installation: "6 kWc – Toiture béton" },
  ],
  corse: [
    { id: 1, name: "Antoine C.", initials: "AC", avatar: avatarAntoineC, date: "mars 2024", rating: 5, text: "Notre maison en Corse est autonome à 80% grâce aux panneaux solaires. L'ensoleillement exceptionnel de l'île fait le reste ! Économie de 120€/mois.", installation: "9 kWc – Toiture tuiles" },
    { id: 2, name: "Francesca M.", initials: "FM", avatar: avatarFrancescaM, date: "févr. 2024", rating: 5, text: "Installation soignée sur notre toiture en tuiles corses. L'équipe a su s'adapter aux contraintes architecturales locales. Résultat impeccable et discret.", installation: "6 kWc – Toiture tuiles" },
    { id: 3, name: "Frédéric M.", initials: "FM", avatar: avatarFredericM, date: "janv. 2024", rating: 5, text: "Le retour sur investissement est plus rapide que prévu. Je recommande à tous les propriétaires corses de franchir le pas. L'accompagnement est au top.", installation: "9 kWc – Toiture ardoise" },
    { id: 4, name: "Marie B.", initials: "MB", avatar: avatarMarieB, date: "avril 2024", rating: 5, text: "Malgré les contraintes ABF en zone protégée, l'équipe a trouvé une solution parfaite. Panneaux intégrés au bâti, c'est magnifique et performant.", installation: "6 kWc – Intégré au bâti" },
    { id: 5, name: "Paul D.", initials: "PD", avatar: avatarPaulD, date: "mai 2024", rating: 4, text: "Avec le prix de l'électricité qui flambe, mon installation corse se rentabilise à vitesse grand V. Je produis 110% de ma conso en été !", installation: "9 kWc – Toiture tuiles" },
    { id: 6, name: "Sylvie R.", initials: "SR", avatar: avatarSylvieR, date: "juin 2024", rating: 5, text: "Installation rapide et propre. Les panneaux s'intègrent parfaitement au paysage méditerranéen. Très contente !", installation: "6 kWc – Toiture tuiles" },
    { id: 7, name: "Thomas G.", initials: "TG", avatar: avatarThomasG, date: "juil. 2024", rating: 5, text: "Le soleil corse rend le solaire ultra rentable. Ma production dépasse les prévisions de 20%. Excellent !", installation: "9 kWc – Toiture tuiles" },
    { id: 8, name: "Isabelle & Marc L.", initials: "IL", avatar: avatarIsabelleMarc, date: "août 2024", rating: 5, text: "Très satisfaits de notre installation. Le suivi est impeccable et les économies au rendez-vous.", installation: "6 kWc – Toiture ardoise" },
  ],
  reunion: [
    { id: 1, name: "Sébastien H.", initials: "SH", avatar: avatarSebastienH, date: "mars 2024", rating: 5, text: "À La Réunion, avec notre ensoleillement, le solaire c'est du bon sens. Mon installation couvre 90% de mes besoins. Économie de 180€/mois !", installation: "9 kWc – Toiture tôle" },
    { id: 2, name: "Marie-Claire F.", initials: "MF", avatar: avatarMarieClaireF, date: "févr. 2024", rating: 5, text: "L'installation est parfaitement adaptée au climat tropical. Même pendant la saison des pluies, la production reste très correcte. Très satisfaite.", installation: "6 kWc – Toiture béton" },
    { id: 3, name: "Carlos B.", initials: "CB", avatar: avatarCarlosB, date: "janv. 2024", rating: 5, text: "Le dossier d'aides majorées DOM a été bouclé en 2 semaines. L'installation a suivi rapidement. Production au rendez-vous dès le premier jour !", installation: "9 kWc – Toiture tôle" },
    { id: 4, name: "Nathalie J.", initials: "NJ", avatar: avatarNathalieJ, date: "avril 2024", rating: 5, text: "Avec les tarifs EDF à La Réunion, c'était une nécessité. L'investissement est quasi nul grâce aux aides. Je recommande les yeux fermés.", installation: "6 kWc – Toiture béton" },
    { id: 5, name: "Fabienne L.", initials: "FL", avatar: avatarFabienneL, date: "mai 2024", rating: 4, text: "Installation cyclone-proof, c'était ma priorité. Les fixations sont renforcées et les panneaux ont résisté à Belal sans aucun dommage. Au top !", installation: "9 kWc – Toiture tôle" },
    { id: 6, name: "Paul D.", initials: "PD", avatar: avatarPaulD, date: "juin 2024", rating: 5, text: "L'accompagnement de Prime Énergies est remarquable. De la simulation à la pose, tout était carré. Économies immédiates.", installation: "6 kWc – Toiture béton" },
    { id: 7, name: "Thomas G.", initials: "TG", avatar: avatarThomasG, date: "juil. 2024", rating: 5, text: "Très satisfait de mon installation. La production dépasse les prévisions de 15%. Le surplus est revendu à EDF.", installation: "9 kWc – Toiture tôle" },
    { id: 8, name: "Francesca M.", initials: "FM", avatar: avatarFrancescaM, date: "août 2024", rating: 5, text: "Équipe professionnelle et réactive. Mon installation fonctionne parfaitement depuis 6 mois. Je recommande !", installation: "6 kWc – Toiture béton" },
  ],
};

interface SolarTestimonialsProps {
  region?: string;
  clientCount?: number;
}

const SolarTestimonials = ({ region = "france", clientCount = 2000 }: SolarTestimonialsProps) => {
  const reviews = allReviews[region] || allReviews.france;
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const { ref, isVisible } = useScrollReveal();

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
      setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1024);
    };
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  useEffect(() => {
    if (!api) return;
    setCurrent(api.selectedScrollSnap());
    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  const renderStars = (rating: number, small = false) =>
    Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`${small ? 'w-4 h-4' : 'w-5 h-5'} ${
          i < rating ? "fill-yellow-400 text-yellow-400" : "fill-gray-300 text-gray-300"
        }`}
      />
    ));

  const perSlide = isMobile ? 1 : isTablet ? 2 : 4;
  const slideCount = Math.ceil(reviews.length / perSlide);

  const ReviewCard = ({ review, compact = false }: { review: Review; compact?: boolean }) => (
    <div className="bg-white rounded-xl p-4 lg:p-6 shadow-sm border border-border hover:shadow-md transition-shadow h-full flex flex-col">
      <div className="flex items-center gap-2 lg:gap-3 mb-3 lg:mb-4">
        <Avatar className={compact ? "w-10 h-10" : "w-12 h-12"}>
          <AvatarImage src={review.avatar} alt={review.name} />
          <AvatarFallback>{review.initials}</AvatarFallback>
        </Avatar>
        <div>
          <div className={`font-semibold ${compact ? 'text-sm' : ''}`}>{review.name}</div>
          <div className="text-xs text-muted-foreground">{review.date}</div>
        </div>
      </div>
      <div className="flex gap-1 mb-2 lg:mb-3">{renderStars(review.rating, compact)}</div>
      <p className={`text-muted-foreground mb-2 lg:mb-3 leading-relaxed flex-1 ${compact ? 'text-xs line-clamp-3' : 'text-sm'}`}>
        {review.text}
      </p>
      <div className="flex items-center justify-between pt-2 lg:pt-3 border-t border-border mt-auto">
        <span className="text-xs font-medium text-primary bg-primary/5 px-2 py-0.5 rounded-full">
          ⚡ {review.installation}
        </span>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <span className="text-blue-600 font-bold">G</span>
          <span>Vérifié</span>
        </div>
      </div>
    </div>
  );

  return (
    <section className="bg-muted py-16">
      <div ref={ref} className="container mx-auto px-4">
        {/* Header - same style as homepage */}
        <div className={`flex flex-col items-center gap-4 mb-12 ${revealClass(isVisible).className}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-2xl font-bold text-blue-600">G</span>
            </div>
            <h2 className="text-3xl font-bold">Avis clients Google</h2>
          </div>
          <p className="text-muted-foreground text-center max-w-2xl">
            Clients installés par nos partenaires certifiés — {clientCount.toLocaleString("fr-FR")}+ installations solaires réalisées.
          </p>

          {/* Average Rating badge */}
          <div className="bg-white rounded-lg p-3 shadow-sm border border-border">
            <div className="flex items-center gap-1 mb-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                <span className="text-2xl font-bold">4.8</span>
                <span className="text-xs text-muted-foreground">({clientCount.toLocaleString("fr-FR")}+ avis)</span>
              </div>
              <div className="text-xs text-muted-foreground">Note moyenne</div>
            </div>
          </div>
        </div>

        {/* Reviews Carousel */}
        <Carousel
          setApi={setApi}
          key={`${isMobile}-${isTablet}`}
          opts={{ align: "start", loop: true }}
          plugins={[Autoplay({ delay: 7000 })]}
          className="w-full mb-4"
        >
          <CarouselContent>
            {Array.from({ length: slideCount }).map((_, slideIdx) => {
              const slideReviews = reviews.slice(slideIdx * perSlide, (slideIdx + 1) * perSlide);
              return (
                <CarouselItem key={slideIdx} className="basis-full pl-4">
                  <div className={`grid gap-4 lg:gap-6 ${
                    isMobile ? 'grid-cols-1' : isTablet ? 'grid-cols-2' : 'grid-cols-4'
                  }`}>
                    {slideReviews.map((review) => (
                      <ReviewCard key={review.id} review={review} compact={isMobile} />
                    ))}
                  </div>
                </CarouselItem>
              );
            })}
          </CarouselContent>
          <CarouselPrevious className="hidden lg:flex -left-12" />
          <CarouselNext className="hidden lg:flex -right-12" />
        </Carousel>

        {/* Pagination Dots */}
        <div className="flex justify-center gap-2 mb-4">
          {Array.from({ length: slideCount }).map((_, index) => (
            <button
              key={index}
              onClick={() => api?.scrollTo(index)}
              className={`w-2.5 h-2.5 rounded-full transition-colors ${
                current === index
                  ? "bg-primary"
                  : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
              }`}
              aria-label={`Aller au slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default SolarTestimonials;
