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
import { supabase } from "@/integrations/supabase/client";
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
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [reviewsLink, setReviewsLink] = useState("");

  useEffect(() => {
    const loadReviewsLink = async () => {
      try {
        const { data } = await supabase
          .from("site_settings")
          .select("value")
          .eq("key", "reviews_link")
          .maybeSingle();
        
        if (data?.value) {
          setReviewsLink(data.value as string);
        }
      } catch (error) {
        console.error("Error loading reviews link:", error);
      }
    };
    loadReviewsLink();
  }, []);

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

  const renderStars = (rating: number, isMobile: boolean = false) => {
    return Array.from({ length: 5 }).map((_, index) => (
      <Star
        key={index}
        className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} ${
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
        <div className="flex flex-col items-center gap-4 mb-12">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-2xl font-bold text-blue-600">G</span>
            </div>
            <h2 className="text-3xl font-bold">Avis clients Google</h2>
          </div>
          <p className="text-muted-foreground text-center max-w-2xl">
            Clients installés par nos partenaires certifiés ou accompagnés par Prime Énergies.
          </p>

          {/* Average Rating - Compact and Centered */}
          <div className="bg-white rounded-lg p-3 shadow-sm border border-border">
            <div className="flex items-center gap-1 mb-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                <span className="text-2xl font-bold">{averageRating}</span>
                <span className="text-xs text-muted-foreground">(233 avis)</span>
              </div>
              <div className="text-xs text-muted-foreground">Note moyenne</div>
            </div>
          </div>
        </div>

        {/* Reviews Carousel */}
        <Carousel
          setApi={setApi}
          key={`${isMobile}-${isTablet}`}
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
            {isMobile ? (
              // Mobile: 1 review per slide
              reviews.map((review, index) => (
                <CarouselItem key={index} className="basis-full pl-4">
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-border hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2 mb-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={review.avatar} alt={review.name} />
                        <AvatarFallback>{review.initials}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-semibold text-sm">{review.name}</div>
                        <div className="text-xs text-muted-foreground">{review.date}</div>
                      </div>
                    </div>
                    <div className="flex gap-1 mb-2">{renderStars(review.rating, true)}</div>
                    <p className="text-muted-foreground mb-2 leading-snug text-xs line-clamp-3">{review.text}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="text-blue-600 font-bold">G</span>
                      <span>Vérifié sur Google</span>
                    </div>
                  </div>
                </CarouselItem>
              ))
            ) : isTablet ? (
              // Tablet: 2 reviews per slide
              reviews.reduce((slides: any[], review, index) => {
                if (index % 2 === 0) {
                  const slideReviews = reviews.slice(index, index + 2);
                  slides.push(
                    <CarouselItem key={index} className="basis-full pl-4">
                      <div className="grid grid-cols-2 gap-4">
                        {slideReviews.map((rev) => (
                          <div
                            key={rev.id}
                            className="bg-white rounded-xl p-5 shadow-sm border border-border hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-center gap-2 mb-3">
                              <Avatar className="w-10 h-10">
                                <AvatarImage src={rev.avatar} alt={rev.name} />
                                <AvatarFallback>{rev.initials}</AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-semibold text-sm">{rev.name}</div>
                                <div className="text-xs text-muted-foreground">{rev.date}</div>
                              </div>
                            </div>
                            <div className="flex gap-1 mb-2">{renderStars(rev.rating)}</div>
                            <p className="text-muted-foreground mb-2 leading-relaxed text-sm">{rev.text}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span className="text-blue-600 font-bold">G</span>
                              <span>Vérifié sur Google</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CarouselItem>
                  );
                }
                return slides;
              }, [])
            ) : (
              // Desktop: 4 reviews per slide
              reviews.reduce((slides: any[], review, index) => {
                if (index % 4 === 0) {
                  const slideReviews = reviews.slice(index, index + 4);
                  slides.push(
                    <CarouselItem key={index} className="basis-full pl-4">
                      <div className="grid grid-cols-4 gap-6">
                        {slideReviews.map((rev) => (
                          <div
                            key={rev.id}
                            className="bg-white rounded-xl p-6 shadow-sm border border-border hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <Avatar className="w-12 h-12">
                                  <AvatarImage src={rev.avatar} alt={rev.name} />
                                  <AvatarFallback>{rev.initials}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-semibold">{rev.name}</div>
                                  <div className="text-sm text-muted-foreground">{rev.date}</div>
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-1 mb-3">{renderStars(rev.rating)}</div>
                            <p className="text-muted-foreground mb-3 leading-relaxed text-sm">{rev.text}</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span className="text-blue-600 font-bold">G</span>
                              <span>Vérifié sur Google</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CarouselItem>
                  );
                }
                return slides;
              }, [])
            )}
          </CarouselContent>
          <CarouselPrevious className="hidden lg:flex -left-12" />
          <CarouselNext className="hidden lg:flex -right-12" />
        </Carousel>

        {/* Pagination Dots */}
        <div className="flex justify-center gap-2 mb-8">
          {isMobile ? (
            // Mobile: 8 dots (8 reviews)
            reviews.map((_, index) => (
              <button
                key={index}
                onClick={() => api?.scrollTo(index)}
                className={`w-2.5 h-2.5 rounded-full transition-colors ${
                  current === index
                    ? "bg-primary"
                    : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))
          ) : isTablet ? (
            // Tablet: 4 dots (4 slides of 2 reviews each)
            Array.from({ length: Math.ceil(reviews.length / 2) }).map((_, index) => (
              <button
                key={index}
                onClick={() => api?.scrollTo(index)}
                className={`w-2.5 h-2.5 rounded-full transition-colors ${
                  current === index
                    ? "bg-primary"
                    : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))
          ) : (
            // Desktop: 2 dots (2 slides of 4 reviews each)
            Array.from({ length: Math.ceil(reviews.length / 4) }).map((_, index) => (
              <button
                key={index}
                onClick={() => api?.scrollTo(index)}
                className={`w-2.5 h-2.5 rounded-full transition-colors ${
                  current === index
                    ? "bg-primary"
                    : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))
          )}
        </div>

        {/* CTA Button */}
        {reviewsLink && (
          <div className="flex justify-center">
            <Button
              size="lg"
              className="bg-primary hover:bg-primary/90 text-white font-medium"
              asChild
            >
              <a
                href={reviewsLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                <MessageSquare className="w-5 h-5" />
                Laisser un avis
              </a>
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};

export default ReviewsSection;
