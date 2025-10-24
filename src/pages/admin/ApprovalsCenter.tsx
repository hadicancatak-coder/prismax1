import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { approvalService } from "@/lib/approvalService";
import { format } from "date-fns";

interface PendingItem {
  id: string;
  type: string;
  title: string;
  requester: string;
  created_at: string;
}

interface ApprovalHistoryItem {
  id: string;
  entity_type: string;
  entity_id: string;
  status: string;
  comment: string | null;
  created_at: string;
  requester: { name: string; email: string } | null;
  approver: { name: string; email: string } | null;
}

export default function ApprovalsCenter() {
  const [pendingApprovals, setPendingApprovals] = useState<PendingItem[]>([]);
  const [approvalHistory, setApprovalHistory] = useState<ApprovalHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingApprovals();
    fetchApprovalHistory();
  }, []);

  const fetchPendingApprovals = async () => {
    setLoading(true);
    try {
      // Fetch pending task change requests
      const { data: taskRequests, error: taskError } = await supabase
        .from('task_change_requests')
        .select(`
          id,
          type,
          task_id,
          created_at,
          requester:profiles(name),
          task:tasks(title)
        `)
        .eq('status', 'pending');

      if (taskError) throw taskError;

      // Fetch pending ads
      const { data: ads, error: adsError } = await supabase
        .from('ads')
        .select(`
          id,
          name,
          created_at,
          creator:profiles(name)
        `)
        .eq('approval_status', 'pending');

      if (adsError) throw adsError;

      const pending: PendingItem[] = [
        ...(taskRequests?.map(req => ({
          id: req.id,
          type: 'task_change',
          title: (req as any).task?.title || 'Unknown Task',
          requester: (req as any).requester?.name || 'Unknown',
          created_at: req.created_at,
        })) || []),
        ...(ads?.map(ad => ({
          id: ad.id,
          type: 'ad',
          title: ad.name,
          requester: (ad as any).creator?.name || 'Unknown',
          created_at: ad.created_at,
        })) || []),
      ];

      setPendingApprovals(pending.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ));
    } catch (error: any) {
      toast.error('Failed to fetch pending approvals');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchApprovalHistory = async () => {
    try {
      const history = await approvalService.getApprovalHistory();
      setApprovalHistory(history as any);
    } catch (error) {
      console.error('Error fetching approval history:', error);
    }
  };

  const handleApprove = async (item: PendingItem) => {
    try {
      const entityType = item.type === 'ad' ? 'ad' : 'task';
      const success = await approvalService.approveItem({
        entityType: entityType as any,
        entityId: item.id,
      });

      if (success) {
        toast.success('Item approved successfully');
        fetchPendingApprovals();
        fetchApprovalHistory();
      } else {
        toast.error('Failed to approve item');
      }
    } catch (error) {
      toast.error('Failed to approve item');
    }
  };

  const handleReject = async (item: PendingItem) => {
    try {
      const entityType = item.type === 'ad' ? 'ad' : 'task';
      const success = await approvalService.rejectItem({
        entityType: entityType as any,
        entityId: item.id,
      });

      if (success) {
        toast.success('Item rejected');
        fetchPendingApprovals();
        fetchApprovalHistory();
      } else {
        toast.error('Failed to reject item');
      }
    } catch (error) {
      toast.error('Failed to reject item');
    }
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Pending ({pendingApprovals.length})
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Pending Approvals</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Requester</TableHead>
                    <TableHead>Requested</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">Loading...</TableCell>
                    </TableRow>
                  ) : pendingApprovals.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">No pending approvals</TableCell>
                    </TableRow>
                  ) : (
                    pendingApprovals.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Badge variant="outline">
                            {item.type === 'ad' ? 'Ad' : 'Task Change'}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{item.title}</TableCell>
                        <TableCell>{item.requester}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(item.created_at), 'MMM dd, HH:mm')}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleApprove(item)}
                              className="flex items-center gap-1"
                            >
                              <CheckCircle className="h-3 w-3" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleReject(item)}
                              className="flex items-center gap-1"
                            >
                              <XCircle className="h-3 w-3" />
                              Reject
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Approval History</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Requester</TableHead>
                    <TableHead>Approver</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {approvalHistory.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">No approval history</TableCell>
                    </TableRow>
                  ) : (
                    approvalHistory.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Badge variant="outline">{item.entity_type}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={item.status === 'approved' ? 'default' : 'destructive'}>
                            {item.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{item.requester?.name || 'Unknown'}</TableCell>
                        <TableCell>{item.approver?.name || 'Unknown'}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(item.created_at), 'MMM dd, HH:mm')}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
