import { Button } from "@/components/ui/button";
import { Star, MessageSquare } from "lucide-react";
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
import sophieAvatar from "@/assets/avatars/sophie-l.jpg";
import marcAvatar from "@/assets/avatars/marc-d.jpg";
import claireAvatar from "@/assets/avatars/claire-r.jpg";
import thomasAvatar from "@/assets/avatars/thomas-b.jpg";
import julieAvatar from "@/assets/avatars/julie-m.jpg";
import pierreAvatar from "@/assets/avatars/pierre-f.jpg";

const reviews = [
  {
    id: 1,
    name: "Sophie L.",
    initials: "SL",
    avatar: sophieAvatar,
    date: "mai 2024",
    rating: 5,
    text: "J'ai apprécié la clarté des informations et la rapidité de la prise de contact. Mon projet avance bien et je suis ravie de mon choix de pompe à chaleur pour ma maison de 120m².",
  },
  {
    id: 2,
    name: "Marc D.",
    initials: "MD",
    avatar: marcAvatar,
    date: "févr. 2024",
    rating: 5,
    text: "Rapide et efficace. J'ai rempli le formulaire un mardi soir, j'étais contacté le mercredi matin. L'accompagnement est vraiment au top pour le choix et l'installation de ma pompe à chaleur air/eau.",
  },
  {
    id: 3,
    name: "Claire R.",
    initials: "CR",
    avatar: claireAvatar,
    date: "janv. 2024",
    rating: 5,
    text: "Tout est bien expliqué, pas de jargon compliqué. Le suivi après ma demande a été impeccable. Je recommande vivement leur service pour l'installation de ma pompe à chaleur réversible.",
  },
  {
    id: 4,
    name: "Thomas B.",
    initials: "TB",
    avatar: thomasAvatar,
    date: "mars 2024",
    rating: 5,
    text: "Formulaire très simple à remplir, j'ai été rappelé en moins de 24h comme promis. L'installation de ma pompe à chaleur haute performance s'est parfaitement déroulée.",
  },
  {
    id: 5,
    name: "Julie M.",
    initials: "JM",
    avatar: julieAvatar,
    date: "avril 2024",
    rating: 5,
    text: "Excellent accompagnement du début à la fin. Les démarches administratives ont été simplifiées. Très satisfaite de mon installation photovoltaïque !",
  },
  {
    id: 6,
    name: "Pierre F.",
    initials: "PF",
    avatar: pierreAvatar,
    date: "déc. 2023",
    rating: 5,
    text: "Installation d'isolation thermique impeccable. Résultat au-delà de mes attentes. Je recommande vivement Prime Énergies.",
  },
  {
    id: 7,
    name: "Marie D.",
    initials: "MD",
    avatar: claireAvatar,
    date: "juin 2024",
    rating: 5,
    text: "Service professionnel et conseils avisés. Mon installation solaire fonctionne parfaitement depuis 3 mois. Très bon retour sur investissement !",
  },
  {
    id: 8,
    name: "Nicolas L.",
    initials: "NL",
    avatar: marcAvatar,
    date: "juil. 2024",
    rating: 5,
    text: "Prime Énergies m'a mis en relation avec un installateur RGE compétent. Chantier propre et rapide. Je réalise déjà des économies sur mes factures.",
  },
];

const ReviewsSection = () => {
  const averageRating = 4.7;
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!api) return;

    setCurrent(api.selectedScrollSnap());

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, index) => (
      <Star
        key={index}
        className={`w-5 h-5 ${
          index < rating
            ? "fill-yellow-400 text-yellow-400"
            : "fill-gray-300 text-gray-300"
        }`}
      />
    ));
  };

  return (
    <section className="bg-muted py-16">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                <span className="text-2xl font-bold text-blue-600">G</span>
              </div>
              <h2 className="text-3xl font-bold">Avis clients Google</h2>
            </div>
            <p className="text-muted-foreground">
              Clients installés par nos partenaires certifiés ou accompagnés par Prime Énergies.
            </p>
          </div>

          {/* Average Rating */}
          <div className="bg-white rounded-xl p-6 md:p-4 shadow-sm border border-border md:w-48 md:flex-shrink-0">
            <div className="flex items-center gap-2 mb-2 justify-center md:justify-start">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="w-6 h-6 md:w-5 md:h-5 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <div className="text-center md:text-left">
              <div className="text-4xl md:text-3xl font-bold">{averageRating}</div>
              <div className="text-sm text-muted-foreground">Note moyenne</div>
            </div>
          </div>
        </div>

        {/* Reviews Carousel */}
        <Carousel
          setApi={setApi}
          opts={{
            align: "start",
            loop: true,
          }}
          plugins={[
            Autoplay({
              delay: 7000,
            }),
          ]}
          className="w-full mb-4"
        >
          <CarouselContent>
            {[0, 4].map((startIndex) => (
              <CarouselItem key={startIndex}>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {reviews.slice(startIndex, startIndex + 4).map((review) => (
                    <div
                      key={review.id}
                      className="bg-white rounded-xl p-6 shadow-sm border border-border hover:shadow-md transition-shadow"
                    >
                      {/* User Info */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={review.avatar} alt={review.name} />
                            <AvatarFallback>{review.initials}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-semibold">{review.name}</div>
                            <div className="text-sm text-muted-foreground">{review.date}</div>
                          </div>
                        </div>
                      </div>

                      {/* Stars */}
                      <div className="flex gap-1 mb-3">{renderStars(review.rating)}</div>

                      {/* Review Text */}
                      <p className="text-muted-foreground mb-3 leading-relaxed text-sm">{review.text}</p>

                      {/* Verified Badge */}
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="text-blue-600 font-bold">G</span>
                        <span>Vérifié sur Google</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden lg:flex -left-12" />
          <CarouselNext className="hidden lg:flex -right-12" />
        </Carousel>

        {/* Pagination Dots */}
        <div className="flex justify-center gap-2 mb-8">
          {[0, 1].map((index) => (
            <button
              key={index}
              onClick={() => api?.scrollTo(index)}
              className={`w-2.5 h-2.5 rounded-full transition-colors ${
                current === index
                  ? "bg-primary"
                  : "bg-muted-foreground/30"
              }`}
              aria-label={`Aller à la slide ${index + 1}`}
            />
          ))}
        </div>

        {/* CTA Button */}
        <div className="flex justify-center">
          <Button
            size="lg"
            className="bg-primary hover:bg-primary/90 text-white font-medium"
            asChild
          >
            <a
              href="https://g.page/r/YOUR_GOOGLE_BUSINESS_LINK/review"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2"
            >
              <MessageSquare className="w-5 h-5" />
              Laisser un avis
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default ReviewsSection;
