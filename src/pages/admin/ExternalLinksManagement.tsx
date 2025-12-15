import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getProductionUrl } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Link2, 
  MoreVertical, 
  Copy, 
  Power, 
  PowerOff, 
  Calendar, 
  Trash2, 
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  BookOpen,
  Globe,
  Lock
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, formatDistanceToNow } from "date-fns";
import { Label } from "@/components/ui/label";

export default function ExternalLinksManagement() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [extendLinkId, setExtendLinkId] = useState<string | null>(null);
  const [newExpiration, setNewExpiration] = useState("");
  const [deleteLinkId, setDeleteLinkId] = useState<string | null>(null);

  // Fetch all external access links
  const { data: links = [], isLoading } = useQuery({
    queryKey: ["external-access-links"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campaign_external_access")
        .select(`
          *,
          utm_campaigns (
            name
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  // Fetch public knowledge pages
  const { data: knowledgePages = [] } = useQuery({
    queryKey: ["public-knowledge-pages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("knowledge_pages")
        .select("*")
        .eq("is_public", true)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  // Toggle knowledge page public status
  const toggleKnowledgePublicMutation = useMutation({
    mutationFn: async ({ id, isPublic }: { id: string; isPublic: boolean }) => {
      const { error } = await supabase
        .from("knowledge_pages")
        .update({ is_public: isPublic })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["public-knowledge-pages"] });
      toast.success("Knowledge page visibility updated");
    },
    onError: () => toast.error("Failed to update knowledge page"),
  });

  // Deactivate link
  const deactivateMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("campaign_external_access")
        .update({ is_active: false })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["external-access-links"] });
      toast.success("Link deactivated");
    },
    onError: () => toast.error("Failed to deactivate link"),
  });

  // Reactivate link
  const reactivateMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("campaign_external_access")
        .update({ is_active: true })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["external-access-links"] });
      toast.success("Link reactivated");
    },
    onError: () => toast.error("Failed to reactivate link"),
  });

  // Extend expiration
  const extendMutation = useMutation({
    mutationFn: async ({ id, expiresAt }: { id: string; expiresAt: string }) => {
      const { error } = await supabase
        .from("campaign_external_access")
        .update({ expires_at: expiresAt })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["external-access-links"] });
      toast.success("Expiration date updated");
      setExtendLinkId(null);
      setNewExpiration("");
    },
    onError: () => toast.error("Failed to update expiration"),
  });

  // Delete link
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("campaign_external_access")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["external-access-links"] });
      toast.success("Link deleted");
      setDeleteLinkId(null);
    },
    onError: () => toast.error("Failed to delete link"),
  });

  const copyToClipboard = (token: string) => {
    const url = `${window.location.origin}/campaigns-log/review/${token}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard");
  };

  const getStatusBadge = (link: any) => {
    if (!link.is_active) {
      return <Badge variant="outline"><PowerOff className="h-3 w-3 mr-1" />Inactive</Badge>;
    }
    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Expired</Badge>;
    }
    if (link.email_verified) {
      return <Badge variant="default"><CheckCircle2 className="h-3 w-3 mr-1" />Verified</Badge>;
    }
    return <Badge variant="secondary"><AlertCircle className="h-3 w-3 mr-1" />Pending</Badge>;
  };

  const filteredLinks = links.filter((link) =>
    link.entity?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    link.reviewer_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    link.reviewer_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate stats
  const stats = {
    total: links.length,
    active: links.filter((l) => l.is_active).length,
    verified: links.filter((l) => l.email_verified).length,
    expired: links.filter((l) => l.expires_at && new Date(l.expires_at) < new Date()).length,
    totalClicks: links.reduce((sum, l) => sum + (l.click_count || 0), 0),
  };

  const copyKnowledgeLink = (token: string) => {
    const url = `${getProductionUrl()}/knowledge/public/${token}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard");
  };

  return (
    <div className="space-y-lg">
      <div>
        <h2 className="text-heading-lg">External Access Links</h2>
        <p className="text-body-sm text-muted-foreground">
          Manage external review links for campaigns and knowledge pages
        </p>
      </div>

      <Tabs defaultValue="campaigns" className="space-y-lg">
        <TabsList>
          <TabsTrigger value="campaigns">Campaign Links</TabsTrigger>
          <TabsTrigger value="knowledge">Knowledge Pages</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="space-y-lg">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-md">
            <Card>
              <CardHeader className="pb-sm">
                <CardTitle className="text-body-sm text-muted-foreground">Total Links</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-heading-lg font-semibold">{stats.total}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-sm">
                <CardTitle className="text-body-sm text-muted-foreground">Active</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-heading-lg font-semibold text-success">{stats.active}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-sm">
                <CardTitle className="text-body-sm text-muted-foreground">Verified</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-heading-lg font-semibold text-primary">{stats.verified}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-sm">
                <CardTitle className="text-body-sm text-muted-foreground">Expired</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-heading-lg font-semibold text-destructive">{stats.expired}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-sm">
                <CardTitle className="text-body-sm text-muted-foreground">Total Clicks</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-heading-lg font-semibold">{stats.totalClicks}</p>
              </CardContent>
            </Card>
          </div>

          {/* Search */}
          <div className="flex gap-md">
            <Input
              placeholder="Search by entity, email, or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
          </div>

          {/* Links Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Entity</TableHead>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Reviewer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Clicks</TableHead>
                    <TableHead>Last Accessed</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLinks.map((link) => (
                    <TableRow key={link.id}>
                      <TableCell className="font-medium">{link.entity}</TableCell>
                      <TableCell className="text-body-sm">
                        {link.utm_campaigns?.name || "All Campaigns"}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-xs">
                          <p className="text-body-sm font-medium">
                            {link.reviewer_name || "Not set"}
                          </p>
                          <p className="text-metadata text-muted-foreground">
                            {link.reviewer_email}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(link)}</TableCell>
                      <TableCell className="text-body-sm">
                        {format(new Date(link.created_at), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-body-sm">
                        {link.expires_at
                          ? formatDistanceToNow(new Date(link.expires_at), {
                              addSuffix: true,
                            })
                          : "Never"}
                      </TableCell>
                      <TableCell className="text-body-sm">{link.click_count || 0}</TableCell>
                      <TableCell className="text-body-sm">
                        {link.last_accessed_at
                          ? formatDistanceToNow(new Date(link.last_accessed_at), {
                              addSuffix: true,
                            })
                          : "Never"}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => copyToClipboard(link.access_token)}
                            >
                              <Copy className="h-4 w-4 mr-2" />
                              Copy Link
                            </DropdownMenuItem>
                            {link.is_active ? (
                              <DropdownMenuItem
                                onClick={() => deactivateMutation.mutate(link.id)}
                              >
                                <PowerOff className="h-4 w-4 mr-2" />
                                Deactivate
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => reactivateMutation.mutate(link.id)}
                              >
                                <Power className="h-4 w-4 mr-2" />
                                Reactivate
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => setExtendLinkId(link.id)}>
                              <Calendar className="h-4 w-4 mr-2" />
                              Extend Expiration
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setDeleteLinkId(link.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="knowledge" className="space-y-lg">
          {/* Knowledge Pages Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
            <Card>
              <CardHeader className="pb-sm">
                <CardTitle className="text-body-sm text-muted-foreground">Public Pages</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-heading-lg font-semibold">{knowledgePages.length}</p>
              </CardContent>
            </Card>
          </div>

          {/* Knowledge Pages Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Page Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead className="w-[150px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {knowledgePages.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        No public knowledge pages yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    knowledgePages.map((page) => (
                      <TableRow key={page.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4 text-muted-foreground" />
                            {page.title}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="default" className="bg-success/15 text-success border-0">
                            <Globe className="h-3 w-3 mr-1" />
                            Public
                          </Badge>
                        </TableCell>
                        <TableCell className="text-body-sm">
                          {format(new Date(page.updated_at), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyKnowledgeLink(page.public_token)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleKnowledgePublicMutation.mutate({ id: page.id, isPublic: false })}
                            >
                              <Lock className="h-4 w-4" />
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
      </Tabs>

      {/* Extend Expiration Dialog */}
      <Dialog open={!!extendLinkId} onOpenChange={() => setExtendLinkId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Extend Link Expiration</DialogTitle>
            <DialogDescription>
              Set a new expiration date for this review link
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-sm">
            <Label>New Expiration Date</Label>
            <Input
              type="datetime-local"
              value={newExpiration}
              onChange={(e) => setNewExpiration(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExtendLinkId(null)}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                extendLinkId &&
                extendMutation.mutate({
                  id: extendLinkId,
                  expiresAt: newExpiration,
                })
              }
              disabled={!newExpiration}
            >
              Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteLinkId} onOpenChange={() => setDeleteLinkId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete External Link</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this review link? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteLinkId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteLinkId && deleteMutation.mutate(deleteLinkId)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
