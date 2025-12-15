import { parseMarkdownLinks } from "@/lib/markdownParser";

interface CommentTextProps {
  text: string;
  className?: string;
  linkClassName?: string;
  enableMentions?: boolean;
  profiles?: any[];
}

export function CommentText({ 
  text, 
  className = "", 
  linkClassName = "text-primary underline hover:text-primary/80",
  enableMentions = false,
  profiles = []
}: CommentTextProps) {
  const segments = parseMarkdownLinks(text);
  
  return (
    <p className={`whitespace-pre-wrap break-words ${className}`}>
      {segments.map((segment, index) => {
        if (segment.type === 'link') {
          return (
            <a
              key={index}
              href={segment.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`${linkClassName} transition-colors`}
              onClick={(e) => e.stopPropagation()}
            >
              {segment.content}
            </a>
          );
        }
        
        // Handle mentions - always parse them for visual styling
        return segment.content.split(/(@\w+)/g).map((part, i) => {
          if (part.startsWith('@')) {
            return (
              <span 
                key={`${index}-${i}`} 
                className="bg-primary/15 text-primary px-1.5 py-0.5 rounded-md font-medium text-body-sm inline-block"
              >
                {part}
              </span>
            );
          }
          return part;
        });
      })}
    </p>
  );
}
