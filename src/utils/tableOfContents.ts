interface TOCItem {
  id: string;
  text: string;
  level: number;
}

/**
 * Extract table of contents from HTML content
 * @param content HTML content string
 * @returns Array of TOC items
 */
export const extractTableOfContents = (content: string): TOCItem[] => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(content, "text/html");
  const headings = doc.querySelectorAll("h2, h3");
  
  const toc: TOCItem[] = [];
  
  headings.forEach((heading, index) => {
    const text = heading.textContent?.trim() || "";
    const level = parseInt(heading.tagName.substring(1));
    const id = heading.id || `heading-${index}`;
    
    // Add id to heading if not present
    if (!heading.id) {
      heading.id = id;
    }
    
    toc.push({ id, text, level });
  });
  
  return toc;
};

/**
 * Add IDs to headings in HTML content
 * @param content HTML content string
 * @returns Modified HTML with IDs added
 */
export const addHeadingIds = (content: string): string => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(content, "text/html");
  const headings = doc.querySelectorAll("h2, h3");
  
  headings.forEach((heading, index) => {
    if (!heading.id) {
      heading.id = `heading-${index}`;
    }
  });
  
  return doc.body.innerHTML;
};
