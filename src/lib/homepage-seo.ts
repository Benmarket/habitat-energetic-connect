export const DEFAULT_HOME_DESCRIPTION = "Étude gratuite de votre projet solaire, pompe à chaleur ou isolation. Découvrez les aides MaPrimeRénov' et CEE selon votre éligibilité.";

export interface HomepageSeo {
  title: string;
  description: string;
  siteName: string;
}

export function resolveHomepageSeo(rows: { key: string; value: unknown }[]): HomepageSeo {
  const text = (key: string) => {
    const value = rows.find(row => row.key === key)?.value;
    return typeof value === "string" ? value.trim() : "";
  };
  const siteName = text("site_title") || "Prime Énergies";
  return {
    title: siteName,
    siteName,
    description: text("meta_description") || text("site_description") || DEFAULT_HOME_DESCRIPTION,
  };
}

/** Read the publication snapshot, never newer settings after the first paint. */
export function readHomepageSeoSnapshot(): HomepageSeo {
  const fallback = resolveHomepageSeo([]);
  // Structural type also allows the build-side resolver to compile without DOM libs.
  const doc = (globalThis as typeof globalThis & {
    document?: { getElementById(id: string): { textContent: string | null } | null };
  }).document;
  const raw = doc?.getElementById("homepage-seo-snapshot")?.textContent;
  if (!raw) return fallback;
  try {
    const value = JSON.parse(raw) as HomepageSeo;
    return typeof value.title === "string" && typeof value.description === "string" && typeof value.siteName === "string"
      ? value : fallback;
  } catch {
    return fallback;
  }
}