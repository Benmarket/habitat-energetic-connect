import { useState, useEffect, useCallback } from 'react';

interface TocItem {
  id: string;
  text: string;
  level: number;
}

export const useActiveSection = (toc: TocItem[]) => {
  const [activeId, setActiveId] = useState<string>('');
  const [scrollProgress, setScrollProgress] = useState(0);

  const handleScroll = useCallback(() => {
    // Calculate scroll progress
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    setScrollProgress(Math.min(progress, 100));

    // Find active section
    const headings = toc.map(item => document.getElementById(item.id)).filter(Boolean);
    
    let currentActiveId = '';
    
    for (let i = headings.length - 1; i >= 0; i--) {
      const heading = headings[i];
      if (heading) {
        const rect = heading.getBoundingClientRect();
        if (rect.top <= 150) {
          currentActiveId = heading.id;
          break;
        }
      }
    }
    
    if (!currentActiveId && headings.length > 0 && headings[0]) {
      currentActiveId = headings[0].id;
    }
    
    setActiveId(currentActiveId);
  }, [toc]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial call
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 100;
      const elementPosition = element.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({
        top: elementPosition - offset,
        behavior: 'smooth'
      });
    }
  };

  return { activeId, scrollProgress, scrollToSection };
};
