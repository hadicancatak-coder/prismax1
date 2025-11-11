import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

export const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { userRole, roleLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!roleLoading && userRole !== 'admin') {
      navigate('/');
      toast({
        title: "Unauthorized",
        description: "You don't have permission to access this page",
        variant: "destructive"
      });
    }
  }, [userRole, roleLoading, navigate]);

  if (roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (userRole !== 'admin') {
    return null;
  }

  return <>{children}</>;
};
