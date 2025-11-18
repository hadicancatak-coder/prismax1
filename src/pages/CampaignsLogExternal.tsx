import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Eye, ExternalLink as ExternalLinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useExternalAccess } from "@/hooks/useExternalAccess";
import { useUtmCampaigns } from "@/hooks/useUtmCampaigns";
import { EntityCampaignTable } from "@/components/campaigns/EntityCampaignTable";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function CampaignsLogExternal() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { verifyToken, verifyEmail } = useExternalAccess();
  const { data: campaigns = [] } = useUtmCampaigns();
  
  const [accessData, setAccessData] = useState<any>(null);
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  
  // Email verification form
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  // Verify token on mount
  useEffect(() => {
    const verify = async () => {
      if (!token) {
        toast.error("Invalid review link");
        navigate("/");
        return;
      }

      try {
        const result = await verifyToken(token);
        setAccessData(result);
        setVerified(result.email_verified);
        
        if (!result.email_verified) {
          setEmail(result.reviewer_email);
          setName(result.reviewer_name || "");
        }
      } catch (error: any) {
        toast.error(error.message || "Invalid or expired link");
        navigate("/");
      } finally {
        setLoading(false);
      }
    };

    verify();
  }, [token, verifyToken, navigate]);

  const handleEmailVerification = async () => {
    if (!email.endsWith("@cfi.trade")) {
      toast.error("Email must be from @cfi.trade domain");
      return;
    }

    if (!name.trim()) {
      toast.error("Please enter your name");
      return;
    }

    setVerifying(true);
    try {
      await verifyEmail.mutateAsync({
        token: token!,
        reviewerName: name,
        reviewerEmail: email,
      });
      setVerified(true);
      toast.success("Access granted!");
    } catch (error: any) {
      toast.error(error.message || "Verification failed");
    } finally {
      setVerifying(false);
    }
  };

  // Transform campaigns to expected format
  const transformedCampaigns = campaigns.map(c => ({
    id: c.id,
    name: c.name,
    notes: null,
  }));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Show verification form if not verified
  if (!verified) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Email Verification Required
            </CardTitle>
            <CardDescription>
              Please verify your @cfi.trade email to access the campaign review
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Your Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email (@cfi.trade)</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@cfi.trade"
              />
            </div>
            <Button
              onClick={handleEmailVerification}
              disabled={verifying}
              className="w-full"
            >
              {verifying ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify & Access"
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Banner */}
      <div className="bg-amber-100 dark:bg-amber-950 border-b border-amber-200 dark:border-amber-800 py-3 px-4 flex-shrink-0">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            <span className="font-semibold">
              External Review Mode - {accessData.entity}
            </span>
          </div>
          <div className="text-sm">
            {accessData.reviewer_name} ({accessData.reviewer_email})
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex flex-col container mx-auto py-6 px-4">
        <EntityCampaignTable
          entity={accessData.entity}
          campaigns={transformedCampaigns}
          isExternal={true}
          externalReviewerName={accessData.reviewer_name}
          externalReviewerEmail={accessData.reviewer_email}
        />
      </div>
    </div>
  );
}
