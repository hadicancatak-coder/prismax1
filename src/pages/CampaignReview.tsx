import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Eye, Heart, MessageSquare, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useExternalAccess } from "@/hooks/useExternalAccess";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { formatDistanceToNow } from "date-fns";

export default function CampaignReview() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { verifyToken, verifyEmail } = useExternalAccess();
  
  const [accessData, setAccessData] = useState<any>(null);
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  
  const [campaignData, setCampaignData] = useState<any>(null);
  const [versions, setVersions] = useState<any[]>([]);
  const [comments, setComments] = useState<{ [key: string]: string }>({});
  const [submitting, setSubmitting] = useState<{ [key: string]: boolean }>({});

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
        
        // Always load campaign data immediately
        await loadCampaignData(result.entity, result.campaign_id);
        
        // Set verified to true (no email check needed)
        setVerified(true);
        
        // Pre-fill name and email if available
        setEmail(result.reviewer_email || "");
        setName(result.reviewer_name || "");
      } catch (error: any) {
        toast.error(error.message || "Invalid or expired link");
        navigate("/");
      } finally {
        setLoading(false);
      }
    };

    verify();
  }, [token, verifyToken, navigate]);

  const loadCampaignData = async (entity: string, campaignId?: string) => {
    try {
      if (campaignId) {
        // Single campaign review
        const { data: campaign, error: campError } = await supabase
          .from("utm_campaigns")
          .select("*")
          .eq("id", campaignId)
          .single();

        if (campError) throw campError;
        setCampaignData(campaign ? [campaign] : []);

        // Load versions
        const { data: versionData } = await (supabase as any)
          .from("utm_campaign_versions")
          .select("id, campaign_id, version_number, version_notes, image_url, asset_link")
          .eq("campaign_id", campaignId)
          .order("version_number", { ascending: false });
        
        setVersions(versionData || []);
      } else {
        // Entity-wide review - load all campaigns for entity
        const { data: tracking, error: trackError } = await supabase
          .from("campaign_entity_tracking")
          .select("campaign_id, utm_campaigns(*)")
          .eq("entity", entity)
          .eq("status", "Live");

        if (trackError) throw trackError;
        
        const campaigns = tracking.map((t: any) => t.utm_campaigns).filter(Boolean);
        setCampaignData(campaigns);

        const campaignIds = campaigns.map((c: any) => c.id);
        if (campaignIds.length > 0) {
          const { data: versionData } = await (supabase as any)
            .from("utm_campaign_versions")
            .select("id, campaign_id, version_number, version_notes, image_url, asset_link")
            .in("campaign_id", campaignIds)
            .order("version_number", { ascending: false });

          setVersions(versionData || []);
        }
      }
    } catch (error: any) {
      toast.error("Failed to load campaign data");
      console.error(error);
    }
  };

  const handleCommentWithDetails = async (versionId: string, campaignId: string) => {
    // Validate email on first comment
    if (!email.endsWith("@cfi.trade")) {
      toast.error("Email must be from @cfi.trade domain");
      return;
    }

    if (!name.trim()) {
      toast.error("Please enter your name");
      return;
    }

    // Update access record with name/email if not set
    if (!accessData.reviewer_name || !accessData.email_verified) {
      try {
        await verifyEmail.mutateAsync({
          token: token!,
          reviewerName: name,
          reviewerEmail: email,
        });
        setAccessData({ ...accessData, reviewer_name: name, reviewer_email: email, email_verified: true });
      } catch (error: any) {
        toast.error("Failed to verify email: " + error.message);
        return;
      }
    }

    // Now submit the comment
    await handleCommentSubmit(versionId, campaignId);
  };

  const handleCommentSubmit = async (versionId: string, campaignId: string) => {
    const commentText = comments[versionId];
    if (!commentText?.trim()) return;

    setSubmitting({ ...submitting, [versionId]: true });
    try {
      const { error } = await supabase
        .from("external_campaign_review_comments")
        .insert({
          campaign_id: campaignId,
          version_id: versionId,
          reviewer_name: name,
          reviewer_email: email,
          entity: accessData.entity,
          comment_text: commentText,
          comment_type: "version_feedback",
          access_token: token!,
        });

      if (error) throw error;
      
      setComments({ ...comments, [versionId]: "" });
      toast.success("Comment submitted");
    } catch (error: any) {
      toast.error("Failed to submit comment");
    } finally {
      setSubmitting({ ...submitting, [versionId]: false });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // No verification screen needed - directly show content

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto py-md px-md">
          <div className="flex items-center gap-sm">
            <Eye className="h-6 w-6 text-primary" />
            <div className="flex-1">
              <h1 className="text-page-title">Campaign Review</h1>
              <p className="text-body-sm text-muted-foreground">
                {accessData?.entity}
              </p>
            </div>
            {/* Name & Email Inputs for first-time visitors */}
            <div className="flex items-center gap-sm">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your Name"
                className="w-[150px]"
              />
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@cfi.trade"
                className="w-[200px]"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto py-md px-md space-y-lg">
        {campaignData?.map((campaign: any) => {
          const campaignVersions = versions.filter((v) => v.campaign_id === campaign.id);
          
          return (
            <Card key={campaign.id}>
              <CardHeader>
                <CardTitle className="text-heading-lg">{campaign.name}</CardTitle>
                <p className="text-body text-muted-foreground">{campaign.lp_type || "Campaign"}</p>
              </CardHeader>
              <CardContent className="space-y-md">
                <Accordion type="single" collapsible>
                  {campaignVersions.map((version) => (
                    <AccordionItem key={version.id} value={version.id}>
                      <AccordionTrigger className="text-body font-medium">
                        Version {version.version_number}
                        {version.version_notes && (
                          <span className="text-metadata text-muted-foreground ml-sm">
                            • {version.version_notes.substring(0, 50)}
                          </span>
                        )}
                      </AccordionTrigger>
                      <AccordionContent className="space-y-md pt-sm">
                        {version.version_notes && (
                          <div>
                            <p className="text-body-sm text-foreground">{version.version_notes}</p>
                          </div>
                        )}
                        
                        {version.image_url && (
                          <div>
                            <img
                              src={version.image_url}
                              alt={`Version ${version.version_number}`}
                              className="rounded-lg max-w-full h-auto"
                            />
                          </div>
                        )}
                        
                        {version.asset_link && (
                          <div>
                            <a
                              href={version.asset_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-body-sm text-primary hover:underline"
                            >
                              View Asset Link →
                            </a>
                          </div>
                        )}

                        {/* Comment section */}
                        <div className="space-y-sm border-t border-border pt-md">
                          <div className="flex items-center gap-xs">
                            <MessageSquare className="h-4 w-4 text-muted-foreground" />
                            <Label className="text-body-sm">Leave feedback on this version:</Label>
                          </div>
                          <Textarea
                            value={comments[version.id] || ""}
                            onChange={(e) =>
                              setComments({ ...comments, [version.id]: e.target.value })
                            }
                            placeholder="Share your feedback on lead quality, creative effectiveness, etc..."
                            className="min-h-[100px]"
                          />
                          <Button
                            onClick={() => handleCommentWithDetails(version.id, campaign.id)}
                            disabled={!comments[version.id]?.trim() || submitting[version.id]}
                            size="sm"
                          >
                            {submitting[version.id] ? "Submitting..." : "Submit Feedback"}
                          </Button>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-primary/5 to-accent/5 border-t border-border py-md backdrop-blur-sm">
        <div className="container mx-auto px-md">
          <p className="text-body text-center text-foreground flex items-center justify-center gap-xs font-medium">
            PerMar loves <Heart className="h-5 w-5 text-destructive fill-destructive animate-pulse" /> {accessData?.entity} - Sales Team
          </p>
        </div>
      </div>
    </div>
  );
}
