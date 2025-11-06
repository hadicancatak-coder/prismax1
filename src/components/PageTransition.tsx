import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

interface PageTransitionProps {
  children: React.ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  const location = useLocation();

  return (
    <div className="relative min-h-screen">
      <div
        key={location.pathname}
        className={cn(
          "animate-in fade-in slide-in-from-bottom-2",
          "duration-300 ease-out"
        )}
      >
        {children}
      </div>
    </div>
  );
}
