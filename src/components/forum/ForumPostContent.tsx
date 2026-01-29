import { sanitizeUserContent } from "@/utils/sanitizeHtml";

interface ForumPostContentProps {
  content: string;
}

// Validate and normalize image URL - only allow http/https protocols
const getSafeImageUrl = (url: string): string | null => {
  if (!url || typeof url !== 'string') return null;
  
  try {
    const parsed = new URL(url.trim());
    
    // Only allow http: and https: protocols
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }
    
    // Return normalized URL
    return parsed.toString();
  } catch {
    // Invalid URL
    return null;
  }
};

// Sanitize alt text - remove any HTML/script content
const sanitizeAltText = (alt: string): string => {
  if (!alt || typeof alt !== 'string') return 'Image';
  // Remove HTML tags and limit length
  return alt.replace(/<[^>]*>/g, '').substring(0, 100) || 'Image';
};

const ForumPostContent = ({ content }: ForumPostContentProps) => {
  // Parse content to separate text and images
  const renderContent = () => {
    // Match markdown images: ![alt](url)
    const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
    const parts: (string | { type: "image"; safeUrl: string; alt: string })[] = [];
    
    let lastIndex = 0;
    let match;
    
    while ((match = imageRegex.exec(content)) !== null) {
      // Add text before the image
      if (match.index > lastIndex) {
        parts.push(content.slice(lastIndex, match.index));
      }
      
      // Validate and normalize URL
      const safeUrl = getSafeImageUrl(match[2]);
      
      // Add the image only if URL is valid
      if (safeUrl) {
        parts.push({
          type: "image",
          alt: sanitizeAltText(match[1]),
          safeUrl: safeUrl,
        });
      }
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text
    if (lastIndex < content.length) {
      parts.push(content.slice(lastIndex));
    }

    return parts.map((part, index) => {
      if (typeof part === "string") {
        const trimmedText = part.trim();
        if (!trimmedText) return null;
        
        // Sanitize text content using DOMPurify (sanitizeUserContent)
        const sanitizedHtml = sanitizeUserContent(trimmedText);
        
        return (
          <div 
            key={index} 
            className="whitespace-pre-wrap [&_a]:text-primary [&_a]:underline"
            dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
          />
        );
      }
      
      // Render sanitized image with safe normalized URL
      return (
        <div key={index} className="my-4">
          <a
            href={part.safeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block"
          >
            <img
              src={part.safeUrl}
              alt={part.alt}
              className="max-w-full max-h-96 rounded-lg border border-border hover:opacity-90 transition-opacity cursor-zoom-in"
              loading="lazy"
              onError={(e) => {
                // Hide broken images
                e.currentTarget.style.display = 'none';
              }}
            />
          </a>
        </div>
      );
    });
  };

  return <div className="prose prose-sm max-w-none dark:prose-invert">{renderContent()}</div>;
};

export default ForumPostContent;
