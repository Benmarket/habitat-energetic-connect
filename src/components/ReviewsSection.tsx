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
import Autoplay from "embla-carousel-autoplay";
import { useEffect, useState } from "react";

const reviews = [
  {
    id: 1,
    name: "Sophie L.",
    initials: "SL",
    date: "mai 2024",
    rating: 5,
    text: "Installation solaire impeccable par un partenaire Prime Énergies. Suivi sérieux et délais respectés. Je recommande !",
    color: "bg-emerald-500",
  },
  {
    id: 2,
    name: "Marc D.",
    initials: "MD",
    date: "févr. 2024",
    rating: 5,
    text: "Service client très réactif, on m'a bien accompagné sur les aides. Les travaux se sont très bien passés.",
    color: "bg-emerald-600",
  },
  {
    id: 3,
    name: "Claire R.",
    initials: "CR",
    date: "janv. 2024",
    rating: 4,
    text: "De bons conseils et un installateur RGE sérieux. Chantier propre, production conforme aux estimations.",
    color: "bg-emerald-500",
  },
  {
    id: 4,
    name: "Thomas B.",
    initials: "TB",
    date: "mars 2024",
    rating: 5,
    text: "Pompe à chaleur installée rapidement. Économies visibles dès le premier mois. Équipe professionnelle et à l'écoute.",
    color: "bg-emerald-600",
  },
  {
    id: 5,
    name: "Julie M.",
    initials: "JM",
    date: "avril 2024",
    rating: 5,
    text: "Excellent accompagnement du début à la fin. Les démarches administratives ont été simplifiées. Très satisfaite !",
    color: "bg-emerald-500",
  },
  {
    id: 6,
    name: "Pierre F.",
    initials: "PF",
    date: "déc. 2023",
    rating: 5,
    text: "Installation d'isolation thermique impeccable. Résultat au-delà de mes attentes. Je recommande vivement.",
    color: "bg-emerald-600",
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
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-12">
          <div>
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
          <div className="bg-white rounded-xl p-6 shadow-sm border border-border">
            <div className="flex items-center gap-2 mb-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="w-6 h-6 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold">{averageRating}</div>
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
            {[0, 3].map((startIndex) => (
              <CarouselItem key={startIndex}>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {reviews.slice(startIndex, startIndex + 3).map((review) => (
                    <div
                      key={review.id}
                      className="bg-white rounded-xl p-6 shadow-sm border border-border hover:shadow-md transition-shadow"
                    >
                      {/* User Info */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-12 h-12 ${review.color} rounded-full flex items-center justify-center text-white font-semibold`}
                          >
                            {review.initials}
                          </div>
                          <div>
                            <div className="font-semibold">{review.name}</div>
                            <div className="text-sm text-muted-foreground">{review.date}</div>
                          </div>
                        </div>
                        <div className="flex gap-1">{renderStars(review.rating)}</div>
                      </div>

                      {/* Review Text */}
                      <p className="text-muted-foreground mb-3 leading-relaxed">{review.text}</p>

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
