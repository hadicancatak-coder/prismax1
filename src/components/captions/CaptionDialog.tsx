import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Copy, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { ENTITIES } from "@/lib/constants";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import type { Caption } from "@/pages/CaptionLibrary";

const CAPTION_TYPES = [
  { value: "headline", label: "Headline", maxLength: 30 },
  { value: "description", label: "Description", maxLength: 90 },
  { value: "primary_text", label: "Primary Text", maxLength: 125 },
  { value: "sitelink", label: "Sitelink", maxLength: 25 },
  { value: "callout", label: "Callout", maxLength: 25 },
];

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

interface CaptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caption: Caption | null;
  onSuccess: () => void;
}

export function CaptionDialog({ open, onOpenChange, caption, onSuccess }: CaptionDialogProps) {
  const { user } = useAuth();
  const isEditing = !!caption;

  const [type, setType] = useState("headline");
  const [selectedEntities, setSelectedEntities] = useState<string[]>([]);
  const [status, setStatus] = useState("pending");
  const [activeLanguage, setActiveLanguage] = useState("en");
  const [content, setContent] = useState<Record<string, string>>({
    en: "",
    ar: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (caption) {
      setType(caption.element_type || "headline");
      setSelectedEntities(caption.entity || []);
      setStatus(caption.google_status || "pending");
      
      // Parse content
      const contentText = typeof caption.content === "string"
        ? caption.content
        : caption.content?.text || "";
      
      setContent({
        en: contentText,
        ar: caption.content?.ar || "",
      });
    } else {
      // Reset form
      setType("headline");
      setSelectedEntities([]);
      setStatus("pending");
      setContent({ en: "", ar: "" });
      setActiveLanguage("en");
    }
  }, [caption, open]);

  const toggleEntity = (entity: string) => {
    setSelectedEntities((prev) =>
      prev.includes(entity)
        ? prev.filter((e) => e !== entity)
        : [...prev, entity]
    );
  };

  const currentType = CAPTION_TYPES.find((t) => t.value === type);
  const maxLength = currentType?.maxLength || 90;

  const handleSubmit = async () => {
    if (!user) {
      toast.error("Not authenticated");
      return;
    }

    if (!content.en.trim()) {
      toast.error("Please enter content");
      return;
    }

    if (selectedEntities.length === 0) {
      toast.error("Please select at least one entity");
      return;
    }

    setIsSubmitting(true);

    try {
      const data = {
        element_type: type,
        content: content.en, // Store primary content as string
        entity: selectedEntities,
        google_status: status,
        language: activeLanguage.toUpperCase(),
        updated_at: new Date().toISOString(),
      };

      if (isEditing && caption) {
        const { error } = await supabase
          .from("ad_elements")
          .update(data)
          .eq("id", caption.id);

        if (error) throw error;
        toast.success("Caption updated");
      } else {
        const { error } = await supabase.from("ad_elements").insert({
          ...data,
          created_by: user.id,
          use_count: 0,
          is_favorite: false,
        });

        if (error) throw error;
        toast.success("Caption created");
      }

      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Failed to save caption");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!caption) return;

    const { error } = await supabase
      .from("ad_elements")
      .delete()
      .eq("id", caption.id);

    if (error) {
      toast.error("Failed to delete caption");
      return;
    }

    toast.success("Caption deleted");
    onSuccess();
  };

  const handleDuplicate = async () => {
    if (!caption || !user) return;

    const { error } = await supabase.from("ad_elements").insert({
      element_type: type,
      content: content.en,
      entity: selectedEntities,
      google_status: "pending",
      language: activeLanguage.toUpperCase(),
      created_by: user.id,
      use_count: 0,
      is_favorite: false,
    });

    if (error) {
      toast.error("Failed to duplicate caption");
      return;
    }

    toast.success("Caption duplicated");
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Caption" : "Create Caption"}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? "Modify caption content, entities, and status" : "Add a new caption to the library"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Type */}
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CAPTION_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label} (max {t.maxLength} chars)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Entities */}
          <div className="space-y-2">
            <Label>Entities</Label>
            <div className="flex flex-wrap gap-2">
              {ENTITIES.map((entity) => (
                <Badge
                  key={entity}
                  variant={selectedEntities.includes(entity) ? "default" : "outline"}
                  className="cursor-pointer transition-smooth hover:bg-primary/80"
                  onClick={() => toggleEntity(entity)}
                >
                  {entity}
                  {selectedEntities.includes(entity) && (
                    <X className="h-3 w-3 ml-1" />
                  )}
                </Badge>
              ))}
            </div>
          </div>

          {/* Content with Language Tabs */}
          <div className="space-y-2">
            <Label>Content</Label>
            <Tabs value={activeLanguage} onValueChange={setActiveLanguage}>
              <TabsList>
                <TabsTrigger value="en">English</TabsTrigger>
                <TabsTrigger value="ar">Arabic</TabsTrigger>
              </TabsList>
              <TabsContent value="en" className="mt-2">
                <div className="space-y-2">
                  <RichTextEditor
                    value={content.en}
                    onChange={(value) => setContent({ ...content, en: value })}
                    placeholder="Enter English content..."
                    minHeight="100px"
                  />
                  <div className="flex justify-between text-metadata text-muted-foreground">
                    <span>Characters: {content.en.replace(/<[^>]*>/g, '').length}</span>
                    <span className={content.en.replace(/<[^>]*>/g, '').length > maxLength ? "text-destructive" : ""}>
                      Max: {maxLength}
                    </span>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="ar" className="mt-2">
                <div className="space-y-2">
                  <RichTextEditor
                    value={content.ar}
                    onChange={(value) => setContent({ ...content, ar: value })}
                    placeholder="أدخل المحتوى بالعربية..."
                    minHeight="100px"
                  />
                  <div className="flex justify-between text-metadata text-muted-foreground">
                    <span>Characters: {content.ar.replace(/<[^>]*>/g, '').length}</span>
                    <span className={content.ar.replace(/<[^>]*>/g, '').length > maxLength ? "text-destructive" : ""}>
                      Max: {maxLength}
                    </span>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <div className="flex gap-2">
            {isEditing && (
              <>
                <Button variant="outline" onClick={handleDuplicate}>
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate
                </Button>
                <Button variant="destructive" onClick={handleDelete}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isEditing ? "Update" : "Create"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
