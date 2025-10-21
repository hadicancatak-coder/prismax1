import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { X, Sun } from "lucide-react";

interface MorningBriefingProps {
  userName: string;
  overdueCount: number;
  dueTodayCount: number;
  meetingsCount: number;
  onDismiss: () => void;
}

export const MorningBriefing = ({ 
  userName, 
  overdueCount, 
  dueTodayCount, 
  meetingsCount,
  onDismiss 
}: MorningBriefingProps) => {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <Alert className="mb-4 border-primary/20 bg-gradient-to-r from-primary/10 to-purple-500/10 relative">
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 h-6 w-6"
        onClick={onDismiss}
      >
        <X className="h-4 w-4" />
      </Button>
      
      <Sun className="h-5 w-5 text-primary" />
      <AlertTitle className="text-lg font-bold">
        {getGreeting()}, {userName}! 👋
      </AlertTitle>
      <AlertDescription className="mt-2">
        {overdueCount > 0 && (
          <span className="text-destructive font-medium">
            You have <strong>{overdueCount} overdue task{overdueCount !== 1 ? 's' : ''}</strong>
            {dueTodayCount > 0 || meetingsCount > 0 ? ', ' : '. '}
          </span>
        )}
        {dueTodayCount > 0 && (
          <span>
            <strong>{dueTodayCount} due today</strong>
            {meetingsCount > 0 ? ', and ' : '. '}
          </span>
        )}
        {meetingsCount > 0 && (
          <span>
            <strong>{meetingsCount} campaign{meetingsCount !== 1 ? 's' : ''}</strong> to launch.
          </span>
        )}
        {overdueCount === 0 && dueTodayCount === 0 && meetingsCount === 0 && (
          <span>You're all caught up! Ready to tackle new challenges? 🚀</span>
        )}
        <span className="block mt-2 text-sm">
          Let's make it a productive day!
        </span>
      </AlertDescription>
    </Alert>
  );
};
