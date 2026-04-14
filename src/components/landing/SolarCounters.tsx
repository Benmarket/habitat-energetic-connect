import { useEffect, useRef, useState } from "react";
import { Users, Zap, ShieldCheck, TrendingUp } from "lucide-react";

interface CounterItem {
  icon: React.ElementType;
  target: number;
  suffix: string;
  label: string;
}

const counters: CounterItem[] = [
  { icon: Users, target: 2000, suffix: "+", label: "Clients satisfaits" },
  { icon: Zap, target: 70, suffix: "%", label: "D'économie en moyenne" },
  { icon: ShieldCheck, target: 25, suffix: " ans", label: "De garantie panneaux" },
  { icon: TrendingUp, target: 7, suffix: " ans", label: "Retour sur investissement" },
];

const useCountUp = (target: number, duration: number = 2000, startCounting: boolean = false) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!startCounting) return;
    let start = 0;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration, startCounting]);

  return count;
};

const CounterCard = ({ item, isVisible }: { item: CounterItem; isVisible: boolean }) => {
  const count = useCountUp(item.target, 2000, isVisible);

  return (
    <div className="flex flex-col items-center text-center group">
      <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
        <item.icon className="w-8 h-8 text-white" />
      </div>
      <span className="text-3xl lg:text-4xl font-black text-white tabular-nums">
        {count.toLocaleString("fr-FR")}{item.suffix}
      </span>
      <span className="text-sm text-white/80 mt-1 font-medium">{item.label}</span>
    </div>
  );
};

const SolarCounters = () => {
  const ref = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      className="py-10 lg:py-14 bg-gradient-to-r from-primary via-emerald-600 to-primary"
    >
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
          {counters.map((item, i) => (
            <CounterCard key={i} item={item} isVisible={isVisible} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default SolarCounters;
