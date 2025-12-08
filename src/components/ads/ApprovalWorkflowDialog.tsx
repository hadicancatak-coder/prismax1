import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, MessageSquare, Clock } from 'lucide-react';
import { useApprovalHistory, useAddApprovalEntry } from '@/hooks/useApprovalHistory';
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ApprovalWorkflowDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ad: any;
}

const APPROVAL_STAGES = [
  { key: 'copywriter', label: 'Copywriter', icon: MessageSquare },
  { key: 'team_lead', label: 'Team Lead', icon: CheckCircle },
  { key: 'legal', label: 'Legal', icon: XCircle },
  { key: 'final', label: 'Final Approval', icon: CheckCircle },
] as const;

export function ApprovalWorkflowDialog({ open, onOpenChange, ad }: ApprovalWorkflowDialogProps) {
  const [comment, setComment] = useState('');
  const [selectedStage, setSelectedStage] = useState<typeof APPROVAL_STAGES[number]['key']>('copywriter');
  const { data: history = [], isLoading } = useApprovalHistory(ad?.id);
  const addEntry = useAddApprovalEntry();

  const handleApprove = async (stage: string) => {
    await addEntry.mutateAsync({
      ad_id: ad.id,
      stage: stage as any,
      status: 'approved',
      comment: comment || undefined,
      approver_id: undefined, // Will be set by RLS policy
    });
    setComment('');
  };

  const handleReject = async (stage: string) => {
    if (!comment.trim()) {
      return;
    }
    await addEntry.mutateAsync({
      ad_id: ad.id,
      stage: stage as any,
      status: 'rejected',
      comment,
      approver_id: undefined,
    });
    setComment('');
  };

  const handleRequestChanges = async (stage: string) => {
    if (!comment.trim()) {
      return;
    }
    await addEntry.mutateAsync({
      ad_id: ad.id,
      stage: stage as any,
      status: 'changes_requested',
      comment,
      approver_id: undefined,
    });
    setComment('');
  };

  const getStageStatus = (stage: string) => {
    const stageHistory = history.filter(h => h.stage === stage);
    if (stageHistory.length === 0) return 'pending';
    return stageHistory[0].status;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'default';
      case 'rejected': return 'destructive';
      case 'changes_requested': return 'secondary';
      default: return 'outline';
    }
  };

  if (!ad) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Approval Workflow: {ad.name}</DialogTitle>
        </DialogHeader>

        <Tabs value={selectedStage} onValueChange={(v) => setSelectedStage(v as any)}>
          <TabsList className="grid w-full grid-cols-4">
            {APPROVAL_STAGES.map((stage) => {
              const Icon = stage.icon;
              const status = getStageStatus(stage.key);
              return (
                <TabsTrigger key={stage.key} value={stage.key} className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  {stage.label}
                  {status === 'approved' && <CheckCircle className="h-3 w-3 text-success" />}
                  {status === 'rejected' && <XCircle className="h-3 w-3 text-destructive" />}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {APPROVAL_STAGES.map((stage) => (
            <TabsContent key={stage.key} value={stage.key} className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{stage.label} Review</h3>
                  <p className="text-sm text-muted-foreground">
                    Current Status: <Badge variant={getStatusColor(getStageStatus(stage.key))}>
                      {getStageStatus(stage.key)}
                    </Badge>
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <Textarea
                  placeholder="Add review comments (required for rejection/changes)..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                />

                <div className="flex gap-2">
                  <Button 
                    onClick={() => handleApprove(stage.key)}
                    disabled={addEntry.isPending}
                    variant="default"
                    className="flex-1"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                  <Button 
                    onClick={() => handleRequestChanges(stage.key)}
                    disabled={addEntry.isPending || !comment.trim()}
                    variant="secondary"
                    className="flex-1"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Request Changes
                  </Button>
                  <Button 
                    onClick={() => handleReject(stage.key)}
                    disabled={addEntry.isPending || !comment.trim()}
                    variant="destructive"
                    className="flex-1"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </div>
              </div>

              <div className="mt-6">
                <h4 className="font-medium mb-3">History for {stage.label}</h4>
                <div className="space-y-2">
                  {history
                    .filter(h => h.stage === stage.key)
                    .map((entry) => (
                      <div key={entry.id} className="border rounded-lg p-3 space-y-1">
                        <div className="flex items-center justify-between">
                          <Badge variant={getStatusColor(entry.status)}>
                            {entry.status.replace('_', ' ')}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(entry.created_at), 'MMM dd, yyyy HH:mm')}
                          </span>
                        </div>
                        {entry.comment && (
                          <p className="text-sm text-muted-foreground mt-2">{entry.comment}</p>
                        )}
                      </div>
                    ))}
                  {history.filter(h => h.stage === stage.key).length === 0 && (
                    <div className="text-center py-4 text-sm text-muted-foreground">
                      <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      No review history yet
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
