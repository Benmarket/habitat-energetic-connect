import { useEffect, useRef, useState } from "react";
import { Users, Zap, ShieldCheck, TrendingUp } from "lucide-react";
import { useScrollReveal, revealClass } from "@/hooks/useScrollReveal";

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
  // IMPORTANT: default to target so if animation never fires, user sees real number
  const [count, setCount] = useState(target);
  const hasStarted = useRef(false);

  useEffect(() => {
    if (!startCounting || hasStarted.current) return;
    hasStarted.current = true;
    setCount(0); // Reset to 0 only when we know animation will run
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

const CounterCard = ({ item, isVisible, index }: { item: CounterItem; isVisible: boolean; index: number }) => {
  const count = useCountUp(item.target, 2000, isVisible);
  const reveal = revealClass(isVisible, index * 150, "up");

  return (
    <div className={`flex flex-col items-center text-center group ${reveal.className}`} style={reveal.style}>
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
  const { ref, isVisible } = useScrollReveal(0.3);

  return (
    <section
      className="py-10 lg:py-14 bg-gradient-to-r from-primary via-emerald-600 to-primary"
    >
      <div ref={ref} className="container mx-auto px-4 max-w-5xl">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
          {counters.map((item, i) => (
            <CounterCard key={i} item={item} isVisible={isVisible} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default SolarCounters;
