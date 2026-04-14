import { useEffect, useRef, useState } from "react";

/**
 * Hook for scroll-triggered reveal animations.
 * Returns a ref to attach to the element and a boolean indicating visibility.
 */
export const useScrollReveal = (threshold = 0.15) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isVisible };
};

/**
 * CSS class helper for staggered reveal animations.
 * Returns opacity-0 + translate until visible, then animates in.
 */
export const revealClass = (isVisible: boolean, delay: number = 0, direction: "up" | "left" | "right" = "up") => {
  const base = "transition-all duration-700 ease-out";
  const delayStyle = delay > 0 ? `transition-delay: ${delay}ms` : "";
  
  if (!isVisible) {
    const transforms: Record<string, string> = {
      up: "translate-y-8 opacity-0",
      left: "-translate-x-8 opacity-0",
      right: "translate-x-8 opacity-0",
    };
    return { className: `${base} ${transforms[direction]}`, style: {} };
  }
  
  return {
    className: `${base} translate-y-0 translate-x-0 opacity-100`,
    style: delayStyle ? { transitionDelay: `${delay}ms` } : {},
  };
};
