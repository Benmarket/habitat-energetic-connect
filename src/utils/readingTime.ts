/**
 * Calculate estimated reading time for content
 * @param content HTML content string
 * @returns Reading time in minutes
 */
export const calculateReadingTime = (content: string): number => {
  // Remove HTML tags
  const text = content.replace(/<[^>]*>/g, "");
  
  // Count words (French average: 200-250 words per minute, we use 200)
  const wordCount = text.trim().split(/\s+/).length;
  const readingTime = Math.ceil(wordCount / 200);
  
  return readingTime;
};

/**
 * Format reading time for display
 * @param minutes Reading time in minutes
 * @returns Formatted string
 */
export const formatReadingTime = (minutes: number): string => {
  if (minutes < 1) return "Moins d'une minute";
  if (minutes === 1) return "1 minute";
  return `${minutes} minutes`;
};
