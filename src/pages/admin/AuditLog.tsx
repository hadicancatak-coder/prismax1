import { useEffect, useState } from "react";
import { adminService } from "@/lib/adminService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TableSkeleton } from "@/components/skeletons/TableSkeleton";

interface AuditLogEntry {
  id: string;
  action: string;
  created_at: string;
  changes: any;
  admin: {
    name: string;
    email: string;
    avatar_url: string | null;
  } | null;
  target: {
    name: string;
    email: string;
  } | null;
}

export default function AuditLog() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await adminService.getAuditLogs();
      setLogs(data as any);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionBadge = (action: string) => {
    const colorMap: Record<string, any> = {
      user_delete: 'destructive',
      role_change: 'default',
      bulk_update_users: 'secondary',
      bulk_delete_users: 'destructive',
      working_days_change: 'secondary',
    };
    return <Badge variant={colorMap[action] || 'outline'}>{action.replace(/_/g, ' ')}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-section-title">Admin Audit Log</h2>
        <p className="text-metadata mt-2">
          Audit logging captures administrative actions automatically. View history of user management, role changes, and system modifications.
        </p>
      </div>
      
      {loading ? (
        <TableSkeleton columns={5} rows={10} />
      ) : (
      <div className="bg-card border border-border rounded">
        <ScrollArea className="h-[600px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Admin</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Target User</TableHead>
                <TableHead>Changes</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <div className="text-muted-foreground">
                      <p className="font-medium mb-2">No audit logs found</p>
                      <p className="text-sm">Admin actions will be automatically logged here</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      {log.admin && (
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={log.admin.avatar_url || undefined} />
                            <AvatarFallback>{log.admin.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{log.admin.name}</p>
                            <p className="text-xs text-muted-foreground">{log.admin.email}</p>
                          </div>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{getActionBadge(log.action)}</TableCell>
                    <TableCell>
                      {log.target ? (
                        <div>
                          <p className="text-sm font-medium">{log.target.name}</p>
                          <p className="text-xs text-muted-foreground">{log.target.email}</p>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <pre className="text-xs bg-muted p-2 rounded max-w-xs overflow-auto">
                        {JSON.stringify(log.changes, null, 2)}
                      </pre>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(log.created_at), 'MMM dd, HH:mm')}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>
      )}
    </div>
  );
}
