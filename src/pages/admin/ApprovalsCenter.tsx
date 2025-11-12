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
import { TableSkeleton } from "@/components/skeletons/TableSkeleton";

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
          requester_id
        `)
        .eq('status', 'pending');

      if (taskError) {
        console.error('Task requests error:', taskError);
        throw taskError;
      }

      // Fetch pending ads
      const { data: ads, error: adsError } = await supabase
        .from('ads')
        .select(`
          id,
          name,
          created_at,
          created_by
        `)
        .eq('approval_status', 'pending');

      if (adsError) {
        console.error('Ads error:', adsError);
        throw adsError;
      }
      
      // Fetch related profile names separately
      const requesterIds = taskRequests?.map(r => r.requester_id).filter(Boolean) || [];
      const creatorIds = ads?.map(a => a.created_by).filter(Boolean) || [];
      const allUserIds = [...new Set([...requesterIds, ...creatorIds])];
      
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', allUserIds);
      
      const profileMap = new Map(profiles?.map(p => [p.id, p.name]) || []);

      const pending: PendingItem[] = [
        ...(taskRequests?.map(req => ({
          id: req.id,
          type: 'task_change',
          title: 'Task Change Request',
          requester: profileMap.get(req.requester_id) || 'Unknown',
          created_at: req.created_at,
        })) || []),
        ...(ads?.map(ad => ({
          id: ad.id,
          type: 'ad',
          title: ad.name,
          requester: profileMap.get(ad.created_by) || 'Unknown',
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
      const result = await approvalService.approveItem({
        entityType: entityType as any,
        entityId: item.id,
      });
      
      toast.success(result.message || 'Item approved successfully');
      fetchPendingApprovals();
      fetchApprovalHistory();
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to approve item';
      toast.error(errorMessage, {
        description: 'Check console for details',
        duration: 5000,
      });
      console.error('❌ Approval error details:', error);
    }
  };

  const handleReject = async (item: PendingItem) => {
    try {
      const entityType = item.type === 'ad' ? 'ad' : 'task';
      const result = await approvalService.rejectItem({
        entityType: entityType as any,
        entityId: item.id,
      });
      
      toast.success(result.message || 'Item rejected successfully');
      fetchPendingApprovals();
      fetchApprovalHistory();
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to reject item';
      toast.error(errorMessage, {
        description: 'Check console for details',
        duration: 5000,
      });
      console.error('❌ Rejection error details:', error);
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6 max-w-7xl">
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
            <CardHeader className="p-4 md:p-6">
              <CardTitle>Pending Approvals</CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              {loading ? (
                <TableSkeleton columns={5} rows={5} />
              ) : (
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
                  {pendingApprovals.length === 0 ? (
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
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader className="p-4 md:p-6">
              <CardTitle>Approval History</CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
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
