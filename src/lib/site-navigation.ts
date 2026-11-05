export interface NavigationSection { id: string; anchor: string; visible: boolean }
export function sectionDestination(sections: NavigationSection[], id: string, fallback: string) {
  const section = sections.find(item => item.id === id);
  if (!section?.visible || !section.anchor?.trim()) return fallback;
  return `/#${section.anchor.replace(/^#/, '')}`;
}