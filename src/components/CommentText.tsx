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
        
        // Handle mentions if enabled
        if (enableMentions) {
          return segment.content.split(/(@\w+)/g).map((part, i) => {
            if (part.startsWith('@')) {
              const username = part.substring(1);
              const mentioned = profiles.find(
                p => p.name?.toLowerCase() === username.toLowerCase() ||
                     p.username?.toLowerCase() === username.toLowerCase()
              );
              return mentioned ? (
                <span key={`${index}-${i}`} className="font-semibold cursor-pointer hover:underline">
                  {part}
                </span>
              ) : part;
            }
            return part;
          });
        }
        
        return segment.content;
      })}
    </p>
  );
}
