import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CheckCircle, XCircle, Clock, AlertCircle, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { StepUpMFADialog } from "@/components/StepUpMFADialog";
import { checkRecentMFAChallenge } from "@/lib/mfaHelpers";

interface AdApprovalSectionProps {
  adId: string;
  currentStatus: string;
  onStatusChange: () => void;
}

export function AdApprovalSection({ adId, currentStatus, onStatusChange }: AdApprovalSectionProps) {
  const [status, setStatus] = useState(currentStatus);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [showStepUpMFA, setShowStepUpMFA] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);

  useEffect(() => {
    fetchComments();
    
    const channel = supabase
      .channel(`ad-comments-${adId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ad_comments', filter: `ad_id=eq.${adId}` }, () => {
        fetchComments();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [adId]);

  const fetchComments = async () => {
    const { data, error } = await supabase
      .from('ad_comments')
      .select(`
        *,
        author:profiles!ad_comments_author_id_fkey(name, avatar_url)
      `)
      .eq('ad_id', adId)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setComments(data);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    // Check for recent MFA challenge
    const recentChallenge = await checkRecentMFAChallenge('approval');
    
    if (!recentChallenge) {
      setPendingStatus(newStatus);
      setShowStepUpMFA(true);
      return;
    }

    await actuallyChangeStatus(newStatus);
  };

  const actuallyChangeStatus = async (newStatus: string) => {
    try {
      const { error } = await supabase
        .from('ads')
        .update({ approval_status: newStatus })
        .eq('id', adId);

      if (error) throw error;
      setStatus(newStatus);
      toast({ title: "Status updated" });
      onStatusChange();
    } catch (error: any) {
      toast({ title: "Error updating status", description: error.message, variant: "destructive" });
    }
  };

  const onMFAVerified = async () => {
    if (!pendingStatus) return;
    await actuallyChangeStatus(pendingStatus);
    setPendingStatus(null);
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    
    setLoading(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const userId = session.session?.user.id;

      const { error } = await supabase
        .from('ad_comments')
        .insert({
          ad_id: adId,
          author_id: userId,
          body: newComment
        });

      if (error) throw error;
      setNewComment("");
      toast({ title: "Comment added" });
    } catch (error: any) {
      toast({ title: "Error adding comment", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const statusConfig = {
    approved: { icon: CheckCircle, color: "bg-success/10 text-success border-success/20", label: "Approved" },
    not_approved: { icon: XCircle, color: "bg-destructive/10 text-destructive border-destructive/20", label: "Not Approved" },
    pending: { icon: Clock, color: "bg-warning/10 text-warning border-warning/20", label: "Pending" },
    needs_adjustments: { icon: AlertCircle, color: "bg-pending/10 text-pending border-pending/20", label: "Needs Adjustments" }
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
  const Icon = config.icon;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">Approval Status</h3>
        <Badge variant="outline" className={config.color}>
          <Icon className="h-3 w-3 mr-1" />
          {config.label}
        </Badge>
      </div>

      <Select value={status} onValueChange={handleStatusChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="approved">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-success" />
              Approved
            </div>
          </SelectItem>
          <SelectItem value="not_approved">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-destructive" />
              Not Approved
            </div>
          </SelectItem>
          <SelectItem value="pending">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-warning" />
              Pending
            </div>
          </SelectItem>
          <SelectItem value="needs_adjustments">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-pending" />
              Needs Adjustments
            </div>
          </SelectItem>
        </SelectContent>
      </Select>

      <div className="border-t pt-4 mt-4">
        <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Comments ({comments.length})
        </h3>
        
        <div className="space-y-3 max-h-64 overflow-y-auto mb-3">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-2 text-sm">
              <Avatar className="h-6 w-6">
                <AvatarImage src={comment.author?.avatar_url} />
                <AvatarFallback className="text-xs">
                  {comment.author?.name?.charAt(0) || "?"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-xs">{comment.author?.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(comment.created_at), "MMM dd, HH:mm")}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{comment.body}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <Textarea
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={2}
            className="text-sm"
          />
          <Button onClick={handleAddComment} disabled={loading || !newComment.trim()} size="sm">
            Add
          </Button>
        </div>
      </div>

      <StepUpMFADialog 
        open={showStepUpMFA}
        onOpenChange={setShowStepUpMFA}
        onVerified={onMFAVerified}
        actionContext="approval"
      />
    </div>
  );
}
