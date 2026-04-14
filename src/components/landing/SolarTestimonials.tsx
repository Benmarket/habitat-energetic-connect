import { Star, Quote, MapPin } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import solarFamilyImg from "@/assets/landing/solar-family-house.jpg";
import { useScrollReveal, revealClass } from "@/hooks/useScrollReveal";

interface Testimonial {
  text: string;
  name: string;
  city: string;
  installation: string;
  rating: number;
  initials: string;
  bgColor: string;
}

const allTestimonials: Record<string, Testimonial[]> = {
  france: [
    { text: "J'ai bénéficié du programme Eco PTZ et je suis passée à l'énergie solaire. Très satisfaite de la qualité d'installation et du suivi. Ma facture a diminué de 65% dès le premier mois.", name: "Marie B.", city: "Lyon (69)", installation: "6 kWc – Toiture tuiles", rating: 5, initials: "MB", bgColor: "bg-emerald-500" },
    { text: "Prise de contact rapide, dossier de financement monté en 48h et installation au top ! Les panneaux sont très discrets et la production dépasse les prévisions. Je recommande fortement !", name: "Paul D.", city: "Toulouse (31)", installation: "9 kWc – Toiture plate", rating: 5, initials: "PD", bgColor: "bg-blue-500" },
    { text: "Pratique et efficace, je contrôle ma production depuis l'application. En 8 mois, j'ai déjà économisé plus de 1 200€. Le surplus est revendu automatiquement à EDF.", name: "Sylvie R.", city: "Nantes (44)", installation: "6 kWc – Toiture ardoise", rating: 5, initials: "SR", bgColor: "bg-violet-500" },
    { text: "Installation réalisée en une journée par une équipe très pro. Le rendement est excellent, surtout l'été. Je produis plus que je ne consomme !", name: "Thomas G.", city: "Montpellier (34)", installation: "9 kWc – Toiture tuiles", rating: 5, initials: "TG", bgColor: "bg-amber-500" },
    { text: "Nous hésitions depuis longtemps, mais le conseiller nous a vraiment rassurés. Les démarches administratives ont été gérées de A à Z. Un vrai soulagement.", name: "Isabelle & Marc L.", city: "Bordeaux (33)", installation: "6 kWc – Toiture tuiles", rating: 4, initials: "IL", bgColor: "bg-rose-500" },
    { text: "Investissement amorti en 7 ans selon les projections. La prime autoconsommation et l'Eco-PTZ rendent le projet très accessible. Zéro regret !", name: "Frédéric M.", city: "Strasbourg (67)", installation: "3 kWc – Toiture plate", rating: 5, initials: "FM", bgColor: "bg-teal-500" },
  ],
  martinique: [
    { text: "En Martinique, le soleil ne manque pas ! Mon installation produit plus que prévu, je revends le surplus. Très satisfaite du suivi et de l'accompagnement.", name: "Nathalie J.", city: "Fort-de-France (972)", installation: "6 kWc – Toiture tôle", rating: 5, initials: "NJ", bgColor: "bg-orange-500" },
    { text: "L'équipe a été réactive et professionnelle. Installation terminée en une journée. Je vois déjà la différence sur ma facture EDF, c'est impressionnant.", name: "Steeve M.", city: "Le Lamentin (972)", installation: "9 kWc – Toiture béton", rating: 5, initials: "SM", bgColor: "bg-blue-500" },
    { text: "Le dossier d'aides a été monté rapidement. L'installation est impeccable et résiste bien aux conditions climatiques martiniquaises. Merci Prime Énergies !", name: "Claudine R.", city: "Schoelcher (972)", installation: "6 kWc – Toiture tuiles", rating: 5, initials: "CR", bgColor: "bg-emerald-500" },
    { text: "Avec le coût de l'électricité ici, le solaire est une évidence. Mon installation me fait économiser plus de 150€/mois. L'appli de suivi est très pratique.", name: "Jean-Louis T.", city: "Sainte-Anne (972)", installation: "9 kWc – Toiture tôle", rating: 5, initials: "JT", bgColor: "bg-violet-500" },
    { text: "Installation cyclone-résistante, ce qui était ma principale inquiétude. L'équipe a su me rassurer et le résultat est parfait. Je recommande à tous les Martiniquais.", name: "Valérie P.", city: "Le Robert (972)", installation: "6 kWc – Toiture béton", rating: 4, initials: "VP", bgColor: "bg-rose-500" },
  ],
  guadeloupe: [
    { text: "Avec le climat guadeloupéen, le solaire c'est une évidence. Mon installation tourne à plein régime et j'économise plus de 140€ chaque mois.", name: "Jean-Marc T.", city: "Les Abymes (971)", installation: "9 kWc – Toiture tôle", rating: 5, initials: "JT", bgColor: "bg-blue-500" },
    { text: "Du premier contact à la mise en service, tout a été fluide. Les panneaux sont discrets et la production est excellente même pendant l'hivernage.", name: "Fabienne L.", city: "Baie-Mahault (971)", installation: "6 kWc – Toiture béton", rating: 5, initials: "FL", bgColor: "bg-emerald-500" },
    { text: "Très bon accompagnement pour les démarches. L'installation fonctionne parfaitement depuis 6 mois. Ma facture EDF a été divisée par 3 !", name: "Dominique P.", city: "Pointe-à-Pitre (971)", installation: "6 kWc – Toiture tuiles", rating: 5, initials: "DP", bgColor: "bg-amber-500" },
    { text: "J'avais peur de l'impact des cyclones mais les fixations sont renforcées. Après la saison, tout est intact et la production n'a pas baissé.", name: "Géraldine B.", city: "Sainte-Rose (971)", installation: "9 kWc – Toiture tôle", rating: 5, initials: "GB", bgColor: "bg-violet-500" },
    { text: "Le prix de l'électricité en Guadeloupe rend le solaire indispensable. Retour sur investissement prévu en 5 ans grâce aux aides DOM majorées.", name: "Thierry C.", city: "Le Gosier (971)", installation: "6 kWc – Toiture béton", rating: 4, initials: "TC", bgColor: "bg-teal-500" },
  ],
  guyane: [
    { text: "En Guyane, le photovoltaïque est la meilleure solution. Installation rapide et pro, je suis ravi. Ma production couvre 85% de ma consommation.", name: "Carlos B.", city: "Cayenne (973)", installation: "9 kWc – Toiture tôle", rating: 5, initials: "CB", bgColor: "bg-emerald-500" },
    { text: "Le suivi post-installation est top. Je suis ma production en temps réel sur l'appli. En 4 mois, j'ai déjà économisé plus de 800€.", name: "Maryse D.", city: "Matoury (973)", installation: "6 kWc – Toiture béton", rating: 5, initials: "MD", bgColor: "bg-blue-500" },
    { text: "Les aides DOM combinées aux primes nationales rendent le projet très abordable. L'installation a été faite avec soin, adaptation aux conditions tropicales.", name: "Patrick V.", city: "Kourou (973)", installation: "9 kWc – Toiture tôle", rating: 5, initials: "PV", bgColor: "bg-amber-500" },
    { text: "Seul bémol : il faut nettoyer les panneaux plus souvent à cause de l'humidité. Mais l'équipe m'a donné tous les conseils. Production excellente !", name: "Sandra K.", city: "Rémire-Montjoly (973)", installation: "6 kWc – Toiture béton", rating: 4, initials: "SK", bgColor: "bg-violet-500" },
  ],
  corse: [
    { text: "Notre maison en Corse est autonome à 80% grâce aux panneaux solaires. L'ensoleillement exceptionnel de l'île fait le reste ! Économie de 120€/mois.", name: "Antoine C.", city: "Ajaccio (2A)", installation: "9 kWc – Toiture tuiles", rating: 5, initials: "AC", bgColor: "bg-emerald-500" },
    { text: "Installation soignée sur notre toiture en tuiles corses. L'équipe a su s'adapter aux contraintes architecturales locales. Résultat impeccable et discret.", name: "Francesca M.", city: "Bastia (2B)", installation: "6 kWc – Toiture tuiles", rating: 5, initials: "FM", bgColor: "bg-amber-500" },
    { text: "Le retour sur investissement est plus rapide que prévu. Je recommande à tous les propriétaires corses de franchir le pas. L'accompagnement est au top.", name: "Jean-Pierre S.", city: "Porto-Vecchio (2A)", installation: "9 kWc – Toiture ardoise", rating: 5, initials: "JS", bgColor: "bg-blue-500" },
    { text: "Malgré les contraintes ABF en zone protégée, l'équipe a trouvé une solution parfaite. Panneaux intégrés au bâti, c'est magnifique et performant.", name: "Laetitia R.", city: "Calvi (2B)", installation: "6 kWc – Intégré au bâti", rating: 5, initials: "LR", bgColor: "bg-rose-500" },
    { text: "Avec le prix de l'électricité qui flambe, mon installation corse se rentabilise à vitesse grand V. Je produis 110% de ma conso en été !", name: "Pierre-Antoine D.", city: "Corte (2B)", installation: "9 kWc – Toiture tuiles", rating: 4, initials: "PD", bgColor: "bg-teal-500" },
  ],
  reunion: [
    { text: "À La Réunion, avec notre ensoleillement, le solaire c'est du bon sens. Mon installation couvre 90% de mes besoins. Économie de 180€/mois !", name: "Sébastien H.", city: "Saint-Denis (974)", installation: "9 kWc – Toiture tôle", rating: 5, initials: "SH", bgColor: "bg-blue-500" },
    { text: "L'installation est parfaitement adaptée au climat tropical. Même pendant la saison des pluies, la production reste très correcte. Très satisfaite.", name: "Marie-Claire F.", city: "Saint-Pierre (974)", installation: "6 kWc – Toiture béton", rating: 5, initials: "MF", bgColor: "bg-emerald-500" },
    { text: "Le dossier d'aides majorées DOM a été bouclé en 2 semaines. L'installation a suivi rapidement. Production au rendez-vous dès le premier jour !", name: "Yannick G.", city: "Le Tampon (974)", installation: "9 kWc – Toiture tôle", rating: 5, initials: "YG", bgColor: "bg-amber-500" },
    { text: "Avec les tarifs EDF à La Réunion, c'était une nécessité. L'investissement est quasi nul grâce aux aides. Je recommande les yeux fermés.", name: "Annick B.", city: "Saint-André (974)", installation: "6 kWc – Toiture béton", rating: 5, initials: "AB", bgColor: "bg-violet-500" },
    { text: "Installation cyclone-proof, c'était ma priorité. Les fixations sont renforcées et les panneaux ont résisté à Belal sans aucun dommage. Au top !", name: "David L.", city: "Saint-Leu (974)", installation: "9 kWc – Toiture tôle", rating: 4, initials: "DL", bgColor: "bg-rose-500" },
  ],
};

interface SolarTestimonialsProps {
  region?: string;
  clientCount?: number;
}

const SolarTestimonials = ({ region = "france", clientCount = 2000 }: SolarTestimonialsProps) => {
  const testimonials = allTestimonials[region] || allTestimonials.france;

  const { ref, isVisible } = useScrollReveal();

  return (
    <section className="py-12 lg:py-20 bg-muted">
      <div ref={ref} className="container mx-auto px-4 max-w-6xl">
        <div className={`text-center mb-10 lg:mb-14 ${revealClass(isVisible).className}`}>
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
            ⭐ Avis clients vérifiés
          </span>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-extrabold">
            Déjà plus de <span className="text-primary">{clientCount.toLocaleString("fr-FR")} clients</span> installés et satisfaits
          </h2>
          {/* Stars summary */}
          <div className="flex items-center justify-center gap-2 mt-4">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-6 h-6 text-amber-400 fill-amber-400" />
              ))}
            </div>
            <span className="text-lg font-bold text-foreground">4.8/5</span>
            <span className="text-muted-foreground">— basé sur {clientCount.toLocaleString("fr-FR")}+ avis</span>
          </div>
        </div>

        {/* Visual banner */}
        <div className={`rounded-2xl overflow-hidden shadow-lg mb-10 ${revealClass(isVisible, 100).className}`} style={revealClass(isVisible, 100).style}>
          <img src={solarFamilyImg} alt="Famille devant leur maison équipée de panneaux solaires" className="w-full h-48 lg:h-56 object-cover" loading="lazy" width={800} height={224} />
        </div>

        {/* Desktop grid */}
        <div className="hidden lg:grid grid-cols-3 gap-6">
          {testimonials.slice(0, 6).map((t, i) => {
            const reveal = revealClass(isVisible, 200 + i * 100, "up");
            return (
              <div key={i} className={reveal.className} style={reveal.style}>
                <TestimonialCard testimonial={t} />
              </div>
            );
          })}
        </div>

        {/* Mobile carousel */}
        <div className="lg:hidden pb-12">
          <Carousel
            opts={{ align: "start", loop: true }}
            plugins={[Autoplay({ delay: 6000 })]}
            className="relative"
          >
            <CarouselContent>
              {testimonials.map((t, i) => (
                <CarouselItem key={i} className="md:basis-1/2">
                  <TestimonialCard testimonial={t} />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="opacity-60 hover:opacity-100 bg-card border-2" />
            <CarouselNext className="opacity-60 hover:opacity-100 bg-card border-2" />
          </Carousel>
        </div>
      </div>
    </section>
  );
};

const TestimonialCard = ({ testimonial }: { testimonial: Testimonial }) => (
  <div className="bg-card rounded-2xl border border-border p-6 shadow-sm hover:shadow-lg transition-shadow h-full flex flex-col">
    {/* Header: avatar + info */}
    <div className="flex items-center gap-3 mb-4">
      <div className={`w-12 h-12 rounded-full ${testimonial.bgColor} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
        {testimonial.initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-foreground truncate">{testimonial.name}</p>
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <MapPin className="w-3 h-3" /> {testimonial.city}
        </p>
      </div>
    </div>

    {/* Stars */}
    <div className="flex gap-0.5 mb-3">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${i < testimonial.rating ? "text-amber-400 fill-amber-400" : "text-muted"}`}
        />
      ))}
    </div>

    {/* Quote */}
    <div className="flex-1 relative">
      <Quote className="w-6 h-6 text-primary/20 absolute -top-1 -left-1" />
      <p className="text-sm text-muted-foreground leading-relaxed pl-4">{testimonial.text}</p>
    </div>

    {/* Installation badge */}
    <div className="mt-4 pt-3 border-t border-border">
      <span className="text-xs font-medium text-primary bg-primary/5 px-3 py-1 rounded-full">
        ⚡ {testimonial.installation}
      </span>
    </div>
  </div>
);

export default SolarTestimonials;
