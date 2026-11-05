import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { sectionDestination, type NavigationSection } from '@/lib/site-navigation';
export function useNavigationLinks() {
  const [sections, setSections] = useState<NavigationSection[]>([]);
  useEffect(() => {
    supabase.from('site_settings').select('value').eq('key', 'homepage_sections').maybeSingle().then(({ data }) => {
      if (Array.isArray(data?.value)) setSections(data.value as unknown as NavigationSection[]);
    });
  }, []);
  return {
    offres: sectionDestination(sections, 'partner-offers', '/#offres'),
    actualite: sectionDestination(sections, 'news', '/actualites'),
    guides: sectionDestination(sections, 'guides', '/guides'),
    aides: '/aides',
    simulateurs: sectionDestination(sections, 'simulators', '/simulateurs/solaire'),
  };
}