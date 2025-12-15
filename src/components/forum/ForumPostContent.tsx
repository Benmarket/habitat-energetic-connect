interface ForumPostContentProps {
  content: string;
}

const ForumPostContent = ({ content }: ForumPostContentProps) => {
  // Parse content to separate text and images
  const renderContent = () => {
    // Match markdown images: ![alt](url)
    const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
    const parts: (string | { type: "image"; url: string; alt: string })[] = [];
    
    let lastIndex = 0;
    let match;
    
    while ((match = imageRegex.exec(content)) !== null) {
      // Add text before the image
      if (match.index > lastIndex) {
        parts.push(content.slice(lastIndex, match.index));
      }
      
      // Add the image
      parts.push({
        type: "image",
        alt: match[1] || "Image",
        url: match[2],
      });
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text
    if (lastIndex < content.length) {
      parts.push(content.slice(lastIndex));
    }
    
    return parts.map((part, index) => {
      if (typeof part === "string") {
        // Render text, split by newlines for proper paragraph handling
        const trimmedText = part.trim();
        if (!trimmedText) return null;
        
        return (
          <div key={index} className="whitespace-pre-wrap">
            {trimmedText}
          </div>
        );
      }
      
      // Render image
      return (
        <div key={index} className="my-4">
          <a
            href={part.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block"
          >
            <img
              src={part.url}
              alt={part.alt}
              className="max-w-full max-h-96 rounded-lg border border-border hover:opacity-90 transition-opacity cursor-zoom-in"
            />
          </a>
        </div>
      );
    });
  };

  return <div className="prose prose-sm max-w-none dark:prose-invert">{renderContent()}</div>;
};

export default ForumPostContent;