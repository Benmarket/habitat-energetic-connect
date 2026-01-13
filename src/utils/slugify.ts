/**
 * Converts a string to a URL-friendly slug
 * @param text - The text to slugify
 * @returns A lowercase, hyphenated string safe for URLs
 */
export const slugify = (text: string): string => {
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/[^\w\-]+/g, '') // Remove non-word characters
    .replace(/\-\-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-+/, '') // Remove leading hyphens
    .replace(/-+$/, ''); // Remove trailing hyphens
};

/**
 * Generates the URL for a partner offer
 * @param advertiserName - The advertiser's company name
 * @param offerId - The offer's unique ID
 * @param regionCode - Optional region code to pass context
 * @returns The full path for the offer
 */
export const getOfferUrl = (advertiserName: string, offerId: string, regionCode?: string): string => {
  const basePath = `/offre-partenaire/${slugify(advertiserName)}/${offerId}`;
  if (regionCode && regionCode !== 'fr') {
    return `${basePath}?region=${regionCode}`;
  }
  return basePath;
};
